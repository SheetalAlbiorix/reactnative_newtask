import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";
import HomeScreen from "@/screens/HomeScreen";
import LoginScreen from "@/screens/LoginScreen";
import { useAuth } from "@/utils/AuthContext";
import { useApp } from "@/utils/AppContext";
import Loader from "@/components/Loader";

const Stack = createNativeStackNavigator<RootStackParamList>();
export default function RootNavigator() {
  const { authState } = useAuth();
  const { isLoading } = useApp();

  return (
    <NavigationContainer>
      <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
        {authState.isAuthenticated ? (
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
      <Loader loading={isLoading} />
    </NavigationContainer>
  );
}
