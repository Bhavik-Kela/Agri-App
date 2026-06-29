import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import ScreenHeader from "../components/ScreenHeader";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { colors, spacing, radius, typography } from "../theme/theme";
import { useNotifications } from "../context/NotificationContext";

// ── Icon per notification type ───────────────────────────────────────────
// Plain-text glyphs, matching the rest of the app's icon-free convention
// (◌, ◉, ✓✓, etc. — no icon library dependency anywhere in this codebase).
const TYPE_ICONS = {
  NEW_ORDER: "🧾",
  ORDER_ACCEPTED: "✓",
  ORDER_REJECTED: "✕",
  ORDER_STATUS: "↻",
  NEW_MESSAGE: "💬",
  PRODUCT_REVIEW: "★",
  FARMER_REVIEW: "★",
  SYSTEM: "◉",
};

// ── Relative time formatter ───────────────────────────────────────────────
// "2 min ago", "5h ago", "Yesterday", "3d ago", then falls back to a date.
// No date library in this project (no dayjs/date-fns import seen anywhere
// else), so this stays a small inline helper rather than adding a dependency.
function formatRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ── Deep-link resolver ────────────────────────────────────────────────────
// Maps a notification's type + payload to a navigation call. Centralized
// here, in one place, so adding a new notification type later means
// adding one case here — not touching the rendering logic above it.
function navigateForNotification(navigation, notification) {
  const { type, order, product, chatRoom } = notification;
  // order/product may be populated objects OR plain ids depending on
  // whether this notification came from the REST list (populated only on
  // `sender`, so these are still raw ids) — always read them as ids.
  const orderId = order?._id || order;
  const productId = product?._id || product;

  switch (type) {
    case "NEW_ORDER":
    case "ORDER_ACCEPTED":
    case "ORDER_REJECTED":
    case "ORDER_STATUS":
      // "Orders" only exists inside OrdersStack, not every stack (unlike
      // Chat/Notifications, which we deliberately duplicated everywhere).
      // Navigating through the parent tab ("OrdersTab") switches tabs AND
      // lands on the right screen in one call, regardless of which tab
      // the user was on when they tapped the notification. Both
      // FarmerTabs and BuyerTabs name this tab "OrdersTab" with an inner
      // "Orders" screen, so this works for both roles unchanged.
      navigation.navigate("OrdersTab", { screen: "Orders" });
      break;

    case "NEW_MESSAGE":
      if (orderId) {
        navigation.navigate("Chat", { orderId, status: "accepted" });
      }
      break;

    case "PRODUCT_REVIEW":
      if (productId) {
        navigation.navigate("ProductDetail", { productId });
      }
      break;

    case "FARMER_REVIEW":
      // FarmerProfile expects the farmer's own id, not an order/product id.
      // The notification's `sender` is the buyer who left the review, not
      // the farmer — so for FARMER_REVIEW there isn't a clean id on the
      // notification itself to deep-link to a specific farmer profile from
      // here. Falling back to Orders, where the farmer can find context.
      navigation.navigate("Orders");
      break;

    case "SYSTEM":
    default:
      break; // nothing to navigate to — just mark read and stay put
  }
}

function NotificationCard({ notification, onPress }) {
  const isUnread = !notification.isRead;

  return (
    <Pressable
      onPress={() => onPress(notification)}
      style={({ pressed }) => [
        styles.card,
        isUnread && styles.cardUnread,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.iconText}>{TYPE_ICONS[notification.type] || "◉"}</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={[styles.cardTitle, isUnread && styles.cardTitleUnread]} numberOfLines={1}>
            {notification.title}
            {notification.count > 1 ? ` (${notification.count})` : ""}
          </Text>
          <Text style={styles.cardTime}>{formatRelativeTime(notification.createdAt)}</Text>
        </View>
        <Text style={styles.cardMessage} numberOfLines={2}>
          {notification.message}
        </Text>
      </View>

      {isUnread && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

export default function NotificationsScreen({ navigation }) {
  const {
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Re-fetch page 1 every time this screen gains focus — keeps the list
  // honest if notifications arrived while the user was elsewhere, since
  // NotificationContext's live socket listener only prepends new items
  // to its own in-memory list when the app is foregrounded and connected,
  // not a guarantee against missed events during a brief disconnect.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setInitialLoad(true);
        const res = await fetchNotifications(1);
        if (active) {
          setPage(1);
          setHasMore(!!res?.hasMore);
          setInitialLoad(false);
        }
      })();
      return () => { active = false; };
    }, [fetchNotifications])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    const res = await fetchNotifications(1);
    setPage(1);
    setHasMore(!!res?.hasMore);
    setRefreshing(false);
  };

  const onLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const res = await fetchNotifications(nextPage);
    setPage(nextPage);
    setHasMore(!!res?.hasMore);
    setLoadingMore(false);
  };

  const handlePress = useCallback(
    (notification) => {
      if (!notification.isRead) {
        markAsRead(notification._id);
      }
      navigateForNotification(navigation, notification);
    },
    [navigation, markAsRead]
  );

  const hasUnread = notifications.some((n) => !n.isRead);

  if (initialLoad && loading) {
    return <LoadingSpinner label="Loading notifications..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        eyebrow="Inbox"
        title="Notifications"
        right={
          hasUnread ? (
            <Pressable onPress={markAllAsRead} style={styles.markAllButton}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </Pressable>
          ) : null
        }
      />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textTertiary}
          />
        }
        onEndReachedThreshold={0.4}
        onEndReached={onLoadMore}
        ListEmptyComponent={
          <EmptyState
            icon="◌"
            title="No notifications yet"
            subtitle="Order updates, messages, and reviews will show up here."
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              style={styles.footerSpinner}
              color={colors.textTertiary}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <NotificationCard notification={item} onPress={handlePress} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  markAllButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },

  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardUnread: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
  },
  cardPressed: {
    opacity: 0.7,
  },

  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 15,
  },

  cardBody: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: 2,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  cardTitleUnread: {
    color: colors.textPrimary,
    fontWeight: "700",
  },
  cardTime: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  cardMessage: {
    ...typography.body,
    fontSize: 13,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    marginTop: 4,
  },

  footerSpinner: {
    paddingVertical: spacing.lg,
  },
});