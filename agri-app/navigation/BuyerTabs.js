import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MarketplaceScreen from "../src/screens/buyer/MarketplaceScreen";
import ProductDetailScreen from "../src/screens/ProductDetailScreen";
import HomeScreen from "../src/screens/HomeScreen";
import { colors } from "../src/theme/theme";

const MarketplaceStack = createNativeStackNavigator();
function MarketplaceStackScreen() {
  return (
    <MarketplaceStack.Navigator screenOptions={{ headerShown: false }}>
      <MarketplaceStack.Screen name="Marketplace" component={MarketplaceScreen} />
      <MarketplaceStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
      />
    </MarketplaceStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  MarketplaceTab: "🛒",
  ProfileTab: "👤",
};

export default function BuyerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.forest,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: () => (
          <Text style={{ fontSize: 18 }}>{TAB_ICONS[route.name]}</Text>
        ),
      })}
    >
      <Tab.Screen
        name="MarketplaceTab"
        component={MarketplaceStackScreen}
        options={{ tabBarLabel: "Marketplace" }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={HomeScreen}
        options={{ tabBarLabel: "Profile" }}
      />
    </Tab.Navigator>
  );
}
