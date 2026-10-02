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

  const dailyPlan = getAi<DailyPlan>(state, aiKey("daily", todayKey));
  const alignment = getAi<AlignmentReport>(state, aiKey("align", todayKey));
  const dietPlan = getAi<DietPlan>(state, aiKey("diet", weekStart));
  const learningPlan = getAi<LearningPlan>(state, aiKey("learning", weekStart));

  const generateDailyPlan = async () => {
    const data = (await dailyMutation.mutateAsync(snapshot)) as DailyPlan;
    saveAi(aiKey("daily", todayKey), data);
    return data;
  };

  const generateAlignment = async () => {
    const data = (await alignMutation.mutateAsync(snapshot)) as AlignmentReport;
    saveAi(aiKey("align", todayKey), data);
    return data;
  };

  const generateDietPlan = async () => {
    const data = (await dietMutation.mutateAsync(snapshot)) as DietPlan;
    saveAi(aiKey("diet", weekStart), data);
    return data;
  };

  const generateLearningPlan = async () => {
    const data = (await learningMutation.mutateAsync(snapshot)) as LearningPlan;
    saveAi(aiKey("learning", weekStart), data);
    return data;
  };

  return {
    snapshot,
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
    aiFailed:
      dailyMutation.isError || alignMutation.isError || dietMutation.isError || learningMutation.isError,
  };
}
