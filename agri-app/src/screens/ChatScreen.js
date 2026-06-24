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
      if (res.data?.seller) {
        setSellerName(res.data.seller.name);
      }
      if (res.data?.buyer) {
        setBuyerName(res.data.buyer.name);
      }
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

      // Fetch messages every 3 seconds for real-time feel
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
      const res = await API.post(`/orders/${orderId}/messages`, {
        text: inputText.trim(),
      });

      setInputText("");
      await fetchMessages();

      // Scroll to bottom
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

  const isUserSender = user?.id === messages[messages.length - 1]?.sender?._id;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        eyebrow="Order Chat"
        title="Message"
        subtitle={`Chat for Order #${orderId?.slice(-8)}`}
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
          renderItem={({ item }) => {
            const isFromCurrentUser = item.sender?._id === user?.id;
            return (
              <View
                style={[
                  styles.messageBubble,
                  isFromCurrentUser
                    ? styles.messageBubbleRight
                    : styles.messageBubbleLeft,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    isFromCurrentUser ? styles.bubbleRight : styles.bubbleLeft,
                  ]}
                >
                  <Text style={[styles.senderName, isFromCurrentUser && styles.senderNameRight]}>
                    {item.sender?.name || "Unknown"}
                  </Text>
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
                    {new Date(item.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
          <View style={styles.inputContainer}>
            <Text style={[styles.messageText, { flex: 1, textAlign: "center", color: colors.textSecondary }]}>
              This order is completed. Chat is read-only.
            </Text>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!sending}
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity
              style={[styles.sendButton, sending && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={sending || !inputText.trim()}
            >
              <Text style={styles.sendButtonText}>
                {sending ? "..." : "Send"}
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
    backgroundColor: colors.cream,
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  messagesContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  messageBubble: {
    marginVertical: spacing.sm,
    flexDirection: "row",
  },
  messageBubbleLeft: {
    justifyContent: "flex-start",
  },
  messageBubbleRight: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "75%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  bubbleLeft: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 4,
  },
  bubbleRight: {
    backgroundColor: colors.leaf,
    borderBottomRightRadius: 4,
  },
  senderName: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 2,
  },
  senderNameRight: {
    color: colors.textOnDark,
  },
  messageText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  messageTextRight: {
    color: colors.textOnDark,
  },
  timestamp: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: "right",
  },
  timestampRight: {
    color: colors.textOnDark,
  },
  inputContainer: {
    flexDirection: "row",
    padding: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    color: colors.textPrimary,
  },
  sendButton: {
    backgroundColor: colors.leaf,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: colors.textOnDark,
    fontWeight: "700",
    fontSize: 14,
  },
});
