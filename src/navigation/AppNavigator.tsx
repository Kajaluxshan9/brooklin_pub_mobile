import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HomeScreen from "../screens/HomeScreen";
import AboutScreen from "../screens/AboutScreen";
import MenuScreen from "../screens/MenuScreen";
import EventsScreen from "../screens/EventsScreen";
import ContactScreen from "../screens/ContactScreen";
import SpecialScreen from "../screens/SpecialScreen";
import PrivacyPolicyScreen from "../screens/PrivacyPolicyScreen";
import TermsScreen from "../screens/TermsScreen";

import { colors, typography } from "../config/theme";

// ─── Type definitions ────────────────────────────────────────────────────────
export type RootTabParamList = {
  HomeTab: undefined;
  MenuTab: undefined;
  EventsTab: undefined;
  SpecialTab: undefined;
  InfoTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Special: { type?: "daily" | "other" };
};

export type MenuStackParamList = {
  Menu: undefined;
  Special: { type?: "daily" | "other" };
};

export type InfoStackParamList = {
  About: undefined;
  Contact: undefined;
  PrivacyPolicy: undefined;
  Terms: undefined;
};

// ─── Stack Navigators ────────────────────────────────────────────────────────
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const MenuStack = createNativeStackNavigator<MenuStackParamList>();
const InfoStack = createNativeStackNavigator<InfoStackParamList>();
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

const InfoStackNavigator = () => (
  <InfoStack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: colors.background.default },
    }}
  >
    <InfoStack.Screen name="About" component={AboutScreen} />
    <InfoStack.Screen name="Contact" component={ContactScreen} />
    <InfoStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    <InfoStack.Screen name="Terms" component={TermsScreen} />
  </InfoStack.Navigator>
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
  MenuTab: { focused: "restaurant", outline: "restaurant-outline" },
  EventsTab: { focused: "calendar", outline: "calendar-outline" },
  SpecialTab: { focused: "flame", outline: "flame-outline" },
  InfoTab: { focused: "information-circle", outline: "information-circle-outline" },
};

// ─── Tab Bar Icon with Active Indicator ──────────────────────────────────────
const TabBarIcon = ({
  focused,
  color,
  routeName,
  iconSize,
}: {
  focused: boolean;
  color: string;
  routeName: keyof RootTabParamList;
  iconSize: number;
}) => {
  const icons = TAB_ICONS[routeName];
  const iconName = focused ? icons.focused : icons.outline;
  return (
    <View style={styles.tabIconContainer}>
      {focused && <View style={styles.tabActiveBackground} />}
      <Ionicons name={iconName} size={iconSize} color={color} />
    </View>
  );
};

// ─── Tab Bar Background ────────────────────────────────────────────────
const GlassTabBarBackground = () => (
  <View style={styles.glassTabBarBg}>
    <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
    <View style={styles.tabBarTopAccent} />
  </View>
);

// ─── Main Tab Navigator ─────────────────────────────────────────────────────
const AppNavigator = () => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const isSmall = screenWidth < 360;
  const isTablet = screenWidth >= 600;

  const tabBarHeight = isSmall ? 58 : isTablet ? 70 : 64;
  const iconSize = isSmall ? 20 : isTablet ? 26 : 22;
  const labelSize = isSmall ? 10 : isTablet ? 12 : 11;
  const paddingBottom = insets.bottom;

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
              iconSize={iconSize}
            />
          ),
          tabBarActiveTintColor: "#D9A756",
          tabBarInactiveTintColor: "rgba(106,58,30,0.45)",
          tabBarShowLabel: true,
          tabBarLabelStyle: [styles.tabBarLabel, { fontSize: labelSize }],
          tabBarStyle: {
            ...styles.tabBar,
            bottom: 0,
            left: 0,
            right: 0,
            height: tabBarHeight + paddingBottom,
            paddingBottom,
          },
          tabBarItemStyle: [styles.tabBarItem, { height: tabBarHeight }],
          tabBarBackground: () => <GlassTabBarBackground />,
          tabBarHideOnKeyboard: true,
        })}
        initialRouteName="HomeTab"
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeStackNavigator}
          options={{ tabBarLabel: "Home" }}
        />
        <Tab.Screen
          name="MenuTab"
          component={MenuStackNavigator}
          options={{ tabBarLabel: "Menu" }}
        />
        <Tab.Screen
          name="EventsTab"
          component={EventsScreen}
          options={{ tabBarLabel: "Events" }}
        />
        <Tab.Screen
          name="SpecialTab"
          component={SpecialScreen}
          options={{ tabBarLabel: "Specials" }}
        />
        <Tab.Screen
          name="InfoTab"
          component={InfoStackNavigator}
          options={{ tabBarLabel: "Info" }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  glassTabBarBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: "rgba(255,253,251,0.95)",
  },
  tabBarTopAccent: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: "rgba(217,167,86,0.5)",
    borderRadius: 1,
  },
  tabBar: {
    position: "absolute",
    bottom: 0,
    borderRadius: 0,
    borderTopWidth: 0,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(217,167,86,0.25)",
    elevation: 8,
    shadowColor: "#1A0A02",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    paddingBottom: 0,
    paddingTop: 0,
    paddingHorizontal: 4,
  },
  tabBarItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 6,
  },
  tabBarLabel: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: 11,
    letterSpacing: 0.1,
    marginTop: 2,
  },
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 32,
    borderRadius: 16,
    position: "relative",
  },
  tabActiveBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    backgroundColor: "rgba(217,167,86,0.18)",
  },
});

export default AppNavigator;
