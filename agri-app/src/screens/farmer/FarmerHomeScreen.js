import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import API from "../../../services/api";
import { useAuth } from "../../context/AuthContext";
import ScreenHeader from "../../components/ScreenHeader";
import ProductCard from "../../components/ProductCard";
import GradientButton from "../../components/GradientButton";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import { colors, radius, spacing, typography } from "../../theme/theme";

export default function FarmerHomeScreen({ navigation }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyProducts = useCallback(async () => {
    try {
      const res = await API.get("/products");
      const mine = (res.data || []).filter(
        (p) => p.farmer === user?.id || p.farmer?._id === user?.id
      );
      setProducts(mine);
    } catch (err) {
      console.log(err.response?.data);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (active) setLoading(true);
        await fetchMyProducts();
        if (active) setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [fetchMyProducts])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyProducts();
    setRefreshing(false);
  };

  if (loading) {
    return <LoadingSpinner label="Loading your farm..." />;
  }

  const recent = products.slice(0, 5);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        eyebrow="Welcome back"
        title={`Welcome, ${user?.name?.split(" ")[0] || "Farmer"}`}
        subtitle={`${products.length} product${products.length === 1 ? "" : "s"} listed`}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.quickActions}>
          <GradientButton
            title="Add Product"
            onPress={() => navigation.navigate("AddProduct")}
            style={styles.actionButton}
          />
          <GradientButton
            title="View My Products"
            onPress={() => navigation.navigate("MyProducts")}
            variant="accent"
            style={styles.actionButton}
          />
        </View>

        <Text style={styles.sectionTitle}>Recent Products</Text>

        {recent.length === 0 ? (
          <EmptyState
            icon="🌱"
            title="No products yet"
            subtitle="List your first harvest so buyers can find it."
            actionLabel="Add Product"
            onAction={() => navigation.navigate("AddProduct")}
          />
        ) : (
          recent.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onPress={() =>
                navigation.navigate("ProductDetail", { productId: product._id })
              }
            />
          ))
        )}
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
  quickActions: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionButton: {
    width: "100%",
  },
  sectionTitle: {
    ...typography.title,
    marginBottom: spacing.md,
  },
});
