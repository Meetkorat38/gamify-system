import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Chips } from "@/components/chips";
import { ProgressBar } from "@/components/progress-bar";
import { ScoreStepper } from "@/components/score-stepper";
import { ScreenContainer } from "@/components/screen-container";
import { BASE_WEIGHT, COLORS, formatClock, MEAL_ITEMS, TRACKS } from "@/constants/gamify";
import { useLifeGamify } from "@/lib/lifegamify-store";
import { useCoach } from "@/lib/use-coach";

const STOP_SECONDS = 25 * 60;
const SCORE_KEYS = ["pronunciation", "grammar", "vocabulary", "clarity"] as const;

export default function TracksScreen() {
  const { state, todayKey, todayLog, addWeight, setWeightGoal, saveFeedback, saveMeals, homeStreak } = useLifeGamify();
  const { dietPlan, generateDietPlan, busyDiet } = useCoach();
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState(String(state.weightGoal));
  const [topic, setTopic] = useState("Explain one shipped AI system");
  const [note, setNote] = useState("");
  const [scores, setScores] = useState({ pronunciation: 7, grammar: 7, vocabulary: 6, clarity: 7 });
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [scoring, setScoring] = useState(false);
  const secondsRef = useRef(0);
  const [minutes, setMinutes] = useState("20");
  const [meals, setMeals] = useState<string[]>(() => state.mealLogs[todayKey]?.items ?? []);
  const [outside, setOutside] = useState(() => state.mealLogs[todayKey]?.outsideFood ?? false);
  const [flashMessage, setFlashMessage] = useState("");

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      secondsRef.current = Math.min(secondsRef.current + 1, STOP_SECONDS);
      setSeconds(secondsRef.current);
      if (secondsRef.current >= STOP_SECONDS) {
        setRunning(false);
        setMinutes("25");
        setScoring(true);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const latestWeight = state.weightEntries[state.weightEntries.length - 1]?.value ?? BASE_WEIGHT;
  const goalGain = Math.max(1, state.weightGoal - BASE_WEIGHT);
  const weightProgress = Math.min(100, Math.max(0, ((latestWeight - BASE_WEIGHT) / goalGain) * 100));
  const recentSessions = state.feedbackEntries.slice(0, 4);
  const recentFive = state.feedbackEntries.slice(0, 5);
  const average = (key: (typeof SCORE_KEYS)[number]) =>
    recentFive.length ? Math.round((recentFive.reduce((sum, entry) => sum + entry[key], 0) / recentFive.length) * 10) / 10 : 0;

  const showFlash = (message: string) => {
    setFlashMessage(message);
    setTimeout(() => setFlashMessage(""), 1800);
  };

  const finishSession = () => {
    setRunning(false);
    setMinutes(seconds ? String(Math.max(1, Math.round(seconds / 60))) : "20");
    setScoring(true);
  };

  const saveSession = () => {
    const parsed = Math.round(Number(minutes));
    saveFeedback({
      topic: topic.trim() || "Voice practice",
      note: note.trim(),
      minutes: Number.isFinite(parsed) ? Math.min(60, Math.max(1, parsed)) : 20,
      pronunciation: scores.pronunciation,
      grammar: scores.grammar,
      vocabulary: scores.vocabulary,
      clarity: scores.clarity,
    });
    setNote("");
    setScoring(false);
    setSeconds(0);
    secondsRef.current = 0;
    showFlash("SESSION SAVED");
  };

  const saveWeight = () => {
    const parsed = Number(weight);
    if (parsed >= 40 && parsed <= 150) {
      addWeight(parsed);
      setWeight("");
      showFlash("WEIGH-IN LOGGED");
    } else {
      showFlash("ENTER 40–150 KG");
    }
  };

  const saveGoal = () => {
    const parsed = Number(goal);
    if (parsed >= 40 && parsed <= 150) {
      setWeightGoal(parsed);
      showFlash("GOAL UPDATED");
    }
  };

  const toggleMeal = (id: string) => {
    setMeals((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const saveFuel = () => {
    saveMeals({ items: meals, outsideFood: outside });
    showFlash(outside ? "LOGGED · OUTSIDE FOOD FLAGGED" : "FUEL SAVED");
  };

  return (
    <ScreenContainer safeAreaClassName="bg-[#070B16]" containerClassName="bg-[#070B16]">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View>
          <Text style={styles.eyebrow}>{"// VOICE ROOM + VITALITY"}</Text>
          <Text style={styles.title}>Train the two multipliers.</Text>
          <Text style={styles.subtitle}>English multiplies every interview. Food and weight keep the run sustainable. Speak first, score at the end.</Text>
        </View>

        <View style={styles.trackHeader}>
          <View style={[styles.trackMark, { backgroundColor: TRACKS.english.dim }]}><Text style={[styles.trackMarkText, { color: TRACKS.english.color }]}>◈</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.trackLabel}>ENGLISH {"//"} VOICE ROOM</Text>
            <Text style={styles.trackTitle}>20–25 min speaking, hard stop at 25</Text>
          </View>
          <Text style={[styles.trackMetric, { color: TRACKS.english.color }]}>{state.feedbackEntries.length}</Text>
        </View>

        <View style={styles.timerCard}>
          <Text style={styles.clock}>{formatClock(seconds)}</Text>
          <Text style={styles.timerHint}>Speak without interruption in ChatGPT Voice. Corrections and scores come after.</Text>
          <View style={styles.timerRow}>
            <Pressable onPress={() => setRunning((current) => !current)} style={({ pressed }) => [styles.timerButton, pressed && styles.pressed]}>
              <Text style={styles.timerButtonText}>{running ? "PAUSE" : seconds ? "RESUME" : "START"}</Text>
            </Pressable>
            <Pressable onPress={finishSession} style={({ pressed }) => [styles.timerButton, styles.timerButtonAlt, pressed && styles.pressed]}>
              <Text style={styles.timerButtonAltText}>FINISH {"&"} SCORE</Text>
            </Pressable>
          </View>
          {running && seconds >= 20 * 60 && seconds < STOP_SECONDS ? <Text style={styles.band}>TARGET BAND REACHED · WRAP UP SOON</Text> : null}
        </View>

        {scoring ? (
          <View style={styles.scoreCard}>
            <Text style={styles.sectionLabel}>{"// END-OF-SESSION SCORECARD"}</Text>
            <Text style={styles.inputLabel}>TOPIC</Text>
            <TextInput value={topic} onChangeText={setTopic} placeholder="What did you discuss?" placeholderTextColor={COLORS.muted} style={styles.input} />
            <Text style={styles.inputLabel}>MINUTES SPOKEN</Text>
            <TextInput value={minutes} onChangeText={setMinutes} keyboardType="number-pad" maxLength={2} style={[styles.input, styles.smallInput]} />
            <View style={styles.scoreGrid}>
              {SCORE_KEYS.map((key) => (
                <ScoreStepper key={key} label={key.toUpperCase()} value={scores[key]} onChange={(value) => setScores((current) => ({ ...current, [key]: value }))} />
              ))}
            </View>
            <Text style={styles.inputLabel}>ONLY THE IMPORTANT CORRECTIONS</Text>
            <TextInput value={note} onChangeText={setNote} placeholder="Repeated errors, better sentences, pronunciation fixes…" placeholderTextColor={COLORS.muted} multiline style={[styles.input, styles.noteInput]} />
            <Pressable onPress={saveSession} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <Text style={styles.primaryButtonText}>{todayLog.bonuses?.english ? "SAVE SESSION · BONUS EARNED ✓" : "SAVE SESSION · +10 XP"}</Text>
            </Pressable>
          </View>
        ) : null}

        {recentFive.length ? (
          <View style={styles.trendCard}>
            <Text style={styles.sectionLabel}>{"// SCORE TREND · LAST 5"}</Text>
            <View style={styles.trendRow}>
              {SCORE_KEYS.map((key) => (
                <View key={key} style={styles.trendBox}>
                  <Text style={[styles.trendValue, { color: average(key) >= 7 ? COLORS.lime : COLORS.violet }]}>{average(key) || "–"}</Text>
                  <Text style={styles.trendLabel}>{key.slice(0, 4).toUpperCase()}</Text>
                </View>
              ))}
            </View>
            {recentSessions.map((entry) => (
              <View key={`${entry.date}-${entry.topic}`} style={styles.sessionRow}>
                <Text style={styles.sessionDate}>{entry.date.slice(5)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionTopic}>{entry.topic}</Text>
                  {entry.note ? <Text style={styles.sessionNote}>{entry.note}</Text> : null}
                </View>
                <Text style={styles.sessionMinutes}>{entry.minutes ?? 0}m</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.trackHeader}>
          <View style={[styles.trackMark, { backgroundColor: TRACKS.health.dim }]}><Text style={[styles.trackMarkText, { color: TRACKS.health.color }]}>＋</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.trackLabel}>HEALTH {"//"} FUEL + WEIGHT</Text>
            <Text style={styles.trackTitle}>{BASE_WEIGHT} kg → {state.weightGoal} kg target</Text>
          </View>
          <Text style={[styles.trackMetric, { color: COLORS.lime }]}>{latestWeight.toFixed(1)}</Text>
        </View>

        <View style={styles.healthCard}>
          <View style={styles.healthStats}>
            <View><Text style={styles.healthLabel}>LATEST WEIGH-IN</Text><Text style={styles.healthValue}>{latestWeight.toFixed(1)} <Text style={styles.healthUnit}>KG</Text></Text></View>
            <View><Text style={styles.healthLabel}>TARGET</Text><Text style={[styles.healthValue, { color: COLORS.lime }]}>{state.weightGoal} <Text style={styles.healthUnit}>KG</Text></Text></View>
          </View>
          <ProgressBar value={weightProgress} color={COLORS.lime} height={8} />
          <Text style={styles.hint}>Vegetarian + eggs · home food only · bananas and tomatoes welcome · weigh in weekly.</Text>
          <View style={styles.row}>
            <TextInput value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="weight in kg" placeholderTextColor={COLORS.muted} style={[styles.input, { flex: 1 }]} />
            <Pressable onPress={saveWeight} style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}><Text style={styles.smallButtonText}>LOG WEIGHT</Text></Pressable>
          </View>
          <View style={styles.row}>
            <TextInput value={goal} onChangeText={setGoal} keyboardType="decimal-pad" placeholder="goal kg" placeholderTextColor={COLORS.muted} style={[styles.input, { flex: 1 }]} />
            <Pressable onPress={saveGoal} style={({ pressed }) => [styles.smallButton, styles.goalButton, pressed && styles.pressed]}><Text style={styles.smallButtonText}>SET GOAL</Text></Pressable>
          </View>
          <Text style={styles.sectionLabel}>{"// TODAY’S FUEL"}</Text>
          <Chips options={MEAL_ITEMS} selected={meals} onToggle={toggleMeal} color={COLORS.lime} dim={COLORS.limeDim} />
          <Pressable onPress={() => setOutside((current) => !current)} style={[styles.outsideChip, outside && styles.outsideChipOn]}>
            <Text style={[styles.outsideText, outside && styles.outsideTextOn]}>{outside ? "OUTSIDE FOOD LOGGED TODAY" : "TAP IF YOU ATE OUTSIDE FOOD"}</Text>
          </Pressable>
          <Pressable onPress={saveFuel} style={({ pressed }) => [styles.primaryButton, styles.fuelButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>{todayLog.bonuses?.meals ? "SAVE FUEL · BONUS EARNED ✓" : "SAVE FUEL · +5 XP FOR 2+ HOME ITEMS"}</Text>
          </Pressable>
          <Text style={styles.hint}>Home-food streak: {homeStreak} day{homeStreak === 1 ? "" : "s"}.</Text>
        </View>

        <View style={styles.dietCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionLabel}>{"// AI DIET PLAN"}</Text>
            <Text style={styles.weekTag}>THIS WEEK</Text>
          </View>
          {dietPlan ? (
            <View style={{ gap: 8 }}>
              <Text style={styles.planSummary}>{dietPlan.summary}</Text>
              {dietPlan.rules.map((rule) => (<Text key={rule} style={styles.prepItem}>{"→ "}{rule}</Text>))}
              {dietPlan.days.map((day) => (
                <View key={day.day} style={styles.dietRow}>
                  <Text style={styles.dietDay}>{day.day}</Text>
                  <Text style={styles.dietMeals}>{[...day.breakfast, ...day.lunch, ...day.dinner, ...day.snacks].join(" · ")}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.hint}>Generate a vegetarian-plus-egg weekly plan for healthy gain toward {state.weightGoal} kg, using home food only.</Text>
          )}
          <Pressable onPress={() => generateDietPlan().catch(() => undefined)} style={({ pressed }) => [styles.primaryButton, styles.dietButton, pressed && styles.pressed]} disabled={busyDiet}>
            {busyDiet ? <ActivityIndicator color={COLORS.ink} /> : <Text style={styles.primaryButtonText}>{dietPlan ? "REGENERATE DIET PLAN" : "GENERATE DIET PLAN"}</Text>}
          </Pressable>
        </View>

        <View style={styles.disclaimer}><Text style={styles.disclaimerText}>Health quests support habits, not medical advice. If low weight is unintentional or comes with fatigue, appetite, or digestive problems, speak with a qualified professional.</Text></View>
        {flashMessage ? <Text style={styles.flash}>{flashMessage}</Text> : null}
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
  timerCard: { backgroundColor: COLORS.panel, borderRadius: 17, borderWidth: 1, borderColor: COLORS.violet, padding: 16, gap: 10, alignItems: "center" },
  clock: { color: COLORS.text, fontSize: 44, fontWeight: "900", letterSpacing: 2, fontVariant: ["tabular-nums"] },
  timerHint: { color: COLORS.muted, fontSize: 11, lineHeight: 16, textAlign: "center" },
  timerRow: { flexDirection: "row", gap: 8, alignSelf: "stretch" },
  timerButton: { flex: 1, backgroundColor: COLORS.violet, borderRadius: 11, alignItems: "center", paddingVertical: 12 },
  timerButtonText: { color: COLORS.ink, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  timerButtonAlt: { backgroundColor: COLORS.panelSoft, borderWidth: 1, borderColor: COLORS.violet },
  timerButtonAltText: { color: COLORS.violet, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  band: { color: COLORS.amber, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  scoreCard: { backgroundColor: COLORS.panel, borderRadius: 17, borderWidth: 1, borderColor: COLORS.violet, padding: 14, gap: 9 },
  sectionLabel: { color: COLORS.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  inputLabel: { color: COLORS.violet, fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  input: { color: COLORS.text, backgroundColor: COLORS.panelSoft, borderWidth: 1, borderColor: COLORS.line, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  smallInput: { width: 90 },
  noteInput: { minHeight: 64, textAlignVertical: "top" },
  scoreGrid: { gap: 8 },
  primaryButton: { backgroundColor: COLORS.violet, borderRadius: 11, alignItems: "center", paddingVertical: 12 },
  primaryButtonText: { color: COLORS.ink, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  trendCard: { backgroundColor: COLORS.panel, borderRadius: 17, borderWidth: 1, borderColor: COLORS.line, padding: 14, gap: 9 },
  trendRow: { flexDirection: "row", gap: 7 },
  trendBox: { flex: 1, alignItems: "center", backgroundColor: COLORS.panelSoft, borderRadius: 10, paddingVertical: 8, gap: 2 },
  trendValue: { fontSize: 17, fontWeight: "900" },
  trendLabel: { color: COLORS.muted, fontSize: 8, fontWeight: "900", letterSpacing: 0.6 },
  sessionRow: { flexDirection: "row", gap: 9, alignItems: "flex-start", borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 8 },
  sessionDate: { color: COLORS.muted, fontSize: 9, fontWeight: "900", marginTop: 2 },
  sessionTopic: { color: COLORS.text, fontSize: 12, fontWeight: "700" },
  sessionNote: { color: COLORS.muted, fontSize: 10, lineHeight: 14, marginTop: 2 },
  sessionMinutes: { color: COLORS.muted, fontSize: 10, fontWeight: "800" },
  healthCard: { backgroundColor: COLORS.panel, borderRadius: 17, borderWidth: 1, borderColor: COLORS.lime, padding: 14, gap: 11 },
  healthStats: { flexDirection: "row", justifyContent: "space-between" },
  healthLabel: { color: COLORS.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  healthValue: { color: COLORS.text, fontSize: 25, fontWeight: "900", marginTop: 3 },
  healthUnit: { color: COLORS.lime, fontSize: 10, letterSpacing: 1 },
  hint: { color: COLORS.muted, fontSize: 11, lineHeight: 16 },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  smallButton: { backgroundColor: COLORS.lime, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 12 },
  goalButton: { backgroundColor: COLORS.cyan },
  smallButtonText: { color: COLORS.ink, fontSize: 10, fontWeight: "900", letterSpacing: 0.7 },
  outsideChip: { borderRadius: 10, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.panelSoft, alignItems: "center", paddingVertical: 9 },
  outsideChipOn: { borderColor: COLORS.red, backgroundColor: COLORS.redDim },
  outsideText: { color: COLORS.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  outsideTextOn: { color: COLORS.red },
  fuelButton: { backgroundColor: COLORS.lime },
  dietCard: { backgroundColor: COLORS.panel, borderRadius: 17, borderWidth: 1, borderColor: COLORS.amber, padding: 14, gap: 10 },
  weekTag: { color: COLORS.amber, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  planSummary: { color: COLORS.text, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  prepItem: { color: COLORS.muted, fontSize: 11, lineHeight: 17 },
  dietRow: { flexDirection: "row", gap: 9, borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 8 },
  dietDay: { color: COLORS.amber, fontSize: 10, fontWeight: "900", width: 34 },
  dietMeals: { flex: 1, color: COLORS.muted, fontSize: 10, lineHeight: 15 },
  dietButton: { backgroundColor: COLORS.amber },
  disclaimer: { borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 12 },
  disclaimerText: { color: COLORS.muted, fontSize: 10, lineHeight: 15 },
  flash: { color: COLORS.lime, fontSize: 10, fontWeight: "900", letterSpacing: 0.8, textAlign: "center" },
  pressed: { opacity: 0.76 },
});
