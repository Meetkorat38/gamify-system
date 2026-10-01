import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ProgressBar } from "@/components/progress-bar";
import { ScreenContainer } from "@/components/screen-container";
import { COLORS, TRACKS } from "@/constants/gamify";
import { useLifeGamify } from "@/lib/lifegamify-store";

const road = [
  { phase: "01", title: "Gap audit", detail: "Map interview-ready, weak, and missing skills across LLM systems, workflow architecture, cloud, and AI system design.", state: "ACTIVE" },
  { phase: "02", title: "Build proof", detail: "Turn learning into diagrams, explanations, small implementations, and sharper case studies from your shipped systems.", state: "NEXT" },
  { phase: "03", title: "Interview battlefield", detail: "From mid-November: applications, networking, mock interviews, feedback loops, and salary conversations.", state: "LOCKED" },
];

export default function TracksScreen() {
  const { state, addWeight, saveFeedback } = useLifeGamify();
  const [weight, setWeight] = useState("");
  const [topic, setTopic] = useState("Explain one shipped AI system");
  const [note, setNote] = useState("");
  const [scores, setScores] = useState({ pronunciation: "7", grammar: "7", vocabulary: "6", clarity: "7" });
  const latestWeight = state.weightEntries[state.weightEntries.length - 1]?.value ?? 56;

  const saveWeight = () => {
    const parsed = Number(weight);
    if (parsed >= 40 && parsed <= 150) { addWeight(parsed); setWeight(""); }
  };
  const saveVoiceFeedback = () => {
    saveFeedback({ topic: topic.trim() || "Voice practice", note: note.trim(), pronunciation: Number(scores.pronunciation) || 0, grammar: Number(scores.grammar) || 0, vocabulary: Number(scores.vocabulary) || 0, clarity: Number(scores.clarity) || 0 });
    setNote("");
  };

  return (
    <ScreenContainer safeAreaClassName="bg-[#070B16]" containerClassName="bg-[#070B16]">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View><Text style={styles.eyebrow}>{"// PROGRESSION TRACKS"}</Text><Text style={styles.title}>Build the stats behind the story.</Text><Text style={styles.subtitle}>English multiplies every track. Health keeps the run sustainable. Career sets the direction.</Text></View>

        <View style={styles.trackHeader}><View style={[styles.trackMark, { backgroundColor: TRACKS.career.dim }]}><Text style={[styles.trackMarkText, { color: TRACKS.career.color }]}>⚡</Text></View><View style={{ flex: 1 }}><Text style={styles.trackLabel}>CAREER {"//"} AI ENGINEER UPGRADE</Text><Text style={styles.trackTitle}>Learning → interview-ready → offer</Text></View><Text style={[styles.trackMetric, { color: TRACKS.career.color }]}>₹7L</Text></View>
        <View style={styles.roadmap}>{road.map((item, index) => <View key={item.phase} style={styles.roadItem}><View style={[styles.roadNumber, { borderColor: index === 0 ? COLORS.cyan : COLORS.line }]}><Text style={[styles.roadNumberText, { color: index === 0 ? COLORS.cyan : COLORS.muted }]}>{item.phase}</Text></View><View style={styles.roadCopy}><View style={styles.roadTitleRow}><Text style={styles.roadTitle}>{item.title}</Text><Text style={[styles.roadState, { color: item.state === "ACTIVE" ? COLORS.cyan : item.state === "NEXT" ? COLORS.amber : COLORS.muted }]}>{item.state}</Text></View><Text style={styles.roadDetail}>{item.detail}</Text></View></View>)}</View>

        <View style={styles.trackHeader}><View style={[styles.trackMark, { backgroundColor: TRACKS.english.dim }]}><Text style={[styles.trackMarkText, { color: TRACKS.english.color }]}>◈</Text></View><View style={{ flex: 1 }}><Text style={styles.trackLabel}>ENGLISH {"//"} COMMUNICATION</Text><Text style={styles.trackTitle}>20–25 min voice room every day</Text></View><Text style={[styles.trackMetric, { color: TRACKS.english.color }]}>{state.feedbackEntries.length}</Text></View>
        <View style={styles.formCard}><Text style={styles.formHint}>Speak without interruption. Log the end-of-session score here.</Text><Text style={styles.inputLabel}>TOPIC</Text><TextInput value={topic} onChangeText={setTopic} placeholder="What did you discuss?" placeholderTextColor={COLORS.muted} style={styles.input} /><View style={styles.scoreGrid}>{(["pronunciation", "grammar", "vocabulary", "clarity"] as const).map((key) => <View key={key} style={styles.scoreBox}><Text style={styles.scoreLabel}>{key.toUpperCase()}</Text><TextInput value={scores[key]} onChangeText={(value) => setScores((current) => ({ ...current, [key]: value }))} keyboardType="number-pad" maxLength={2} style={styles.scoreInput} /></View>)}</View><TextInput value={note} onChangeText={setNote} placeholder="Important corrections, repeated errors, better sentences…" placeholderTextColor={COLORS.muted} multiline style={[styles.input, styles.noteInput]} /><Pressable onPress={saveVoiceFeedback} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>SAVE VOICE FEEDBACK</Text></Pressable></View>

        <View style={styles.trackHeader}><View style={[styles.trackMark, { backgroundColor: TRACKS.health.dim }]}><Text style={[styles.trackMarkText, { color: TRACKS.health.color }]}>＋</Text></View><View style={{ flex: 1 }}><Text style={styles.trackLabel}>HEALTH {"//"} VITALITY</Text><Text style={styles.trackTitle}>56 kg → 59–60 kg target</Text></View><Text style={[styles.trackMetric, { color: TRACKS.health.color }]}>{latestWeight.toFixed(1)}</Text></View>
        <View style={styles.healthCard}><View style={styles.healthStats}><View><Text style={styles.healthLabel}>LATEST WEIGH-IN</Text><Text style={styles.healthValue}>{latestWeight.toFixed(1)} <Text style={styles.healthUnit}>KG</Text></Text></View><View><Text style={styles.healthLabel}>TARGET</Text><Text style={[styles.healthValue, { color: COLORS.lime }]}>59–60 <Text style={styles.healthUnit}>KG</Text></Text></View></View><ProgressBar value={Math.max(0, Math.min(100, ((latestWeight - 56) / 4) * 100))} color={COLORS.lime} height={8} /><Text style={styles.healthCopy}>Vegetarian + eggs · home food default · bananas with a protein/calorie partner · weekly weigh-in.</Text><View style={styles.weightRow}><TextInput value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="kg" placeholderTextColor={COLORS.muted} style={[styles.input, { flex: 1 }]} /><Pressable onPress={saveWeight} style={styles.smallButton}><Text style={styles.smallButtonText}>LOG WEIGHT</Text></Pressable></View></View>

        <View style={styles.disclaimer}><Text style={styles.disclaimerText}>Health quests support habits, not medical advice. If low weight is unintentional or comes with fatigue, appetite, or digestive problems, speak with a qualified professional.</Text></View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 34, gap: 16 },
  eyebrow: { color: COLORS.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: COLORS.text, fontSize: 25, fontWeight: "900", marginTop: 5 },
  subtitle: { color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 5 },
  trackHeader: { flexDirection: "row", alignItems: "center", gap: 11, marginTop: 7 },
  trackMark: { width: 37, height: 37, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  trackMarkText: { fontSize: 20, fontWeight: "900" },
  trackLabel: { color: COLORS.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  trackTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800", marginTop: 3 },
  trackMetric: { fontSize: 17, fontWeight: "900" },
  roadmap: { backgroundColor: COLORS.panel, borderRadius: 17, borderWidth: 1, borderColor: COLORS.line, padding: 14, gap: 14 },
  roadItem: { flexDirection: "row", gap: 11 },
  roadNumber: { width: 31, height: 31, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  roadNumberText: { fontSize: 11, fontWeight: "900" },
  roadCopy: { flex: 1, gap: 4 },
  roadTitleRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  roadTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  roadState: { fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  roadDetail: { color: COLORS.muted, fontSize: 11, lineHeight: 16 },
  formCard: { backgroundColor: COLORS.panel, borderRadius: 17, borderWidth: 1, borderColor: COLORS.violet, padding: 14, gap: 10 },
  formHint: { color: COLORS.muted, fontSize: 11, lineHeight: 16 },
  inputLabel: { color: COLORS.violet, fontSize: 9, fontWeight: "900", letterSpacing: 1.1, marginTop: 3 },
  input: { color: COLORS.text, backgroundColor: COLORS.panelSoft, borderWidth: 1, borderColor: COLORS.line, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  scoreGrid: { flexDirection: "row", gap: 7 },
  scoreBox: { flex: 1, alignItems: "center", backgroundColor: COLORS.violetDim, borderRadius: 10, paddingVertical: 7 },
  scoreLabel: { color: COLORS.violet, fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  scoreInput: { color: COLORS.text, fontSize: 18, fontWeight: "900", textAlign: "center", padding: 0, marginTop: 2 },
  noteInput: { minHeight: 70, textAlignVertical: "top" },
  primaryButton: { backgroundColor: COLORS.violet, borderRadius: 11, alignItems: "center", paddingVertical: 12 },
  primaryButtonText: { color: COLORS.ink, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  healthCard: { backgroundColor: COLORS.panel, borderRadius: 17, borderWidth: 1, borderColor: COLORS.lime, padding: 14, gap: 11 },
  healthStats: { flexDirection: "row", justifyContent: "space-between" },
  healthLabel: { color: COLORS.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  healthValue: { color: COLORS.text, fontSize: 25, fontWeight: "900", marginTop: 3 },
  healthUnit: { color: COLORS.lime, fontSize: 10, letterSpacing: 1 },
  healthCopy: { color: COLORS.muted, fontSize: 11, lineHeight: 16 },
  weightRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  smallButton: { backgroundColor: COLORS.lime, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 12 },
  smallButtonText: { color: COLORS.ink, fontSize: 10, fontWeight: "900", letterSpacing: 0.7 },
  disclaimer: { borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 12 },
  disclaimerText: { color: COLORS.muted, fontSize: 10, lineHeight: 15 },
  pressed: { opacity: 0.76 },
});
