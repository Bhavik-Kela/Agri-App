import React, { useState } from "react";
import { Text, Pressable, Alert } from "react-native";
import API from "../../services/api";
import AuthLayout from "../components/AuthLayout";
import FieldInput from "../components/FieldInput";
import RoleSelector from "../components/RoleSelector";
import GradientButton from "../components/GradientButton";
import { colors, typography } from "../theme/theme";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("farmer");
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) =>
    password.length >= 6 && /[A-Z]/.test(password) && /[0-9]/.test(password);

  const handleRegister = async () => {
    let isValid = true;

    if (!name.trim()) { setNameError("Name is required"); isValid = false; }
    else setNameError("");

    if (!email) { setEmailError("Email is required"); isValid = false; }
    else if (!validateEmail(email)) { setEmailError("Please enter a valid email"); isValid = false; }
    else setEmailError("");

    if (!password) { setPasswordError("Password is required"); isValid = false; }
    else if (!validatePassword(password)) {
      setPasswordError("6+ chars, 1 uppercase, 1 number");
      isValid = false;
    } else setPasswordError("");

    if (!confirmPassword) { setConfirmPasswordError("Please confirm password"); isValid = false; }
    else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      isValid = false;
    } else setConfirmPasswordError("");

    if (!isValid) return;

    setLoading(true);
    try {
      const res = await API.post("/auth/register", { name, email, password, role });
      Alert.alert("Success", res.data.message || "Registration successful");
      navigation?.navigate?.("Login");
    } catch (err) {
      console.log(err.response?.data);
      Alert.alert("Error", err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Welcome to AgriApp"
      title="Create account"
      subtitle="Join farmers and buyers trading directly"
      footer={
        <Pressable onPress={() => navigation?.navigate?.("Login")}>
          <Text style={styles.footerText}>
            Already have an account?{" "}
            <Text style={styles.footerLink}>Log in</Text>
          </Text>
        </Pressable>
      }
    >
      <FieldInput
        label="Name"
        placeholder="Your full name"
        value={name}
        onChangeText={(t) => { setName(t); setNameError(""); }}
        autoCapitalize="words"
        error={nameError}
      />
      <FieldInput
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={(t) => { setEmail(t); setEmailError(""); }}
        keyboardType="email-address"
        error={emailError}
      />
      <FieldInput
        label="Password"
        placeholder="6+ chars, 1 uppercase, 1 number"
        value={password}
        onChangeText={(t) => { setPassword(t); setPasswordError(""); }}
        secureTextEntry
        error={passwordError}
      />
      <FieldInput
        label="Confirm Password"
        placeholder="Re-enter your password"
        value={confirmPassword}
        onChangeText={(t) => { setConfirmPassword(t); setConfirmPasswordError(""); }}
        secureTextEntry
        error={confirmPasswordError}
      />

      <RoleSelector value={role} onChange={setRole} />

      <GradientButton
        title={loading ? "Creating account…" : "Create account"}
        onPress={handleRegister}
        loading={loading}
        disabled={!name || !email || !password || !confirmPassword}
      />
    </AuthLayout>
  );
}

const styles = {
  footerText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: "center",
  },
  footerLink: {
    color: colors.textPrimary,
    fontWeight: "700",
  },
};