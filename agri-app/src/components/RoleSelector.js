import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, radius, spacing, typography } from "../theme/theme";

const ROLES = [
  { key: "farmer", label: "Farmer", icon: "⬡", blurb: "Grow & sell produce" },
  { key: "buyer",  label: "Buyer",  icon: "⬢", blurb: "Source fresh harvests" },
];

export default function RoleSelector({ value, onChange }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>I am a</Text>
      <View style={styles.row}>
        {ROLES.map((role) => {
          const selected = value === role.key;
          return (
            <Pressable
              key={role.key}
              onPress={() => onChange(role.key)}
              style={[styles.card, selected && styles.cardSelected]}
            >
              <Text style={[styles.icon, selected && styles.iconSelected]}>
                {role.icon}
              </Text>
              <Text style={[styles.roleName, selected && styles.roleNameSelected]}>
                {role.label}
              </Text>
              <Text style={[styles.blurb, selected && styles.blurbSelected]}>
                {role.blurb}
              </Text>
              {selected && <View style={styles.dot} />}
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
  label: {
    ...typography.label,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    minHeight: 110,
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardSelected: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  icon: {
    fontSize: 22,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  iconSelected: {
    color: colors.black,
  },
  roleName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    letterSpacing: -0.2,
  },
  roleNameSelected: {
    color: colors.black,
  },
  blurb: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 3,
    textAlign: "center",
  },
  blurbSelected: {
    color: "#555555",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.black,
    marginTop: spacing.sm,
  },
});