/**
 * WriteProductReviewScreen
 * Allows a buyer to submit a product review for a completed order.
 *
 * Navigation params:
 *   orderId      — string, required
 *   productName  — string, optional (display only)
 */
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API from "../../../services/api";
import ScreenHeader from "../../components/ScreenHeader";
import GradientButton from "../../components/GradientButton";
import InteractiveStarRating from "../../components/InteractiveStarRating";
import { colors, radius, spacing, typography } from "../../theme/theme";

export default function WriteProductReviewScreen({ route, navigation }) {
  const { orderId, productName } = route.params || {};

  const [rating,     setRating]     = useState(0);
  const [comment,    setComment]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [errors,     setErrors]     = useState({});

  /* ── Validation ─────────────────────────────────────────────────────── */
  function validate() {
    const e = {};
    if (!rating)          e.rating  = "Please select a star rating.";
    if (!comment.trim())  e.comment = "Please write a comment.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ── Submit ─────────────────────────────────────────────────────────── */
  async function handleSubmit() {
    if (!validate()) return;
    if (submitting)   return;          // prevent double-tap

    setSubmitting(true);
    try {
      await API.post("/reviews", {
        orderId,
        rating,
        comment: comment.trim(),
      });

      setSubmitted(true);

      // Short success moment, then go back
      setTimeout(() => navigation.goBack(), 1600);
    } catch (err) {
      const msg = err?.response?.data?.message || "Could not submit review. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Success state ──────────────────────────────────────────────────── */
  if (submitted) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ScreenHeader eyebrow="Review" title="Thank you!" />
        <View style={styles.successWrap}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>Review submitted</Text>
          <Text style={styles.successSubtitle}>
            Your feedback helps other buyers make better choices.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ── Form ───────────────────────────────────────────────────────────── */
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        eyebrow="Product Review"
        title={productName || "Write a Review"}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Star selector card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>How would you rate this product?</Text>
          <View style={styles.starsCenter}>
            <InteractiveStarRating
              value={rating}
              onChange={(v) => {
                setRating(v);
                if (errors.rating) setErrors((e) => ({ ...e, rating: undefined }));
              }}
              size={40}
            />
          </View>
          {errors.rating ? (
            <Text style={styles.errorText}>{errors.rating}</Text>
          ) : null}
        </View>

        {/* Comment card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Share your experience</Text>
          <TextInput
            style={[styles.textArea, errors.comment && styles.textAreaError]}
            placeholder="Was the product fresh? Was quantity correct? Any other feedback…"
            placeholderTextColor={colors.textTertiary}
            value={comment}
            onChangeText={(t) => {
              setComment(t);
              if (errors.comment) setErrors((e) => ({ ...e, comment: undefined }));
            }}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={500}
          />
          <View style={styles.commentFooter}>
            {errors.comment ? (
              <Text style={styles.errorText}>{errors.comment}</Text>
            ) : (
              <View />
            )}
            <Text style={styles.charCount}>{comment.length}/500</Text>
          </View>
        </View>

        {/* Submit */}
        <GradientButton
          title={submitting ? "Submitting…" : "Submit Review"}
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
          style={styles.submitButton}
        />

        <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Styles ──────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },

  /* Cards */
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },

  /* Stars */
  starsCenter: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },

  /* Text area */
  textArea: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    minHeight: 120,
  },
  textAreaError: {
    borderColor: colors.error,
  },
  commentFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  charCount: {
    ...typography.label,
    color: colors.textTertiary,
  },

  /* Errors */
  errorText: {
    fontSize: 12,
    color: colors.error,
    fontWeight: "500",
  },

  /* Actions */
  submitButton: {
    marginTop: spacing.xs,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  cancelText: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: "500",
  },

  /* Success */
  successWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  successIcon: {
    fontSize: 56,
    color: colors.statusAcceptedText,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  successSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});