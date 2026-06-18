import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import API from "../../services/api";
import { useAuth } from "../context/AuthContext";
import ScreenHeader from "../components/ScreenHeader";
import GradientButton from "../components/GradientButton";
import LoadingSpinner from "../components/LoadingSpinner";
import { colors, radius, spacing, typography } from "../theme/theme";

const CATEGORY_ICONS = {
  Vegetable: "🥬",
  Fruit: "🍎",
  Grain: "🌾",
  Dairy: "🥛",
  Other: "📦",
};

export default function ProductDetailScreen({ route, navigation }) {
  const { productId } = route.params || {};
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const fetchProduct = useCallback(async () => {
    try {
      const res = await API.get(`/products/${productId}`);
      setProduct(res.data);
    } catch (err) {
      console.log(err.response?.data);
      Alert.alert("Error", "Could not load this product");
    }
  }, [productId]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (active) setLoading(true);
        await fetchProduct();
        if (active) setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [fetchProduct])
  );

  if (loading || !product) {
    return <LoadingSpinner label="Loading product..." />;
  }

  const farmerId = product.farmer?._id || product.farmer;
  const isOwner = user?.role === "farmer" && farmerId === user?.id;
  const icon = CATEGORY_ICONS[product.category] || CATEGORY_ICONS.Other;

  const handleDelete = () => {
    Alert.alert(
      "Delete product",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await API.delete(`/products/${productId}`);
              navigation.navigate("MyProducts");
            } catch (err) {
              console.log(err.response?.data);
              Alert.alert(
                "Error",
                err.response?.data?.message || "Could not delete product"
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader eyebrow={product.category} title={product.name} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>{icon}</Text>
        </View>

        <View style={styles.card}>
          <DetailRow label="Price" value={`₹${product.price} / unit`} />
          <View style={styles.divider} />
          <DetailRow label="Quantity Available" value={`${product.quantity} units`} />
          <View style={styles.divider} />
          <DetailRow label="Category" value={product.category} />
          {product.farmer?.name ? (
            <>
              <View style={styles.divider} />
              <DetailRow label="Sold By" value={product.farmer.name} />
            </>
          ) : null}
        </View>

        {isOwner ? (
          <View style={styles.actions}>
            <GradientButton
              title="Edit Product"
              onPress={() =>
                navigation.navigate("EditProduct", { productId })
              }
              style={styles.actionButton}
            />
            <GradientButton
              title={deleting ? "Deleting..." : "Delete Product"}
              onPress={handleDelete}
              loading={deleting}
              variant="accent"
              style={styles.actionButton}
            />
          </View>
        ) : (
          <View style={styles.actions}>
            <GradientButton
              title="Place Order (coming soon)"
              onPress={() =>
                Alert.alert(
                  "Not available yet",
                  "Ordering isn't implemented yet — check back soon!"
                )
              }
              disabled
              style={styles.actionButton}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={typography.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
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
  iconWrap: {
    alignSelf: "center",
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    backgroundColor: colors.leafLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    marginTop: -spacing.xl,
  },
  icon: {
    fontSize: 44,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: colors.forestDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  value: {
    ...typography.title,
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  actionButton: {
    width: "100%",
  },
});
