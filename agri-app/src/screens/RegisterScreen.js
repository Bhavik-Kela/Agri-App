import React, { useState } from "react";
import { Text, Pressable, Alert } from "react-native";
import API from "../../services/api";
import AuthLayout from "../components/AuthLayout";
import FieldInput from "../components/FieldInput";
import RoleSelector from "../components/RoleSelector";
import GradientButton from "../components/GradientButton";
import { colors, spacing, typography } from "../theme/theme";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("farmer");
  const [loading, setLoading] = useState(false);

  // Original registration logic preserved exactly — only the surrounding UI changed.
  const handleRegister = async () => {
    setLoading(true);
    try {
      const res = await API.post("/auth/register", {
        name,
        email,
        password,
        role,
      });

      Alert.alert("Success", res.data.message || "Registration successful");
      navigation?.navigate?.("Login");
    } catch (err) {
      console.log(err.response?.data);
      Alert.alert("Error", "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Welcome to AgriApp"
      title="Create your account"
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
        onChangeText={setName}
        autoCapitalize="words"
      />
      <FieldInput
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <FieldInput
        label="Password"
        placeholder="At least 6 characters"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <RoleSelector value={role} onChange={setRole} />

      <GradientButton
        title={loading ? "Creating account..." : "Create account"}
        onPress={handleRegister}
        loading={loading}
        disabled={!name || !email || !password}
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