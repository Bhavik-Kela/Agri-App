import React, { useState } from "react";
import { Text, Pressable, Alert } from "react-native";
import API from "../../services/api";
import AuthLayout from "../components/AuthLayout";
import FieldInput from "../components/FieldInput";
import GradientButton from "../components/GradientButton";
import { colors, typography } from "../theme/theme";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6 && /[A-Z]/.test(password) && /[0-9]/.test(password);
  };

  const handleResetPassword = async () => {
    let isValid = true;

    if (!email) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError("Please enter a valid email");
      isValid = false;
    } else {
      setEmailError("");
    }

    if (!newPassword) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (!validatePassword(newPassword)) {
      setPasswordError("Password must have 6+ chars, 1 uppercase, 1 number");
      isValid = false;
    } else {
      setPasswordError("");
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm password");
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      isValid = false;
    } else {
      setConfirmPasswordError("");
    }

    if (!isValid) return;

    setLoading(true);
    try {
      const res = await API.post("/auth/reset-password", {
        email,
        newPassword,
      });

      Alert.alert("Success", res.data.message || "Password reset successfully");
      navigation?.navigate?.("Login");
    } catch (err) {
      console.log(err.response?.data);
      Alert.alert(
        "Error",
        err.response?.data?.message || "Could not reset password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Reset your password"
      title="Forgot Password"
      subtitle="Enter your email and new password"
      footer={
        <Pressable onPress={() => navigation?.navigate?.("Login")}>
          <Text style={styles.footerText}>
            Remember your password?{" "}
            <Text style={styles.footerLink}>Back to login</Text>
          </Text>
        </Pressable>
      }
    >
      <FieldInput
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setEmailError("");
        }}
        keyboardType="email-address"
        error={emailError}
      />
      <FieldInput
        label="New Password"
        placeholder="At least 6 characters, 1 uppercase, 1 number"
        value={newPassword}
        onChangeText={(text) => {
          setNewPassword(text);
          setPasswordError("");
        }}
        secureTextEntry
        error={passwordError}
      />
      <FieldInput
        label="Confirm Password"
        placeholder="Re-enter your password"
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          setConfirmPasswordError("");
        }}
        secureTextEntry
        error={confirmPasswordError}
      />

      <GradientButton
        title={loading ? "Resetting..." : "Reset Password"}
        onPress={handleResetPassword}
        loading={loading}
        disabled={!email || !newPassword || !confirmPassword}
      />
    </AuthLayout>
  );
}

const styles = {
  footerText: {
    ...typography.body,
    fontSize: 14,
  },
  footerLink: {
    color: colors.forest,
    fontWeight: "700",
  },
};
