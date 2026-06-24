import React, { useCallback, useState, useMemo } from "react";
import { FlatList, StyleSheet, Alert, View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import API from "../../../services/api";
import ScreenHeader from "../../components/ScreenHeader";
import ProductCard from "../../components/ProductCard";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import { colors, spacing, radius, typography } from "../../theme/theme";

const CATEGORIES = ["All", "Vegetable", "Fruit", "Grain", "Dairy", "Other"];

export default function MarketplaceScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default"); // default, priceAsc, priceDesc, nameAsc
  const [showFilters, setShowFilters] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await API.get("/products");
      setProducts(res.data || []);
    } catch (err) {
      console.log(err.response?.data);
      Alert.alert("Error", "Could not load the marketplace");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (active) setLoading(true);
        await fetchProducts();
        if (active) setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [fetchProducts])
  );

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Sort
    const sorted = [...filtered];
    switch (sortBy) {
      case "priceAsc":
        sorted.sort((a, b) => {
          const priceA = a.pricePerUnit || a.price;
          const priceB = b.pricePerUnit || b.price;
          return priceA - priceB;
        });
        break;
      case "priceDesc":
        sorted.sort((a, b) => {
          const priceA = a.pricePerUnit || a.price;
          const priceB = b.pricePerUnit || b.price;
          return priceB - priceA;
        });
        break;
      case "nameAsc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return sorted;
  }, [products, selectedCategory, sortBy]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  if (loading) {
    return <LoadingSpinner label="Loading marketplace..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        eyebrow="Fresh from the farm"
        title="Marketplace"
        subtitle={`${filteredAndSortedProducts.length} listing${filteredAndSortedProducts.length === 1 ? "" : "s"} available`}
      />

      {/* Filter Button */}
      <Pressable
        onPress={() => setShowFilters(!showFilters)}
        style={styles.filterButton}
      >
        <Text style={styles.filterButtonText}>🔍 {showFilters ? "Hide" : "Show"} Filters</Text>
      </Pressable>

      {/* Filters */}
      {showFilters && (
        <ScrollView horizontal style={styles.filterContainer} showsHorizontalScrollIndicator={false}>
          {/* Category Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Category:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterOptions}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[
                    styles.filterChip,
                    selectedCategory === cat && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedCategory === cat && styles.filterChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Sort Options */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Sort:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterOptions}>
              {[
                { label: "Default", value: "default" },
                { label: "Price: Low to High", value: "priceAsc" },
                { label: "Price: High to Low", value: "priceDesc" },
                { label: "A - Z", value: "nameAsc" },
              ].map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setSortBy(option.value)}
                  style={[
                    styles.filterChip,
                    sortBy === option.value && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      sortBy === option.value && styles.filterChipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      )}

      <FlatList
        data={filteredAndSortedProducts}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <EmptyState
            icon="🛒"
            title="No products listed yet"
            subtitle="Check back soon — farmers are adding fresh harvests regularly."
          />
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() =>
              navigation.navigate("ProductDetail", { productId: item._id })
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
  filterButton: {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.leaf,
    borderRadius: radius.md,
    alignItems: "center",
  },
  filterButtonText: {
    color: colors.textOnDark,
    fontWeight: "700",
    fontSize: 14,
  },
  filterContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
 filterSection: {
  marginRight: spacing.lg,
  alignItems: "flex-start",
},
  filterLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  filterOptions: {
  flexDirection: "row",
  alignItems: "center",
},
 filterChip: {
  height: 36,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  borderRadius: radius.pill,
  borderWidth: 1.5,
  borderColor: colors.border,
  backgroundColor: colors.cream,
  marginRight: spacing.sm,
  justifyContent: "center",
},
  filterChipActive: {
    backgroundColor: colors.leaf,
    borderColor: colors.leaf,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.textOnDark,
  },
  listContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },
});
