import { useMemo } from "react";

import { weekStartKey } from "@/constants/gamify";
import {
  aiKey,
  buildCoachSnapshot,
  getAi,
  type AlignmentReport,
  type CoachSnapshot,
  type DailyPlan,
  type DietPlan,
  type LearningPlan,
} from "@/lib/coach";
import {
  buildFallbackAlignment,
  buildFallbackDailyPlan,
  buildFallbackDietPlan,
  buildFallbackLearningPlan,
  ensureLearningLinks,
  ensurePlanLinks,
} from "@/lib/fallback-plans";
import {
  buildFallbackNudge,
  buildNudgeSignals,
  nudgeBucket,
  nudgeId,
  type CoachNudge,
} from "@/lib/nudges";
import { useLifeGamify } from "@/lib/lifegamify-store";
import { trpc } from "@/lib/trpc";

export function useCoach() {
  const { state, todayKey, dayNumber, phase, recoveryDays, saveAi } = useLifeGamify();
  const snapshot: CoachSnapshot = useMemo(
    () => buildCoachSnapshot(state, todayKey, dayNumber, phase, recoveryDays),
    [state, todayKey, dayNumber, phase, recoveryDays],
  );
  const weekStart = weekStartKey();

  const dailyMutation = trpc.ai.dailyPlan.useMutation();
  const alignMutation = trpc.ai.alignment.useMutation();
  const dietMutation = trpc.ai.dietPlan.useMutation();
  const learningMutation = trpc.ai.learningPlan.useMutation();
  const nudgeMutation = trpc.ai.nudge.useMutation();

  const cachedDaily = getAi<DailyPlan>(state, aiKey("daily", todayKey));
  const dailyPlan = cachedDaily ? ensurePlanLinks(cachedDaily) : null;
  const alignment = getAi<AlignmentReport>(state, aiKey("align", todayKey));
  const dietPlan = getAi<DietPlan>(state, aiKey("diet", weekStart));
  const cachedLearning = getAi<LearningPlan>(state, aiKey("learning", weekStart));
  const learningPlan = cachedLearning ? ensureLearningLinks(cachedLearning) : null;

  const signals = useMemo(() => buildNudgeSignals(snapshot), [snapshot]);
  const nudgeStamp = `${todayKey}:${nudgeBucket(snapshot.hourOfDay)}`;
  const cachedNudge = getAi<CoachNudge>(state, aiKey("nudge", nudgeStamp));
  const nudge: CoachNudge | null = !signals.behind
    ? null
    : cachedNudge
      ? {
          ...cachedNudge,
          id: nudgeId(snapshot, signals),
          level: signals.level,
          signals: signals.reasons.map((reason) => reason.label),
        }
      : buildFallbackNudge(snapshot, signals);

  const generateDailyPlan = async () => {
    try {
      const data = ensurePlanLinks((await dailyMutation.mutateAsync(snapshot)) as DailyPlan);
      saveAi(aiKey("daily", todayKey), { ...data, source: "ai" });
      return data;
    } catch {
      const fallback = buildFallbackDailyPlan(snapshot);
      saveAi(aiKey("daily", todayKey), { ...fallback, source: "fallback" });
      return fallback;
    }
  };

  const generateAlignment = async () => {
    try {
      const data = (await alignMutation.mutateAsync(snapshot)) as AlignmentReport;
      saveAi(aiKey("align", todayKey), { ...data, source: "ai" });
      return data;
    } catch {
      const fallback = buildFallbackAlignment(snapshot);
      saveAi(aiKey("align", todayKey), { ...fallback, source: "fallback" });
      return fallback;
    }
  };

  const generateDietPlan = async () => {
    try {
      const data = (await dietMutation.mutateAsync(snapshot)) as DietPlan;
      saveAi(aiKey("diet", weekStart), { ...data, source: "ai" });
      return data;
    } catch {
      const fallback = buildFallbackDietPlan();
      saveAi(aiKey("diet", weekStart), { ...fallback, source: "fallback" });
      return fallback;
    }
  };

  const generateLearningPlan = async () => {
    try {
      const data = ensureLearningLinks((await learningMutation.mutateAsync(snapshot)) as LearningPlan);
      saveAi(aiKey("learning", weekStart), { ...data, source: "ai" });
      return data;
    } catch {
      const fallback = buildFallbackLearningPlan(snapshot);
      saveAi(aiKey("learning", weekStart), { ...fallback, source: "fallback" });
      return fallback;
    }
  };

  const generateNudge = async () => {
    if (!signals.behind) return null;
    try {
      const data = (await nudgeMutation.mutateAsync({
        ...snapshot,
        behindSignals: signals.reasons,
      })) as Omit<CoachNudge, "id" | "source" | "signals">;
      const full: CoachNudge = {
        ...data,
        id: nudgeId(snapshot, signals),
        source: "ai",
        signals: signals.reasons.map((reason) => reason.label),
      };
      saveAi(aiKey("nudge", nudgeStamp), full);
      return full;
    } catch {
      const fallback = buildFallbackNudge(snapshot, signals);
      saveAi(aiKey("nudge", nudgeStamp), fallback);
      return fallback;
    }
  };

  return {
    snapshot,
    nudge,
    nudgeSignals: signals,
    generateNudge,
    dailyPlan,
    alignment,
    dietPlan,
    learningPlan,
    generateDailyPlan,
    generateAlignment,
    generateDietPlan,
    generateLearningPlan,
    busyDaily: dailyMutation.isPending,
    busyAlign: alignMutation.isPending,
    busyDiet: dietMutation.isPending,
    busyLearning: learningMutation.isPending,
    busyNudge: nudgeMutation.isPending,
  };
}
