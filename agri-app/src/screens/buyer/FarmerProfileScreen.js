/**
 * FarmerProfileScreen
 * Displays a farmer's public profile and buyer reviews.
 *
 * Navigation params:
 *   farmerId   — string, required
 *   farmerName — string, optional (display fallback while loading)
 */
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  RefreshControl,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import API from "../../../services/api";
import ScreenHeader from "../../components/ScreenHeader";
import LoadingSpinner from "../../components/LoadingSpinner";
import FarmerRatingSummary from "../../components/FarmerRatingSummary";
import RatingBadge from "../../components/RatingBadge";
import EmptyState from "../../components/EmptyState";
import { colors, radius, spacing, typography } from "../../theme/theme";

const SERVER_ORIGIN = "http://10.121.163.109:5000";

function resolveImageUri(photo) {
  if (!photo) return null;
  if (photo.startsWith("http://") || photo.startsWith("https://")) return photo;
  return `${SERVER_ORIGIN}${photo.startsWith("/") ? "" : "/"}${photo}`;
}

function getInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

export default function FarmerProfileScreen({ route, navigation }) {
  const { farmerId, farmerName: paramFarmerName } = route.params || {};

  const [farmer,           setFarmer]           = useState(null);
  const [farmerRatingData, setFarmerRatingData] = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [reviewsLoading,   setReviewsLoading]   = useState(false);
  const [refreshing,       setRefreshing]       = useState(false);
  const [error,            setError]            = useState(null);

  const fetchFarmerProfile = useCallback(async () => {
    if (!farmerId) {
      setError("Farmer not found.");
      return false;
    }

    try {
      const res = await API.get(`/auth/farmer/${farmerId}`);
      setFarmer(res.data);
      setError(null);
      return true;
    } catch (err) {
      console.log("Farmer profile fetch error:", err?.response?.data);
      setError(err?.response?.data?.message || "Could not load farmer profile.");
      setFarmer(null);
      return false;
    }
  }, [farmerId]);

  const fetchFarmerReviews = useCallback(async () => {
    if (!farmerId) return;

    setReviewsLoading(true);
    try {
      const res = await API.get(`/farmer-reviews/${farmerId}`);
      setFarmerRatingData(res.data);
    } catch (err) {
      console.log("Farmer reviews fetch error:", err?.response?.data);
      setFarmerRatingData(null);
    } finally {
      setReviewsLoading(false);
    }
  }, [farmerId]);

  const loadAll = useCallback(async () => {
    const profileOk = await fetchFarmerProfile();
    if (profileOk) {
      await fetchFarmerReviews();
    }
  }, [fetchFarmerProfile, fetchFarmerReviews]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (active) setLoading(true);
        await loadAll();
        if (active) setLoading(false);
      })();
      return () => { active = false; };
    }, [loadAll])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  if (!farmerId) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ScreenHeader eyebrow="Farmer" title="Profile" />
        <EmptyState
          icon="◻"
          title="Farmer not found"
          subtitle="This profile link is invalid or the farmer no longer exists."
          actionLabel="Go Back"
          onAction={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return <LoadingSpinner label="Loading farmer profile..." />;
  }

  if (error || !farmer) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ScreenHeader
          eyebrow="Farmer"
          title={paramFarmerName || "Profile"}
        />
        <EmptyState
          icon="◻"
          title="Could not load profile"
          subtitle={error || "Something went wrong. Please try again."}
          actionLabel="Try Again"
          onAction={loadAll}
        />
        <Pressable style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const displayName = farmer.name || paramFarmerName || "Farmer";
  const roleLabel =
    farmer.role?.charAt(0).toUpperCase() + (farmer.role?.slice(1) || "");
  const averageFarmerRating =
    farmerRatingData?.averageFarmerRating ?? farmer.averageFarmerRating;
  const farmerReviewCount =
    farmerRatingData?.farmerReviewCount ?? farmer.farmerReviewCount;
  const averageQualityRating =
    farmerRatingData?.averageQualityRating ?? farmer.averageQualityRating;
  const averageFreshnessRating =
    farmerRatingData?.averageFreshnessRating ?? farmer.averageFreshnessRating;
  const averageCommunicationRating =
    farmerRatingData?.averageCommunicationRating ?? farmer.averageCommunicationRating;
  const averageDeliveryRating =
    farmerRatingData?.averageDeliveryRating ?? farmer.averageDeliveryRating;
  const reviews =
    farmerRatingData?.reviews?.map((r) => ({
      ...r,
      rating: r.overallRating,
    })) ?? [];
  const photoUri = resolveImageUri(farmer.profilePhoto);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        eyebrow={roleLabel || "Farmer"}
        title={displayName}
        subtitle={
          farmerReviewCount != null
            ? `${farmerReviewCount} review${farmerReviewCount === 1 ? "" : "s"}`
            : undefined
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textSecondary}
          />
        }
      >
        {/* Profile card */}
        <View style={styles.profileCard}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{getInitials(displayName)}</Text>
            </View>
          )}

          <View style={styles.profileMeta}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileRole}>{roleLabel}</Text>

            {averageFarmerRating > 0 ? (
              <RatingBadge
                rating={averageFarmerRating}
                count={farmerReviewCount}
                size="large"
                style={styles.profileBadge}
              />
            ) : (
              <Text style={styles.noRatingText}>No ratings yet</Text>
            )}
          </View>
        </View>

        {/* Rating summary + review list */}
        <FarmerRatingSummary
          averageFarmerRating={averageFarmerRating}
          farmerReviewCount={farmerReviewCount}
          averageQualityRating={averageQualityRating}
          averageFreshnessRating={averageFreshnessRating}
          averageCommunicationRating={averageCommunicationRating}
          averageDeliveryRating={averageDeliveryRating}
          reviews={reviews}
          reviewsLoading={reviewsLoading}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceRaised,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  profileMeta: {
    flex: 1,
    gap: spacing.xs,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  profileRole: {
    ...typography.label,
    color: colors.textTertiary,
  },
  profileBadge: {
    marginTop: spacing.xs,
  },
  noRatingText: {
    fontSize: 13,
    color: colors.textTertiary,
    fontWeight: "500",
    marginTop: spacing.xs,
  },
  backLink: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  backLinkText: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: "500",
  },
});
