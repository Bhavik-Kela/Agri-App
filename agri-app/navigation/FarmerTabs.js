import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import FarmerHomeScreen from "../src/screens/farmer/FarmerHomeScreen";
import AddProductScreen from "../src/screens/farmer/AddProductScreen";
import MyProductsScreen from "../src/screens/farmer/MyProductsScreen";
import EditProductScreen from "../src/screens/farmer/EditProductScreen";
import FarmerOrdersScreen from "../src/screens/farmer/FarmerOrdersScreen";
import ProductDetailScreen from "../src/screens/ProductDetailScreen";
import ChatScreen from "../src/screens/ChatScreen";
import ProfileScreen from "../src/screens/ProfileScreen";
import { colors } from "../src/theme/theme";

// Each tab gets its OWN stack with the SAME inner route names
// ("ProductDetail", "EditProduct", "MyProducts", "AddProduct").
// Screens call navigation.navigate("ProductDetail", ...) and React
// Navigation resolves it within whichever tab's stack is currently
// active, so there is no need for every screen to know which tab
// it was opened from.

const HomeStack = createNativeStackNavigator();
function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="FarmerHome" component={FarmerHomeScreen} />
      <HomeStack.Screen name="AddProduct" component={AddProductScreen} />
      <HomeStack.Screen name="MyProducts" component={MyProductsScreen} />
      <HomeStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <HomeStack.Screen name="EditProduct" component={EditProductScreen} />
    </HomeStack.Navigator>
  );
}

const AddStack = createNativeStackNavigator();
function AddProductStackScreen() {
  return (
    <AddStack.Navigator screenOptions={{ headerShown: false }}>
      <AddStack.Screen name="AddProduct" component={AddProductScreen} />
      <AddStack.Screen name="MyProducts" component={MyProductsScreen} />
      <AddStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <AddStack.Screen name="EditProduct" component={EditProductScreen} />
    </AddStack.Navigator>
  );
}

const MyProductsStack = createNativeStackNavigator();
function MyProductsStackScreen() {
  return (
    <MyProductsStack.Navigator screenOptions={{ headerShown: false }}>
      <MyProductsStack.Screen name="MyProducts" component={MyProductsScreen} />
      <MyProductsStack.Screen name="AddProduct" component={AddProductScreen} />
      <MyProductsStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
      />
      <MyProductsStack.Screen name="EditProduct" component={EditProductScreen} />
    </MyProductsStack.Navigator>
  );
}

const OrdersStack = createNativeStackNavigator();
function OrdersStackScreen() {
  return (
    <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
      <OrdersStack.Screen name="Orders" component={FarmerOrdersScreen} />
      <OrdersStack.Screen name="Chat" component={ChatScreen} />
    </OrdersStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  HomeTab: "🏠",
  AddProductTab: "➕",
  MyProductsTab: "📦",
  OrdersTab: "🧾",
  ProfileTab: "👤",
};

export default function FarmerTabs() {
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
        name="HomeTab"
        component={HomeStackScreen}
        options={{ tabBarLabel: "Home" }}
      />
      <Tab.Screen
        name="AddProductTab"
        component={AddProductStackScreen}
        options={{ tabBarLabel: "Add Product" }}
      />
      <Tab.Screen
        name="MyProductsTab"
        component={MyProductsStackScreen}
        options={{ tabBarLabel: "My Products" }}
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
