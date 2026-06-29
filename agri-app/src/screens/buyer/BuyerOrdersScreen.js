/**
 * BuyerOrdersScreen (updated)
 * Changes from original:
 *   - Completed orders show "Write Product Review" + "Review Farmer" buttons
 *   - Buttons are disabled/greyed if the order already has a review
 *   - All original behaviour (chat, address, status badges) is preserved
 */
import React, { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import API from "../../../services/api";
import EmptyState from "../../components/EmptyState";
import LoadingSpinner from "../../components/LoadingSpinner";
import ScreenHeader from "../../components/ScreenHeader";
import RatingBadge from "../../components/RatingBadge";
import { colors, radius, spacing, typography } from "../../theme/theme";

const STATUS_META = {
  pending:   { label: "Pending",   dot: "#B8A050" },
  accepted:  { label: "Accepted",  dot: "#5BB880" },
  rejected:  { label: "Rejected",  dot: "#C06060" },
  completed: { label: "Completed", dot: "#6080C8" },
};

const DATE_FILTERS = [
  { key: "all", label: "All", days: null },
  { key: "today", label: "Today", days: 1 },
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
];

function getOrderTime(order) {
  return new Date(order?.createdAt || 0).getTime();
}

function getFilteredOrdersByDate(orders, filterKey) {
  const filter = DATE_FILTERS.find((item) => item.key === filterKey) || DATE_FILTERS[0];
  const sorted = [...orders].sort((a, b) => getOrderTime(b) - getOrderTime(a));

  if (!filter.days) return sorted;

  const start = new Date();
  if (filter.key === "today") {
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(start.getDate() - (filter.days - 1));
    start.setHours(0, 0, 0, 0);
  }

  return sorted.filter((order) => getOrderTime(order) >= start.getTime());
}

function formatOrderDate(dateString) {
  if (!dateString) return "Date unavailable";

  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BuyerOrdersScreen() {
  const navigation = useNavigation();
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState("all");

  const fetchOrders = useCallback(async () => {
    try {
      const res = await API.get("/orders/my");
      setOrders(res.data || []);
    } catch (err) {
      console.log(err?.response?.data);
      Alert.alert("Error", "Could not load your orders");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (active) setLoading(true);
        await fetchOrders();
        if (active) setLoading(false);
      })();
      return () => { active = false; };
    }, [fetchOrders])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const filteredOrders = useMemo(
    () => getFilteredOrdersByDate(orders, selectedDateFilter),
    [orders, selectedDateFilter]
  );

  if (loading) return <LoadingSpinner label="Loading your orders..." />;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        eyebrow="Your purchases"
        title="My Orders"
        subtitle={`${filteredOrders.length} of ${orders.length} order${orders.length === 1 ? "" : "s"}`}
      />

      <DateFilterBar
        selectedDateFilter={selectedDateFilter}
        onSelect={setSelectedDateFilter}
      />

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="◻"
            title={orders.length ? "No orders in this date range" : "No orders yet"}
            subtitle={
              orders.length
                ? "Try a wider date filter to see older purchases."
                : "Your purchased items will appear here once you place an order."
            }
          />
        }
        renderItem={({ item }) => <OrderCard item={item} navigation={navigation} />}
      />
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  OrderCard — extracted to avoid creating functions inside renderItem    */
/* ─────────────────────────────────────────────────────────────────────── */
function DateFilterBar({ selectedDateFilter, onSelect }) {
  return (
    <View style={styles.filterBar}>
      {DATE_FILTERS.map((filter) => {
        const active = selectedDateFilter === filter.key;
        return (
          <Pressable
            key={filter.key}
            onPress={() => onSelect(filter.key)}
            style={[styles.filterChip, active && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function OrderCard({ item, navigation }) {
  const meta           = STATUS_META[item?.status] || STATUS_META.pending;
  const isCompleted    = item?.status === "completed";
  const canChat        = item?.status === "accepted" || isCompleted;
  const sellerAddress  = item?.farmer?.addresses?.find((a) => a.isDefault);

  // Backend may return hasProductReview / hasFarmerReview booleans
  // If not present yet, default to false so buttons are always shown
  const hasProductReview = item?.hasProductReview ?? false;
  const hasFarmerReview  = item?.hasFarmerReview  ?? false;

  const productName = item?.product?.name || "Product";
  const farmerName  = item?.farmer?.name  || "Farmer";

  return (
    <View style={styles.card}>
      {/* Card header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.productName} numberOfLines={1}>{productName}</Text>
          <Text style={styles.dateText}>Placed {formatOrderDate(item?.createdAt)}</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: meta.dot }]} />
          <Text style={styles.statusText}>{meta.label}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Sold by */}
      <Pressable
        style={({ pressed }) => [
          styles.sellerRow,
          pressed && item?.farmer?._id && styles.sellerRowPressed,
        ]}
        disabled={!item?.farmer?._id}
        onPress={() =>
          navigation.navigate("FarmerProfile", {
            farmerId:   item.farmer._id,
            farmerName: item.farmer.name,
          })
        }
      >
        <Text style={styles.sellerName} numberOfLines={1}>Sold by {farmerName}</Text>
        {item?.farmer?.averageFarmerRating ? (
          <View style={styles.sellerRatingRow}>
            <Text style={styles.sellerRatingStar}>★</Text>
            <Text style={styles.sellerRatingValue}>
              {Number(item.farmer.averageFarmerRating).toFixed(1)}
            </Text>
            <Text style={styles.sellerRatingLabel}>
              farmer rating · {item.farmer.farmerReviewCount}{" "}
              {item.farmer.farmerReviewCount === 1 ? "review" : "reviews"}
            </Text>
          </View>
        ) : null}
      </Pressable>

      {/* Info rows */}
      <View style={styles.infoGrid}>
        <InfoCell label="Quantity" value={`${item?.quantity || 0} units`} />
        <InfoCell label="Total"    value={`₹${item?.totalPrice || 0}`}    />
      </View>

      {/* Seller address when accepted */}
      {item?.status === "accepted" && sellerAddress ? (
        <View style={styles.addressBlock}>
          <Text style={styles.addressLabel}>Pickup address</Text>
          <Text style={styles.addressLine}>{sellerAddress.street}</Text>
          <Text style={styles.addressLine}>
            {sellerAddress.city}, {sellerAddress.state} {sellerAddress.zipCode}
          </Text>
        </View>
      ) : null}

      {/* Review buttons — only for completed orders */}
      {isCompleted ? (
        <View style={styles.reviewSection}>
          <View style={styles.reviewDivider} />
          <Text style={styles.reviewSectionLabel}>Reviews</Text>
          <View style={styles.reviewButtons}>
            {hasProductReview ? (
              <Text style={styles.reviewStatus}>✓ Product Reviewed</Text>
            ) : (
              <ReviewButton
                label="Write Product Review"
                onPress={() =>
                  navigation.navigate("WriteProductReview", {
                    orderId:     item._id,
                    productName,
                  })
                }
              />
            )}

            {hasFarmerReview ? (
              <Text style={styles.reviewStatus}>✓ Farmer Reviewed</Text>
            ) : (
              <ReviewButton
                label="Review Farmer"
                variant="secondary"
                onPress={() =>
                  navigation.navigate("WriteFarmerReview", {
                    orderId:    item._id,
                    farmerName,
                    order:      item,
                  })
                }
              />
            )}
          </View>
        </View>
      ) : null}

      {/* Chat button */}
      {canChat ? (
        <Pressable
          style={[
            styles.chatButton,
            isCompleted && styles.chatButtonMuted,
          ]}
          onPress={() =>
            navigation.navigate("Chat", {
              orderId: item._id,
              status:  item.status,
            })
          }
        >
          <Text
            style={[
              styles.chatButtonText,
              isCompleted && styles.chatButtonTextMuted,
            ]}
          >
            {isCompleted ? "View Chat" : "Message Seller"}
          </Text>
          <Text style={styles.chatArrow}>→</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ── ReviewButton ─────────────────────────────────────────────────────── */
function ReviewButton({ label, onPress, variant = "primary" }) {
  const isPrimary = variant === "primary";

  return (
    <Pressable
      style={[
        styles.reviewBtn,
        isPrimary ? styles.reviewBtnPrimary : styles.reviewBtnSecondary,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.reviewBtnText,
          isPrimary ? styles.reviewBtnTextPrimary : styles.reviewBtnTextSecondary,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* ── InfoCell ─────────────────────────────────────────────────────────── */
function InfoCell({ label, value }) {
  return (
    <View style={styles.infoCell}>
      <Text style={styles.infoCellLabel}>{label}</Text>
      <Text style={styles.infoCellValue}>{value}</Text>
    </View>
  );
}

/* ── Styles ───────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  listContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },

  filterBar: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.black,
  },

  /* Card */
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  cardHeaderLeft: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  productName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  dateText: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: colors.hairline,
    marginHorizontal: spacing.lg,
  },

  /* Sold by */
  sellerRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sellerRowPressed: {
    opacity: 0.6,
  },
  sellerName: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  sellerRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 3,
  },
  sellerRatingStar: {
    fontSize: 11,
    color: "#D4A017",
  },
  sellerRatingValue: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  sellerRatingLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    marginLeft: 2,
  },

  /* Info grid */
  infoGrid: {
    flexDirection: "row",
    padding: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  infoCell: {
    flex: 1,
  },
  infoCellLabel: {
    ...typography.label,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  infoCellValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },

  /* Address block */
  addressBlock: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addressLabel: {
    ...typography.label,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  addressLine: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  /* Review section */
  reviewSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: colors.hairline,
    marginBottom: spacing.md,
  },
  reviewSectionLabel: {
    ...typography.label,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  reviewButtons: {
    gap: spacing.sm,
  },
  reviewStatus: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textTertiary,
    paddingVertical: 10,
  },
  reviewBtn: {
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  reviewBtnPrimary: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  reviewBtnSecondary: {
    backgroundColor: "transparent",
    borderColor: colors.borderStrong,
  },
  reviewBtnText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  reviewBtnTextPrimary: {
    color: colors.black,
  },
  reviewBtnTextSecondary: {
    color: colors.textSecondary,
  },

  /* Chat button */
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    margin: spacing.lg,
    marginTop: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
  },
  chatButtonMuted: {
    backgroundColor: colors.surfaceRaised,
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.black,
  },
  chatButtonTextMuted: {
    color: colors.textSecondary,
  },
  chatArrow: {
    fontSize: 16,
    color: colors.black,
    fontWeight: "300",
  },
});
