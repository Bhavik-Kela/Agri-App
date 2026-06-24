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
    pricePerUnit: "",
    quantity: "",
    unit: "kg",
    category: "Vegetable",
    photo: "",
    otherProductName: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name.trim());
      formData.append("price", Number(values.price));
      formData.append("pricePerUnit", Number(values.pricePerUnit || 0));
      formData.append("quantity", Number(values.quantity));
      formData.append("unit", values.unit);
      formData.append("category", values.category);
      if (values.otherProductName) {
        formData.append("otherProductName", values.otherProductName);
      }
      if (values.photo) {
        const uriParts = values.photo.split(".");
        const fileType = uriParts[uriParts.length - 1];
        formData.append("photo", {
          uri: values.photo,
          name: `photo.${fileType}`,
          type: `image/${fileType}`,
        });
      }

      await API.post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
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
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});