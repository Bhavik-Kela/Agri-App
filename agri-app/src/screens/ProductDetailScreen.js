/**
 * ProductDetailScreen (updated)
 * Changes from original:
 *   - Fetches GET /api/reviews/product/:productId on mount
 *   - Shows RatingBadge in the stats row
 *   - Renders a ReviewList section at the bottom of the ScrollView
 *   - All original behaviour (order, edit, delete) is preserved exactly
 */
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
  Image,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import API from "../../services/api";
import { useAuth } from "../context/AuthContext";
import ScreenHeader from "../components/ScreenHeader";
import GradientButton from "../components/GradientButton";
import LoadingSpinner from "../components/LoadingSpinner";
import RatingBadge from "../components/RatingBadge";
import ReviewList from "../components/ReviewList";
import { colors, radius, spacing, typography } from "../theme/theme";

const SERVER_ORIGIN = "http://10.121.163.109:5000";

function resolveImageUri(photo) {
  if (!photo) return null;
  if (photo.startsWith("http://") || photo.startsWith("https://")) return photo;
  return `${SERVER_ORIGIN}${photo.startsWith("/") ? "" : "/"}${photo}`;
}

const CATEGORY_ICONS = {
  Vegetable: "◈",
  Fruit:     "◉",
  Grain:     "◌",
  Dairy:     "○",
  Other:     "◇",
};

export default function ProductDetailScreen({ route, navigation }) {
  const { productId } = route.params || {};
  const { user } = useAuth();

  const [product,        setProduct]        = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [deleting,       setDeleting]       = useState(false);
  const [placingOrder,   setPlacingOrder]   = useState(false);
  const [quantity,       setQuantity]       = useState("1");

  // ── Review state ──────────────────────────────────────────────────────
  const [reviewData,     setReviewData]     = useState(null);   // { averageRating, reviewCount, reviews }
  const [reviewsLoading, setReviewsLoading] = useState(false);

  /* ── Fetchers ─────────────────────────────────────────────────────── */
  const fetchProduct = useCallback(async () => {
    try {
      const res = await API.get(`/products/${productId}`);
      setProduct(res.data);
    } catch (err) {
      console.log(err.response?.data);
      Alert.alert("Error", "Could not load this product");
    }
  }, [productId]);

  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const res = await API.get(`/reviews/product/${productId}`);
      setReviewData(res.data);
    } catch (err) {
      // Reviews failing silently — not critical to product display
      console.log("Reviews fetch error:", err?.response?.data);
    } finally {
      setReviewsLoading(false);
    }
  }, [productId]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (active) setLoading(true);
        await Promise.all([fetchProduct(), fetchReviews()]);
        if (active) setLoading(false);
      })();
      return () => { active = false; };
    }, [fetchProduct, fetchReviews])
  );

  if (loading || !product) {
    return <LoadingSpinner label="Loading product..." />;
  }

  const farmerId = product.farmer?._id || product.farmer;
  const isOwner  = user?.role === "farmer" && farmerId === user?.id;
  const icon     = CATEGORY_ICONS[product.category] || CATEGORY_ICONS.Other;

  // Prefer live review data, fall back to values embedded in product model
  const averageRating = reviewData?.averageRating ?? product.averageRating;
  const reviewCount   = reviewData?.reviewCount   ?? product.reviewCount;
  const reviews       = reviewData?.reviews       ?? [];

  /* ── Handlers ─────────────────────────────────────────────────────── */
  const handleDelete = () => {
    Alert.alert(
      "Delete product",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await API.delete(`/products/${productId}`);
              navigation.navigate("MyProducts");
            } catch (err) {
              console.log(err.response?.data);
              Alert.alert("Error", err.response?.data?.message || "Could not delete product");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handlePlaceOrder = async () => {
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      Alert.alert("Error", "Please enter a valid quantity");
      return;
    }
    if (qty > Number(product?.quantity || 0)) {
      Alert.alert("Error", "Requested quantity exceeds available stock");
      return;
    }
    try {
      setPlacingOrder(true);
      await API.post("/orders", { productId, quantity: qty });
      Alert.alert("Success", "Order placed successfully");
      await fetchProduct();
      setQuantity("1");
    } catch (err) {
      console.log(err?.response?.data);
      Alert.alert("Error", err?.response?.data?.message || "Could not place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader eyebrow={product.category} title={product.name} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image / icon */}
        <View style={styles.heroWrap}>
          {product?.photo ? (
            <Image
              source={{ uri: resolveImageUri(product.photo) }}
              style={styles.productImage}
            />
          ) : (
            <View style={styles.iconPlaceholder}>
              <Text style={styles.icon}>{icon}</Text>
              <Text style={styles.iconLabel}>{product.category}</Text>
            </View>
          )}

          {/* Rating badge overlaid on hero */}
          {averageRating > 0 ? (
            <View style={styles.ratingOverlay}>
              <RatingBadge rating={averageRating} count={reviewCount} />
            </View>
          ) : null}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>₹{product.price}</Text>
            <Text style={styles.statLabel}>per unit</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{product.quantity}</Text>
            <Text style={styles.statLabel}>available</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statValue}>
              {averageRating ? Number(averageRating).toFixed(1) : "—"}
            </Text>
            <Text style={styles.statLabel}>rating</Text>
          </View>
        </View>

        {/* Detail card */}
        <View style={styles.card}>
          {product.farmer?.name ? (
            <Pressable
              style={({ pressed }) => [
                styles.sellerRow,
                pressed && farmerId && styles.sellerRowPressed,
              ]}
              disabled={!farmerId}
              onPress={() =>
                navigation.navigate("FarmerProfile", {
                  farmerId,
                  farmerName: product.farmer.name,
                })
              }
            >
              <Text style={styles.sellerLinkLabel}>Sold by</Text>
              <View style={styles.sellerLinkRow}>
                <Text style={styles.sellerName} numberOfLines={1}>
                  {product.farmer.name}
                </Text>
                <Text style={styles.sellerChevron}>→</Text>
              </View>
            </Pressable>
          ) : null}
          <DetailRow label="Unit price" value={`₹${product.price}`} last />
        </View>

        {/* Owner actions */}
        {isOwner ? (
          <View style={styles.actions}>
            <GradientButton
              title="Edit Product"
              onPress={() => navigation.navigate("EditProduct", { productId })}
              style={styles.actionButton}
            />
            <Pressable
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={deleting}
            >
              <Text style={styles.deleteButtonText}>
                {deleting ? "Deleting…" : "Delete Product"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.actions}>
            {/* Quantity picker */}
            <View style={styles.quantityRow}>
              <Text style={styles.quantityLabel}>Quantity</Text>
              <View style={styles.quantityControls}>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() =>
                    setQuantity(String(Math.max(1, Number(quantity) - 1)))
                  }
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </Pressable>
                <TextInput
                  style={styles.qtyInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="number-pad"
                  selectTextOnFocus
                />
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => setQuantity(String(Number(quantity) + 1))}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </Pressable>
              </View>
            </View>

            <GradientButton
              title={placingOrder ? "Placing Order…" : "Place Order"}
              onPress={handlePlaceOrder}
              loading={placingOrder}
              style={styles.actionButton}
            />
          </View>
        )}

        {/* ── Reviews section ──────────────────────────────────────────── */}
        <View style={styles.reviewsSection}>
          {/* Section header */}
          <View style={styles.reviewsHeader}>
            <Text style={styles.reviewsTitle}>Customer Reviews</Text>
            {reviewCount > 0 ? (
              <RatingBadge rating={averageRating} count={reviewCount} />
            ) : null}
          </View>

          <ReviewList
            reviews={reviews}
            loading={reviewsLoading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────── */
function DetailRow({ label, value, last }) {
  return (
    <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  /* Hero */
  heroWrap: {
    borderRadius: radius.xl,
    overflow: "hidden",
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  iconPlaceholder: {
    alignItems: "center",
    gap: spacing.sm,
  },
  icon: {
    fontSize: 48,
    color: colors.textTertiary,
  },
  iconLabel: {
    ...typography.label,
    color: colors.textTertiary,
  },
  ratingOverlay: {
    position: "absolute",
    bottom: spacing.sm,
    right: spacing.sm,
  },

  /* Stats */
  statsRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  statCell: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 2,
  },

  /* Card */
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  detailLabel: {
    ...typography.label,
    color: colors.textTertiary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  sellerRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  sellerRowPressed: {
    opacity: 0.6,
  },
  sellerLinkLabel: {
    ...typography.label,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  sellerLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
  },
  sellerChevron: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "600",
  },

  /* Actions */
  actions: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionButton: {
    width: "100%",
  },
  deleteButton: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.error,
  },

  /* Quantity */
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  qtyBtnText: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: "400",
    lineHeight: 20,
  },
  qtyInput: {
    minWidth: 40,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  /* Reviews section */
  reviewsSection: {
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  reviewsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reviewsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
});