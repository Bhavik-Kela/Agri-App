import React, { useCallback, useState, useMemo } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
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

export default function FarmerOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedTab, setSelectedTab] = useState("pending"); // pending, accepted, completed, rejected

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

      return () => {
        active = false;
      };
    }, [fetchOrders])
  );

  const filteredOrders = useMemo(() => {
    let filtered = orders;
    
    if (selectedTab === "pending") {
      filtered = filtered.filter(o => o.status === "pending");
    } else if (selectedTab === "accepted") {
      filtered = filtered.filter(o => o.status === "accepted");
    } else if (selectedTab === "completed") {
      filtered = filtered.filter(o => o.status === "completed");
    } else if (selectedTab === "rejected") {
      filtered = filtered.filter(o => o.status === "rejected");
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders, selectedTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const updateStatus = async (orderId, newStatus) => {
    // Validation: Once accepted, cannot be rejected
    const order = orders.find(o => o._id === orderId);
    if (order?.status === "accepted" && newStatus === "rejected") {
      Alert.alert("Cannot reject", "This order has already been accepted. It cannot be rejected.");
      return;
    }

    // Once rejected, cannot change status
    if (order?.status === "rejected") {
      Alert.alert("Cannot modify", "Rejected orders cannot be modified.");
      return;
    }

    // Once completed, cannot change
    if (order?.status === "completed") {
      Alert.alert("Cannot modify", "Completed orders cannot be modified.");
      return;
    }

    try {
      setUpdatingId(orderId);
      await API.put(`/orders/${orderId}/status`, { status: newStatus });
      
      // If accepting order, enable chat
      if (newStatus === "accepted") {
        await API.put(`/orders/${orderId}`, { chatActive: true });
      }
      
      await fetchOrders();
      
      if (newStatus === "accepted") {
        Alert.alert("Success", "Order accepted. Chat has been enabled.");
      } else if (newStatus === "completed") {
        Alert.alert("Success", "Order marked as completed.");
      }
    } catch (err) {
      console.log(err?.response?.data);
      Alert.alert("Error", err?.response?.data?.message || "Could not update status");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading farmer orders..." />;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        eyebrow="Orders received"
        title="Farmer Orders"
        subtitle={`${orders.length} total order${orders.length === 1 ? "" : "s"}`}
      />

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {["pending", "accepted", "completed", "rejected"].map((tab) => {
          const count = orders.filter(o => o.status === tab).length;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setSelectedTab(tab)}
              style={[styles.tab, selectedTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <EmptyState
            icon="📋"
            title={`No ${selectedTab} orders`}
            subtitle={`Orders with status "${selectedTab}" will appear here.`}
          />
        }
        renderItem={({ item }) => {
          const statusStyle = STATUS_STYLES[item?.status] || STATUS_STYLES.pending;
          const isRejected = item?.status === "rejected";
          const isAccepted = item?.status === "accepted";
          const isCompleted = item?.status === "completed";

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleWrap}>
                  <Text style={styles.label}>Buyer</Text>
                  <Text style={styles.value}>
                    {item?.buyer?.name || "Unknown buyer"}
                  </Text>
                  <Text style={styles.subText}>
                    {item?.buyer?.email || ""}
                  </Text>
                  <Text style={styles.dateText}>
                    📅 {formatDate(item?.createdAt)}
                  </Text>
                </View>
                <View
                  style={[styles.statusBadge, { backgroundColor: statusStyle.background }]}
                >
                  <Text style={[styles.statusText, { color: statusStyle.text }]}>
                    {item?.status || "pending"}
                  </Text>
                </View>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Product</Text>
                <Text style={styles.value}>
                  {item?.product?.name || "Product"}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Price</Text>
                <Text style={styles.value}>
                  {item?.product?.pricePerUnit 
                    ? `₹${item.product.pricePerUnit}/${item.product.unit}`
                    : `₹${item?.product?.price || 0}`
                  }
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Quantity</Text>
                <Text style={styles.value}>
                  {item?.quantity || 0} {item?.product?.unit || 'units'}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Total</Text>
                <Text style={styles.value}>₹{item?.totalPrice || 0}</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                {item?.status === "pending" && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.acceptButton]}
                      onPress={() => updateStatus(item._id, "accepted")}
                      disabled={updatingId === item._id}
                    >
                      <Text style={[styles.actionButtonText, styles.acceptButtonText]}>
                        ✓ Accept
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => updateStatus(item._id, "rejected")}
                      disabled={updatingId === item._id}
                    >
                      <Text style={[styles.actionButtonText, styles.rejectButtonText]}>
                        ✕ Reject
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {item?.status === "accepted" && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.chatButton]}
                      onPress={() => navigation.navigate("Chat", { orderId: item._id, buyerId: item.buyer._id })}
                    >
                      <Text style={[styles.actionButtonText, styles.chatButtonText]}>
                        💬 Chat
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.completeButton]}
                      onPress={() => updateStatus(item._id, "completed")}
                      disabled={updatingId === item._id}
                    >
                      <Text style={[styles.actionButtonText, styles.completeButtonText]}>
                        ✓ Mark Complete
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {item?.status === "completed" && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.disabledButton]}
                    disabled={true}
                  >
                    <Text style={[styles.actionButtonText, styles.disabledButtonText]}>
                      ✓ Completed
                    </Text>
                  </TouchableOpacity>
                )}

                {item?.status === "rejected" && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.disabledButton]}
                    disabled={true}
                  >
                    <Text style={[styles.actionButtonText, styles.disabledButtonText]}>
                      ✕ Rejected
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
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
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: colors.forest,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.forest,
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitleWrap: {
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
    textAlign: "right",
    flexShrink: 1,
  },
  subText: {
    ...typography.body,
    fontSize: 12,
    marginTop: 2,
  },
  dateText: {
    ...typography.body,
    fontSize: 12,
    marginTop: 4,
    color: colors.textSecondary,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  acceptButton: {
    backgroundColor: colors.leaf,
  },
  acceptButtonText: {
    color: colors.textOnDark,
  },
  rejectButton: {
    backgroundColor: colors.error,
  },
  rejectButtonText: {
    color: colors.textOnDark,
  },
  chatButton: {
    backgroundColor: colors.amberLight,
  },
  chatButtonText: {
    color: colors.amberDark,
  },
  completeButton: {
    backgroundColor: colors.leaf,
  },
  completeButtonText: {
    color: colors.textOnDark,
  },
  disabledButton: {
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  disabledButtonText: {
    color: colors.textSecondary,
  },
  actionButtonText: {
    ...typography.label,
    fontSize: 12,
    textTransform: "capitalize",
  },
});
