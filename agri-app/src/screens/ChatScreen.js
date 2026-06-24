import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import API from "../../services/api";
import ScreenHeader from "../components/ScreenHeader";
import LoadingSpinner from "../components/LoadingSpinner";
import { colors, spacing, radius, typography } from "../theme/theme";
import { useAuth } from "../context/AuthContext";

export default function ChatScreen({ route, navigation }) {
  const { orderId, buyerId, status } = route.params;
  const isReadOnly = status === "completed";
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sellerName, setSellerName] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const flatListRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await API.get(`/orders/${orderId}/messages`);
      setMessages(res.data?.messages || []);
      if (res.data?.seller) setSellerName(res.data.seller.name);
      if (res.data?.buyer) setBuyerName(res.data.buyer.name);
    } catch (err) {
      console.log(err?.response?.data);
      Alert.alert("Error", "Could not load messages");
    }
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (active) setLoading(true);
        await fetchMessages();
        if (active) setLoading(false);
      })();

      const interval = setInterval(() => {
        if (active) fetchMessages();
      }, 3000);

      return () => {
        active = false;
        clearInterval(interval);
      };
    }, [fetchMessages])
  );

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    setSending(true);
    try {
      await API.post(`/orders/${orderId}/messages`, { text: inputText.trim() });
      setInputText("");
      await fetchMessages();
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.log(err?.response?.data);
      Alert.alert("Error", "Could not send message");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading chat..." />;
  }

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
          renderItem={({ item }) => {
            const isFromCurrentUser = item.sender?._id === user?.id;
            return (
              <View
                style={[
                  styles.messageRow,
                  isFromCurrentUser ? styles.messageRowRight : styles.messageRowLeft,
                ]}
              >
                {!isFromCurrentUser && (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(item.sender?.name || "?")[0].toUpperCase()}
                    </Text>
                  </View>
                )}
                <View
                  style={[
                    styles.bubble,
                    isFromCurrentUser ? styles.bubbleRight : styles.bubbleLeft,
                  ]}
                >
                  {!isFromCurrentUser && (
                    <Text style={styles.senderName}>{item.sender?.name || "Unknown"}</Text>
                  )}
                  <Text
                    style={[
                      styles.messageText,
                      isFromCurrentUser && styles.messageTextRight,
                    ]}
                  >
                    {item.text}
                  </Text>
                  <Text
                    style={[
                      styles.timestamp,
                      isFromCurrentUser && styles.timestampRight,
                    ]}
                  >
                    {formatTime(item.createdAt)}
                  </Text>
                </View>
              </View>
            );
          }}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
          onLayout={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
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
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!sending}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || sending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={sending || !inputText.trim()}
            >
              <Text style={styles.sendButtonText}>
                {sending ? "…" : "↑"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    flexGrow: 1,
    justifyContent: "flex-end",
  },

  // Empty state
  emptyWrap: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 36,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  emptySubtext: {
    ...typography.body,
    marginTop: 4,
  },

  // Messages
  messageRow: {
    flexDirection: "row",
    marginVertical: 4,
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  messageRowLeft: {
    justifyContent: "flex-start",
  },
  messageRowRight: {
    justifyContent: "flex-end",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  avatarText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  bubble: {
    maxWidth: "72%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
  },
  bubbleLeft: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleRight: {
    backgroundColor: colors.white,
    borderBottomRightRadius: 4,
  },
  senderName: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  messageTextRight: {
    color: colors.black,
  },
  timestamp: {
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 4,
    textAlign: "right",
  },
  timestampRight: {
    color: "#888888",
  },

  // Input bar
  inputBar: {
    flexDirection: "row",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    maxHeight: 100,
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceRaised,
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.black,
    lineHeight: 22,
  },

  // Read-only bar
  readOnlyBar: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: "center",
  },
  readOnlyText: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
});