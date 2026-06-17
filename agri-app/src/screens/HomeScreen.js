import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import GradientButton from "./components/GradientButton";
import { colors, gradients, radius, spacing, typography } from "./theme/theme";

const ROLE_META = {
  farmer: { icon: "🌾", label: "Farmer" },
  buyer: { icon: "🛒", label: "Buyer" },
};

export default function HomeScreen({ route, navigation }) {
  // Expecting { user: { name, email, role } } passed via navigation params
  // from LoginScreen once the backend confirms its response shape.
  const user = route?.params?.user || {
    name: "Your name",
    email: "your@email.com",
    role: "farmer",
  };

  const roleMeta = ROLE_META[user.role] || ROLE_META.farmer;

  const handleLogout = () => {
    navigation?.reset?.({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.eyebrow}>Your profile</Text>
        <Text style={styles.headerTitle}>{user.name}</Text>
      </LinearGradient>

      <View style={styles.content}>
        <LinearGradient
          colors={gradients.sunrise}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 1 }}
          style={styles.cardGlow}
        >
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowIcon}>{roleMeta.icon}</Text>
              <View>
                <Text style={typography.label}>Role</Text>
                <Text style={styles.rowValue}>{roleMeta.label}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowIcon}>✉️</Text>
              <View>
                <Text style={typography.label}>Email</Text>
                <Text style={styles.rowValue}>{user.email}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <GradientButton
          title="Log out"
          onPress={handleLogout}
          variant="accent"
          style={styles.logoutButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl + spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  eyebrow: {
    ...typography.label,
    color: colors.leafLight,
    marginBottom: spacing.xs,
  },
  headerTitle: {
    ...typography.display,
    color: colors.textOnDark,
  },
  content: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  cardGlow: {
    borderRadius: radius.lg,
    padding: spacing.xs,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: colors.forestDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  rowIcon: {
    fontSize: 22,
  },
  rowValue: {
    ...typography.title,
    fontSize: 17,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  logoutButton: {
    marginTop: spacing.xl,
  },
});