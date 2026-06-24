import React from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator } from "react-native";
import { mono, colors, radius, spacing } from "../theme/theme";

// Redesigned: gradients replaced with solid monochrome fills. The "accent"
// variant keeps a touch of warmth (deep ink with the original amber as a
// thin top accent would be inconsistent with the mono system, so accent is
// now a bordered "outline" button — still clearly a secondary action, no
// green/amber anywhere).
export default function GradientButton({
  title,
  onPress,
  loading = false,
  variant = "primary", // "primary" (solid ink) | "accent" (outline)
  disabled = false,
  style,
}) {
  const isAccent = variant === "accent";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.wrapper,
        isAccent ? styles.wrapperAccent : styles.wrapperPrimary,
        style,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isAccent ? colors.ink : colors.surface} />
      ) : (
        <Text style={isAccent ? styles.textAccent : styles.textPrimary}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  wrapperPrimary: {
    backgroundColor: colors.ink,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  wrapperAccent: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.5,
  },
  textPrimary: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface,
    letterSpacing: 0.3,
  },
  textAccent: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: 0.3,
  },
});