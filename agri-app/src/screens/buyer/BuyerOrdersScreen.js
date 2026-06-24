import React, { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import API from "../../../services/api";
import EmptyState from "../../components/EmptyState";
import LoadingSpinner from "../../components/LoadingSpinner";
import ScreenHeader from "../../components/ScreenHeader";
import { colors, radius, spacing, typography } from "../../theme/theme";

const STATUS_STYLES = {
  pending: { background: "#FFF4CC", text: "#A66A00" },
  accepted: { background: "#E7F7EE", text: "#1F7A4A" },
  rejected: { background: "#FDE7E9", text: "#B42318" },
  completed: { background: "#E9ECFF", text: "#3556D9" },
};

export default function BuyerOrdersScreen() {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await API.get("/orders/my");
      setOrders(res.data || []);
    } catch (err) {
      console.log(err?.response?.data);
      Alert.alert("Error", "Could not load your orders");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        if (active) setLoading(true);
        await fetchOrders();
        if (active) setLoading(false);
      })();

      return () => {
        active = false;
      };
    }, [fetchOrders])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  if (loading) {
    return <LoadingSpinner label="Loading your orders..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        eyebrow="Your purchases"
        title="My Orders"
        subtitle={`${orders.length} order${orders.length === 1 ? "" : "s"}`}
      />

      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <EmptyState
            icon="📦"
            title="No orders yet"
            subtitle="Your purchased items will appear here once you place an order."
          />
        }
        renderItem={({ item }) => {
          const statusStyle = STATUS_STYLES[item?.status] || STATUS_STYLES.pending;
          const sellerAddress = item?.farmer?.addresses?.find((address) => address.isDefault);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.productName} numberOfLines={1}>
                  {item?.product?.name || "Product"}
                </Text>
                <View
                  style={[styles.statusBadge, { backgroundColor: statusStyle.background }]}
                >
                  <Text style={[styles.statusText, { color: statusStyle.text }]}>
                    {item?.status || "pending"}
                  </Text>
                </View>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Quantity</Text>
                <Text style={styles.value}>{item?.quantity || 0} units</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Total Price</Text>
                <Text style={styles.value}>₹{item?.totalPrice || 0}</Text>
              </View>

              {item?.status === "accepted" && sellerAddress ? (
                <View style={styles.addressBlock}>
                  <Text style={styles.addressLabel}>Seller default address</Text>
                  <Text style={styles.addressText}>{sellerAddress.street}</Text>
                  <Text style={styles.addressText}>
                    {sellerAddress.city}, {sellerAddress.state} {sellerAddress.zipCode}
                  </Text>
                </View>
              ) : null}

             {(item?.status === "accepted" || item?.status === "completed") ? (
                <View style={styles.chatButtonRow}>
                  <Pressable
                    style={styles.chatButton}
                    onPress={() => navigation.navigate("Chat", { orderId: item._id, status: item.status })}
                  >
                    <Text style={styles.chatButtonText}>
                      {item.status === "completed" ? "✓ Completed · View Chat" : "💬 Chat with seller"}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        }}
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
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  productName: {
    ...typography.title,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  statusText: {
    ...typography.label,
    fontSize: 11,
    textTransform: "capitalize",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.label,
  },
  value: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  addressBlock: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.leafLight,
    borderRadius: radius.md,
  },
  addressLabel: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  addressText: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  chatButtonRow: {
    marginTop: spacing.md,
    alignItems: "flex-start",
  },
  chatButton: {
    backgroundColor: colors.leaf,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  chatButtonText: {
    color: colors.textOnDark,
    fontWeight: "700",
    fontSize: 14,
  },
});
