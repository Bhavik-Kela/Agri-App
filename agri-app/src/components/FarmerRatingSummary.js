/**
 * FarmerRatingSummary
 * Reusable component for the Farmer Profile rating section.
 * Accepts props directly — no API calls inside. Just renders what it receives.
 *
 * Usage:
 *   <FarmerRatingSummary
 *     averageFarmerRating={4.6}
 *     farmerReviewCount={12}
 *     averageQualityRating={4.7}
 *     averageFreshnessRating={4.9}
 *     averageCommunicationRating={4.5}
 *     averageDeliveryRating={4.8}
 *     reviews={[]}         // optional — renders ReviewList when provided
 *   />
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "../theme/theme";
import StarRating from "./StarRating";
import ReviewList from "./ReviewList";

function CategoryIcon({ icon, size = 18, color = colors.textTertiary }) {
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

export default function FarmerRatingSummary({
  averageFarmerRating,
  farmerReviewCount,
  averageQualityRating,
  averageFreshnessRating,
  averageCommunicationRating,
  averageDeliveryRating,
  reviews,
  reviewsLoading = false,
  style,
}) {
  const hasRating = averageFarmerRating != null && farmerReviewCount != null;

  const categoryAverages = {
    quality: averageQualityRating,
    freshness: averageFreshnessRating,
    communication: averageCommunicationRating,
    delivery: averageDeliveryRating,
  };

  return (
    <View style={[styles.wrapper, style]}>
      {/* Section header */}
      <Text style={styles.sectionTitle}>Farmer Rating</Text>

      {/* Summary card */}
      <View style={styles.summaryCard}>
        {hasRating ? (
          <>
            <View style={styles.bigRating}>
              <Text style={styles.bigNumber}>
                {Number(averageFarmerRating).toFixed(1)}
              </Text>
              <View style={styles.bigRatingRight}>
                <StarRating rating={averageFarmerRating} size={20} />
                <Text style={styles.reviewCountText}>
                  {farmerReviewCount} {farmerReviewCount === 1 ? "review" : "reviews"}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />
            <View style={styles.categoryList}>
              {CATEGORIES.map((c, index) => {
                const avg = categoryAverages[c.key];
                return (
                  <View
                    key={c.key}
                    style={[
                      styles.categoryRow,
                      index < CATEGORIES.length - 1 && styles.categoryRowBorder,
                    ]}
                  >
                    <View style={styles.categoryLeft}>
                      <CategoryIcon icon={c.icon} />
                      <Text style={styles.categoryLabel}>{c.label}</Text>
                    </View>
                    <View style={styles.categoryRight}>
                      {avg > 0 ? (
                        <>
                          <StarRating rating={avg} size={14} />
                          <Text style={styles.categoryValue}>
                            {Number(avg).toFixed(1)}
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.categoryEmpty}>—</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <View style={styles.noRatingWrap}>
            <Text style={styles.noRatingIcon}>◻</Text>
            <Text style={styles.noRatingText}>No ratings yet</Text>
          </View>
        )}
      </View>

      {/* Review list — only shown when reviews prop is provided */}
      {reviews !== undefined ? (
        <>
          <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
            Buyer Reviews
          </Text>
          <ReviewList reviews={reviews} loading={reviewsLoading} />
        </>
      ) : null}
    </View>
  );
}

const CATEGORIES = [
  { key: "quality",       icon: "award",           label: "Quality"       },
  { key: "freshness",     icon: "leaf",            label: "Freshness"     },
  { key: "communication", icon: "message-circle", label: "Communication" },
  { key: "delivery",      icon: "truck",           label: "Delivery"      },
];

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    padding: spacing.lg,
  },
  bigRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  bigNumber: {
    fontSize: 48,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -2,
    lineHeight: 52,
  },
  bigRatingRight: {
    gap: spacing.xs,
  },
  reviewCountText: {
    fontSize: 13,
    color: colors.textTertiary,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: colors.hairline,
    marginVertical: spacing.md,
  },
  categoryList: {
    gap: 0,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
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
  categoryRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  categoryLabel: {
    ...typography.label,
    color: colors.textTertiary,
    textTransform: "none",
    letterSpacing: -0.1,
    fontSize: 13,
  },
  categoryValue: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    minWidth: 28,
    textAlign: "right",
  },
  categoryEmpty: {
    fontSize: 13,
    color: colors.textTertiary,
    fontWeight: "500",
  },
  noRatingWrap: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  noRatingIcon: {
    fontSize: 28,
    color: colors.textTertiary,
  },
  noRatingText: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: "500",
  },
});
