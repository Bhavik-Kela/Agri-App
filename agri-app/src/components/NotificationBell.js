import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors, spacing, radius } from "../theme/theme";
import { useNotifications } from "../context/NotificationContext";

/**
 * NotificationBell
 * ────────────────────────────────────────────────────────────────────────
 * Standalone — does NOT modify ScreenHeader. Pass it into any screen like:
 *
 *   <ScreenHeader
 *     title="Orders"
 *     right={<NotificationBell />}
 *   />
 *
 * Reads unreadCount from NotificationContext (already wired app-wide),
 * navigates to the "Notifications" screen on press. Uses a plain text
 * glyph (no icon library dependency) to match the existing monochrome
 * components — same approach as ChatScreen's avatar initials and the
 * "◌" / "◉" glyphs already used elsewhere in this app's empty-state and
 * read-only-bar text.
 */
export default function NotificationBell() {
  const navigation = useNavigation();
  const { unreadCount } = useNotifications();

  const hasUnread = unreadCount > 0;
  // Cap the displayed number so the badge never stretches oddly wide —
  // same idea as the standard "99+" pattern used by most apps.
  const displayCount = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => navigation.navigate("Notifications")}
      accessibilityRole="button"
      accessibilityLabel={
        hasUnread ? `Notifications, ${unreadCount} unread` : "Notifications"
      }
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={styles.bellGlyph}>🔔</Text>
      {hasUnread && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{displayCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  bellGlyph: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.surfaceSunken, // matches ScreenHeader's bg, so badge looks "cut out" cleanly
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.white,
  },
});