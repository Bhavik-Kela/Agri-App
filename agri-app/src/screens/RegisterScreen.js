import React, { useState } from "react";
import { View, TextInput, Button, Alert } from "react-native";
import API from "../../services/api";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      const res = await API.post("/auth/register", {
        name,
        email,
        password,
        role: "farmer",
      });

      Alert.alert("Success", res.data.message);
    } catch (err) {
      console.log(err.response?.data);
      Alert.alert("Error", "Registration failed");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button
        title="Register"
        onPress={handleRegister}
      />
    </View>
  );
}