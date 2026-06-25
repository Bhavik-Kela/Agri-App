/**
 * RatingBadge
 * Compact inline rating badge: ★ 4.7 · 23 Reviews
 *
 * Usage:
 *   <RatingBadge rating={4.7} count={23} />
 *   <RatingBadge rating={4.7} count={23} size="large" />
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../theme/theme";

export default function RatingBadge({ rating, count, size = "small", style }) {
  const isLarge = size === "large";

  if (!rating && !count) return null;

  return (
    <View style={[styles.badge, isLarge && styles.badgeLarge, style]}>
      <Text style={[styles.star, isLarge && styles.starLarge]}>★</Text>
      <Text style={[styles.rating, isLarge && styles.ratingLarge]}>
        {rating != null ? Number(rating).toFixed(1) : "—"}
      </Text>
      {count != null ? (
        <Text style={[styles.count, isLarge && styles.countLarge]}>
          · {count} {count === 1 ? "Review" : "Reviews"}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: "flex-start",
  },
  badgeLarge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 5,
  },
  star: {
    fontSize: 12,
    color: "#D4A017",
    lineHeight: 16,
  },
  starLarge: {
    fontSize: 18,
    lineHeight: 24,
  },
  rating: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  ratingLarge: {
    fontSize: 18,
    letterSpacing: -0.4,
  },
  count: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  countLarge: {
    fontSize: 14,
  },
});