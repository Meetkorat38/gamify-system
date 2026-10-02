import { useEffect, useState } from "react";
import { Animated, View, type ViewStyle } from "react-native";

import { COLORS } from "@/constants/gamify";

type ProgressBarProps = {
  value: number;
  color?: string;
  height?: number;
  style?: ViewStyle;
};

export function ProgressBar({ value, color = COLORS.cyan, height = 7, style }: ProgressBarProps) {
  const safeValue = Math.min(100, Math.max(0, value));
  const [animated] = useState(() => new Animated.Value(safeValue));

  useEffect(() => {
    Animated.timing(animated, { toValue: safeValue, duration: 650, useNativeDriver: false }).start();
  }, [animated, safeValue]);

  const width = animated.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });

  return (
    <View style={[{ height, borderRadius: height, backgroundColor: COLORS.line, overflow: "hidden" }, style]}>
      <Animated.View style={{ width, height: "100%", borderRadius: height, backgroundColor: color }} />
    </View>
  );
}
