import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import RegisterScreen from "../src/screens/RegisterScreen";
import LoginScreen from "../src/screens/LoginScreen";
import ForgotPasswordScreen from "../src/screens/ForgotPasswordScreen";
import FarmerTabs from "./FarmerTabs";
import BuyerTabs from "./BuyerTabs";
import LoadingSpinner from "../src/components/LoadingSpinner";
import ChatScreen from "../src/screens/ChatScreen";
import ProfileScreen from "../src/screens/ProfileScreen";
import { AuthProvider, useAuth } from "../src/context/AuthContext";

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

function RootSwitch() {
  const { isAuthenticated, user, bootstrapping } = useAuth();

  // Wait for the persisted session to be restored before deciding which
  // stack to show, otherwise a logged-in user would briefly flash the
  // auth screens on every app launch.
  if (bootstrapping) {
    return <LoadingSpinner label="Starting AgriApp..." />;
  }

  if (!isAuthenticated) {
    return <AuthStack />;
  }

  if (user?.role === "buyer") {
    return <BuyerTabs />;
  }

  // Default to the farmer experience for "farmer" and any role not yet
  // covered by the buyer tabs (shop/company/admin reuse the farmer view
  // since their dedicated flows aren't part of this build).
  return <FarmerTabs />;
}

export default function AppNavigator() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootSwitch />
      </NavigationContainer>
    </AuthProvider>
  );
}
