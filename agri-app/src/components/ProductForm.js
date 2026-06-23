import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import FieldInput from "./FieldInput";
import GradientButton from "./GradientButton";
import { colors, radius, spacing, typography } from "../theme/theme";

const CATEGORIES = ["Vegetable", "Fruit", "Grain", "Dairy", "Other"];
const UNITS = ["kg", "g", "liter", "ml", "piece", "dozen"];

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
    values.category &&
    (values.category !== "Other" || values.otherProductName?.trim());

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.cancelled) {
      set("photo")(result.assets[0].uri);
    }
  };

  return (
    <ScrollView>
      <View>
        {values.photo && (
          <View style={styles.photoPreview}>
            <Text style={styles.photoLabel}>Photo added ✓</Text>
          </View>
        )}

        <Pressable
          onPress={handlePickImage}
          style={styles.uploadButton}
        >
          <Text style={styles.uploadButtonText}>
            {values.photo ? "📸 Change Photo" : "📸 Add Product Photo"}
          </Text>
        </Pressable>

        <FieldInput
          label="Product Name"
          placeholder="e.g. Tomato"
          value={values.name}
          onChangeText={set("name")}
          autoCapitalize="words"
        />

        <View style={styles.row}>
          <View style={styles.half}>
            <FieldInput
              label="Price"
              placeholder="e.g. 40"
              value={String(values.price ?? "")}
              onChangeText={set("price")}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.half}>
            <FieldInput
              label="Price per Unit"
              placeholder="e.g. 40/kg"
              value={String(values.pricePerUnit ?? "")}
              onChangeText={set("pricePerUnit")}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <FieldInput
              label="Quantity"
              placeholder="e.g. 100"
              value={String(values.quantity ?? "")}
              onChangeText={set("quantity")}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.half}>
            <Text style={typography.label}>Unit</Text>
            <View style={styles.unitRow}>
              {UNITS.map((unit) => {
                const selected = values.unit === unit;
                return (
                  <Pressable
                    key={unit}
                    onPress={() => set("unit")(unit)}
                    style={[styles.unitChip, selected && styles.unitChipSelected]}
                  >
                    <Text
                      style={[
                        styles.unitChipText,
                        selected && styles.unitChipTextSelected,
                      ]}
                    >
                      {unit}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

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

        {values.category === "Other" && (
          <FieldInput
            label="Product Type"
            placeholder="e.g. Honey, Oil, etc."
            value={values.otherProductName}
            onChangeText={set("otherProductName")}
            autoCapitalize="words"
          />
        )}

        <GradientButton
          title={submitting ? "Saving..." : submitLabel}
          onPress={onSubmit}
          loading={submitting}
          disabled={!isValid}
          style={styles.submit}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  photoPreview: {
    backgroundColor: colors.leafLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  photoLabel: {
    color: colors.forest,
    fontWeight: "600",
    fontSize: 14,
  },
  uploadButton: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.leaf,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  uploadButtonText: {
    color: colors.forest,
    fontWeight: "700",
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  half: {
    flex: 1,
    marginRight: spacing.sm,
  },
  unitRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  unitChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  unitChipSelected: {
    backgroundColor: colors.leaf,
    borderColor: colors.leaf,
  },
  unitChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  unitChipTextSelected: {
    color: colors.textOnDark,
  },
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
