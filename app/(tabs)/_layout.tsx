import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { COLORS } from "@/constants/gamify";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.cyan,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarButton: HapticTab,
        tabBarStyle: { height: 62 + bottomPadding, paddingTop: 8, paddingBottom: bottomPadding, backgroundColor: COLORS.ink, borderTopColor: "#223354", borderTopWidth: 1, boxShadow: "0px -2px 12px rgba(67, 231, 255, 0.12)", elevation: 12 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "800", letterSpacing: 0.4 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Command", tabBarIcon: ({ color, size }) => <Ionicons name="radio-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="quests" options={{ title: "Quests", tabBarIcon: ({ color, size }) => <Ionicons name="flash-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="learn" options={{ title: "Learn", tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="tracks" options={{ title: "Tracks", tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="review" options={{ title: "Review", tabBarIcon: ({ color, size }) => <Ionicons name="moon-outline" size={size} color={color} /> }} />
    </Tabs>
  );
}
