import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl, Pressable } from "react-native";
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
import NotificationBell from "../../components/NotificationBell";

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
      return () => { active = false; };
    }, [fetchMyProducts])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyProducts();
    setRefreshing(false);
  };

  if (loading) return <LoadingSpinner label="Loading your farm..." />;

  const recent = products.slice(0, 5);
  const firstName = user?.name?.split(" ")[0] || "Farmer";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Custom header — richer than ScreenHeader for the home screen */}
  <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Good day</Text>
          <Text style={styles.headerTitle}>{firstName}</Text>
        </View>
        <View style={styles.headerActions}>
          <NotificationBell />
          <View style={styles.statBadge}>
            <Text style={styles.statNumber}>{products.length}</Text>
            <Text style={styles.statUnit}>listings</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textTertiary}
          />
        }
      >
        {/* Quick actions */}
        <View style={styles.quickActions}>
          <Pressable
            style={styles.primaryAction}
            onPress={() => navigation.navigate("AddProduct")}
          >
            <Text style={styles.primaryActionIcon}>+</Text>
            <Text style={styles.primaryActionText}>Add Product</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryAction}
            onPress={() => navigation.navigate("MyProducts")}
          >
            <Text style={styles.secondaryActionIcon}>≡</Text>
            <Text style={styles.secondaryActionText}>My Listings</Text>
          </Pressable>
        </View>

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Products</Text>
          {recent.length > 0 && (
            <Pressable onPress={() => navigation.navigate("MyProducts")}>
              <Text style={styles.seeAll}>See all →</Text>
            </Pressable>
          )}
        </View>

        {recent.length === 0 ? (
          <EmptyState
            icon="◌"
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
    backgroundColor: colors.bg,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  eyebrow: {
    ...typography.label,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.8,
  },
  statBadge: {
    alignItems: "flex-end",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  statUnit: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Quick actions
  quickActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
    gap: spacing.xs,
  },
  primaryActionIcon: {
    fontSize: 24,
    fontWeight: "300",
    color: colors.black,
    lineHeight: 28,
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.black,
    letterSpacing: -0.2,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryActionIcon: {
    fontSize: 22,
    color: colors.textSecondary,
    lineHeight: 28,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: -0.2,
  },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textTertiary,
  },
});