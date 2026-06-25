/**
 * FarmerRatingSummary
 * Reusable component for the Farmer Profile rating section.
 * Accepts props directly — no API calls inside. Just renders what it receives.
 *
 * Usage:
 *   <FarmerRatingSummary
 *     averageFarmerRating={4.6}
 *     farmerReviewCount={12}
 *     reviews={[]}         // optional — renders ReviewList when provided
 *   />
 *
 * When the GET /farmer-reviews endpoint is ready, simply fetch the data
 * in the parent screen and pass it down here.
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius, spacing, typography } from "../theme/theme";
import StarRating from "./StarRating";
import RatingBadge from "./RatingBadge";
import ReviewList from "./ReviewList";

export default function FarmerRatingSummary({
  averageFarmerRating,
  farmerReviewCount,
  reviews,
  reviewsLoading = false,
  style,
}) {
  const hasRating = averageFarmerRating != null && farmerReviewCount != null;

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

            {/* Category breakdown legend (static labels matching FarmerReview form) */}
            <View style={styles.divider} />
            <View style={styles.categoryRow}>
              {CATEGORIES.map((c) => (
                <View key={c.key} style={styles.categoryCell}>
                  <Text style={styles.categoryIcon}>{c.icon}</Text>
                  <Text style={styles.categoryLabel}>{c.label}</Text>
                </View>
              ))}
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
  { key: "quality",       icon: "◈", label: "Quality"  },
  { key: "freshness",     icon: "◉", label: "Freshness" },
  { key: "communication", icon: "◌", label: "Comms"    },
  { key: "delivery",      icon: "○", label: "Delivery"  },
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
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  categoryCell: {
    alignItems: "center",
    gap: 4,
  },
  categoryIcon: {
    fontSize: 18,
    color: colors.textTertiary,
  },
  categoryLabel: {
    ...typography.label,
    color: colors.textTertiary,
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