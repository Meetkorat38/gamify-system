import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS, TRACKS } from "@/constants/gamify";
import { statusLabel, type QuestDefinition, type QuestStatus } from "@/lib/lifegamify-store";

const OPTIONS: { key: Exclude<QuestStatus, "pending">; label: string; detail: string }[] = [
  { key: "full", label: "FULL", detail: "Complete" },
  { key: "partial", label: "PARTIAL", detail: "Halfway" },
  { key: "minimum", label: "MIN", detail: "Keep alive" },
];

type QuestCardProps = {
  quest: QuestDefinition;
  status: QuestStatus;
  onSelect: (status: Exclude<QuestStatus, "pending">) => void;
  compact?: boolean;
};

export function QuestCard({ quest, status, onSelect, compact = false }: QuestCardProps) {
  const track = TRACKS[quest.track];
  return (
    <View style={[styles.card, { borderColor: status !== "pending" ? track.color : COLORS.line }]}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: track.dim }]}>
          <Text style={[styles.iconText, { color: track.color }]}>{quest.icon}</Text>
        </View>
        <View style={styles.heading}>
          <Text style={styles.kicker}>{track.label} {"//"} +{quest.points} XP</Text>
          <Text style={styles.title}>{quest.title}</Text>
          {!compact ? <Text style={styles.subtitle}>{quest.subtitle}</Text> : null}
        </View>
        {status !== "pending" ? <Text style={[styles.status, { color: track.color }]}>{statusLabel(status)}</Text> : null}
      </View>
      {!compact ? (
        <View style={styles.options}>
          {OPTIONS.map((option) => {
            const selected = status === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => onSelect(option.key)}
                style={({ pressed }) => [
                  styles.option,
                  { borderColor: selected ? track.color : COLORS.line, backgroundColor: selected ? track.dim : COLORS.panelSoft },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.optionLabel, { color: selected ? track.color : COLORS.text }]}>{option.label}</Text>
                <Text style={styles.optionDetail}>{option.detail}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
    backgroundColor: COLORS.panel,
    marginBottom: 12,
  },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 11 },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  iconText: { fontSize: 20, fontWeight: "800" },
  heading: { flex: 1, gap: 3 },
  kicker: { fontSize: 10, letterSpacing: 1.2, color: COLORS.muted, fontWeight: "800" },
  title: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  subtitle: { fontSize: 12, lineHeight: 17, color: COLORS.muted, marginTop: 2 },
  status: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  options: { flexDirection: "row", gap: 8, marginTop: 15 },
  option: { flex: 1, minHeight: 47, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", gap: 2 },
  optionLabel: { fontSize: 11, letterSpacing: 1, fontWeight: "900" },
  optionDetail: { fontSize: 10, color: COLORS.muted },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
