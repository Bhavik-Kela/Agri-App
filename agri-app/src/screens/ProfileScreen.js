import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import API from "../../services/api";
import ScreenHeader from "../components/ScreenHeader";
import FieldInput from "../components/FieldInput";
import GradientButton from "../components/GradientButton";
import LoadingSpinner from "../components/LoadingSpinner";
import FarmerRatingSummary from "../components/FarmerRatingSummary";
import { mono, spacing, radius } from "../theme/theme";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/theme";

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [addresses, setAddresses] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
  });

  // ── Farmer rating state (only relevant when profile.role === "farmer") ──
  const [farmerRatingData,    setFarmerRatingData]    = useState(null); // { averageFarmerRating, farmerReviewCount, reviews }
  const [farmerRatingLoading, setFarmerRatingLoading]  = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await API.get("/auth/profile");
      setProfile(res.data);
      setEditValues({
        name: res.data.name,
        email: res.data.email,
        phone: res.data.phone || "",
      });
      setAddresses(res.data.addresses || []);
    } catch (err) {
      console.log(err?.response?.data);
      Alert.alert("Error", "Could not load profile");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (active) setLoading(true);
        await fetchProfile();
        if (active) setLoading(false);
      })();

      return () => {
        active = false;
      };
    }, [fetchProfile])
  );

  const fetchFarmerRating = useCallback(async (farmerId) => {
    if (!farmerId) return;
    setFarmerRatingLoading(true);
    try {
      const res = await API.get(`/farmer-reviews/${farmerId}`);
      setFarmerRatingData(res.data);
    } catch (err) {
      // Rating failing silently — not critical to profile display
      console.log("Farmer rating fetch error:", err?.response?.data);
    } finally {
      setFarmerRatingLoading(false);
    }
  }, []);

  // Only fetch once we know the profile belongs to a farmer.
  useEffect(() => {
    if (profile?.role === "farmer" && profile?._id) {
      fetchFarmerRating(profile._id);
    }
  }, [profile?.role, profile?._id, fetchFarmerRating]);

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const res = await API.put("/auth/profile", {
        name: editValues.name,
        phone: editValues.phone,
      });

      setProfile(res.data);
      updateUser(res.data);
      setEditing(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (err) {
      console.log(err?.response?.data);
      Alert.alert("Error", err?.response?.data?.message || "Could not update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!addressForm.label.trim() || !addressForm.street.trim() || !addressForm.city.trim()) {
      Alert.alert("Error", "Please fill all address fields");
      return;
    }

    try {
      const res = await API.post("/auth/address", addressForm);
      setAddresses(res.data.addresses || []);
      setAddressForm({ label: "", street: "", city: "", state: "", zipCode: "" });
      setShowAddressModal(false);
      Alert.alert("Success", "Address added successfully");
    } catch (err) {
      console.log(err?.response?.data);
      Alert.alert("Error", "Could not add address");
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      const res = await API.put(`/auth/address/${addressId}/default`);
      setAddresses(res.data.addresses || []);
      Alert.alert("Success", "Default address updated");
    } catch (err) {
      console.log(err?.response?.data);
      Alert.alert("Error", "Could not update default address");
    }
  };

  const handleDeleteAddress = async (addressId) => {
    Alert.alert("Delete Address", "Are you sure?", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Delete",
        onPress: async () => {
          try {
            const res = await API.delete(`/auth/address/${addressId}`);
            setAddresses(res.data.addresses || []);
            Alert.alert("Success", "Address deleted");
          } catch (err) {
            Alert.alert("Error", "Could not delete address");
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Logout",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  if (loading) {
    return <LoadingSpinner label="Loading profile..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader eyebrow="Account" title="Profile" subtitle="Manage your profile" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          {editing ? (
            <View>
              <FieldInput
                label="Name"
                value={editValues.name}
                onChangeText={(text) => setEditValues({ ...editValues, name: text })}
                placeholder="Your name"
                autoCapitalize="words"
              />
              <FieldInput
                label="Email"
                value={editValues.email}
                editable={false}
                placeholder="Email"
              />
              <FieldInput
                label="Phone"
                value={editValues.phone}
                onChangeText={(text) => setEditValues({ ...editValues, phone: text })}
                placeholder="Phone number"
                keyboardType="phone-pad"
              />

              <View style={styles.buttonRow}>
                <GradientButton
                  title="Save"
                  onPress={handleSaveProfile}
                  style={styles.halfButton}
                />
                <TouchableOpacity
                  style={[styles.halfButton, styles.cancelButton]}
                  onPress={() => setEditing(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Name</Text>
                <Text style={styles.value}>{profile?.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{profile?.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Phone</Text>
                <Text style={styles.value}>{profile?.phone || "Not provided"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Role</Text>
                <Text style={styles.value}>
                  {profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1)}
                </Text>
              </View>

              <GradientButton title="Edit Profile" onPress={() => setEditing(true)} />
            </View>
          )}
        </View>

        {/* Farmer Rating Section — only shown when viewing a farmer's own profile */}
        {profile?.role === "farmer" ? (
          <View style={styles.section}>
            <FarmerRatingSummary
              averageFarmerRating={farmerRatingData?.averageFarmerRating}
              farmerReviewCount={farmerRatingData?.farmerReviewCount}
              averageQualityRating={farmerRatingData?.averageQualityRating}
              averageFreshnessRating={farmerRatingData?.averageFreshnessRating}
              averageCommunicationRating={farmerRatingData?.averageCommunicationRating}
              averageDeliveryRating={farmerRatingData?.averageDeliveryRating}
              reviews={farmerRatingData?.reviews?.map((r) => ({
                ...r,
                rating: r.overallRating,
              }))}
              reviewsLoading={farmerRatingLoading}
            />
          </View>
        ) : null}

        {/* Addresses Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saved Addresses</Text>
            <TouchableOpacity
              onPress={() => setShowAddressModal(true)}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {addresses.length === 0 ? (
            <Text style={styles.emptyText}>No addresses saved yet</Text>
          ) : (
            addresses.map((address) => (
              <View key={address._id} style={styles.addressCard}>
                <View style={styles.addressHeader}>
                  <View style={styles.addressLabelWrap}>
                    <Text style={styles.addressLabel}>{address.label}</Text>
                    {address.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.addressActions}>
                    {!address.isDefault && (
                      <TouchableOpacity
                        onPress={() => handleSetDefaultAddress(address._id)}
                        style={styles.actionLink}
                      >
                        <Text style={styles.actionLinkText}>Set Default</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => handleDeleteAddress(address._id)}
                      style={styles.actionLink}
                    >
                      <Text style={[styles.actionLinkText, styles.deleteLink]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.addressText}>{address.street}</Text>
                <Text style={styles.addressText}>
                  {address.city}, {address.state} {address.zipCode}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Address Modal */}
      <Modal visible={showAddressModal} animationType="slide" transparent>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Address</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              <FieldInput
                label="Label (Home, Office, etc.)"
                value={addressForm.label}
                onChangeText={(text) =>
                  setAddressForm({ ...addressForm, label: text })
                }
                placeholder="Label"
              />
              <FieldInput
                label="Street Address"
                value={addressForm.street}
                onChangeText={(text) =>
                  setAddressForm({ ...addressForm, street: text })
                }
                placeholder="Street address"
              />
              <FieldInput
                label="City"
                value={addressForm.city}
                onChangeText={(text) =>
                  setAddressForm({ ...addressForm, city: text })
                }
                placeholder="City"
              />
              <View style={styles.row}>
                <View style={styles.half}>
                  <FieldInput
                    label="State"
                    value={addressForm.state}
                    onChangeText={(text) =>
                      setAddressForm({ ...addressForm, state: text })
                    }
                    placeholder="State"
                  />
                </View>
                <View style={styles.half}>
                  <FieldInput
                    label="ZIP Code"
                    value={addressForm.zipCode}
                    onChangeText={(text) =>
                      setAddressForm({ ...addressForm, zipCode: text })
                    }
                    placeholder="ZIP"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <GradientButton
                title="Add Address"
                onPress={handleAddAddress}
                style={styles.submitButton}
              />
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surfaceSunken,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: spacing.md,
  },
  addButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
  },
  addButtonText: {
    color: colors.surface,
    fontWeight: "700",
    fontSize: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.inkSoft,
  },
  value: {
    fontSize: 15,
    color: colors.ink,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: spacing.md,
  },
  addressCard: {
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  addressLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.ink,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  defaultBadge: {
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  defaultBadgeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: "700",
  },
  addressActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionLink: {
    paddingHorizontal: spacing.sm,
  },
  actionLinkText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "600",
  },
  deleteLink: {
    color: colors.error,
  },
  addressText: {
    fontSize: 13,
    color: colors.inkSoft,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  halfButton: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: colors.chipBg,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
  },
  cancelButtonText: {
    color: colors.inkSoft,
    fontWeight: "700",
  },
  logoutButton: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.error,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  logoutButtonText: {
    color: colors.error,
    fontWeight: "700",
    fontSize: 16,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.surfaceSunken,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.ink,
  },
  closeButton: {
    fontSize: 24,
    color: colors.inkSoft,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  half: {
    flex: 1,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
});