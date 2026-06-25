/**
 * ReviewList
 * Handles loading / empty / list states for a collection of reviews.
 * Accepts reviews sorted newest-first from the caller.
 *
 * Usage:
 *   <ReviewList reviews={reviews} loading={loading} />
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius, spacing, typography } from "../theme/theme";
import ReviewCard from "./ReviewCard";

/* ── Skeleton ─────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <View style={styles.skeleton}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonHeaderLines}>
          <View style={[styles.skeletonLine, { width: "40%", height: 12 }]} />
          <View style={[styles.skeletonLine, { width: "25%", height: 10, marginTop: 5 }]} />
        </View>
      </View>
      <View style={[styles.skeletonLine, { width: "90%", height: 12, marginTop: 4 }]} />
      <View style={[styles.skeletonLine, { width: "70%", height: 12, marginTop: 6 }]} />
    </View>
  );
}

/* ── Empty ────────────────────────────────────────────────────────────── */
function EmptyReviews() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>◻</Text>
      <Text style={styles.emptyTitle}>No reviews yet</Text>
      <Text style={styles.emptySubtitle}>
        Reviews from verified buyers will appear here.
      </Text>
    </View>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────── */
export default function ReviewList({ reviews = [], loading = false, style }) {
  if (loading) {
    return (
      <View style={[styles.list, style]}>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </View>
    );
  }

  if (!reviews.length) {
    return <EmptyReviews />;
  }

  return (
    <View style={[styles.list, style]}>
      {reviews.map((review) => (
        <ReviewCard key={review._id} review={review} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },

  /* Skeleton */
  skeleton: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  skeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  skeletonAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceRaised,
  },
  skeletonHeaderLines: {
    flex: 1,
  },
  skeletonLine: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.sm,
  },

  /* Empty */
  empty: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyIcon: {
    fontSize: 32,
    color: colors.textTertiary,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 240,
  },
});