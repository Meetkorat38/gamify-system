import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ProgressBar } from "@/components/progress-bar";
import { ScreenContainer } from "@/components/screen-container";
import { COLORS, rankForLevel, TRACKS, xpIntoLevel } from "@/constants/gamify";
import { QUESTS, useLifeGamify } from "@/lib/lifegamify-store";

export default function CommandScreen() {
  const { state, todayLog, dayNumber, phase, phaseCopy, level, recoveryDays, loading } = useLifeGamify();
  const completed = QUESTS.filter((quest) => todayLog.statuses[quest.id] && todayLog.statuses[quest.id] !== "pending").length;
  const careerProgress = Math.min(100, Math.round((state.xp / 560) * 100));
  const englishProgress = Math.min(100, Math.round((state.feedbackEntries.length / 12) * 100));
  const healthProgress = state.weightEntries.length ? Math.min(100, Math.round(((state.weightEntries[state.weightEntries.length - 1]?.value ?? 56) - 56) * 25)) : 0;
  const firstOpen = QUESTS.find((quest) => !todayLog.statuses[quest.id] || todayLog.statuses[quest.id] === "pending");

  return (
    <ScreenContainer safeAreaClassName="bg-[#070B16]" containerClassName="bg-[#070B16]">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>{"// HUNTER PROFILE"}</Text>
            <Text style={styles.name}>MEET <Text style={{ color: COLORS.cyan }}>KORAT</Text></Text>
            <Text style={styles.meta}>AI AUTOMATION ENGINEER · LVL {level} · {rankForLevel(level)}</Text>
          </View>
          <View style={styles.dayBadge}><Text style={styles.dayLabel}>DAY</Text><Text style={styles.dayNumber}>{dayNumber}</Text><Text style={styles.dayLabel}>/ 90</Text></View>
        </View>

        <View style={styles.xpCard}>
          <View style={styles.xpTop}><View><Text style={styles.eyebrow}>CURRENT RUN</Text><Text style={styles.xpValue}>{state.xp} <Text style={styles.xpUnit}>XP</Text></Text></View><View style={styles.streak}><Ionicons name="flame" color={COLORS.amber} size={17} /><Text style={styles.streakText}>{state.streak} DAY CHAIN</Text></View></View>
          <ProgressBar value={xpIntoLevel(state.xp)} color={COLORS.cyan} height={8} />
          <View style={styles.xpBottom}><Text style={styles.muted}>LEVEL {level} → {level + 1}</Text><Text style={styles.muted}>{xpIntoLevel(state.xp)} / 100</Text></View>
        </View>

        <View style={styles.sectionHeader}><Text style={styles.sectionLabel}>{"// TRACK SIGNALS"}</Text><Text style={styles.muted}>{completed}/3 quests logged</Text></View>
        <View style={styles.signalRow}>
          {([
            ["career", careerProgress],
            ["english", englishProgress],
            ["health", healthProgress],
          ] as const).map(([key, progress]) => {
            const track = TRACKS[key];
            return <View key={key} style={styles.signalCard}><Text style={[styles.signalIcon, { color: track.color }]}>{track.icon}</Text><Text style={styles.signalName}>{track.short}</Text><Text style={[styles.signalPercent, { color: track.color }]}>{progress}%</Text><ProgressBar value={progress} color={track.color} height={4} /></View>;
          })}
        </View>

        <View style={styles.sectionHeader}><Text style={styles.sectionLabel}>{"// MAIN QUEST"}</Text><View style={[styles.phaseChip, { backgroundColor: COLORS.amberDim }]}><Text style={styles.phaseText}>{phase}</Text></View></View>
        <View style={styles.mainQuest}><View style={styles.questGlyph}><Text style={styles.questGlyphText}>✦</Text></View><View style={{ flex: 1, gap: 5 }}><Text style={styles.questTitle}>Reach ₹6–7 LPA</Text><Text style={styles.questCopy}>{phaseCopy}</Text><View style={styles.questTargets}><Text style={styles.targetText}>CURRENT <Text style={styles.targetStrong}>₹3.6 LPA</Text></Text><Text style={styles.targetText}>TARGET <Text style={[styles.targetStrong, { color: COLORS.lime }]}>₹7 LPA</Text></Text></View></View></View>

        <Pressable onPress={() => router.navigate("/(tabs)/quests")} style={({ pressed }) => [styles.nextAction, pressed && styles.pressed]}>
          <View style={styles.nextIcon}><Ionicons name="arrow-forward" color={COLORS.ink} size={18} /></View><View style={{ flex: 1 }}><Text style={styles.eyebrow}>NEXT ACTION</Text><Text style={styles.nextTitle}>{loading ? "Loading your run…" : firstOpen ? firstOpen.title : "Run the nightly check-in"}</Text><Text style={styles.nextCopy}>{recoveryDays >= 2 ? "Recovery mode is active. Choose the smallest version." : "Tap to open today’s missions and record evidence."}</Text></View><Ionicons name="chevron-forward" color={COLORS.cyan} size={20} />
        </Pressable>

        {recoveryDays >= 2 ? <View style={styles.recovery}><Ionicons name="shield-checkmark-outline" color={COLORS.lime} size={18} /><Text style={styles.recoveryText}>RECOVERY MODE · No reset. Reduce difficulty and keep the run alive.</Text></View> : null}

        <View style={styles.footerNote}><Text style={styles.footerBig}>5–10 MIN</Text><Text style={styles.footerCopy}>system maintenance. Your growth work lives inside the quests.</Text></View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 34, gap: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  eyebrow: { color: COLORS.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  name: { color: COLORS.text, fontSize: 27, fontWeight: "900", letterSpacing: 1, marginTop: 5 },
  meta: { color: COLORS.muted, fontSize: 10, fontWeight: "700", letterSpacing: 0.7, marginTop: 5 },
  dayBadge: { borderWidth: 1, borderColor: COLORS.cyan, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 8, alignItems: "center", minWidth: 58, backgroundColor: COLORS.cyanDim },
  dayLabel: { color: COLORS.cyan, fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  dayNumber: { color: COLORS.text, fontSize: 22, fontWeight: "900", lineHeight: 24 },
  xpCard: { backgroundColor: COLORS.panel, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: COLORS.line, gap: 11 },
  xpTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  xpValue: { color: COLORS.text, fontSize: 28, fontWeight: "900", marginTop: 3 },
  xpUnit: { color: COLORS.cyan, fontSize: 12, letterSpacing: 1 },
  streak: { flexDirection: "row", gap: 5, alignItems: "center", backgroundColor: COLORS.amberDim, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6 },
  streakText: { color: COLORS.amber, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  xpBottom: { flexDirection: "row", justifyContent: "space-between" },
  muted: { color: COLORS.muted, fontSize: 11, fontWeight: "700" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionLabel: { color: COLORS.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  signalRow: { flexDirection: "row", gap: 9 },
  signalCard: { flex: 1, backgroundColor: COLORS.panel, borderRadius: 15, padding: 12, gap: 6, borderWidth: 1, borderColor: COLORS.line },
  signalIcon: { fontSize: 16, fontWeight: "900" },
  signalName: { color: COLORS.text, fontSize: 11, fontWeight: "800" },
  signalPercent: { fontSize: 15, fontWeight: "900" },
  phaseChip: { borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5 },
  phaseText: { color: COLORS.amber, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  mainQuest: { flexDirection: "row", gap: 13, backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.amber, borderRadius: 18, padding: 16 },
  questGlyph: { width: 40, height: 40, borderRadius: 13, backgroundColor: COLORS.amberDim, alignItems: "center", justifyContent: "center" },
  questGlyphText: { color: COLORS.amber, fontSize: 22 },
  questTitle: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  questCopy: { color: COLORS.muted, fontSize: 12, lineHeight: 17 },
  questTargets: { flexDirection: "row", gap: 18, marginTop: 4 },
  targetText: { color: COLORS.muted, fontSize: 9, fontWeight: "800", letterSpacing: 0.7 },
  targetStrong: { color: COLORS.text, fontSize: 11 },
  nextAction: { flexDirection: "row", alignItems: "center", gap: 11, borderRadius: 18, backgroundColor: COLORS.cyan, padding: 15 },
  nextIcon: { width: 35, height: 35, borderRadius: 12, backgroundColor: COLORS.text, alignItems: "center", justifyContent: "center" },
  nextTitle: { color: COLORS.ink, fontSize: 16, fontWeight: "900", marginTop: 3 },
  nextCopy: { color: "#17464D", fontSize: 11, lineHeight: 15, marginTop: 2 },
  recovery: { flexDirection: "row", gap: 8, alignItems: "center", borderRadius: 13, borderWidth: 1, borderColor: COLORS.lime, backgroundColor: COLORS.limeDim, padding: 12 },
  recoveryText: { flex: 1, color: COLORS.lime, fontSize: 11, lineHeight: 15, fontWeight: "700" },
  footerNote: { borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 15, flexDirection: "row", gap: 8, alignItems: "center" },
  footerBig: { color: COLORS.cyan, fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  footerCopy: { color: COLORS.muted, fontSize: 11, flex: 1 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
