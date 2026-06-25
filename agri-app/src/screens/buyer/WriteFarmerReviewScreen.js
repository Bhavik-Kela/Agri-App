/**
 * WriteFarmerReviewScreen
 * Allows a buyer to submit a multi-category farmer review for a completed order.
 *
 * Navigation params:
 *   orderId     — string, required
 *   farmerName  — string, optional (display only)
 */
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import API from "../../../services/api";
import ScreenHeader from "../../components/ScreenHeader";
import GradientButton from "../../components/GradientButton";
import InteractiveStarRating from "../../components/InteractiveStarRating";
import { colors, radius, spacing, typography } from "../../theme/theme";

function CategoryIcon({ icon, size = 20, color = colors.textTertiary }) {
  switch (icon) {
    case "award":
      return <Feather name="award" size={size} color={color} />;
    case "leaf":
      return <MaterialCommunityIcons name="leaf" size={size} color={color} />;
    case "message-circle":
      return <Feather name="message-circle" size={size} color={color} />;
    case "truck":
      return <Feather name="truck" size={size} color={color} />;
    default:
      return null;
  }
}

const CATEGORIES = [
  {
    key:         "qualityRating",
    label:       "Quality",
    icon:        "award",
    description: "How good was the product quality?",
  },
  {
    key:         "freshnessRating",
    label:       "Freshness",
    icon:        "leaf",
    description: "How fresh was the produce?",
  },
  {
    key:         "communicationRating",
    label:       "Communication",
    icon:        "message-circle",
    description: "How responsive was the farmer?",
  },
  {
    key:         "deliveryRating",
    label:       "Delivery",
    icon:        "truck",
    description: "How smooth was order fulfilment?",
  },
];

const INITIAL_RATINGS = {
  qualityRating:       0,
  freshnessRating:     0,
  communicationRating: 0,
  deliveryRating:      0,
};

export default function WriteFarmerReviewScreen({ route, navigation }) {
  const { orderId, farmerName, order } = route.params || {};

  const productName = order?.product?.name;
  const quantity     = order?.quantity;
  const totalPrice   = order?.totalPrice;
  const orderDate    = order?.createdAt
    ? new Date(order.createdAt).toLocaleDateString()
    : null;

  const [ratings,    setRatings]    = useState(INITIAL_RATINGS);
  const [comment,    setComment]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [errors,     setErrors]     = useState({});

  /* ── Helpers ─────────────────────────────────────────────────────────── */
  function setCategory(key, value) {
    setRatings((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  /* ── Validation ──────────────────────────────────────────────────────── */
  function validate() {
    const e = {};
    CATEGORIES.forEach(({ key, label }) => {
      if (!ratings[key]) e[key] = `Please rate ${label.toLowerCase()}.`;
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ── Submit ──────────────────────────────────────────────────────────── */
  async function handleSubmit() {
    if (!validate()) return;
    if (submitting)   return;

    setSubmitting(true);
    try {
      await API.post("/farmer-reviews", {
        orderId,
        ...ratings,
        comment: comment.trim(),
      });

      setSubmitted(true);
      setTimeout(() => navigation.goBack(), 1600);
    } catch (err) {
      const msg = err?.response?.data?.message || "Could not submit review. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Success ─────────────────────────────────────────────────────────── */
  if (submitted) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ScreenHeader eyebrow="Farmer Review" title="Thank you!" />
        <View style={styles.successWrap}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>Review submitted</Text>
          <Text style={styles.successSubtitle}>
            Your feedback helps farmers improve and helps other buyers decide.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ── Form ────────────────────────────────────────────────────────────── */
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        eyebrow="Farmer Review"
        title={farmerName ? `Review ${farmerName}` : "Review Farmer"}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Order summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Farmer</Text>
            <Text style={styles.summaryValue}>{farmerName || "Farmer"}</Text>
          </View>
          {productName ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Product</Text>
              <Text style={styles.summaryValue}>{productName}</Text>
            </View>
          ) : null}
          {quantity != null ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Quantity</Text>
              <Text style={styles.summaryValue}>{quantity} units</Text>
            </View>
          ) : null}
          {totalPrice != null ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryValue}>₹{totalPrice}</Text>
            </View>
          ) : null}
          {orderDate ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>{orderDate}</Text>
            </View>
          ) : null}
        </View>

        {/* Category ratings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rate your experience</Text>

          {CATEGORIES.map(({ key, label, icon, description }, index) => (
            <View
              key={key}
              style={[
                styles.categoryRow,
                index < CATEGORIES.length - 1 && styles.categoryRowBorder,
              ]}
            >
              {/* Left: icon + labels */}
              <View style={styles.categoryLeft}>
                <CategoryIcon icon={icon} />
                <View style={styles.categoryTexts}>
                  <Text style={styles.categoryLabel}>{label}</Text>
                  <Text style={styles.categoryDesc}>{description}</Text>
                </View>
              </View>

              {/* Right: stars */}
              <View style={styles.categoryRight}>
                <InteractiveStarRating
                  value={ratings[key]}
                  onChange={(v) => setCategory(key, v)}
                  size={26}
                />
                {errors[key] ? (
                  <Text style={styles.errorText}>{errors[key]}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        {/* Comment */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Share your experience</Text>
          <TextInput
            style={[styles.textArea, errors.comment && styles.textAreaError]}
            placeholder="Tell us about your overall experience with this farmer…"
            placeholderTextColor={colors.textTertiary}
            value={comment}
            onChangeText={(t) => {
              setComment(t);
              if (errors.comment) setErrors((e) => ({ ...e, comment: undefined }));
            }}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={500}
          />
          <View style={styles.commentFooter}>
            {errors.comment ? (
              <Text style={styles.errorText}>{errors.comment}</Text>
            ) : (
              <View />
            )}
            <Text style={styles.charCount}>{comment.length}/500</Text>
          </View>
        </View>

        {/* Average preview */}
        {Object.values(ratings).some((v) => v > 0) ? (
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>Your overall impression</Text>
            <View style={styles.previewRow}>
              {CATEGORIES.map(({ key, icon }) => (
                <View key={key} style={styles.previewCell}>
                  <CategoryIcon icon={icon} size={16} />
                  <Text style={styles.previewValue}>
                    {ratings[key] ? `${ratings[key]}★` : "—"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Submit */}
        <GradientButton
          title={submitting ? "Submitting…" : "Submit Review"}
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
          style={styles.submitButton}
        />

        <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Styles ───────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },

  /* Cards */
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },

  /* Order summary */
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textTertiary,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "600",
  },

  /* Category rows */
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  categoryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  categoryTexts: {
    gap: 2,
    flex: 1,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  categoryDesc: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: "400",
  },
  categoryRight: {
    alignItems: "flex-end",
    gap: 3,
  },

  /* Text area */
  textArea: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    minHeight: 120,
  },
  textAreaError: {
    borderColor: colors.error,
  },
  commentFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  charCount: {
    ...typography.label,
    color: colors.textTertiary,
  },

  /* Errors */
  errorText: {
    fontSize: 11,
    color: colors.error,
    fontWeight: "500",
  },

  /* Preview */
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  previewLabel: {
    ...typography.label,
    color: colors.textTertiary,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  previewCell: {
    alignItems: "center",
    gap: 4,
  },
  previewValue: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  /* Actions */
  submitButton: {
    marginTop: spacing.xs,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  cancelText: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: "500",
  },

  /* Success */
  successWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  successIcon: {
    fontSize: 56,
    color: colors.statusAcceptedText,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  successSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});