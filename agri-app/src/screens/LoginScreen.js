import React, { useState } from "react";
import { Text, Pressable, Alert } from "react-native";
import AuthLayout from "../components/AuthLayout";
import FieldInput from "../components/FieldInput";
import GradientButton from "../components/GradientButton";
import { useAuth } from "../context/AuthContext";
import { colors, typography } from "../theme/theme";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await login(email, password);

      Alert.alert(
        "Welcome back",
        res?.message || "Logged in successfully"
      );
    } catch (err) {
      console.log("ERROR:", err);
      console.log("MESSAGE:", err?.message);
      console.log("RESPONSE:", err?.response?.data);

      Alert.alert(
        "Error",
        err?.response?.data?.message || err?.message || "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Log in"
      subtitle="Pick up right where you left off"
      footer={
        <Pressable onPress={() => navigation?.navigate?.("Register")}>
          <Text style={styles.footerText}>
            New to AgriApp?{" "}
            <Text style={styles.footerLink}>Create an account</Text>
          </Text>
        </Pressable>
      }
    >
      <FieldInput
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <FieldInput
        label="Password"
        placeholder="Your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <GradientButton
        title={loading ? "Logging in..." : "Log in"}
        onPress={handleLogin}
        loading={loading}
        disabled={!email || !password}
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