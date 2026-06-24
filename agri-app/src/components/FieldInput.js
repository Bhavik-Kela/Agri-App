import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import { colors, radius, spacing, typography } from "../theme/theme";

export default function FieldInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  error,
}) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = secureTextEntry;

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputWrapper}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            focused && styles.inputFocused,
            error && styles.inputError,
            isPassword && styles.inputWithToggle,
          ]}
        />
        {isPassword && (
          <Pressable
            style={styles.eyeToggle}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeIcon}>
              {showPassword ? "◉" : "◎"}
            </Text>
          </Pressable>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputWithToggle: {
    paddingRight: 48,
  },
  inputFocused: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.error,
  },
  eyeToggle: {
    position: "absolute",
    right: spacing.md,
    top: 0,
    height: "100%",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  eyeIcon: {
    fontSize: 16,
    color: colors.textTertiary,
  },
  errorText: {
    marginTop: spacing.xs,
    color: colors.error,
    fontSize: 12,
    fontWeight: "500",
  },
});