import React, { useCallback, useState, useMemo, useRef, useEffect } from "react";
import {
  FlatList,
  StyleSheet,
  Alert,
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  Easing,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import API from "../../../services/api";
import ProductCard from "../../components/ProductCard";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import { spacing } from "../../theme/theme";
import { colors } from "../../theme/theme";

// ---------------------------------------------------------------------------
// INTENTIONAL LOCAL OVERRIDE — read before touching this file.
//
// theme.js defines a warm forest/leaf/amber/cream palette used by the rest
// of the app (ScreenHeader, GradientButton, HomeScreen, etc). This screen
// deliberately ignores that palette and uses its own monochrome (black /
// white / gray) token set instead, by explicit design decision, not by
// accident or fallback. Nothing here is imported from theme.colors.
// If the rest of the app's look ever needs to be flipped to monochrome too,
// this block is the one to promote into theme.js — until then, every other
// screen is completely unaffected by what's below.
// ---------------------------------------------------------------------------
const MONO = {
  ink: "#0A0A0A",
  inkSoft: "#86868A",
  faint: "#B8B8BC",
  hairline: "#E6E6E8",
  surface: "#FFFFFF",
  sunken: "#F4F4F5",
  chipBg: "#EDEDEF",
  overlay: "rgba(10,10,10,0.45)",
};

const CATEGORIES = ["All", "Vegetable", "Fruit", "Grain", "Dairy", "Other"];

const CATEGORY_ICONS = {
  All: "✺",
  Vegetable: "🥬",
  Fruit: "🍎",
  Grain: "🌾",
  Dairy: "🥛",
  Other: "📦",
};

const SORT_OPTIONS = [
  { label: "Default", value: "default", icon: "≡" },
  { label: "Price: Low to High", value: "priceAsc", icon: "↑" },
  { label: "Price: High to Low", value: "priceDesc", icon: "↓" },
  { label: "Name A–Z", value: "nameAsc", icon: "AZ" },
];

export default function MarketplaceScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default"); // default, priceAsc, priceDesc, nameAsc

  // ---- Presentational-only animation state (no business logic here) ----
  const listEntrance = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const pillX = useRef(new Animated.Value(0)).current; // native-driven, position only
  const pillWidth = useRef(0); // plain ref — width snaps instantly, never animated
  const tabLayouts = useRef({});
  const pillReady = useRef(false);
  const [, forcePillRerender] = useState(0);
  const [sheetVisible, setSheetVisible] = useState(false);

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

  // Fade/slide the list in whenever it settles (load, filter, or sort change).
  useEffect(() => {
    if (!loading) {
      listEntrance.setValue(0);
      Animated.timing(listEntrance, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [loading, selectedCategory, sortBy]);

  const openSortSheet = () => {
    setSheetVisible(true);
    Animated.timing(sheetAnim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeSortSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setSheetVisible(false));
  };

  const movePillTo = (cat) => {
    const layout = tabLayouts.current[cat];
    if (!layout) return;
    // Width snaps instantly (no animation) — only position slides.
    // Animating width requires a JS-driven animation, and mixing that with
    // a native-driven transform on the SAME node throws at runtime, so we
    // keep this node 100% native-driven and just set width directly.
    pillWidth.current = layout.width;
    forcePillRerender((n) => n + 1);
    Animated.spring(pillX, {
      toValue: layout.x,
      useNativeDriver: true,
      speed: 16,
      bounciness: 7,
    }).start();
  };

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    movePillTo(cat);
  };

  const handleCategoryLayout = (cat) => (e) => {
    const { x, width } = e.nativeEvent.layout;
    tabLayouts.current[cat] = { x, width };
    if (cat === selectedCategory && !pillReady.current) {
      pillX.setValue(x);
      pillWidth.current = width;
      pillReady.current = true;
      forcePillRerender((n) => n + 1);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading marketplace..." />;
  }

  const activeSortOption = SORT_OPTIONS.find((o) => o.value === sortBy);

  const listOpacity = listEntrance;
  const listTranslate = listEntrance.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });

  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [340, 0],
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* ---------- Inline header (ScreenHeader intentionally not used) ---------- */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.eyebrow}>FRESH FROM THE FARM</Text>
            <Text style={styles.headerTitle}>Marketplace</Text>
          </View>
          <Pressable
            onPress={openSortSheet}
            style={({ pressed }) => [styles.sortButton, pressed && styles.sortButtonPressed]}
          >
            <Text style={styles.sortButtonIcon}>{activeSortOption.icon}</Text>
          </Pressable>
        </View>
        <View style={styles.countRow}>
          <View style={styles.countDot} />
          <Text style={styles.countText}>
            <Text style={styles.countNumber}>{filteredAndSortedProducts.length}</Text>
            {filteredAndSortedProducts.length === 1 ? "  listing available" : "  listings available"}
          </Text>
        </View>
      </View>

      {/* ---------- Segmented category rail with sliding pill ---------- */}
      <View style={styles.segmentWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.segmentRail}
        >
          <Animated.View
            style={[
              styles.pill,
              {
                width: pillWidth.current,
                transform: [{ translateX: pillX }],
              },
            ]}
          />
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                onLayout={handleCategoryLayout(cat)}
                onPress={() => handleSelectCategory(cat)}
                style={styles.segmentItem}
              >
                <Text style={styles.segmentIcon}>{CATEGORY_ICONS[cat]}</Text>
                <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ---------- Product list ---------- */}
      <Animated.View
        style={{ flex: 1, opacity: listOpacity, transform: [{ translateY: listTranslate }] }}
      >
        <FlatList
          data={filteredAndSortedProducts}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="🛒"
              title="No products listed yet"
              subtitle="Check back soon — farmers are adding fresh harvests regularly."
            />
          }
          renderItem={({ item, index }) => (
            <StaggeredCard index={index}>
              <ProductCard
                product={item}
                onPress={() =>
                  navigation.navigate("ProductDetail", { productId: item._id })
                }
              />
            </StaggeredCard>
          )}
        />
      </Animated.View>

      {/* ---------- Sort bottom sheet ---------- */}
      <Modal visible={sheetVisible} transparent animationType="none" onRequestClose={closeSortSheet}>
        <Pressable style={styles.backdropTouchable} onPress={closeSortSheet}>
          <Animated.View
            style={[
              styles.backdrop,
              { opacity: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) },
            ]}
          />
        </Pressable>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Sort by</Text>
          {SORT_OPTIONS.map((option) => {
            const active = sortBy === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  setSortBy(option.value);
                  closeSortSheet();
                }}
                style={({ pressed }) => [styles.sheetOption, pressed && styles.sheetOptionPressed]}
              >
                <View style={[styles.sheetIconWrap, active && styles.sheetIconWrapActive]}>
                  <Text style={[styles.sheetIconText, active && styles.sheetIconTextActive]}>
                    {option.icon}
                  </Text>
                </View>
                <Text style={[styles.sheetLabel, active && styles.sheetLabelActive]}>
                  {option.label}
                </Text>
                {active && <Text style={styles.sheetCheck}>✓</Text>}
              </Pressable>
            );
          })}
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

// Wraps each row with a staggered fade/slide-up entrance only.
// Deliberately not wrapped in its own Pressable/Touchable — ProductCard
// already owns its own onPress handling; stacking another touchable
// around it risks intercepting or double-firing that gesture.
function StaggeredCard({ index, children }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 340,
      delay: Math.min(index, 8) * 40,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.cardFrame,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surfaceSunken,
  },

  // --- Header ---
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.surfaceSunken,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerTextWrap: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.inkSoft,
    letterSpacing: 1.6,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.6,
  },
  sortButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  sortButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.95 }],
  },
  sortButtonIcon: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: "800",
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm + 2,
    gap: 7,
  },
  countDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.ink,
  },
  countText: {
    fontSize: 13,
    color: colors.inkSoft,
    fontWeight: "500",
  },
  countNumber: {
    color: colors.ink,
    fontWeight: "800",
  },

  // --- Segmented category rail ---
  segmentWrap: {
    backgroundColor: colors.surfaceSunken,
    paddingBottom: spacing.sm,
  },
  segmentRail: {
    paddingHorizontal: spacing.lg,
    position: "relative",
  },
  pill: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: colors.ink,
    borderRadius: 18,
  },
  segmentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    zIndex: 1,
  },
  segmentIcon: {
    fontSize: 14,
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.inkSoft,
  },
  segmentLabelActive: {
    color: colors.surface,
    fontWeight: "800",
  },

  // --- List ---
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  cardFrame: {
    // Intentionally no background/shadow/margin here — ProductCard already
    // renders its own card surface, border, shadow, and bottom margin.
    // Adding visual styling on this wrapper would double up (nested shadows,
    // mismatched border-radius, doubled spacing). This wrapper exists only
    // to carry the entrance animation.
  },

  // --- Sort sheet ---
  backdropTouchable: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.hairline,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: spacing.md,
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm + 2,
    gap: spacing.md,
  },
  sheetOptionPressed: {
    opacity: 0.6,
  },
  sheetIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.chipBg,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetIconWrapActive: {
    backgroundColor: colors.ink,
  },
  sheetIconText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.inkSoft,
  },
  sheetIconTextActive: {
    color: colors.surface,
  },
  sheetLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.inkSoft,
  },
  sheetLabelActive: {
    color: colors.ink,
    fontWeight: "700",
  },
  sheetCheck: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
});