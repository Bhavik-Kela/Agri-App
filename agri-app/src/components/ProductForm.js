import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import FieldInput from "./FieldInput";
import GradientButton from "./GradientButton";
import { colors, radius, spacing, typography } from "../theme/theme";

const CATEGORIES = ["Vegetable", "Fruit", "Grain", "Dairy", "Other"];

export default function ProductForm({
  values,
  onChange,
  onSubmit,
  submitting = false,
  submitLabel = "Save",
}) {
  const set = (key) => (val) => onChange({ ...values, [key]: val });

  const isValid =
    values.name?.trim() &&
    values.price !== "" &&
    !Number.isNaN(Number(values.price)) &&
    values.quantity !== "" &&
    !Number.isNaN(Number(values.quantity)) &&
    values.category;

  return (
    <View>
      <FieldInput
        label="Product Name"
        placeholder="e.g. Tomato"
        value={values.name}
        onChangeText={set("name")}
        autoCapitalize="words"
      />
      <FieldInput
        label="Price (per unit)"
        placeholder="e.g. 40"
        value={String(values.price ?? "")}
        onChangeText={set("price")}
        keyboardType="numeric"
      />
      <FieldInput
        label="Quantity"
        placeholder="e.g. 100"
        value={String(values.quantity ?? "")}
        onChangeText={set("quantity")}
        keyboardType="numeric"
      />

      <View style={styles.categoryBlock}>
        <Text style={typography.label}>Category</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((cat) => {
            const selected = values.category === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => set("category")(cat)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selected && styles.chipTextSelected,
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <GradientButton
        title={submitting ? "Saving..." : submitLabel}
        onPress={onSubmit}
        loading={submitting}
        disabled={!isValid}
        style={styles.submit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  categoryBlock: {
    marginBottom: spacing.md,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipSelected: {
    backgroundColor: colors.leaf,
    borderColor: colors.leaf,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.textOnDark,
  },
  submit: {
    marginTop: spacing.lg,
  },
});
