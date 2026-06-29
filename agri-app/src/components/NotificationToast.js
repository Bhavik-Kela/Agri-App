import React, { useEffect, useRef } from "react";
import { Animated, Text, Pressable, StyleSheet, Easing } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, radius } from "../theme/theme";
import { useNotifications } from "../context/NotificationContext";

const AUTO_DISMISS_MS = 3500;

/**
 * NotificationToast
 * ────────────────────────────────────────────────────────────────────────
 * Mount this ONCE, near the top of the component tree, ABOVE
 * NavigationContainer's content but still inside NotificationProvider
 * (so it can read `toast`). It positions itself absolutely, so it floats
 * over whatever screen is currently showing.
 *
 * It does NOT navigate anywhere on tap — this app's screens are spread
 * across multiple independent per-tab stacks (see FarmerTabs/BuyerTabs),
 * and this component has no navigation prop / ref wired to it. Tapping
 * the toast just dismisses it early. Full deep-link navigation already
 * lives in NotificationsScreen's `navigateForNotification` — that's the
 * one place equipped to do it correctly, since it already has the right
 * navigation object for whichever stack it's rendered in.
 */
export default function NotificationToast() {
  const { toast, clearToast } = useNotifications();
  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef(null);

  useEffect(() => {
    if (!toast) return;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();

    clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => {
      dismiss();
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(dismissTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => clearToast());
  };

  if (!toast) return null;

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          top: insets.top + spacing.sm,
          opacity,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="box-none"
    >
      <Pressable style={styles.toast} onPress={dismiss}>
        <Text style={styles.title} numberOfLines={1}>
          {toast.title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {toast.message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    zIndex: 999,
    elevation: 10, // Android — ensures it draws above the navigator
  },
  toast: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});