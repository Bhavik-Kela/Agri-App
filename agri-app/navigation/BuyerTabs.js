import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MarketplaceScreen from "../src/screens/buyer/MarketplaceScreen";
import BuyerOrdersScreen from "../src/screens/buyer/BuyerOrdersScreen";
import ProductDetailScreen from "../src/screens/ProductDetailScreen";
import ChatScreen from "../src/screens/ChatScreen";
import ProfileScreen from "../src/screens/ProfileScreen";
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
      <MarketplaceStack.Screen
        name="Chat"
        component={ChatScreen}
      />
    </MarketplaceStack.Navigator>
  );
}

const OrdersStack = createNativeStackNavigator();
function OrdersStackScreen() {
  return (
    <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
      <OrdersStack.Screen name="Orders" component={BuyerOrdersScreen} />
      <OrdersStack.Screen
        name="Chat"
        component={ChatScreen}
      />
    </OrdersStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  MarketplaceTab: "🛒",
  OrdersTab: "📦",
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
        name="OrdersTab"
        component={OrdersStackScreen}
        options={{ tabBarLabel: "Orders" }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: "Profile" }}
      />
    </Tab.Navigator>
  );
}
