import React, { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import API from "../../../services/api";
import { useAuth } from "../../context/AuthContext";
import ScreenHeader from "../../components/ScreenHeader";
import ProductCard from "../../components/ProductCard";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import { colors, radius, spacing, typography } from "../../theme/theme";

export default function MyProductsScreen({ navigation }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyProducts = useCallback(async () => {
    try {
      const res = await API.get("/products");
      const mine = (res.data || []).filter(
        (p) => p.farmer === user?.id || p.farmer?._id === user?.id
      );
      setProducts(mine);
    } catch (err) {
      console.log(err.response?.data);
      Alert.alert("Error", "Could not load your products");
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
      return () => { active = false; };
    }, [fetchMyProducts])
  );

  if (loading) return <LoadingSpinner label="Loading your products..." />;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        eyebrow="Your listings"
        title="My Products"
        subtitle={`${products.length} product${products.length === 1 ? "" : "s"}`}
      />

      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          products.length > 0 ? (
            <Pressable
              style={styles.addButton}
              onPress={() => navigation.navigate("AddProduct")}
            >
              <Text style={styles.addButtonText}>+ Add new product</Text>
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="◌"
            title="No products yet"
            subtitle="List your first harvest so buyers can find it."
            actionLabel="Add Product"
            onAction={() => navigation.navigate("AddProduct")}
          />
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() =>
              navigation.navigate("ProductDetail", { productId: item._id })
            }
            footer={
              <View style={styles.cardFooter}>
                <Pressable
                  onPress={() =>
                    navigation.navigate("EditProduct", { productId: item._id })
                  }
                  style={styles.editChip}
                >
                  <Text style={styles.editChipText}>Edit</Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    navigation.navigate("ProductDetail", { productId: item._id })
                  }
                  style={styles.viewChip}
                >
                  <Text style={styles.viewChipText}>View →</Text>
                </Pressable>
              </View>
            }
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  listContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },

  // Add button banner
  addButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    paddingVertical: spacing.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textTertiary,
  },

  // Card footer
  cardFooter: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  editChip: {
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  viewChip: {
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
  },
  viewChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textTertiary,
  },
});