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
import { colors, spacing } from "../../theme/theme";

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
      return () => {
        active = false;
      };
    }, [fetchMyProducts])
  );

  if (loading) {
    return <LoadingSpinner label="Loading your products..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader eyebrow="Your listings" title="My Products" />

      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="🌱"
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
              <View style={styles.actions}>
                <Pressable
                  onPress={() =>
                    navigation.navigate("EditProduct", { productId: item._id })
                  }
                  style={styles.actionChip}
                >
                  <Text style={styles.actionText}>Edit</Text>
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
    backgroundColor: colors.cream,
  },
  listContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  actions: {
    flexDirection: "row",
  },
  actionChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.leafLight,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.forestDark,
  },
});
