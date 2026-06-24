import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { mono, spacing } from "../theme/theme";
import { colors } from "../theme/theme";

export default function ScreenHeader({ eyebrow, title, subtitle, right }) {
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <View style={styles.textBlock}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right ? <View>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surfaceSunken,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  textBlock: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
    color: colors.inkSoft,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: colors.ink,
  },
  subtitle: {
    fontSize: 14,
    color: colors.inkSoft,
    marginTop: spacing.xs,
  },
});