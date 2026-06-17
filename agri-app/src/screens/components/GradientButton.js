import React from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients, radius, spacing, typography } from "../theme/theme";

export default function GradientButton({
  title,
  onPress,
  loading = false,
  variant = "primary", // "primary" (forest->leaf) | "accent" (amber)
  disabled = false,
  style,
}) {
  const colorsForVariant =
    variant === "accent" ? gradients.accent : gradients.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.wrapper,
        style,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <LinearGradient
        colors={colorsForVariant}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color={colors.cream} />
        ) : (
          <Text style={typography.button}>{title}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.pill,
    overflow: "hidden",
    shadowColor: colors.forestDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  gradient: {
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.5,
  },
});