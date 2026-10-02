import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ProgressBar } from "@/components/progress-bar";
import { ScreenContainer } from "@/components/screen-container";
import { COLORS } from "@/constants/gamify";
import { QUESTS, useLifeGamify } from "@/lib/lifegamify-store";

const REWARDS = [
  { id: "video", title: "Watch a useful short video", detail: "Coding, finance, or a topic that moves the build forward.", cost: 120, icon: "▶" },
  { id: "outing", title: "Take a small outing", detail: "A reset that gets you out of the room and back into life.", cost: 220, icon: "↗" },
  { id: "purchase", title: "Buy one useful thing", detail: "A bounded reward with a spending limit you choose.", cost: 300, icon: "＋" },
];

export default function ReviewScreen() {
  const { state, todayLog, saveCheckIn, claimReward, resetDemo } = useLifeGamify();
  const [energy, setEnergy] = useState(todayLog.energy ?? 2);
  const [tomorrow, setTomorrow] = useState(todayLog.tomorrow ?? "");
  const [saved, setSaved] = useState(false);
  const weeklyLogs = useMemo(() => Object.entries(state.logs).sort(([a], [b]) => b.localeCompare(a)).slice(0, 7), [state.logs]);
  const weeklyXp = weeklyLogs.reduce((sum, [, log]) => sum + Object.values(log.statuses).reduce((total, status) => total + (status === "full" ? 20 : status === "partial" ? 10 : status === "minimum" ? 5 : 0), 0) + (log.bonusAwarded ? 15 : 0) + (log.checkInAwarded ? 5 : 0), 0);
  const weeklyClears = weeklyLogs.reduce((sum, [, log]) => sum + QUESTS.filter((quest) => log.statuses[quest.id] && log.statuses[quest.id] !== "pending" && log.statuses[quest.id] !== "skipped").length, 0);

  const save = () => { saveCheckIn(energy, tomorrow.trim()); setSaved(true); setTimeout(() => setSaved(false), 1800); };

  return (
    <ScreenContainer safeAreaClassName="bg-[#070B16]" containerClassName="bg-[#070B16]">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View><Text style={styles.eyebrow}>{"// NIGHTLY REVIEW"}</Text><Text style={styles.title}>Close the loop.</Text><Text style={styles.subtitle}>A five-minute save point. Honest evidence beats a perfect story.</Text></View>

        <View style={styles.checkinCard}><View style={styles.cardHeader}><Text style={styles.sectionLabel}>TODAY&apos;S SAVE POINT</Text><Text style={styles.saveState}>{saved ? "SAVED ✓" : "LOCAL"}</Text></View><Text style={styles.question}>How much energy did you have?</Text><View style={styles.energyRow}>{[1, 2, 3].map((value) => <Pressable key={value} onPress={() => setEnergy(value)} style={[styles.energy, energy === value && styles.energySelected]}><Text style={[styles.energyNumber, energy === value && { color: COLORS.ink }]}>{value}</Text><Text style={[styles.energyLabel, energy === value && { color: COLORS.ink }]}>{value === 1 ? "LOW" : value === 2 ? "MID" : "HIGH"}</Text></Pressable>)}</View><Text style={styles.question}>What is tomorrow&apos;s first action?</Text><TextInput value={tomorrow} onChangeText={setTomorrow} placeholder="Example: revise one RAG interview answer" placeholderTextColor={COLORS.muted} style={styles.input} /><Pressable onPress={save} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryText}>SAVE CHECK-IN</Text></Pressable></View>

        <View style={styles.weekCard}><View style={styles.cardHeader}><Text style={styles.sectionLabel}>WEEKLY SIGNAL</Text><Text style={styles.weekXp}>{weeklyXp} XP</Text></View><View style={styles.weekStats}><View><Text style={styles.statValue}>{weeklyClears}</Text><Text style={styles.statLabel}>QUESTS LOGGED</Text></View><View><Text style={styles.statValue}>{state.feedbackEntries.length}</Text><Text style={styles.statLabel}>VOICE REVIEWS</Text></View><View><Text style={styles.statValue}>{state.weightEntries.length}</Text><Text style={styles.statLabel}>WEIGH-INS</Text></View></View><ProgressBar value={Math.min(100, (weeklyXp / 300) * 100)} color={COLORS.amber} height={8} /><Text style={styles.weekCopy}>{weeklyXp >= 220 ? "Reward threshold reached. Claim a deliberate reset." : `${Math.max(0, 220 - weeklyXp)} XP until the next reward threshold.`}</Text></View>

        <View style={styles.cardHeader}><Text style={styles.sectionLabel}>REWARD LOCKER</Text><Text style={styles.muted}>NO IMPULSE SPENDING</Text></View>
        {REWARDS.map((reward) => { const claimed = state.claimedRewards.includes(reward.id); const available = weeklyXp >= reward.cost; return <Pressable key={reward.id} onPress={() => available && claimReward(reward.id)} style={[styles.reward, claimed && styles.rewardClaimed, !available && styles.rewardLocked]}><View style={styles.rewardIcon}><Text style={styles.rewardGlyph}>{reward.icon}</Text></View><View style={{ flex: 1 }}><Text style={styles.rewardTitle}>{reward.title}</Text><Text style={styles.rewardDetail}>{reward.detail}</Text></View><View style={styles.rewardRight}><Text style={[styles.rewardCost, available && { color: COLORS.lime }]}>{claimed ? "CLAIMED" : `${reward.cost} XP`}</Text><Text style={styles.rewardChevron}>{available ? "›" : "LOCK"}</Text></View></Pressable>; })}

        <Text style={styles.note}>Rewards are a weekly contract with yourself: useful, bounded, and never a punishment for a hard day.</Text>
        <Pressable onPress={resetDemo} style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}><Text style={styles.resetText}>RESET LOCAL TEST DATA</Text></Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 34, gap: 16 },
  eyebrow: { color: COLORS.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: COLORS.text, fontSize: 27, fontWeight: "900", marginTop: 5 },
  subtitle: { color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 5 },
  checkinCard: { backgroundColor: COLORS.panel, borderRadius: 18, borderWidth: 1, borderColor: COLORS.cyan, padding: 15, gap: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionLabel: { color: COLORS.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  saveState: { color: COLORS.cyan, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  question: { color: COLORS.text, fontSize: 14, fontWeight: "800", marginTop: 1 },
  energyRow: { flexDirection: "row", gap: 8 },
  energy: { flex: 1, borderRadius: 12, backgroundColor: COLORS.panelSoft, borderWidth: 1, borderColor: COLORS.line, alignItems: "center", paddingVertical: 10, gap: 3 },
  energySelected: { backgroundColor: COLORS.cyan, borderColor: COLORS.cyan },
  energyNumber: { color: COLORS.cyan, fontSize: 17, fontWeight: "900" },
  energyLabel: { color: COLORS.muted, fontSize: 8, fontWeight: "900", letterSpacing: 0.7 },
  input: { color: COLORS.text, backgroundColor: COLORS.panelSoft, borderWidth: 1, borderColor: COLORS.line, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11, fontSize: 13 },
  primaryButton: { backgroundColor: COLORS.cyan, borderRadius: 11, alignItems: "center", paddingVertical: 12, marginTop: 1 },
  primaryText: { color: COLORS.ink, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  weekCard: { backgroundColor: COLORS.panel, borderRadius: 18, borderWidth: 1, borderColor: COLORS.amber, padding: 15, gap: 12 },
  weekXp: { color: COLORS.amber, fontSize: 15, fontWeight: "900" },
  weekStats: { flexDirection: "row", justifyContent: "space-between" },
  statValue: { color: COLORS.text, fontSize: 22, fontWeight: "900" },
  statLabel: { color: COLORS.muted, fontSize: 8, fontWeight: "900", letterSpacing: 0.7, marginTop: 2 },
  weekCopy: { color: COLORS.muted, fontSize: 11, lineHeight: 16 },
  muted: { color: COLORS.muted, fontSize: 9, fontWeight: "800", letterSpacing: 0.7 },
  reward: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.line, borderRadius: 15, padding: 12 },
  rewardClaimed: { borderColor: COLORS.lime, backgroundColor: COLORS.limeDim },
  rewardLocked: { opacity: 0.66 },
  rewardIcon: { width: 35, height: 35, borderRadius: 11, backgroundColor: COLORS.amberDim, alignItems: "center", justifyContent: "center" },
  rewardGlyph: { color: COLORS.amber, fontSize: 18, fontWeight: "900" },
  rewardTitle: { color: COLORS.text, fontSize: 13, fontWeight: "800" },
  rewardDetail: { color: COLORS.muted, fontSize: 10, lineHeight: 14, marginTop: 2 },
  rewardRight: { alignItems: "flex-end", gap: 4 },
  rewardCost: { color: COLORS.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  rewardChevron: { color: COLORS.muted, fontSize: 16, fontWeight: "800" },
  note: { color: COLORS.muted, fontSize: 10, lineHeight: 15, textAlign: "center", paddingHorizontal: 8 },
  resetButton: { alignSelf: "center", borderWidth: 1, borderColor: COLORS.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginTop: 1 },
  resetText: { color: COLORS.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  pressed: { opacity: 0.78 },
});
