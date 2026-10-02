import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS } from "@/constants/gamify";

type ScoreStepperProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  color?: string;
};

export function ScoreStepper({ label, value, onChange, color = COLORS.violet }: ScoreStepperProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => {
          const active = value === score;
          return (
            <Pressable
              key={score}
              onPress={() => onChange(score)}
              style={({ pressed }) => [
                styles.cell,
                { borderColor: active ? color : COLORS.line, backgroundColor: active ? color : COLORS.panelSoft },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.cellText, { color: active ? COLORS.ink : COLORS.muted }]}>{score}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 5 },
  label: { color: COLORS.violet, fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  row: { flexDirection: "row", gap: 3 },
  cell: { flex: 1, minWidth: 22, borderRadius: 7, borderWidth: 1, alignItems: "center", paddingVertical: 7 },
  cellText: { fontSize: 10, fontWeight: "900" },
  pressed: { opacity: 0.7 },
});
