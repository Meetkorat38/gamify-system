import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ProgressBar } from "@/components/progress-bar";
import { ScreenContainer } from "@/components/screen-container";
import { BASE_WEIGHT, COLORS, rankForLevel, SKILLS, TRACKS, weekStartKey, xpIntoLevel } from "@/constants/gamify";
import type { PlanTrack } from "@/lib/coach";
import { QUESTS, useLifeGamify } from "@/lib/lifegamify-store";
import { useCoach } from "@/lib/use-coach";

const PLAN_STYLE: Record<PlanTrack, string> = {
  career: COLORS.cyan,
  english: COLORS.violet,
  health: COLORS.lime,
  system: COLORS.amber,
};

const ALIGN_COLOR: Record<string, string> = { aligned: COLORS.lime, "at-risk": COLORS.amber, "off-track": COLORS.red };

type Action = { title: string; copy: string; route: string };

const greetingFor = (hour: number) => {
  if (hour < 12) return "MORNING RUN";
  if (hour < 17) return "AFTERNOON RUN";
  return "EVENING RUN";
};

export default function CommandScreen() {
  const { state, todayKey, todayLog, dayNumber, phase, phaseCopy, level, recoveryDays, loading, togglePlanItem } = useLifeGamify();
  const { dailyPlan, alignment, generateDailyPlan, generateAlignment, busyDaily, busyAlign } = useCoach();
  const started = useRef(false);

  useEffect(() => {
    if (loading || started.current) return;
    started.current = true;
    if (!dailyPlan) generateDailyPlan().catch(() => undefined);
    if (!alignment) generateAlignment().catch(() => undefined);
  }, [loading, dailyPlan, alignment, generateDailyPlan, generateAlignment]);

  const hour = new Date().getHours();
  const completed = QUESTS.filter((quest) => todayLog.statuses[quest.id] && todayLog.statuses[quest.id] !== "pending").length;
  const weekStart = weekStartKey();
  const skillScore = SKILLS.reduce((sum, skill) => {
    const value = state.skills[skill.id];
    return sum + (value === "ready" ? 1 : value === "learning" ? 0.5 : 0);
  }, 0);
  const learnThisWeek = state.learnLogs.filter((entry) => entry.date >= weekStart).length;
  const careerProgress = Math.min(100, Math.round((skillScore / SKILLS.length) * 70 + (Math.min(3, learnThisWeek) / 3) * 30));
  const englishMinutes = state.feedbackEntries.filter((entry) => entry.date >= weekStart).reduce((sum, entry) => sum + (entry.minutes ?? 0), 0);
  const englishProgress = Math.min(100, Math.round(englishMinutes));
  const latestWeight = state.weightEntries[state.weightEntries.length - 1]?.value ?? BASE_WEIGHT;
  const goalGain = Math.max(1, state.weightGoal - BASE_WEIGHT);
  const fuelDays = Object.entries(state.mealLogs).filter(([key, meal]) => key >= weekStart && !meal.outsideFood && meal.items.length >= 2).length;
  const healthProgress = Math.min(100, Math.round((Math.min(1, Math.max(0, latestWeight - BASE_WEIGHT) / goalGain) * 50) + (Math.min(1, fuelDays / 7) * 50)));

  const firstOpen = QUESTS.find((quest) => !todayLog.statuses[quest.id] || todayLog.statuses[quest.id] === "pending");
  const englishToday = state.feedbackEntries.some((entry) => entry.date === todayKey);
  const learnToday = state.learnLogs.some((entry) => entry.date === todayKey);
  const mealToday = Boolean(state.mealLogs[todayKey]);
  const networkToday = Boolean(state.networkLogs[todayKey]);
  const checkedIn = Boolean(todayLog.energy);
  const actions: (Action | null)[] = [
    firstOpen ? { title: firstOpen.title, copy: "Open today’s missions and record evidence.", route: "/(tabs)/quests" } : null,
    englishToday ? null : { title: "Run the 20-min voice room", copy: "Speak first. Score it at the end.", route: "/(tabs)/tracks" },
    learnToday ? null : { title: "Log one small lesson", copy: "One video or article with a takeaway.", route: "/(tabs)/learn" },
    mealToday ? null : { title: "Add a home-fuel item", copy: "Vegetarian + eggs. Home food default.", route: "/(tabs)/tracks" },
    networkToday ? null : { title: "Send one LinkedIn touch", copy: "A connection, message, or referral ask.", route: "/(tabs)/learn" },
    checkedIn ? null : { title: "Save tonight’s check-in", copy: "Energy and tomorrow’s first action.", route: "/(tabs)/review" },
  ];
  const fallback: Action = { title: "Run complete. Recover well.", copy: "Sleep is part of the program.", route: "/(tabs)/review" };
  const next = actions.find((item): item is Action => item !== null) ?? fallback;

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

        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.heroLabel}>{"// AGENT BRIEF · "}{greetingFor(hour)}</Text>
            <Text style={styles.heroAuto}>{dailyPlan ? (dailyPlan.source === "fallback" ? "CURRICULUM ✓" : "AI ✓") : busyDaily ? "ANALYZING…" : "AUTO"}</Text>
          </View>
          {dailyPlan ? (
            <View style={{ gap: 12 }}>
              <View>
                <Text style={styles.heroKicker}>TODAY’S TOPIC</Text>
                <Text style={styles.heroFocus}>{dailyPlan.focus}</Text>
              </View>
              <View style={styles.questionBox}>
                <Text style={styles.heroKicker}>THE SPECIFIC QUESTION</Text>
                <Text style={styles.questionText}>{dailyPlan.focusQuestion}</Text>
              </View>
              <View style={{ gap: 8 }}>
                {dailyPlan.items.map((item, index) => {
                  const key = `${todayKey}:${index}`;
                  const done = Boolean(state.planChecks[key]);
                  return (
                    <Pressable key={key} onPress={() => togglePlanItem(key)} style={[styles.planItem, done && styles.planItemDone]}>
                      <View style={[styles.checkbox, done && styles.checkboxOn]}>{done ? <Ionicons name="checkmark" size={12} color={COLORS.ink} /> : null}</View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.planTitle, done && styles.planTitleDone]}>{item.title}</Text>
                        {item.question ? <Text style={styles.planQuestion}>{item.question}</Text> : null}
                        <Text style={styles.planWhy}>{item.why}</Text>
                      </View>
                      <View style={styles.planMeta}>
                        <Text style={[styles.planTrack, { color: PLAN_STYLE[item.track] }]}>{item.track.toUpperCase()}</Text>
                        <Text style={styles.planMinutes}>{item.minutes} MIN</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable onPress={() => generateDailyPlan().catch(() => undefined)} style={({ pressed }) => [styles.reanalyze, pressed && styles.pressed]} disabled={busyDaily}>
                <Text style={styles.reanalyzeText}>{busyDaily ? "RE-ANALYZING…" : "↻ RE-ANALYZE"}</Text>
              </Pressable>
            </View>
          ) : busyDaily ? (
            <View style={styles.heroLoading}>
              <ActivityIndicator color={COLORS.cyan} />
              <Text style={styles.heroLoadingText}>Building today’s mission from what you already learned…</Text>
            </View>
          ) : (
            <Pressable onPress={() => generateDailyPlan().catch(() => undefined)} style={({ pressed }) => [styles.reanalyze, pressed && styles.pressed]}>
              <Text style={styles.reanalyzeText}>TAP TO RETRY ANALYSIS</Text>
            </Pressable>
          )}
        </View>

        <Pressable onPress={() => generateAlignment().catch(() => undefined)} style={[styles.alignCard, { borderColor: alignment ? ALIGN_COLOR[alignment.status] ?? COLORS.amber : COLORS.line }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>{"// GOAL ALIGNMENT"}</Text>
            <Text style={[styles.alignScore, { color: alignment ? ALIGN_COLOR[alignment.status] ?? COLORS.amber : COLORS.muted }]}>{alignment ? `${alignment.score}/100` : busyAlign ? "…" : "AUTO"}</Text>
          </View>
          {alignment ? (
            <View style={{ gap: 5 }}>
              <Text style={[styles.alignStatus, { color: ALIGN_COLOR[alignment.status] ?? COLORS.amber }]}>{alignment.status.toUpperCase()}</Text>
              <Text style={styles.planWhy}>{alignment.correction}</Text>
            </View>
          ) : (
            <Text style={styles.planWhy}>{busyAlign ? "Checking alignment with the ₹6–7 LPA goal…" : "Automatic check runs with today’s brief."}</Text>
          )}
        </Pressable>

        <View style={styles.xpCard}>
          <View style={styles.xpTop}>
            <View>
              <Text style={styles.eyebrow}>CURRENT RUN</Text>
              <Text style={styles.xpValue}>{state.xp} <Text style={styles.xpUnit}>XP</Text></Text>
            </View>
            <View style={styles.streak}><Ionicons name="flame" color={COLORS.amber} size={17} /><Text style={styles.streakText}>{state.streak} DAY CHAIN</Text></View>
          </View>
          <ProgressBar value={xpIntoLevel(state.xp)} color={COLORS.cyan} height={8} />
          <View style={styles.xpBottom}>
            <Text style={styles.muted}>LEVEL {level} → {level + 1}</Text>
            <Text style={styles.muted}>{completed}/3 quests today</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{"// TRACK SIGNALS"}</Text>
          <Text style={styles.muted}>week progress</Text>
        </View>
        <View style={styles.signalRow}>
          {([["career", careerProgress], ["english", englishProgress], ["health", healthProgress]] as const).map(([key, progress]) => {
            const track = TRACKS[key];
            return (
              <View key={key} style={styles.signalCard}>
                <Text style={[styles.signalIcon, { color: track.color }]}>{track.icon}</Text>
                <Text style={styles.signalName}>{track.short}</Text>
                <Text style={[styles.signalPercent, { color: track.color }]}>{progress}%</Text>
                <ProgressBar value={progress} color={track.color} height={4} />
              </View>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{"// MAIN QUEST"}</Text>
          <View style={styles.phaseChip}><Text style={styles.phaseText}>{phase}</Text></View>
        </View>
        <View style={styles.mainQuest}>
          <View style={styles.questGlyph}><Text style={styles.questGlyphText}>✦</Text></View>
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={styles.questTitle}>Reach ₹6–7 LPA</Text>
            <Text style={styles.questCopy}>{phaseCopy}</Text>
            <View style={styles.questTargets}>
              <Text style={styles.targetText}>CURRENT <Text style={styles.targetStrong}>₹3.6 LPA</Text></Text>
              <Text style={styles.targetText}>TARGET <Text style={[styles.targetStrong, { color: COLORS.lime }]}>₹7 LPA</Text></Text>
            </View>
          </View>
        </View>

        <Pressable onPress={() => router.navigate(next.route as never)} style={({ pressed }) => [styles.nextAction, pressed && styles.pressed]}>
          <View style={styles.nextIcon}><Ionicons name="arrow-forward" color={COLORS.ink} size={18} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>NEXT ACTION</Text>
            <Text style={styles.nextTitle}>{loading ? "Loading your run…" : next.title}</Text>
            <Text style={styles.nextCopy}>{recoveryDays >= 2 ? "Recovery mode is active. Choose the smallest version." : next.copy}</Text>
          </View>
          <Ionicons name="chevron-forward" color={COLORS.cyan} size={20} />
        </Pressable>

        {recoveryDays >= 2 ? (
          <View style={styles.recovery}>
            <Ionicons name="shield-checkmark-outline" color={COLORS.lime} size={18} />
            <Text style={styles.recoveryText}>RECOVERY MODE · No reset. Reduce difficulty and keep the run alive.</Text>
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 34, gap: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  eyebrow: { color: COLORS.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  name: { color: COLORS.text, fontSize: 27, fontWeight: "900", letterSpacing: 1, marginTop: 5 },
  meta: { color: COLORS.muted, fontSize: 10, fontWeight: "700", letterSpacing: 0.7, marginTop: 5 },
  dayBadge: { borderWidth: 1, borderColor: COLORS.cyan, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 8, alignItems: "center", minWidth: 58, backgroundColor: COLORS.cyanDim },
  dayLabel: { color: COLORS.cyan, fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  dayNumber: { color: COLORS.text, fontSize: 22, fontWeight: "900", lineHeight: 24 },
  hero: { backgroundColor: COLORS.panel, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.cyan, padding: 16, gap: 12, boxShadow: "0px 0px 16px rgba(67, 231, 255, 0.22)", elevation: 8 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroLabel: { color: COLORS.cyan, fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  heroAuto: { color: COLORS.lime, fontSize: 9, fontWeight: "900", letterSpacing: 0.9 },
  heroKicker: { color: COLORS.muted, fontSize: 8, fontWeight: "900", letterSpacing: 1.2 },
  heroFocus: { color: COLORS.text, fontSize: 20, fontWeight: "900", lineHeight: 26, marginTop: 4 },
  questionBox: { backgroundColor: COLORS.cyanDim, borderRadius: 13, borderLeftWidth: 3, borderLeftColor: COLORS.cyan, padding: 11, gap: 5 },
  questionText: { color: COLORS.text, fontSize: 13, lineHeight: 19, fontWeight: "700" },
  planItem: { flexDirection: "row", gap: 10, alignItems: "flex-start", backgroundColor: COLORS.panelSoft, borderRadius: 13, borderWidth: 1, borderColor: COLORS.line, padding: 11 },
  planItemDone: { opacity: 0.55 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: COLORS.cyan, alignItems: "center", justifyContent: "center", marginTop: 1 },
  checkboxOn: { backgroundColor: COLORS.cyan, borderColor: COLORS.cyan },
  planTitle: { color: COLORS.text, fontSize: 12, fontWeight: "800" },
  planTitleDone: { textDecorationLine: "line-through" },
  planQuestion: { color: COLORS.cyan, fontSize: 10, lineHeight: 15, marginTop: 3, fontStyle: "italic" },
  planWhy: { color: COLORS.muted, fontSize: 10, lineHeight: 14, marginTop: 3 },
  planMeta: { alignItems: "flex-end", gap: 3 },
  planTrack: { fontSize: 8, fontWeight: "900", letterSpacing: 0.7 },
  planMinutes: { color: COLORS.muted, fontSize: 9, fontWeight: "800" },
  reanalyze: { alignSelf: "center", borderRadius: 10, borderWidth: 1, borderColor: COLORS.line, paddingHorizontal: 13, paddingVertical: 8 },
  reanalyzeText: { color: COLORS.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  heroLoading: { flexDirection: "row", gap: 10, alignItems: "center", paddingVertical: 8 },
  heroLoadingText: { flex: 1, color: COLORS.muted, fontSize: 11, lineHeight: 16 },
  alignCard: { backgroundColor: COLORS.panel, borderWidth: 1, borderRadius: 16, padding: 14, gap: 8 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionLabel: { color: COLORS.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  alignScore: { fontSize: 12, fontWeight: "900", letterSpacing: 0.6 },
  alignStatus: { fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  xpCard: { backgroundColor: COLORS.panel, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: COLORS.line, gap: 11 },
  xpTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  xpValue: { color: COLORS.text, fontSize: 28, fontWeight: "900", marginTop: 3 },
  xpUnit: { color: COLORS.cyan, fontSize: 12, letterSpacing: 1 },
  streak: { flexDirection: "row", gap: 5, alignItems: "center", backgroundColor: COLORS.amberDim, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6 },
  streakText: { color: COLORS.amber, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  xpBottom: { flexDirection: "row", justifyContent: "space-between" },
  muted: { color: COLORS.muted, fontSize: 10, fontWeight: "700" },
  signalRow: { flexDirection: "row", gap: 9 },
  signalCard: { flex: 1, backgroundColor: COLORS.panel, borderRadius: 15, padding: 12, gap: 6, borderWidth: 1, borderColor: COLORS.line },
  signalIcon: { fontSize: 16, fontWeight: "900" },
  signalName: { color: COLORS.text, fontSize: 11, fontWeight: "800" },
  signalPercent: { fontSize: 15, fontWeight: "900" },
  phaseChip: { borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: COLORS.amberDim },
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
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
