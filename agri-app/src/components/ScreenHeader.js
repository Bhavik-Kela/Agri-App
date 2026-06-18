import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients, spacing, typography } from "../theme/theme";

export default function ScreenHeader({ eyebrow, title, subtitle, right }) {
  return (
    <LinearGradient
      colors={gradients.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View style={styles.row}>
        <View style={styles.textBlock}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right ? <View>{right}</View> : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
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
    ...typography.label,
    color: colors.leafLight,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.display,
    fontSize: 26,
    color: colors.textOnDark,
  },
  subtitle: {
    ...typography.body,
    color: colors.leafLight,
    marginTop: spacing.xs,
  },
});
