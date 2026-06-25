/**
 * ReviewCard
 * Renders one review: buyer name, star rating, comment, formatted date.
 *
 * Usage:
 *   <ReviewCard review={review} />
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius, spacing, typography } from "../theme/theme";
import StarRating from "./StarRating";

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function getInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

export default function ReviewCard({ review, style }) {
  if (!review) return null;

  const name    = review.buyer?.name || "Anonymous";
  const rating  = review.rating ?? 0;
  const comment = review.comment || "";
  const date    = formatDate(review.createdAt);

  return (
    <View style={[styles.card, style]}>
      {/* Header row */}
      <View style={styles.header}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(name)}</Text>
        </View>

        <View style={styles.headerMeta}>
          <Text style={styles.buyerName} numberOfLines={1}>{name}</Text>
          <StarRating rating={rating} size={13} />
        </View>

        <Text style={styles.date}>{date}</Text>
      </View>

      {/* Comment */}
      {comment ? (
        <Text style={styles.comment}>{comment}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  headerMeta: {
    flex: 1,
    gap: 3,
  },
  buyerName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  date: {
    ...typography.label,
    color: colors.textTertiary,
    alignSelf: "flex-start",
  },
  comment: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});