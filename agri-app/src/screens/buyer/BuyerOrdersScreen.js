/**
 * BuyerOrdersScreen (updated)
 * Changes from original:
 *   - Completed orders show "Write Product Review" + "Review Farmer" buttons
 *   - Buttons are disabled/greyed if the order already has a review
 *   - All original behaviour (chat, address, status badges) is preserved
 */
import React, { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import API from "../../../services/api";
import EmptyState from "../../components/EmptyState";
import LoadingSpinner from "../../components/LoadingSpinner";
import ScreenHeader from "../../components/ScreenHeader";
import { colors, radius, spacing, typography } from "../../theme/theme";

const STATUS_META = {
  pending:   { label: "Pending",   dot: "#B8A050" },
  accepted:  { label: "Accepted",  dot: "#5BB880" },
  rejected:  { label: "Rejected",  dot: "#C06060" },
  completed: { label: "Completed", dot: "#6080C8" },
};

export default function BuyerOrdersScreen() {
  const navigation = useNavigation();
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  if (loading) return <LoadingSpinner label="Loading your orders..." />;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        eyebrow="Your purchases"
        title="My Orders"
        subtitle={`${orders.length} order${orders.length === 1 ? "" : "s"}`}
      />

      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="◻"
            title="No orders yet"
            subtitle="Your purchased items will appear here once you place an order."
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
        <Text style={styles.productName} numberOfLines={1}>{productName}</Text>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: meta.dot }]} />
          <Text style={styles.statusText}>{meta.label}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

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
            {/* Product review */}
            <ReviewButton
              label={hasProductReview ? "Product Reviewed ✓" : "Write Product Review"}
              disabled={hasProductReview}
              onPress={() =>
                navigation.navigate("WriteProductReview", {
                  orderId:     item._id,
                  productName,
                })
              }
            />

            {/* Farmer review */}
            <ReviewButton
              label={hasFarmerReview ? "Farmer Reviewed ✓" : "Review Farmer"}
              disabled={hasFarmerReview}
              variant="secondary"
              onPress={() =>
                navigation.navigate("WriteFarmerReview", {
                  orderId:    item._id,
                  farmerName,
                })
              }
            />
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
function ReviewButton({ label, onPress, disabled, variant = "primary" }) {
  const isPrimary = variant === "primary";

  return (
    <Pressable
      style={[
        styles.reviewBtn,
        isPrimary ? styles.reviewBtnPrimary : styles.reviewBtnSecondary,
        disabled && styles.reviewBtnDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.reviewBtnText,
          isPrimary ? styles.reviewBtnTextPrimary : styles.reviewBtnTextSecondary,
          disabled && styles.reviewBtnTextDisabled,
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
  productName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    flex: 1,
    letterSpacing: -0.3,
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
  reviewBtnDisabled: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
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
  reviewBtnTextDisabled: {
    color: colors.textTertiary,
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