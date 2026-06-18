import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients, radius, spacing, typography } from "../theme/theme";

const ROLES = [
  { key: "farmer", label: "Farmer", icon: "🌾", blurb: "Grow & sell produce" },
  { key: "buyer", label: "Buyer", icon: "🛒", blurb: "Source fresh harvests" },
];

export default function RoleSelector({ value, onChange }) {
  return (
    <View style={styles.container}>
      <Text style={typography.label}>I am a</Text>
      <View style={styles.row}>
        {ROLES.map((role) => {
          const selected = value === role.key;
          return (
            <Pressable
              key={role.key}
              onPress={() => onChange(role.key)}
              style={styles.cardWrapper}
            >
              {selected ? (
                <LinearGradient
                  colors={gradients.accent}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.card, styles.cardSelected]}
                >
                  <Text style={styles.icon}>{role.icon}</Text>
                  <Text style={styles.labelSelected}>{role.label}</Text>
                  <Text style={styles.blurbSelected}>{role.blurb}</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.card, styles.cardUnselected]}>
                  <Text style={styles.icon}>{role.icon}</Text>
                  <Text style={styles.label}>{role.label}</Text>
                  <Text style={styles.blurb}>{role.blurb}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    minHeight: 120,
    justifyContent: "center",
  },
  cardUnselected: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cardSelected: {
    shadowColor: colors.amberDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  icon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  labelSelected: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.forestDark,
  },
  blurb: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },
  blurbSelected: {
    fontSize: 11,
    color: colors.forestDark,
    opacity: 0.75,
    marginTop: 2,
    textAlign: "center",
  },
});