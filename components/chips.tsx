import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS } from "@/constants/gamify";

export type ChipOption = { id: string; label: string };

type ChipsProps = {
  options: ChipOption[];
  selected: string[];
  onToggle: (id: string) => void;
  color?: string;
  dim?: string;
};

export function Chips({ options, selected, onToggle, color = COLORS.cyan, dim = COLORS.cyanDim }: ChipsProps) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const active = selected.includes(option.id);
        return (
          <Pressable
            key={option.id}
            onPress={() => onToggle(option.id)}
            style={({ pressed }) => [
              styles.chip,
              { borderColor: active ? color : COLORS.line, backgroundColor: active ? dim : COLORS.panelSoft },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.label, { color: active ? color : COLORS.muted }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  label: { fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
  pressed: { opacity: 0.72 },
});
