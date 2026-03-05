import React from "react";
import { StyleSheet, View, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

import HomeScreen from "../screens/HomeScreen";
import AboutScreen from "../screens/AboutScreen";
import MenuScreen from "../screens/MenuScreen";
import EventsScreen from "../screens/EventsScreen";
import ContactScreen from "../screens/ContactScreen";
import SpecialScreen from "../screens/SpecialScreen";

import { colors, typography, spacing } from "../config/theme";

// ─── Type definitions ────────────────────────────────────────────────────────
export type RootTabParamList = {
  HomeTab: undefined;
  AboutTab: undefined;
  EventsTab: undefined;
  MenuTab: undefined;
  SpecialTab: undefined;
  ContactTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Special: { type?: "daily" | "other" };
};

export type MenuStackParamList = {
  Menu: undefined;
  Special: { type?: "daily" | "other" };
};

// ─── Stack Navigators ────────────────────────────────────────────────────────
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const MenuStack = createNativeStackNavigator<MenuStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

const HomeStackNavigator = () => (
  <HomeStack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: colors.background.default },
    }}
  >
    <HomeStack.Screen name="Home" component={HomeScreen} />
    <HomeStack.Screen name="Special" component={SpecialScreen} />
  </HomeStack.Navigator>
);

const MenuStackNavigator = () => (
  <MenuStack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: colors.background.default },
    }}
  >
    <MenuStack.Screen name="Menu" component={MenuScreen} />
    <MenuStack.Screen name="Special" component={SpecialScreen} />
  </MenuStack.Navigator>
);

// ─── Tab Icon Map ────────────────────────────────────────────────────────────
const TAB_ICONS: Record<
  keyof RootTabParamList,
  {
    focused: keyof typeof Ionicons.glyphMap;
    outline: keyof typeof Ionicons.glyphMap;
  }
> = {
  HomeTab: { focused: "home", outline: "home-outline" },
  AboutTab: {
    focused: "information-circle",
    outline: "information-circle-outline",
  },
  EventsTab: { focused: "calendar", outline: "calendar-outline" },
  MenuTab: { focused: "restaurant", outline: "restaurant-outline" },
  SpecialTab: { focused: "flame", outline: "flame-outline" },
  ContactTab: { focused: "mail", outline: "mail-outline" },
};

// ─── Tab Bar Icon with Active Indicator ──────────────────────────────────────
const TabBarIcon = ({
  focused,
  color,
  routeName,
}: {
  focused: boolean;
  color: string;
  routeName: keyof RootTabParamList;
}) => {
  const icons = TAB_ICONS[routeName];
  const iconName = focused ? icons.focused : icons.outline;
  return (
    <View style={styles.tabIconContainer}>
      <Ionicons name={iconName} size={22} color={color} />
      <View style={styles.activeIndicatorWrap}>
        {focused && (
          <LinearGradient
            colors={["#D9A756", "#B08030"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.activeIndicator}
          />
        )}
      </View>
    </View>
  );
};

// ─── Glass Tab Bar Background ────────────────────────────────────────────────
const GlassTabBarBackground = () => (
  <View style={styles.glassTabBarBg}>
    <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
    {/* Gold accent line at top of tab bar */}
    <LinearGradient
      colors={["transparent", "rgba(217,167,86,0.4)", "transparent"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.tabBarTopAccent}
    />
  </View>
);

// ─── Main Tab Navigator ─────────────────────────────────────────────────────
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              routeName={route.name}
            />
          ),
          tabBarActiveTintColor: "#D9A756",
          tabBarInactiveTintColor: "rgba(106,58,30,0.5)",
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabBarItem,
          tabBarBackground: () => <GlassTabBarBackground />,
        })}
        initialRouteName="HomeTab"
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeStackNavigator}
          options={{ tabBarLabel: "Home" }}
        />
        <Tab.Screen
          name="AboutTab"
          component={AboutScreen}
          options={{ tabBarLabel: "About" }}
        />
        <Tab.Screen
          name="EventsTab"
          component={EventsScreen}
          options={{ tabBarLabel: "Events" }}
        />
        <Tab.Screen
          name="MenuTab"
          component={MenuStackNavigator}
          options={{ tabBarLabel: "Menu" }}
        />
        <Tab.Screen
          name="SpecialTab"
          component={SpecialScreen}
          options={{ tabBarLabel: "Specials" }}
        />
        <Tab.Screen
          name="ContactTab"
          component={ContactScreen}
          options={{ tabBarLabel: "Contact" }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  glassTabBarBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "rgba(255, 253, 251, 0.92)",
  },
  tabBarTopAccent: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    height: 2,
    borderRadius: 1,
  },
  tabBar: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 24 : 16,
    left: 16,
    right: 16,
    height: 56,
    borderRadius: 28,
    borderTopWidth: 0,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(217,167,86,0.2)",
    elevation: 16,
    shadowColor: "rgba(106,58,30,0.3)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    paddingBottom: 0,
    paddingTop: 0,
    paddingHorizontal: 8,
  },
  tabBarItem: {
    flex: 1,
    paddingVertical: 0,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
  },
  activeIndicatorWrap: {
    height: 7,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  activeIndicator: {
    width: 16,
    height: 3,
    borderRadius: 1.5,
  },
});

export default AppNavigator;
