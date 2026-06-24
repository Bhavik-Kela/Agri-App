import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API from "../../../services/api";
import ScreenHeader from "../../components/ScreenHeader";
import ProductForm from "../../components/ProductForm";
import LoadingSpinner from "../../components/LoadingSpinner";
import { colors, spacing } from "../../theme/theme";

export default function EditProductScreen({ route, navigation }) {
  const { productId } = route.params || {};
  const [values, setValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await API.get(`/products/${productId}`);
        if (active) {
          setValues({
            name: res.data.name,
            price: String(res.data.price),
            pricePerUnit: String(res.data.pricePerUnit || ""),
            quantity: String(res.data.quantity),
            unit: res.data.unit || "kg",
            category: res.data.category,
            otherProductName: res.data.otherProductName || "",
            photo: res.data.photo || "",
          });
        }
      } catch (err) {
        console.log(err.response?.data);
        Alert.alert("Error", "Could not load this product");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [productId]);

  const handleSubmit = async () => {
    console.log("VALUES AT SUBMIT:", JSON.stringify(values));
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
      if (values.photo && (values.photo.startsWith("file://") || values.photo.startsWith("content://"))) {
        const uriParts = values.photo.split(".");
        const fileType = uriParts[uriParts.length - 1];
        formData.append("photo", {
          uri: values.photo,
          name: `photo.${fileType}`,
          type: `image/${fileType}`,
        });
      }

      await API.put(`/products/${productId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      Alert.alert("Success", "Product updated successfully");
      navigation.navigate("ProductDetail", { productId });
   } catch (err) {
      console.log("FULL ERROR:", err.message);
      console.log("STATUS:", err.response?.status);
      console.log("DATA:", JSON.stringify(err.response?.data));
      Alert.alert(
        "Error",
        err.response?.data?.message || "Could not update product"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !values) {
    return <LoadingSpinner label="Loading product..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader eyebrow="Update listing" title="Edit Product" />
      <ScrollView contentContainerStyle={styles.content}>
        <ProductForm
          values={values}
          onChange={setValues}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitLabel="Update Product"
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
