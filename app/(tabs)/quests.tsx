import { ScrollView, StyleSheet, Text, View } from "react-native";

import { QuestCard } from "@/components/quest-card";
import { ProgressBar } from "@/components/progress-bar";
import { ScreenContainer } from "@/components/screen-container";
import { COLORS, TRACKS } from "@/constants/gamify";
import { QUESTS, logXp, useLifeGamify } from "@/lib/lifegamify-store";

export default function QuestsScreen() {
  const { state, todayLog, completeQuest, recoveryDays } = useLifeGamify();
  const logged = QUESTS.filter((quest) => todayLog.statuses[quest.id] && todayLog.statuses[quest.id] !== "pending").length;
  const todayXp = logXp(todayLog);

  return (
    <ScreenContainer safeAreaClassName="bg-[#F6F6F3]" containerClassName="bg-[#F6F6F3]">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><View><Text style={styles.eyebrow}>{"// DAILY MISSIONS"}</Text><Text style={styles.title}>Keep the run alive.</Text><Text style={styles.subtitle}>Three quests. No overthinking. Record the strongest version you can do today.</Text></View><View style={styles.xpBadge}><Text style={styles.xpNumber}>{todayXp}</Text><Text style={styles.xpLabel}>TODAY XP</Text></View></View>

        <View style={styles.progressCard}><View style={styles.progressTop}><Text style={styles.sectionLabel}>TODAY&apos;S CLEAR RATE</Text><Text style={styles.progressValue}>{logged} / 3</Text></View><ProgressBar value={(logged / 3) * 100} color={COLORS.lime} height={8} /><Text style={styles.progressCopy}>{logged === 3 ? "All missions logged. The bonus is yours." : "Partial and minimum routes still earn XP."}</Text></View>

        {recoveryDays >= 2 ? <View style={styles.recovery}><Text style={styles.recoveryGlyph}>↺</Text><View style={{ flex: 1 }}><Text style={styles.recoveryTitle}>RECOVERY QUEST ACTIVE</Text><Text style={styles.recoveryCopy}>Difficulty is reduced. One small action is enough to restart the chain. You do not lose levels.</Text></View></View> : null}

        <View style={styles.sectionHeader}><Text style={styles.sectionLabel}>{"// CHOOSE YOUR CLEAR"}</Text><Text style={styles.muted}>FULL / PARTIAL / MIN</Text></View>
        {QUESTS.map((quest) => <QuestCard key={quest.id} quest={quest} status={todayLog.statuses[quest.id] ?? "pending"} onSelect={(status) => completeQuest(quest.id, status)} />)}

        <View style={styles.tip}><Text style={[styles.tipLabel, { color: TRACKS.english.color }]}>SYSTEM RULE</Text><Text style={styles.tipText}>The smallest version is not a cheat code. It is the recovery mechanic that protects your identity as someone who keeps promises.</Text></View>
        <Text style={styles.persisted}>XP {state.xp} · {state.streak} day chain · saved on this device</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 32, gap: 18 },
  header: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  eyebrow: { color: COLORS.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: COLORS.text, fontSize: 26, fontWeight: "900", marginTop: 5 },
  subtitle: { color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 5, maxWidth: 260 },
  xpBadge: { marginLeft: "auto", alignItems: "center", backgroundColor: COLORS.cyanDim, borderRadius: 14, padding: 10, minWidth: 62 },
  xpNumber: { color: COLORS.cyan, fontSize: 21, fontWeight: "900" },
  xpLabel: { color: COLORS.cyan, fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  progressCard: { backgroundColor: COLORS.panel, borderColor: COLORS.line, borderWidth: 1, borderRadius: 16, padding: 14, gap: 9 },
  progressTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionLabel: { color: COLORS.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  progressValue: { color: COLORS.lime, fontSize: 16, fontWeight: "900" },
  progressCopy: { color: COLORS.muted, fontSize: 11 },
  recovery: { flexDirection: "row", gap: 11, borderWidth: 1, borderColor: COLORS.lime, backgroundColor: COLORS.limeDim, borderRadius: 16, padding: 14, alignItems: "center" },
  recoveryGlyph: { color: COLORS.lime, fontSize: 28, fontWeight: "800" },
  recoveryTitle: { color: COLORS.lime, fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  recoveryCopy: { color: COLORS.text, fontSize: 11, lineHeight: 16, marginTop: 3 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  muted: { color: COLORS.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  tip: { borderLeftWidth: 2, borderLeftColor: TRACKS.english.color, paddingLeft: 12, paddingVertical: 3, gap: 4 },
  tipLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  tipText: { color: COLORS.muted, fontSize: 12, lineHeight: 18 },
  persisted: { textAlign: "center", color: COLORS.muted, fontSize: 10, marginTop: 3 },
});
