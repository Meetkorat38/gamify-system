import { useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Chips } from "@/components/chips";
import { CounterRow } from "@/components/counter-row";
import { ProgressBar } from "@/components/progress-bar";
import { ScreenContainer } from "@/components/screen-container";
import {
  COLORS,
  LEARN_CATEGORIES,
  SKILLS,
  SKILL_STATES,
  weekStartKey,
  type LearnCategory,
  type SkillState,
} from "@/constants/gamify";
import { useLifeGamify, type NetworkLog } from "@/lib/lifegamify-store";
import { useCoach } from "@/lib/use-coach";

const SEGMENTS = [
  { id: "skills", label: "SKILL GAPS" },
  { id: "feed", label: "DAILY FEED" },
  { id: "network", label: "NETWORK PUSH" },
];

const ROADMAP = [
  { phase: "01", title: "Gap audit", detail: "Map interview-ready, weak, and missing skills across LLM systems, workflow architecture, cloud, and AI system design." },
  { phase: "02", title: "Build proof", detail: "Turn learning into diagrams, explanations, small implementations, and sharper case studies from your shipped systems." },
  { phase: "03", title: "Interview battlefield", detail: "From mid-November: applications, networking, mock interviews, feedback loops, and salary conversations." },
];

const NETWORK_FIELDS: { key: keyof NetworkLog; label: string; target: number }[] = [
  { key: "connections", label: "LinkedIn connections", target: 20 },
  { key: "messages", label: "Personal messages", target: 10 },
  { key: "applications", label: "Applications sent", target: 5 },
  { key: "referrals", label: "Referral asks", target: 2 },
];

const stateColor = (state: SkillState) => (state === "ready" ? COLORS.lime : state === "learning" ? COLORS.amber : COLORS.muted);

export default function LearnScreen() {
  const { state, todayKey, todayLog, setSkill, logLearn, saveNetwork } = useLifeGamify();
  const { learningPlan, generateLearningPlan, busyLearning } = useCoach();
  const [segment, setSegment] = useState("skills");
  const [category, setCategory] = useState<LearnCategory>("coding");
  const [title, setTitle] = useState("");
  const [takeaway, setTakeaway] = useState("");
  const [minutes, setMinutes] = useState("15");
  const [counts, setCounts] = useState<NetworkLog>(
    () => state.networkLogs[todayKey] ?? { connections: 0, messages: 0, applications: 0, referrals: 0 },
  );
  const [savedFlash, setSavedFlash] = useState("");

  const readyCount = SKILLS.filter((skill) => state.skills[skill.id] === "ready").length;
  const learningCount = SKILLS.filter((skill) => state.skills[skill.id] === "learning").length;
  const readiness = Math.round(((readyCount + learningCount * 0.5) / SKILLS.length) * 100);
  const weekStart = weekStartKey();
  const weekNetwork = Object.entries(state.networkLogs)
    .filter(([key]) => key >= weekStart)
    .reduce(
      (sum, [, log]) => ({
        connections: sum.connections + log.connections,
        messages: sum.messages + log.messages,
        applications: sum.applications + log.applications,
        referrals: sum.referrals + log.referrals,
      }),
      { connections: 0, messages: 0, applications: 0, referrals: 0 },
    );
  const recentLearn = state.learnLogs.slice(0, 6);

  const flash = (message: string) => {
    setSavedFlash(message);
    setTimeout(() => setSavedFlash(""), 1800);
  };

  const cycleSkill = (id: string) => {
    const current = state.skills[id] ?? "idle";
    const next = SKILL_STATES[(SKILL_STATES.indexOf(current) + 1) % SKILL_STATES.length];
    setSkill(id, next);
  };

  const saveLearn = () => {
    const parsed = Math.round(Number(minutes));
    logLearn({
      category,
      title: title.trim() || "Small lesson",
      takeaway: takeaway.trim(),
      minutes: Number.isFinite(parsed) ? Math.min(240, Math.max(5, parsed)) : 15,
    });
    setTitle("");
    setTakeaway("");
    flash("LESSON LOGGED");
  };

  const pushNetwork = () => {
    saveNetwork(counts);
    flash("NETWORK PUSH SAVED");
  };

  return (
    <ScreenContainer safeAreaClassName="bg-[#F6F6F3]" containerClassName="bg-[#F6F6F3]">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View>
          <Text style={styles.eyebrow}>{"// LEARNING RUN"}</Text>
          <Text style={styles.title}>Feed the build.</Text>
          <Text style={styles.subtitle}>Small daily lessons, tracked skill gaps, and real network pushes. This is how ₹3.6 LPA becomes ₹6–7 LPA.</Text>
        </View>

        <View style={styles.roadmap}>
          {ROADMAP.map((item, index) => {
            const active = index === (readiness >= 80 ? 1 : 0);
            return (
              <View key={item.phase} style={styles.roadItem}>
                <View style={[styles.roadNumber, { borderColor: active ? COLORS.cyan : COLORS.line }]}>
                  <Text style={[styles.roadNumberText, { color: active ? COLORS.cyan : COLORS.muted }]}>{item.phase}</Text>
                </View>
                <View style={styles.roadCopy}>
                  <View style={styles.roadTitleRow}>
                    <Text style={styles.roadTitle}>{item.title}</Text>
                    <Text style={[styles.roadState, { color: active ? COLORS.cyan : COLORS.muted }]}>{active ? "ACTIVE" : "NEXT"}</Text>
                  </View>
                  <Text style={styles.roadDetail}>{item.detail}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.planCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionLabel}>{"// AI LEARNING PLAN"}</Text>
            <Text style={styles.weekTag}>THIS WEEK</Text>
          </View>
          {learningPlan ? (
            <View style={{ gap: 9 }}>
              <Text style={styles.planSummary}>{learningPlan.summary}</Text>
              {learningPlan.covered.length ? (
                <Text style={styles.coveredLine}>COVERED: {learningPlan.covered.join(" · ")}</Text>
              ) : null}
              <View style={styles.focusRow}>
                {learningPlan.weekFocus.map((focus) => (
                  <View key={focus} style={styles.focusChip}>
                    <Text style={styles.focusChipText}>{focus}</Text>
                  </View>
                ))}
              </View>
              {learningPlan.blocks.map((block) => (
                <View key={`${block.skill}-${block.task}`} style={styles.blockRow}>
                  <View style={styles.blockHead}>
                    <Text style={styles.blockSkill}>{block.skill}</Text>
                    <Text style={styles.blockStatus}>{block.status === "next" ? "NEXT" : "UPCOMING"}</Text>
                  </View>
                  <Text style={styles.blockTask}>{block.task}</Text>
                  {block.links?.length ? (
                    <View style={styles.linkRow}>
                      {block.links.map((link) => (
                        <Pressable key={link.url} onPress={() => Linking.openURL(link.url).catch(() => undefined)} style={styles.linkChip}>
                          <Text style={styles.linkChipText} numberOfLines={1}>{"READ · "}{link.title}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                  <Text style={styles.blockMinutes}>{block.minutes} MIN</Text>
                </View>
              ))}
              <Text style={styles.sectionLabel}>INTERVIEW PREP</Text>
              {learningPlan.interviewPrep.map((item) => (
                <Text key={item} style={styles.prepItem}>{"→ "}{item}</Text>
              ))}
            </View>
          ) : (
            <Text style={styles.planHint}>Generate a weekly plan that matches your current skill gaps and mid-November interview target.</Text>
          )}
          <Pressable
            onPress={() => generateLearningPlan().catch(() => undefined)}
            style={({ pressed }) => [styles.aiButton, pressed && styles.pressed]}
            disabled={busyLearning}
          >
            {busyLearning ? (
              <ActivityIndicator color={COLORS.ink} />
            ) : (
              <Text style={styles.aiButtonText}>{learningPlan ? "REGENERATE WEEKLY PLAN" : "GENERATE WEEKLY PLAN"}</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.segmentRow}>
          {SEGMENTS.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setSegment(item.id)}
              style={[styles.segment, segment === item.id && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, segment === item.id && styles.segmentTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        {segment === "skills" ? (
          <View style={styles.block}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionLabel}>{"// GAP AUDIT"}</Text>
              <Text style={styles.readiness}>{readiness}% READY</Text>
            </View>
            <ProgressBar value={readiness} color={COLORS.cyan} height={7} />
            <Text style={styles.hint}>Tap a skill to cycle: IDLE → LEARNING → READY. {readyCount} ready · {learningCount} in progress.</Text>
            {SKILLS.map((skill) => {
              const skillState = state.skills[skill.id] ?? "idle";
              return (
                <Pressable key={skill.id} onPress={() => cycleSkill(skill.id)} style={({ pressed }) => [styles.skillRow, pressed && styles.pressed]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.skillLabel}>{skill.label}</Text>
                    <Text style={styles.skillHint}>{skill.hint}</Text>
                  </View>
                  <View style={[styles.skillBadge, { borderColor: stateColor(skillState) }]}>
                    <Text style={[styles.skillBadgeText, { color: stateColor(skillState) }]}>{skillState.toUpperCase()}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {segment === "feed" ? (
          <View style={styles.block}>
            <Text style={styles.sectionLabel}>{"// DAILY FEED"}</Text>
            <Text style={styles.hint}>Watch one small coding, finance, or useful video or read one article. Log the takeaway so it sticks.</Text>
            <Chips
              options={LEARN_CATEGORIES.map((item) => ({ id: item.id, label: item.label }))}
              selected={[category]}
              onToggle={(id) => setCategory(id as LearnCategory)}
            />
            <Text style={styles.inputLabel}>WHAT DID YOU CONSUME?</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder="Video or article title" placeholderTextColor={COLORS.muted} style={styles.input} />
            <View style={styles.rowGap}>
              <Text style={styles.inputLabel}>MINUTES</Text>
              <TextInput value={minutes} onChangeText={setMinutes} keyboardType="number-pad" maxLength={3} style={[styles.input, styles.minutesInput]} />
            </View>
            <Text style={styles.inputLabel}>ONE-LINE TAKEAWAY</Text>
            <TextInput value={takeaway} onChangeText={setTakeaway} placeholder="The one idea you will actually use" placeholderTextColor={COLORS.muted} multiline style={[styles.input, styles.noteInput]} />
            <Pressable onPress={saveLearn} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <Text style={styles.primaryButtonText}>{todayLog.bonuses?.learn ? "LOG LESSON · BONUS EARNED ✓" : "LOG LESSON · +5 XP"}</Text>
            </Pressable>
            {recentLearn.length ? (
              <View style={{ gap: 8, marginTop: 4 }}>
                <Text style={styles.sectionLabel}>RECENT LESSONS</Text>
                {recentLearn.map((entry, index) => (
                  <View key={`${entry.date}-${index}`} style={styles.logRow}>
                    <Text style={styles.logCategory}>{entry.category.toUpperCase()}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.logTitle}>{entry.title}</Text>
                      {entry.takeaway ? <Text style={styles.logDetail}>{entry.takeaway}</Text> : null}
                    </View>
                    <Text style={styles.logMinutes}>{entry.minutes}m</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {segment === "network" ? (
          <View style={styles.block}>
            <Text style={styles.sectionLabel}>{"// NETWORK PUSH"}</Text>
            <Text style={styles.hint}>LinkedIn is part of the job switch. Track real touches today; targets are weekly.</Text>
            {NETWORK_FIELDS.map((field) => (
              <View key={field.key} style={{ gap: 6 }}>
                <CounterRow
                  label={field.label}
                  value={counts[field.key]}
                  onChange={(value) => setCounts((current) => ({ ...current, [field.key]: value }))}
                />
                <View style={styles.targetRow}>
                  <ProgressBar value={(weekNetwork[field.key] / field.target) * 100} color={COLORS.cyan} height={4} />
                  <Text style={styles.targetText}>{weekNetwork[field.key]} / {field.target} this week</Text>
                </View>
              </View>
            ))}
            <Pressable onPress={pushNetwork} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <Text style={styles.primaryButtonText}>{todayLog.bonuses?.network ? "SAVE PUSH · BONUS EARNED ✓" : "SAVE NETWORK PUSH · +5 XP"}</Text>
            </Pressable>
          </View>
        ) : null}

        {savedFlash ? <Text style={styles.flash}>{savedFlash}</Text> : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 34, gap: 16 },
  eyebrow: { color: COLORS.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: COLORS.text, fontSize: 25, fontWeight: "900", marginTop: 5 },
  subtitle: { color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 5 },
  roadmap: { backgroundColor: COLORS.panel, borderRadius: 17, borderWidth: 1, borderColor: COLORS.line, padding: 14, gap: 14 },
  roadItem: { flexDirection: "row", gap: 11 },
  roadNumber: { width: 31, height: 31, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  roadNumberText: { fontSize: 11, fontWeight: "900" },
  roadCopy: { flex: 1, gap: 4 },
  roadTitleRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  roadTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  roadState: { fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  roadDetail: { color: COLORS.muted, fontSize: 11, lineHeight: 16 },
  planCard: { backgroundColor: COLORS.panel, borderRadius: 17, borderWidth: 1, borderColor: COLORS.amber, padding: 14, gap: 10 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionLabel: { color: COLORS.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  weekTag: { color: COLORS.amber, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  planSummary: { color: COLORS.text, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  planHint: { color: COLORS.muted, fontSize: 11, lineHeight: 16 },
  focusRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  focusChip: { backgroundColor: COLORS.amberDim, borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5 },
  focusChipText: { color: COLORS.amber, fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  blockRow: { borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 8, gap: 3 },
  blockHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  blockStatus: { color: COLORS.amber, fontSize: 8, fontWeight: "900", letterSpacing: 0.7 },
  coveredLine: { color: COLORS.lime, fontSize: 9, lineHeight: 14, fontWeight: "800", letterSpacing: 0.4 },
  blockSkill: { color: COLORS.cyan, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  blockTask: { color: COLORS.text, fontSize: 12, lineHeight: 17 },
  linkRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 3 },
  linkChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4, maxWidth: "100%" },
  linkChipText: { color: COLORS.cyan, fontSize: 8, fontWeight: "900", letterSpacing: 0.3, flexShrink: 1 },
  blockMinutes: { color: COLORS.muted, fontSize: 9, fontWeight: "800" },
  prepItem: { color: COLORS.muted, fontSize: 11, lineHeight: 17 },
  aiButton: { backgroundColor: COLORS.amber, borderRadius: 11, alignItems: "center", paddingVertical: 11, marginTop: 2 },
  aiButtonText: { color: COLORS.ink, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  segmentRow: { flexDirection: "row", gap: 7 },
  segment: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.panelSoft, alignItems: "center", paddingVertical: 9 },
  segmentActive: { borderColor: COLORS.cyan, backgroundColor: COLORS.cyanDim },
  segmentText: { color: COLORS.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.6 },
  segmentTextActive: { color: COLORS.cyan },
  block: { backgroundColor: COLORS.panel, borderRadius: 17, borderWidth: 1, borderColor: COLORS.line, padding: 14, gap: 10 },
  readiness: { color: COLORS.cyan, fontSize: 11, fontWeight: "900" },
  hint: { color: COLORS.muted, fontSize: 11, lineHeight: 16 },
  skillRow: { flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 10 },
  skillLabel: { color: COLORS.text, fontSize: 13, fontWeight: "800" },
  skillHint: { color: COLORS.muted, fontSize: 10, lineHeight: 14, marginTop: 2 },
  skillBadge: { borderRadius: 9, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 6 },
  skillBadgeText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  inputLabel: { color: COLORS.cyan, fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  input: { color: COLORS.text, backgroundColor: COLORS.panelSoft, borderWidth: 1, borderColor: COLORS.line, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  rowGap: { gap: 5 },
  minutesInput: { width: 90 },
  noteInput: { minHeight: 64, textAlignVertical: "top" },
  primaryButton: { backgroundColor: COLORS.cyan, borderRadius: 11, alignItems: "center", paddingVertical: 12 },
  primaryButtonText: { color: COLORS.ink, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  logRow: { flexDirection: "row", gap: 9, alignItems: "flex-start", borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 8 },
  logCategory: { color: COLORS.amber, fontSize: 8, fontWeight: "900", letterSpacing: 0.7, marginTop: 2 },
  logTitle: { color: COLORS.text, fontSize: 12, fontWeight: "700" },
  logDetail: { color: COLORS.muted, fontSize: 10, lineHeight: 14, marginTop: 2 },
  logMinutes: { color: COLORS.muted, fontSize: 10, fontWeight: "800" },
  targetRow: { gap: 4 },
  targetText: { color: COLORS.muted, fontSize: 9, fontWeight: "800" },
  flash: { color: COLORS.lime, fontSize: 10, fontWeight: "900", letterSpacing: 0.8, textAlign: "center" },
  pressed: { opacity: 0.75 },
});
