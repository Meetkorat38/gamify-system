import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  BONUS_XP,
  campaignDay,
  campaignPhase,
  dateKey,
  levelForXp,
  phaseDescription,
  REWARDS,
  weekStartKey,
  yesterdayKey,
  type LearnCategory,
  type SkillState,
  type TrackKey,
} from "@/constants/gamify";
import { parseFoodEntry, type ParsedFood } from "@/constants/food";

export type QuestStatus = "pending" | "full" | "partial" | "minimum" | "skipped";

export type QuestDefinition = {
  id: string;
  track: TrackKey;
  title: string;
  subtitle: string;
  full: string;
  partial: string;
  minimum: string;
  points: number;
  icon: string;
};

export type DailyBonusFlags = {
  english?: boolean;
  learn?: boolean;
  network?: boolean;
  meals?: boolean;
};

export type DailyLog = {
  statuses: Record<string, QuestStatus>;
  energy?: number;
  tomorrow?: string;
  bonusAwarded?: boolean;
  checkInAwarded?: boolean;
  bonuses?: DailyBonusFlags;
};

export type WeightEntry = { date: string; value: number };

export type EnglishFeedback = {
  date: string;
  topic: string;
  pronunciation: number;
  grammar: number;
  vocabulary: number;
  clarity: number;
  note: string;
  minutes?: number;
};

export type LearnLog = {
  date: string;
  category: LearnCategory;
  title: string;
  takeaway: string;
  minutes: number;
};

export type NetworkLog = {
  connections: number;
  messages: number;
  applications: number;
  referrals: number;
};

export type MealLog = { items: string[]; outsideFood: boolean; custom?: ParsedFood[] };

export type PersistedState = {
  xp: number;
  streak: number;
  lastActiveDate: string | null;
  logs: Record<string, DailyLog>;
  weightEntries: WeightEntry[];
  feedbackEntries: EnglishFeedback[];
  claimedRewards: string[];
  learnLogs: LearnLog[];
  networkLogs: Record<string, NetworkLog>;
  mealLogs: Record<string, MealLog>;
  skills: Record<string, SkillState>;
  aiCache: Record<string, { stamp: string; data: unknown }>;
  planChecks: Record<string, boolean>;
  weightGoal: number;
};

export const QUESTS: QuestDefinition[] = [
  {
    id: "career",
    track: "career",
    title: "Close one skill gap",
    subtitle: "Learn, build, or explain one interview-relevant AI system concept.",
    full: "60–90 min focused learning or implementation with a written explanation.",
    partial: "30 min learning plus 3 bullet notes or one small code change.",
    minimum: "Read one useful article or revise one interview answer.",
    points: 20,
    icon: "⚡",
  },
  {
    id: "english",
    track: "english",
    title: "Voice room: 20 minutes",
    subtitle: "Speak freely first. Get corrections and scores at the end.",
    full: "20–25 min ChatGPT voice conversation + review the feedback.",
    partial: "10–15 min conversation on a technical or interview topic.",
    minimum: "Speak for 5 minutes and name one sentence to improve.",
    points: 15,
    icon: "◈",
  },
  {
    id: "health",
    track: "health",
    title: "Fuel + move",
    subtitle: "One nutritious add-on and one simple movement choice.",
    full: "Planned protein/calorie add-on, mostly home food, and 20–30 min movement.",
    partial: "One planned nutritious add-on or a 15 min walk.",
    minimum: "Eat one planned item: banana + milk/curd/eggs/paneer/nuts, or walk 5 min.",
    points: 20,
    icon: "＋",
  },
];

const STORAGE_KEY = "life-gamify-mvp-v1";

function pointsForStatus(questId: string, status: QuestStatus) {
  const quest = QUESTS.find((item) => item.id === questId);
  if (!quest || status === "pending" || status === "skipped") return 0;
  if (status === "full") return quest.points;
  if (status === "partial") return Math.round(quest.points / 2);
  return 5;
}

const blankState = (): PersistedState => ({
  xp: 0,
  streak: 0,
  lastActiveDate: null,
  logs: {},
  weightEntries: [],
  feedbackEntries: [],
  claimedRewards: [],
  learnLogs: [],
  networkLogs: {},
  mealLogs: {},
  skills: {},
  aiCache: {},
  planChecks: {},
  weightGoal: 60,
});

function blankLog(): DailyLog {
  return { statuses: {} };
}

function activeStatuses(statuses: Record<string, QuestStatus>) {
  return Object.values(statuses).some((status) => status !== "pending");
}

function completeStatuses(statuses: Record<string, QuestStatus>) {
  return QUESTS.every((quest) => {
    const status = statuses[quest.id];
    return status && status !== "pending" && status !== "skipped";
  });
}

function isAtRisk(state: PersistedState, key: string) {
  const previous = new Date(`${key}T00:00:00`);
  const campaignStart = new Date("2026-10-01T00:00:00");
  let missed = 0;
  for (let index = 1; index <= 3; index += 1) {
    const day = new Date(previous);
    day.setDate(day.getDate() - index);
    if (day < campaignStart) continue;
    const log = state.logs[dateKey(day)];
    if (!log || !activeStatuses(log.statuses)) missed += 1;
  }
  return missed;
}

export function logXp(log: DailyLog) {
  const questXp = QUESTS.reduce((sum, quest) => sum + pointsForStatus(quest.id, log.statuses[quest.id] ?? "pending"), 0);
  const bonuses = log.bonuses ?? {};
  return (
    questXp +
    (log.bonusAwarded ? BONUS_XP.dailyClear : 0) +
    (log.checkInAwarded ? BONUS_XP.checkIn : 0) +
    (bonuses.english ? BONUS_XP.english : 0) +
    (bonuses.learn ? BONUS_XP.learn : 0) +
    (bonuses.network ? BONUS_XP.network : 0) +
    (bonuses.meals ? BONUS_XP.meals : 0)
  );
}

export function weekXp(state: PersistedState, weekStart = weekStartKey()) {
  return Object.entries(state.logs).reduce((sum, [key, log]) => (key >= weekStart ? sum + logXp(log) : sum), 0);
}

export function homeFoodStreak(state: PersistedState) {
  let streak = 0;
  const cursor = new Date();
  const isHomeDay = (key: string) => {
    const meal = state.mealLogs?.[key];
    return Boolean(meal && !meal.outsideFood && ((meal.items?.length ?? 0) + (meal.custom?.length ?? 0)) > 0);
  };
  if (!isHomeDay(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (isHomeDay(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

type StoreValue = {
  state: PersistedState;
  todayKey: string;
  todayLog: DailyLog;
  dayNumber: number;
  phase: string;
  phaseCopy: string;
  level: number;
  loading: boolean;
  recoveryDays: number;
  homeStreak: number;
  completeQuest: (questId: string, status: Exclude<QuestStatus, "pending">) => void;
  saveCheckIn: (energy: number, tomorrow: string) => void;
  addWeight: (value: number) => void;
  setWeightGoal: (goal: number) => void;
  saveFeedback: (feedback: Omit<EnglishFeedback, "date">) => void;
  logLearn: (entry: Omit<LearnLog, "date">) => void;
  saveNetwork: (counts: NetworkLog) => void;
  saveMeals: (meal: MealLog) => void;
  logCustomFood: (text: string) => void;
  setSkill: (skillId: string, next: SkillState) => void;
  saveAi: (key: string, data: unknown) => void;
  togglePlanItem: (key: string) => void;
  claimReward: (rewardId: string) => void;
  resetDemo: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

export function LifeGamifyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(blankState);
  const [loading, setLoading] = useState(true);
  const todayKey = dateKey();

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          try {
            setState({ ...blankState(), ...JSON.parse(stored) });
          } catch {
            setState(blankState());
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
    }
  }, [loading, state]);

  const value = useMemo<StoreValue>(() => {
    const todayLog = state.logs[todayKey] ?? blankLog();
    const dayNumber = campaignDay();

    const withDailyBonus = (flag: keyof DailyBonusFlags, xp: number) => {
      setState((current) => {
        const previous = current.logs[todayKey] ?? blankLog();
        const bonuses = previous.bonuses ?? {};
        if (bonuses[flag]) return current;
        return {
          ...current,
          xp: current.xp + xp,
          logs: {
            ...current.logs,
            [todayKey]: { ...previous, bonuses: { ...bonuses, [flag]: true } },
          },
        };
      });
    };

    return {
      state,
      todayKey,
      todayLog,
      dayNumber,
      phase: campaignPhase(dayNumber),
      phaseCopy: phaseDescription(dayNumber),
      level: levelForXp(state.xp),
      loading,
      recoveryDays: isAtRisk(state, todayKey),
      homeStreak: homeFoodStreak(state),
      completeQuest: (questId, status) => {
        setState((current) => {
          const previous = current.logs[todayKey] ?? blankLog();
          const previousStatus = previous.statuses[questId] ?? "pending";
          const nextStatuses = { ...previous.statuses, [questId]: status };
          const wasComplete = completeStatuses(previous.statuses);
          const nowComplete = completeStatuses(nextStatuses);
          const delta = pointsForStatus(questId, status) - pointsForStatus(questId, previousStatus);
          let nextXp = Math.max(0, current.xp + delta);
          let bonusAwarded = previous.bonusAwarded ?? false;

          if (nowComplete && !wasComplete) {
            nextXp += BONUS_XP.dailyClear;
            bonusAwarded = true;
          } else if (!nowComplete && wasComplete && bonusAwarded) {
            nextXp = Math.max(0, nextXp - BONUS_XP.dailyClear);
            bonusAwarded = false;
          }

          const nextLog = { ...previous, statuses: nextStatuses, bonusAwarded };
          const wasActive = activeStatuses(previous.statuses);
          const nowActive = activeStatuses(nextStatuses);
          let nextStreak = current.streak;
          let lastActiveDate = current.lastActiveDate;
          if (!wasActive && nowActive) {
            nextStreak = current.lastActiveDate === yesterdayKey() ? current.streak + 1 : 1;
            lastActiveDate = todayKey;
          }

          return {
            ...current,
            xp: nextXp,
            streak: nextStreak,
            lastActiveDate,
            logs: { ...current.logs, [todayKey]: nextLog },
          };
        });
      },
      saveCheckIn: (energy, tomorrow) => {
        setState((current) => {
          const previous = current.logs[todayKey] ?? blankLog();
          const checkInAwarded = previous.checkInAwarded ?? false;
          return {
            ...current,
            xp: current.xp + (checkInAwarded ? 0 : BONUS_XP.checkIn),
            logs: { ...current.logs, [todayKey]: { ...previous, energy, tomorrow, checkInAwarded: true } },
          };
        });
      },
      addWeight: (value) => {
        setState((current) => ({
          ...current,
          weightEntries: [
            ...current.weightEntries.filter((entry) => entry.date !== todayKey),
            { date: todayKey, value },
          ].sort((a, b) => a.date.localeCompare(b.date)),
        }));
      },
      setWeightGoal: (goal) => {
        setState((current) => ({ ...current, weightGoal: Math.min(150, Math.max(40, Math.round(goal))) }));
      },
      saveFeedback: (feedback) => {
        setState((current) => {
          const previous = current.logs[todayKey] ?? blankLog();
          const bonuses = previous.bonuses ?? {};
          const earned = !bonuses.english;
          return {
            ...current,
            xp: current.xp + (earned ? BONUS_XP.english : 0),
            logs: {
              ...current.logs,
              [todayKey]: { ...previous, bonuses: { ...bonuses, english: true } },
            },
            feedbackEntries: [{ ...feedback, date: todayKey }, ...current.feedbackEntries].slice(0, 40),
          };
        });
      },
      logLearn: (entry) => {
        setState((current) => {
          const previous = current.logs[todayKey] ?? blankLog();
          const bonuses = previous.bonuses ?? {};
          const earned = !bonuses.learn;
          return {
            ...current,
            xp: current.xp + (earned ? BONUS_XP.learn : 0),
            logs: {
              ...current.logs,
              [todayKey]: { ...previous, bonuses: { ...bonuses, learn: true } },
            },
            learnLogs: [{ ...entry, date: todayKey }, ...current.learnLogs].slice(0, 60),
          };
        });
      },
      saveNetwork: (counts) => {
        setState((current) => {
          const previous = current.logs[todayKey] ?? blankLog();
          const bonuses = previous.bonuses ?? {};
          const earned = !bonuses.network;
          return {
            ...current,
            xp: current.xp + (earned ? BONUS_XP.network : 0),
            logs: {
              ...current.logs,
              [todayKey]: { ...previous, bonuses: { ...bonuses, network: true } },
            },
            networkLogs: { ...current.networkLogs, [todayKey]: counts },
          };
        });
      },
      saveMeals: (meal) => {
        setState((current) => {
          const existing = current.mealLogs[todayKey];
          const merged: MealLog = { ...meal, custom: existing?.custom ?? [] };
          const qualifies = merged.items.length + (merged.custom?.length ?? 0) >= 2 && !merged.outsideFood;
          const previous = current.logs[todayKey] ?? blankLog();
          const bonuses = previous.bonuses ?? {};
          const earned = qualifies && !bonuses.meals;
          return {
            ...current,
            xp: current.xp + (earned ? BONUS_XP.meals : 0),
            logs: {
              ...current.logs,
              [todayKey]: { ...previous, bonuses: { ...bonuses, ...(earned || bonuses.meals ? { meals: true } : {}) } },
            },
            mealLogs: { ...current.mealLogs, [todayKey]: merged },
          };
        });
      },
      logCustomFood: (text) => {
        const parsed = parseFoodEntry(text);
        if (!parsed.length) return;
        setState((current) => {
          const existing = current.mealLogs[todayKey] ?? { items: [], outsideFood: false };
          const merged: MealLog = { ...existing, custom: [...(existing.custom ?? []), ...parsed] };
          const qualifies = merged.items.length + (merged.custom?.length ?? 0) >= 2 && !merged.outsideFood;
          const previous = current.logs[todayKey] ?? blankLog();
          const bonuses = previous.bonuses ?? {};
          const earned = qualifies && !bonuses.meals;
          return {
            ...current,
            xp: current.xp + (earned ? BONUS_XP.meals : 0),
            logs: {
              ...current.logs,
              [todayKey]: { ...previous, bonuses: { ...bonuses, ...(earned || bonuses.meals ? { meals: true } : {}) } },
            },
            mealLogs: { ...current.mealLogs, [todayKey]: merged },
          };
        });
      },
      setSkill: (skillId, next) => {
        setState((current) => ({ ...current, skills: { ...current.skills, [skillId]: next } }));
      },
      saveAi: (key, data) => {
        setState((current) => ({ ...current, aiCache: { ...current.aiCache, [key]: { stamp: todayKey, data } } }));
      },
      togglePlanItem: (key) => {
        setState((current) => ({ ...current, planChecks: { ...current.planChecks, [key]: !current.planChecks[key] } }));
      },
      claimReward: (rewardId) => {
        setState((current) => {
          const claimKey = `${weekStartKey()}:${rewardId}`;
          const threshold = REWARDS.find((reward) => reward.id === rewardId)?.threshold ?? 0;
          if (current.claimedRewards.includes(claimKey) || weekXp(current) < threshold) return current;
          return { ...current, claimedRewards: [...current.claimedRewards, claimKey] };
        });
      },
      resetDemo: () => setState(blankState()),
    };
  }, [loading, state, todayKey]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useLifeGamify() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useLifeGamify must be used inside LifeGamifyProvider");
  return context;
}

export function statusLabel(status: QuestStatus) {
  if (status === "full") return "FULL";
  if (status === "partial") return "PARTIAL";
  if (status === "minimum") return "MINIMUM";
  if (status === "skipped") return "SKIPPED";
  return "OPEN";
}

export function questPointsFor(questId: string, status: QuestStatus) {
  return pointsForStatus(questId, status);
}
