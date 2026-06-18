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
            quantity: String(res.data.quantity),
            category: res.data.category,
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
    setSubmitting(true);
    try {
      await API.put(`/products/${productId}`, {
        name: values.name.trim(),
        price: Number(values.price),
        quantity: Number(values.quantity),
        category: values.category,
      });

      Alert.alert("Success", "Product updated successfully");
      navigation.navigate("ProductDetail", { productId });
    } catch (err) {
      console.log(err.response?.data);
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
