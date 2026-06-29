/**
 * ChatScreen (read-receipt + tick fix)
 *
 * Fixes vs previous version:
 *   1. readByOther derived from loaded message history (readAt field) so
 *      double tick survives re-mounts.
 *   2. Tick shown on ALL sent messages, not just isLast — ticks never
 *      disappear when the other person replies.
 *   3. mark_read emitted on mount AND on every incoming message.
 *   4. messages_read stamps readAt locally on all our messages.
 */
import React, { useState, useCallback, useRef } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import API from "../../services/api";
import { getSocket } from "../services/socketService";
import ScreenHeader from "../components/ScreenHeader";
import LoadingSpinner from "../components/LoadingSpinner";
import { colors, spacing, radius, typography } from "../theme/theme";
import { useAuth } from "../context/AuthContext";

export default function ChatScreen({ route }) {
  const { orderId, status } = route.params;
  const isReadOnly = status === "completed";
  const { user } = useAuth();

  const [messages,    setMessages]    = useState([]);
  const [inputText,   setInputText]   = useState("");
  const [loading,     setLoading]     = useState(true);
  const [sending,     setSending]     = useState(false);
  const [sellerName,  setSellerName]  = useState("");
  const [buyerName,   setBuyerName]   = useState("");
  const [otherTyping, setOtherTyping] = useState(false);
  const [readByOther, setReadByOther] = useState(false);

  const flatListRef   = useRef(null);
  const typingTimeout = useRef(null);

  const scrollToBottom = (animated = true) =>
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated }), 80);

  const appendMessage = useCallback((msg) => {
    setMessages((prev) => {
      if (prev.some((m) => m._id === msg._id)) return prev;
      return [...prev, msg];
    });
    scrollToBottom(true);
  }, []);

  const fetchMessages = useCallback(async () => {
  try {
    const res = await API.get(`/orders/${orderId}/messages`);
    const fetched = res.data?.messages || [];
    setMessages(fetched);
    if (res.data?.seller) setSellerName(res.data.seller.name);
    if (res.data?.buyer)  setBuyerName(res.data.buyer.name);

    // Only show double tick if a message I sent already has readAt
    // AND that readAt was set AFTER the message was created
    // (meaning someone else actually read it, not just us marking our own)
    const uid = user?.id;
    const alreadyRead = fetched.some(
      (m) =>
        m.sender?._id === uid &&
        m.readAt &&
        new Date(m.readAt) > new Date(m.createdAt)
    );
    if (alreadyRead) setReadByOther(true);

  } catch (err) {
    console.log(err?.response?.data);
    Alert.alert("Error", "Could not load messages");
  }
}, [orderId, user?.id]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        if (active) setLoading(true);
        await fetchMessages();
        if (active) setLoading(false);
        scrollToBottom(false);
      })();

      const socket = getSocket();
      if (!socket) return () => { active = false; };

      socket.emit("join_room", { orderId });
      socket.emit("mark_read", { orderId });

      const onNewMessage = (msg) => {
        if (!active) return;
        appendMessage(msg);
        socket.emit("mark_read", { orderId });
      };

      const onUserTyping = ({ isTyping }) => {
        if (!active) return;
        setOtherTyping(isTyping);
      };

      const onMessagesRead = ({ readBy }) => {
  if (!active) return;
  if (readBy === user?.id) return;
  setMessages((prev) =>
    prev.map((m) => {
      if (m.sender?._id === user?.id && !m.readAt) {
        return { ...m, readAt: new Date().toISOString() };
      }
      return m;
    })
  );
};

      const onError = ({ message }) => console.log("[Socket] error:", message);

      socket.on("new_message",   onNewMessage);
      socket.on("user_typing",   onUserTyping);
      socket.on("messages_read", onMessagesRead);
      socket.on("error",         onError);

      return () => {
        active = false;
        socket.off("new_message",   onNewMessage);
        socket.off("user_typing",   onUserTyping);
        socket.off("messages_read", onMessagesRead);
        socket.off("error",         onError);
        clearTimeout(typingTimeout.current);
      };
    }, [fetchMessages, orderId, appendMessage, user?.id])
  );

  const handleSendMessage = () => {
    if (!inputText.trim() || sending) return;
    const socket = getSocket();
    if (!socket || !socket.connected) {
      Alert.alert("Error", "Not connected. Please wait and try again.");
      return;
    }
    setSending(true);
    socket.emit("typing", { orderId, isTyping: false });
    clearTimeout(typingTimeout.current);
    socket.emit("send_message", { orderId, text: inputText.trim() });
    setInputText("");
    setSending(false);
  };

  const handleInputChange = (text) => {
    setInputText(text);
    const socket = getSocket();
    if (!socket || isReadOnly) return;
    socket.emit("typing", { orderId, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("typing", { orderId, isTyping: false });
    }, 2000);
  };

  if (loading) return <LoadingSpinner label="Loading chat..." />;

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        eyebrow={`Order #${orderId?.slice(-6).toUpperCase()}`}
        title="Chat"
        subtitle={isReadOnly ? "Read-only — order completed" : "Active conversation"}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => `${item._id}-${index}`}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>◌</Text>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation below</Text>
            </View>
          }
          ListFooterComponent={
            otherTyping ? (
              <View style={styles.typingWrap}>
                <View style={styles.typingBubble}>
                  <Text style={styles.typingText}>typing…</Text>
                </View>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const isFromCurrentUser = item.sender?._id === user?.id;

            // Double tick if readByOther (live event this session)
            // OR if this specific message was stamped with readAt from DB.
            const isRead = !!item.readAt;

            return (
              <View style={[
                styles.messageRow,
                isFromCurrentUser ? styles.messageRowRight : styles.messageRowLeft,
              ]}>
                {!isFromCurrentUser && (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(item.sender?.name || "?")[0].toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={[
                  styles.bubble,
                  isFromCurrentUser ? styles.bubbleRight : styles.bubbleLeft,
                ]}>
                  {!isFromCurrentUser && (
                    <Text style={styles.senderName}>
                      {item.sender?.name || "Unknown"}
                    </Text>
                  )}
                  <Text style={[
                    styles.messageText,
                    isFromCurrentUser && styles.messageTextRight,
                  ]}>
                    {item.text}
                  </Text>

                  <View style={styles.timestampRow}>
                    <Text style={[
                      styles.timestamp,
                      isFromCurrentUser && styles.timestampRight,
                    ]}>
                      {formatTime(item.createdAt)}
                    </Text>

                    {/* Show tick on ALL my messages — not just last one */}
                    {isFromCurrentUser && (
                      <Text style={[
                        styles.readReceipt,
                        isRead && styles.readReceiptRead,
                      ]}>
                        {isRead ? " ✓✓" : " ✓"}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
          onContentSizeChange={() => scrollToBottom(true)}
          onLayout={() => scrollToBottom(false)}
        />

        {isReadOnly ? (
          <View style={styles.readOnlyBar}>
            <Text style={styles.readOnlyText}>
              ◉  This order is completed — chat is read-only
            </Text>
          </View>
        ) : (
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Message…"
              placeholderTextColor={colors.textTertiary}
              value={inputText}
              onChangeText={handleInputChange}
              multiline
              maxLength={500}
              editable={!sending}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || sending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={sending || !inputText.trim()}
            >
              <Text style={styles.sendButtonText}>{sending ? "…" : "↑"}</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:          { flex: 1, backgroundColor: colors.bg },
  container:         { flex: 1 },
  messagesContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    flexGrow: 1,
    justifyContent: "flex-end",
  },

  emptyWrap:    { alignItems: "center", paddingVertical: spacing.xxl },
  emptyIcon:    { fontSize: 36, color: colors.textTertiary, marginBottom: spacing.sm },
  emptyText:    { fontSize: 15, fontWeight: "600", color: colors.textSecondary },
  emptySubtext: { ...typography.body, marginTop: 4 },

  messageRow:      { flexDirection: "row", marginVertical: 4, alignItems: "flex-end", gap: spacing.xs },
  messageRowLeft:  { justifyContent: "flex-start" },
  messageRowRight: { justifyContent: "flex-end" },

  avatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
    marginBottom: 2,
  },
  avatarText: { fontSize: 11, fontWeight: "700", color: colors.textSecondary },

  bubble: {
    maxWidth: "72%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
  },
  bubbleLeft: {
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleRight:      { backgroundColor: colors.white, borderBottomRightRadius: 4 },
  senderName:       { fontSize: 10, fontWeight: "700", color: colors.textTertiary, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 3 },
  messageText:      { fontSize: 14, lineHeight: 20, color: colors.textPrimary },
  messageTextRight: { color: colors.black },

  timestampRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  timestamp:        { fontSize: 10, color: colors.textTertiary },
  timestampRight:   { color: "#888888" },
  readReceipt:      { fontSize: 10, color: colors.textTertiary, fontWeight: "600" },
  readReceiptRead:  { color: "#6080C8" },

  typingWrap: {
    flexDirection: "row", justifyContent: "flex-start",
    paddingHorizontal: spacing.xs, marginTop: 4,
  },
  typingBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, borderBottomLeftRadius: 4,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  typingText: { fontSize: 12, color: colors.textTertiary, fontStyle: "italic" },

  inputBar: {
    flexDirection: "row", padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
    gap: spacing.sm, alignItems: "flex-end",
  },
  input: {
    flex: 1, backgroundColor: colors.bg,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderStrong,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    maxHeight: 100, color: colors.textPrimary, fontSize: 14, lineHeight: 20,
  },
  sendButton:         { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  sendButtonDisabled: { backgroundColor: colors.surfaceRaised },
  sendButtonText:     { fontSize: 18, fontWeight: "700", color: colors.black, lineHeight: 22 },

  readOnlyBar: {
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
    alignItems: "center",
  },
  readOnlyText: { fontSize: 12, color: colors.textTertiary, fontWeight: "500", letterSpacing: 0.3 },
});