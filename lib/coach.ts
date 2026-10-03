import { SKILLS, weekStartKey } from "@/constants/gamify";
import type { PersistedState } from "@/lib/lifegamify-store";

export type PlanTrack = "career" | "english" | "health" | "system";

export type LearnLink = { title: string; url: string };

export type PlanItem = { title: string; question: string; why: string; minutes: number; track: PlanTrack; links?: LearnLink[] };
export type DailyPlan = { focus: string; focusQuestion: string; items: PlanItem[]; source?: "ai" | "fallback"; links?: LearnLink[] };
export type AlignmentStatus = "aligned" | "at-risk" | "off-track";
export type AlignmentReport = { status: AlignmentStatus; score: number; observations: string[]; correction: string; source?: "ai" | "fallback" };
export type DietDay = { day: string; breakfast: string[]; lunch: string[]; dinner: string[]; snacks: string[] };
export type DietPlan = { summary: string; rules: string[]; days: DietDay[] };
export type LearningBlock = { skill: string; task: string; status: "next" | "upcoming"; minutes: number; links?: LearnLink[] };
export type LearningPlan = { summary: string; covered: string[]; weekFocus: string[]; blocks: LearningBlock[]; interviewPrep: string[] };

export type CoachSnapshot = {
  today: string;
  weekStart: string;
  hourOfDay: number;
  weekday: string;
  day: number;
  phase: string;
  xp: number;
  level: number;
  streak: number;
  recoveryDays: number;
  questsToday: Record<string, string>;
  topicsCovered: string[];
  recentActions: { date: string; title: string; done: boolean }[];
  week: {
    activeDays: number;
    fullClearDays: number;
    englishMinutes: number;
    englishSessions: number;
    learnEntries: number;
    learnMinutes: number;
    network: { connections: number; messages: number; applications: number; referrals: number };
    homeFuelDays: number;
    outsideFoodDays: number;
    weighIns: number;
  };
  skills: { id: string; label: string; state: string }[];
  weight: { current: number; goal: number; history: { date: string; value: number }[] };
  recentScores: { date: string; minutes: number; pronunciation: number; grammar: number; vocabulary: number; clarity: number }[];
};

export type AiKind = "daily" | "align" | "diet" | "learning" | "nudge";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function aiKey(kind: AiKind, stamp: string) {
  return `${kind}:${stamp}`;
}

export function getAi<T>(state: PersistedState, key: string): T | null {
  const entry = state.aiCache[key];
  return entry ? (entry.data as T) : null;
}

export function buildCoachSnapshot(state: PersistedState, todayKey: string, day: number, phase: string, recoveryDays: number): CoachSnapshot {
  const weekStart = weekStartKey();
  const now = new Date();
  const weekLogs = Object.entries(state.logs).filter(([key]) => key >= weekStart);
  const todayLog = state.logs[todayKey] ?? { statuses: {} };
  const english = state.feedbackEntries.filter((entry) => entry.date >= weekStart);
  const learn = state.learnLogs.filter((entry) => entry.date >= weekStart);
  const meals = Object.entries(state.mealLogs).filter(([key]) => key >= weekStart);
  const network = Object.entries(state.networkLogs)
    .filter(([key]) => key >= weekStart)
    .reduce(
      (sum, [, log]) => ({
        connections: sum.connections + (log.connections ?? 0),
        messages: sum.messages + (log.messages ?? 0),
        applications: sum.applications + (log.applications ?? 0),
        referrals: sum.referrals + (log.referrals ?? 0),
      }),
      { connections: 0, messages: 0, applications: 0, referrals: 0 },
    );
  const latestWeight = state.weightEntries[state.weightEntries.length - 1]?.value ?? 56;

  const recentActions = Object.entries(state.aiCache)
    .filter(([key]) => key.startsWith("daily:"))
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-3)
    .flatMap(([, entry]) => {
      const plan = entry.data as { items?: { title?: string }[] } | null;
      return (plan?.items ?? []).map((item, index) => ({
        date: entry.stamp,
        title: item.title ?? "",
        done: Boolean(state.planChecks[`${entry.stamp}:${index}`]),
      }));
    })
    .filter((action) => action.title);

  const topicsCovered = [
    ...state.learnLogs.slice(0, 25).map((entry) => (entry.takeaway ? `${entry.title} — ${entry.takeaway}` : entry.title)),
    ...recentActions.filter((action) => action.done).map((action) => action.title),
  ].slice(0, 30);

  return {
    today: todayKey,
    weekStart,
    hourOfDay: now.getHours(),
    weekday: WEEKDAYS[now.getDay()],
    day,
    phase,
    xp: state.xp,
    level: Math.max(1, Math.floor(state.xp / 100) + 1),
    streak: state.streak,
    recoveryDays,
    questsToday: { ...todayLog.statuses },
    topicsCovered,
    recentActions,
    week: {
      activeDays: weekLogs.filter(([, log]) => Object.values(log.statuses).some((status) => status && status !== "pending")).length,
      fullClearDays: weekLogs.filter(([, log]) => log.bonusAwarded).length,
      englishMinutes: english.reduce((sum, entry) => sum + (entry.minutes ?? 0), 0),
      englishSessions: english.length,
      learnEntries: learn.length,
      learnMinutes: learn.reduce((sum, entry) => sum + entry.minutes, 0),
      network,
      homeFuelDays: meals.filter(([, meal]) => !meal.outsideFood && meal.items.length + (meal.custom?.length ?? 0) >= 2).length,
      outsideFoodDays: meals.filter(([, meal]) => meal.outsideFood).length,
      weighIns: state.weightEntries.filter((entry) => entry.date >= weekStart).length,
    },
    skills: SKILLS.map((skill) => ({ id: skill.id, label: skill.label, state: state.skills[skill.id] ?? "idle" })),
    weight: {
      current: latestWeight,
      goal: state.weightGoal,
      history: state.weightEntries.slice(-4).map((entry) => ({ date: entry.date, value: entry.value })),
    },
    recentScores: state.feedbackEntries
      .slice(0, 5)
      .map((entry) => ({
        date: entry.date,
        minutes: entry.minutes ?? 0,
        pronunciation: entry.pronunciation,
        grammar: entry.grammar,
        vocabulary: entry.vocabulary,
        clarity: entry.clarity,
      })),
  };
}
