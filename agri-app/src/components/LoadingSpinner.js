import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { mono, spacing } from "../theme/theme";
import { colors } from "../theme/theme";

export default function LoadingSpinner({ label = "Loading...", fullscreen = true }) {
  return (
    <View style={[styles.container, fullscreen && styles.fullscreen]}>
      <ActivityIndicator size="large" color={colors.ink} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  fullscreen: {
    flex: 1,
    backgroundColor: colors.surfaceSunken,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.inkSoft,
    marginTop: spacing.sm,
  },
});