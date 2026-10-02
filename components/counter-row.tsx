import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS } from "@/constants/gamify";

type CounterRowProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  color?: string;
};

export function CounterRow({ label, value, onChange, color = COLORS.cyan }: CounterRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Pressable onPress={() => onChange(Math.max(0, value - 1))} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonText}>−</Text>
        </Pressable>
        <Text style={[styles.value, { color }]}>{value}</Text>
        <Pressable onPress={() => onChange(Math.min(99, value + 1))} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonText}>＋</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  label: { flex: 1, color: COLORS.text, fontSize: 12, fontWeight: "700" },
  controls: { flexDirection: "row", alignItems: "center", gap: 10 },
  button: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.panelSoft, alignItems: "center", justifyContent: "center" },
  buttonText: { color: COLORS.text, fontSize: 15, fontWeight: "900" },
  value: { minWidth: 26, textAlign: "center", fontSize: 16, fontWeight: "900" },
  pressed: { opacity: 0.7 },
});
