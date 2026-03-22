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
      {focused && (
        <LinearGradient
          colors={["rgba(217,167,86,0.25)", "rgba(217,167,86,0.08)"]}
          style={styles.tabActiveBackground}
        />
      )}
      <Ionicons name={iconName} size={20} color={color} />
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
          tabBarInactiveTintColor: "rgba(106,58,30,0.45)",
          tabBarShowLabel: true,
          tabBarLabelStyle: styles.tabBarLabel,
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
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "rgba(255, 253, 251, 0.96)",
  },
  tabBarTopAccent: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    height: 1.5,
    borderRadius: 1,
  },
  tabBar: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 22 : 14,
    left: 10,
    right: 10,
    height: 68,
    borderRadius: 26,
    borderTopWidth: 0,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(217,167,86,0.3)",
    elevation: 28,
    shadowColor: "#1A0A02",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.26,
    shadowRadius: 28,
    paddingBottom: 0,
    paddingTop: 0,
    paddingHorizontal: 2,
  },
  tabBarItem: {
    flex: 1,
    paddingVertical: 0,
    height: 68,
    justifyContent: "center",
    alignItems: "center",
  },
  tabBarLabel: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: 11,
    letterSpacing: 0.1,
    marginTop: -1,
    marginBottom: 5,
  },
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 34,
    borderRadius: 17,
    position: "relative",
  },
  tabActiveBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 17,
  },
});

export default AppNavigator;
