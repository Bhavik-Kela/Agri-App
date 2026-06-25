/**
 * StarRating
 * Display-only star row. Pass `rating` (0–5, supports decimals) and optional `size`.
 *
 * Usage:
 *   <StarRating rating={4.7} />
 *   <StarRating rating={3} size={20} />
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing } from "../theme/theme";

const STAR = "★";
const EMPTY = "☆";

export default function StarRating({ rating = 0, size = 16, style }) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    if (rating >= i + 1) return "full";
    if (rating >= i + 0.5) return "half";
    return "empty";
  });

  return (
    <View style={[styles.row, style]}>
      {stars.map((type, i) => (
        <Text
          key={i}
          style={[
            styles.star,
            { fontSize: size, lineHeight: size + 4 },
            type === "empty" ? styles.starEmpty : styles.starFilled,
          ]}
        >
          {type === "empty" ? EMPTY : STAR}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  star: {
    fontWeight: "400",
  },
  starFilled: {
    color: "#D4A017", // warm gold — only intentional color deviation, universally readable
  },
  starEmpty: {
    color: colors.textTertiary,
  },
});