/**
 * InteractiveStarRating
 * Tappable 5-star selector for review forms.
 *
 * Usage:
 *   <InteractiveStarRating
 *     value={rating}
 *     onChange={setRating}
 *     label="Quality"
 *     size={32}
 *   />
 */
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, radius, spacing, typography } from "../theme/theme";

const STAR_FILLED = "★";
const STAR_EMPTY  = "☆";

export default function InteractiveStarRating({
  value = 0,
  onChange,
  label,
  size = 32,
  error,
  style,
}) {
  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => onChange?.(star)}
            hitSlop={8}
            style={({ pressed }) => [styles.starBtn, pressed && styles.starBtnPressed]}
          >
            <Text
              style={[
                styles.star,
                { fontSize: size, lineHeight: size + 6 },
                star <= value ? styles.starFilled : styles.starEmpty,
              ]}
            >
              {star <= value ? STAR_FILLED : STAR_EMPTY}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Descriptive hint */}
      {value > 0 ? (
        <Text style={styles.hint}>{HINTS[value]}</Text>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const HINTS = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  starsRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  starBtn: {
    padding: 2,
  },
  starBtnPressed: {
    opacity: 0.7,
  },
  star: {
    fontWeight: "400",
  },
  starFilled: {
    color: "#D4A017",
  },
  starEmpty: {
    color: colors.textTertiary,
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  error: {
    fontSize: 12,
    color: colors.error,
    fontWeight: "500",
  },
});