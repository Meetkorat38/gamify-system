import { View, type ViewStyle } from "react-native";

import { COLORS } from "@/constants/gamify";

type ProgressBarProps = {
  value: number;
  color?: string;
  height?: number;
  style?: ViewStyle;
};

export function ProgressBar({ value, color = COLORS.cyan, height = 7, style }: ProgressBarProps) {
  const safeValue = Math.min(100, Math.max(0, value));
  return (
    <View style={[{ height, borderRadius: height, backgroundColor: COLORS.line, overflow: "hidden" }, style]}>
      <View style={{ width: `${safeValue}%`, height: "100%", borderRadius: height, backgroundColor: color }} />
    </View>
  );
}
