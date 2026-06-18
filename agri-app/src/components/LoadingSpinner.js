import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { colors, spacing, typography } from "../theme/theme";

export default function LoadingSpinner({ label = "Loading...", fullscreen = true }) {
  return (
    <View style={[styles.container, fullscreen && styles.fullscreen]}>
      <ActivityIndicator size="large" color={colors.forest} />
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
    backgroundColor: colors.cream,
  },
  label: {
    ...typography.body,
    marginTop: spacing.sm,
  },
});
