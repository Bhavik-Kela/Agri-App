import React, { useState } from "react";
import { ScrollView, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API from "../../../services/api";
import ScreenHeader from "../../components/ScreenHeader";
import ProductForm from "../../components/ProductForm";
import { colors, spacing } from "../../theme/theme";

export default function AddProductScreen({ navigation }) {
  const [values, setValues] = useState({
    name: "",
    price: "",
    quantity: "",
    category: "Vegetable",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await API.post("/products", {
        name: values.name.trim(),
        price: Number(values.price),
        quantity: Number(values.quantity),
        category: values.category,
      });

      Alert.alert("Success", "Product added successfully");
      navigation.navigate("MyProducts");
    } catch (err) {
      console.log(err.response?.data);
      Alert.alert("Error", err.response?.data?.message || "Could not add product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader eyebrow="New listing" title="Add Product" />
      <ScrollView contentContainerStyle={styles.content}>
        <ProductForm
          values={values}
          onChange={setValues}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitLabel="Add Product"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    padding: spacing.lg,
  },
});
