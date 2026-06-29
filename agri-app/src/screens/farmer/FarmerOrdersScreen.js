import React, { useCallback, useState, useMemo } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import API from "../../../services/api";
import EmptyState from "../../components/EmptyState";
import LoadingSpinner from "../../components/LoadingSpinner";
import ScreenHeader from "../../components/ScreenHeader";
import { colors, radius, spacing, typography } from "../../theme/theme";

const STATUS_DOT = {
  pending:   "#B8A050",
  accepted:  "#5BB880",
  rejected:  "#C06060",
  completed: "#6080C8",
};

const TABS = ["pending", "accepted", "completed", "rejected"];

const DATE_FILTERS = [
  { key: "all", label: "All", days: null },
  { key: "today", label: "Today", days: 1 },
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
];

function getOrderTime(order) {
  return new Date(order?.createdAt || 0).getTime();
}

function matchesDateFilter(order, filterKey) {
  const filter = DATE_FILTERS.find((item) => item.key === filterKey) || DATE_FILTERS[0];
  if (!filter.days) return true;

  const start = new Date();
  if (filter.key === "today") {
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(start.getDate() - (filter.days - 1));
    start.setHours(0, 0, 0, 0);
  }

  return getOrderTime(order) >= start.getTime();
}

export default function FarmerOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedTab, setSelectedTab] = useState("pending");
  const [selectedDateFilter, setSelectedDateFilter] = useState("all");

  const fetchOrders = useCallback(async () => {
    try {
      const res = await API.get("/orders/farmer");
      setOrders(res.data || []);
    } catch (err) {
      console.log(err?.response?.data);
      Alert.alert("Error", "Could not load farmer orders");
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
      return () => { active = false; };
    }, [fetchOrders])
  );

  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => o.status === selectedTab)
      .filter((o) => matchesDateFilter(o, selectedDateFilter))
      .sort((a, b) => getOrderTime(b) - getOrderTime(a));
  }, [orders, selectedTab, selectedDateFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const updateStatus = async (orderId, newStatus) => {
    const order = orders.find((o) => o._id === orderId);
    if (order?.status === "accepted" && newStatus === "rejected") {
      Alert.alert("Cannot reject", "This order has already been accepted.");
      return;
    }
    if (order?.status === "rejected") {
      Alert.alert("Cannot modify", "Rejected orders cannot be modified.");
      return;
    }
    if (order?.status === "completed") {
      Alert.alert("Cannot modify", "Completed orders cannot be modified.");
      return;
    }
    try {
      setUpdatingId(orderId);
      await API.put(`/orders/${orderId}/status`, { status: newStatus });
      if (newStatus === "accepted") {
        await API.put(`/orders/${orderId}`, { chatActive: true });
      }
      await fetchOrders();
      if (newStatus === "accepted") Alert.alert("Accepted", "Order accepted. Chat enabled.");
      if (newStatus === "completed") Alert.alert("Completed", "Order marked as completed.");
    } catch (err) {
      console.log(err?.response?.data);
      Alert.alert("Error", err?.response?.data?.message || "Could not update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (loading) return <LoadingSpinner label="Loading orders..." />;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        eyebrow="Orders received"
        title="Farmer Orders"
        subtitle={`${orders.length} total`}
      />

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const count = orders.filter((o) => o.status === tab).length;
          const active = selectedTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setSelectedTab(tab)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <DateFilterBar
        selectedDateFilter={selectedDateFilter}
        onSelect={setSelectedDateFilter}
      />

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="◻"
            title={`No ${selectedTab} orders`}
            subtitle={
              selectedDateFilter === "all"
                ? `${selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)} orders appear here.`
                : "Try a wider date filter to see older orders."
            }
          />
        }
        renderItem={({ item }) => {
          const dot = STATUS_DOT[item?.status] || STATUS_DOT.pending;

          return (
            <View style={styles.card}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.buyerName}>
                    {item?.buyer?.name || "Unknown buyer"}
                  </Text>
                  <Text style={styles.buyerEmail}>{item?.buyer?.email || ""}</Text>
                  <Text style={styles.dateText}>{formatDate(item?.createdAt)}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <View style={[styles.statusDot, { backgroundColor: dot }]} />
                  <Text style={styles.statusText}>{item?.status}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Product info */}
              <View style={styles.infoGrid}>
                <InfoCell label="Product" value={item?.product?.name || "Product"} />
                <InfoCell
                  label="Price"
                  value={
                    item?.product?.pricePerUnit
                      ? `₹${item.product.pricePerUnit}/${item.product.unit}`
                      : `₹${item?.product?.price || 0}`
                  }
                />
                <InfoCell
                  label="Quantity"
                  value={`${item?.quantity || 0} ${item?.product?.unit || "units"}`}
                />
                <InfoCell label="Total" value={`₹${item?.totalPrice || 0}`} />
              </View>

              {/* Actions */}
              <View style={styles.actionRow}>
                {item?.status === "pending" && (
                  <>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => updateStatus(item._id, "accepted")}
                      disabled={updatingId === item._id}
                    >
                      <Text style={styles.acceptBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => updateStatus(item._id, "rejected")}
                      disabled={updatingId === item._id}
                    >
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </>
                )}

                {item?.status === "accepted" && (
                  <>
                    <TouchableOpacity
                      style={styles.chatBtn}
                      onPress={() => {
                        if (!item?._id || !item?.buyer?._id) {
                          Alert.alert("Error", "Chat unavailable.");
                          return;
                        }
                        navigation.navigate("Chat", {
                          orderId: item._id,
                          buyerId: item.buyer._id,
                          status: item.status,
                        });
                      }}
                    >
                      <Text style={styles.chatBtnText}>Message</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.completeBtn}
                      onPress={() => updateStatus(item._id, "completed")}
                      disabled={updatingId === item._id}
                    >
                      <Text style={styles.completeBtnText}>Mark Complete</Text>
                    </TouchableOpacity>
                  </>
                )}

                {item?.status === "completed" && (
                  <TouchableOpacity
                    style={styles.chatBtn}
                    onPress={() => {
                      if (!item?._id || !item?.buyer?._id) {
                        Alert.alert("Error", "Chat unavailable.");
                        return;
                      }
                      navigation.navigate("Chat", {
                        orderId: item._id,
                        buyerId: item.buyer._id,
                        status: item.status,
                      });
                    }}
                  >
                    <Text style={styles.chatBtnText}>View Chat</Text>
                  </TouchableOpacity>
                )}

                {item?.status === "rejected" && (
                  <View style={styles.rejectedTag}>
                    <Text style={styles.rejectedTagText}>Rejected</Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

function DateFilterBar({ selectedDateFilter, onSelect }) {
  return (
    <View style={styles.filterBar}>
      {DATE_FILTERS.map((filter) => {
        const active = selectedDateFilter === filter.key;
        return (
          <TouchableOpacity
            key={filter.key}
            onPress={() => onSelect(filter.key)}
            style={[styles.filterChip, active && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function InfoCell({ label, value }) {
  return (
    <View style={styles.infoCell}>
      <Text style={styles.infoCellLabel}>{label}</Text>
      <Text style={styles.infoCellValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Tabs
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    gap: 5,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: colors.white,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textTertiary,
  },
  tabTextActive: {
    color: colors.textPrimary,
  },
  tabBadge: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: "center",
  },
  tabBadgeActive: {
    backgroundColor: colors.white,
  },
  tabBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.textTertiary,
  },
  tabBadgeTextActive: {
    color: colors.black,
  },

  filterBar: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bg,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.black,
  },

  listContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  buyerName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  buyerEmail: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  dateText: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "capitalize",
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.hairline,
    marginHorizontal: spacing.lg,
  },

  // Info grid
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  infoCell: {
    minWidth: "42%",
    flex: 1,
  },
  infoCellLabel: {
    ...typography.label,
    color: colors.textTertiary,
    marginBottom: 3,
  },
  infoCellValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  // Action buttons
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.xs,
  },
  acceptBtn: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.black,
  },
  rejectBtn: {
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.error,
  },
  chatBtn: {
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  chatBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  completeBtn: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  completeBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.black,
  },
  rejectedTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    opacity: 0.6,
  },
  rejectedTagText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textTertiary,
  },
});
