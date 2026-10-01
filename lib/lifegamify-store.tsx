import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  campaignDay,
  campaignPhase,
  dateKey,
  levelForXp,
  phaseDescription,
  yesterdayKey,
  type TrackKey,
} from "@/constants/gamify";

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

export type DailyLog = {
  statuses: Record<string, QuestStatus>;
  energy?: number;
  tomorrow?: string;
  bonusAwarded?: boolean;
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
};

export type PersistedState = {
  xp: number;
  streak: number;
  lastActiveDate: string | null;
  logs: Record<string, DailyLog>;
  weightEntries: WeightEntry[];
  feedbackEntries: EnglishFeedback[];
  claimedRewards: string[];
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
const DAILY_BONUS = 15;
const statusPoints: Record<QuestStatus, number> = {
  pending: 0,
  full: 20,
  partial: 10,
  minimum: 5,
  skipped: 0,
};

const blankState = (): PersistedState => ({
  xp: 0,
  streak: 0,
  lastActiveDate: null,
  logs: {},
  weightEntries: [],
  feedbackEntries: [],
  claimedRewards: [],
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
  completeQuest: (questId: string, status: Exclude<QuestStatus, "pending">) => void;
  saveCheckIn: (energy: number, tomorrow: string) => void;
  addWeight: (value: number) => void;
  saveFeedback: (feedback: Omit<EnglishFeedback, "date">) => void;
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
      completeQuest: (questId, status) => {
        setState((current) => {
          const previous = current.logs[todayKey] ?? blankLog();
          const previousStatus = previous.statuses[questId] ?? "pending";
          const nextStatuses = { ...previous.statuses, [questId]: status };
          const wasComplete = completeStatuses(previous.statuses);
          const nowComplete = completeStatuses(nextStatuses);
          const delta = statusPoints[status] - statusPoints[previousStatus];
          let nextXp = Math.max(0, current.xp + delta);
          let bonusAwarded = previous.bonusAwarded ?? false;

          if (nowComplete && !wasComplete) {
            nextXp += DAILY_BONUS;
            bonusAwarded = true;
          } else if (!nowComplete && wasComplete && bonusAwarded) {
            nextXp = Math.max(0, nextXp - DAILY_BONUS);
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
        setState((current) => ({
          ...current,
          logs: { ...current.logs, [todayKey]: { ...(current.logs[todayKey] ?? blankLog()), energy, tomorrow } },
        }));
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
      saveFeedback: (feedback) => {
        setState((current) => ({
          ...current,
          feedbackEntries: [{ ...feedback, date: todayKey }, ...current.feedbackEntries].slice(0, 30),
        }));
      },
      claimReward: (rewardId) => {
        setState((current) => ({
          ...current,
          claimedRewards: current.claimedRewards.includes(rewardId)
            ? current.claimedRewards.filter((id) => id !== rewardId)
            : [...current.claimedRewards, rewardId],
        }));
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

export function statusPointsFor(status: QuestStatus) {
  return statusPoints[status];
}
