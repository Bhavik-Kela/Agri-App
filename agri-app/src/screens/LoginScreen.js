import React, { useState } from "react";
import { Text, Pressable, Alert } from "react-native";
import API from "../../services/api";
import AuthLayout from "./components/AuthLayout";
import FieldInput from "./components/FieldInput";
import GradientButton from "./components/GradientButton";
import { colors, typography } from "./theme/theme";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await API.post("/auth/login", { email, password });

      // Expecting the backend to return a user object and/or token.
      // Adjust this destructure once your friend confirms the response shape.
      const user = res.data?.user || res.data;

      Alert.alert("Welcome back", res.data?.message || "Logged in successfully");
      navigation?.navigate?.("Profile", { user });
    } catch (err) {
      console.log(err.response?.data);
      Alert.alert("Error", "Login failed. Check your email and password.");
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