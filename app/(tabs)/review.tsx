import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ProgressBar } from "@/components/progress-bar";
import { ScreenContainer } from "@/components/screen-container";
import { COLORS, REWARDS, weekStartKey } from "@/constants/gamify";
import { QUESTS, useLifeGamify, weekXp } from "@/lib/lifegamify-store";
import { useCoach } from "@/lib/use-coach";

const ALIGN_COLOR: Record<string, string> = { aligned: COLORS.lime, "at-risk": COLORS.amber, "off-track": COLORS.red };

export default function ReviewScreen() {
  const { state, todayLog, saveCheckIn, claimReward, resetDemo } = useLifeGamify();
  const { alignment, generateAlignment, busyAlign } = useCoach();
  const [energy, setEnergy] = useState(todayLog.energy ?? 2);
  const [tomorrow, setTomorrow] = useState(todayLog.tomorrow ?? "");
  const [saved, setSaved] = useState(false);
  const weekStart = weekStartKey();
  const weeklyXp = weekXp(state, weekStart);
  const weeklyClears = Object.entries(state.logs)
    .filter(([key]) => key >= weekStart)
    .reduce((sum, [, log]) => sum + QUESTS.filter((quest) => log.statuses[quest.id] && log.statuses[quest.id] !== "pending" && log.statuses[quest.id] !== "skipped").length, 0);
  const voiceReviews = state.feedbackEntries.filter((entry) => entry.date >= weekStart).length;
  const weighIns = state.weightEntries.filter((entry) => entry.date >= weekStart).length;
  const nextThreshold = REWARDS.find((reward) => weeklyXp < reward.threshold);

  const save = () => {
    saveCheckIn(energy, tomorrow.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <ScreenContainer safeAreaClassName="bg-[#F6F6F3]" containerClassName="bg-[#F6F6F3]">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View>
          <Text style={styles.eyebrow}>{"// NIGHTLY REVIEW"}</Text>
          <Text style={styles.title}>Close the loop.</Text>
          <Text style={styles.subtitle}>A five-minute save point. Honest evidence beats a perfect story.</Text>
        </View>

        <View style={styles.alignCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionLabel}>{"// AI ALIGNMENT CHECK"}</Text>
            <Pressable onPress={() => generateAlignment().catch(() => undefined)} disabled={busyAlign}>
              <Text style={styles.regen}>{busyAlign ? "…" : alignment ? "RE-RUN" : "RUN CHECK"}</Text>
            </Pressable>
          </View>
          {busyAlign && !alignment ? <ActivityIndicator color={COLORS.cyan} /> : null}
          {alignment ? (
            <View style={{ gap: 9 }}>
              <View style={styles.alignRow}>
                <Text style={[styles.alignStatus, { color: ALIGN_COLOR[alignment.status] ?? COLORS.amber }]}>{alignment.status.toUpperCase()}</Text>
                <Text style={[styles.alignScore, { color: ALIGN_COLOR[alignment.status] ?? COLORS.amber }]}>{alignment.score}/100</Text>
              </View>
              {alignment.observations.map((observation) => (
                <Text key={observation} style={styles.observation}>{"→ "}{observation}</Text>
              ))}
              <View style={styles.correctionBox}>
                <Text style={styles.correctionLabel}>NEXT 48 HOURS</Text>
                <Text style={styles.correctionText}>{alignment.correction}</Text>
              </View>
            </View>
          ) : !busyAlign ? (
            <Text style={styles.hint}>Honest read: are you aligned with the ₹6–7 LPA goal, English practice, and health right now?</Text>
          ) : null}
        </View>

        <View style={styles.checkinCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionLabel}>TODAY&apos;S SAVE POINT</Text>
            <Text style={styles.saveState}>{saved ? "SAVED ✓" : "LOCAL"}</Text>
          </View>
          <Text style={styles.question}>How much energy did you have?</Text>
          <View style={styles.energyRow}>
            {[1, 2, 3].map((value) => (
              <Pressable key={value} onPress={() => setEnergy(value)} style={[styles.energy, energy === value && styles.energySelected]}>
                <Text style={[styles.energyNumber, energy === value && { color: COLORS.ink }]}>{value}</Text>
                <Text style={[styles.energyLabel, energy === value && { color: COLORS.ink }]}>{value === 1 ? "LOW" : value === 2 ? "MID" : "HIGH"}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.question}>What is tomorrow&apos;s first action?</Text>
          <TextInput value={tomorrow} onChangeText={setTomorrow} placeholder="Example: revise one RAG interview answer" placeholderTextColor={COLORS.muted} style={styles.input} />
          <Pressable onPress={save} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>{todayLog.checkInAwarded ? "UPDATE CHECK-IN" : "SAVE CHECK-IN · +5 XP"}</Text>
          </Pressable>
        </View>

        <View style={styles.weekCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionLabel}>WEEKLY SIGNAL</Text>
            <Text style={styles.weekXp}>{weeklyXp} XP</Text>
          </View>
          <View style={styles.weekStats}>
            <View><Text style={styles.statValue}>{weeklyClears}</Text><Text style={styles.statLabel}>QUESTS LOGGED</Text></View>
            <View><Text style={styles.statValue}>{voiceReviews}</Text><Text style={styles.statLabel}>VOICE REVIEWS</Text></View>
            <View><Text style={styles.statValue}>{weighIns}</Text><Text style={styles.statLabel}>WEIGH-INS</Text></View>
          </View>
          <ProgressBar value={(weeklyXp / 300) * 100} color={COLORS.amber} height={8} />
          <Text style={styles.weekCopy}>{nextThreshold ? `${Math.max(0, nextThreshold.threshold - weeklyXp)} XP until “${nextThreshold.title}”.` : "Top reward unlocked. Claim one deliberate reset."}</Text>
        </View>

        <View style={styles.cardHeader}>
          <Text style={styles.sectionLabel}>REWARD LOCKER</Text>
          <Text style={styles.muted}>NO IMPULSE SPENDING</Text>
        </View>
        {REWARDS.map((reward) => {
          const claimKey = `${weekStart}:${reward.id}`;
          const claimed = state.claimedRewards.includes(claimKey);
          const available = weeklyXp >= reward.threshold && !claimed;
          return (
            <Pressable key={reward.id} onPress={() => available && claimReward(reward.id)} style={[styles.reward, claimed && styles.rewardClaimed, !available && !claimed && styles.rewardLocked]}>
              <View style={styles.rewardIcon}><Text style={styles.rewardGlyph}>{reward.icon}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rewardTitle}>{reward.title}</Text>
                <Text style={styles.rewardDetail}>{reward.detail}</Text>
              </View>
              <View style={styles.rewardRight}>
                <Text style={[styles.rewardCost, available && { color: COLORS.lime }]}>{claimed ? "CLAIMED ✓" : `${reward.threshold} XP`}</Text>
                <Text style={styles.rewardChevron}>{claimed ? "USED" : available ? "CLAIM" : "LOCK"}</Text>
              </View>
            </Pressable>
          );
        })}

        <Text style={styles.note}>Rewards reset every week and are a contract with yourself: useful, bounded, and never a punishment for a hard day.</Text>
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
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionLabel: { color: COLORS.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  alignCard: { backgroundColor: COLORS.panel, borderRadius: 18, borderWidth: 1, borderColor: COLORS.line, padding: 15, gap: 10 },
  regen: { color: COLORS.cyan, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  alignRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  alignStatus: { fontSize: 15, fontWeight: "900", letterSpacing: 1 },
  alignScore: { fontSize: 24, fontWeight: "900" },
  observation: { color: COLORS.text, fontSize: 11, lineHeight: 17 },
  correctionBox: { backgroundColor: COLORS.panelSoft, borderRadius: 12, borderWidth: 1, borderColor: COLORS.cyan, padding: 11, gap: 4 },
  correctionLabel: { color: COLORS.cyan, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  correctionText: { color: COLORS.text, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  hint: { color: COLORS.muted, fontSize: 11, lineHeight: 16 },
  checkinCard: { backgroundColor: COLORS.panel, borderRadius: 18, borderWidth: 1, borderColor: COLORS.cyan, padding: 15, gap: 12 },
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
  rewardChevron: { color: COLORS.muted, fontSize: 11, fontWeight: "900", letterSpacing: 0.7 },
  note: { color: COLORS.muted, fontSize: 10, lineHeight: 15, textAlign: "center", paddingHorizontal: 8 },
  resetButton: { alignSelf: "center", borderWidth: 1, borderColor: COLORS.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginTop: 1 },
  resetText: { color: COLORS.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  pressed: { opacity: 0.78 },
});
