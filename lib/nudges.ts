import type { CoachSnapshot, PlanTrack } from "@/lib/coach";

export type NudgeLevel = "gentle" | "firm" | "rescue";

export type NudgeReason = {
  code: string;
  label: string;
  detail: string;
  track: PlanTrack;
  minutes: number;
};

export type NudgeSignals = {
  behind: boolean;
  level: NudgeLevel;
  reasons: NudgeReason[];
};

export type CoachNudge = {
  id: string;
  level: NudgeLevel;
  headline: string;
  message: string;
  action: string;
  minutes: number;
  track: PlanTrack;
  source: "ai" | "fallback";
  signals: string[];
};

export function nudgeBucket(hour: number): "am" | "mid" | "pm" {
  return hour < 12 ? "am" : hour < 18 ? "mid" : "pm";
}

function daysBetween(start: string, end: string): number {
  const from = new Date(`${start}T00:00:00`).getTime();
  const to = new Date(`${end}T00:00:00`).getTime();
  return Number.isFinite(from) && Number.isFinite(to) ? Math.max(0, Math.round((to - from) / 86_400_000)) : 0;
}

export function buildNudgeSignals(snapshot: CoachSnapshot): NudgeSignals {
  const hour = snapshot.hourOfDay;
  const reasons: NudgeReason[] = [];
  const doneToday = Object.values(snapshot.questsToday).filter(
    (status) => Boolean(status) && status !== "pending" && status !== "skipped",
  ).length;
  const weekElapsedDays = daysBetween(snapshot.weekStart, snapshot.today) + 1;
  const englishToday = snapshot.recentScores.some((entry) => entry.date === snapshot.today && entry.minutes > 0);

  if (hour >= 13 && doneToday === 0) {
    reasons.push({
      code: "no-action-today",
      label: "Nothing logged today",
      detail: `Day ${snapshot.day} of 90 with zero completed actions and it is already ${hour}:00.`,
      track: "career",
      minutes: 15,
    });
  } else if (hour >= 20 && doneToday < 2) {
    reasons.push({
      code: "quests-behind",
      label: "Today's quests slipping",
      detail: `Only ${doneToday} of 3 quests touched and the day is almost over.`,
      track: "system",
      minutes: 20,
    });
  }

  if (hour >= 15 && !englishToday) {
    reasons.push({
      code: "english-missing",
      label: "English session missing",
      detail: `No speaking session logged today; the weekly total stands at ${snapshot.week.englishMinutes} minutes.`,
      track: "english",
      minutes: 20,
    });
  }

  const englishTarget = weekElapsedDays * 18;
  if (snapshot.week.englishMinutes < englishTarget - 20) {
    reasons.push({
      code: "english-week-pace",
      label: "Speaking minutes below pace",
      detail: `${snapshot.week.englishMinutes} of ${englishTarget} planned speaking minutes are done this week.`,
      track: "english",
      minutes: 15,
    });
  }

  const expectedFullClears = Math.round((weekElapsedDays * 5) / 7);
  if (snapshot.week.fullClearDays < expectedFullClears - 1) {
    reasons.push({
      code: "week-pace",
      label: "Weekly reward pace slipping",
      detail: `${snapshot.week.fullClearDays} full-clear days this week against a ${expectedFullClears}-day pace.`,
      track: "system",
      minutes: 25,
    });
  }

  if (snapshot.week.weighIns === 0 && weekElapsedDays >= 3) {
    reasons.push({
      code: "weigh-in-missing",
      label: "No weigh-in this week",
      detail: `No weigh-in logged this week while the target is ${snapshot.weight.goal} kg.`,
      track: "health",
      minutes: 2,
    });
  }

  if (snapshot.week.outsideFoodDays >= 2) {
    reasons.push({
      code: "outside-food",
      label: "Outside food breaking the run",
      detail: `${snapshot.week.outsideFoodDays} outside-food days this week against the home-food rule.`,
      track: "health",
      minutes: 5,
    });
  } else if (snapshot.week.homeFuelDays < weekElapsedDays - 1) {
    reasons.push({
      code: "home-fuel-pace",
      label: "Home-fuel days below pace",
      detail: `${snapshot.week.homeFuelDays} home-fuel days logged against ${weekElapsedDays} days elapsed.`,
      track: "health",
      minutes: 10,
    });
  }

  if (snapshot.recoveryDays > 0) {
    reasons.unshift({
      code: "recovery",
      label: "Recovery mode active",
      detail: `Recovery mode is on after a broken chain; day ${snapshot.day} is the restart.`,
      track: "system",
      minutes: 20,
    });
  }

  const level: NudgeLevel =
    snapshot.recoveryDays > 0 || reasons.length >= 4 ? "rescue" : reasons.length >= 2 ? "firm" : "gentle";
  return { behind: reasons.length > 0, level, reasons };
}

const TEMPLATES: Record<string, { headline: string; action: string }> = {
  "no-action-today": {
    headline: "Zero logged today — one move fixes it",
    action: "Do the minimum version of today’s career quest and tap it done",
  },
  "quests-behind": {
    headline: "Today’s quests are slipping",
    action: "Clear the smallest unfinished quest right now",
  },
  "english-missing": {
    headline: "Speaking session still missing",
    action: "Start ChatGPT Voice now — even 10 minutes keeps the habit",
  },
  "english-week-pace": {
    headline: "Speaking minutes below pace",
    action: "Add one extra 15-minute speaking block today",
  },
  "week-pace": {
    headline: "Weekly reward is slipping away",
    action: "Finish today with a full clear to protect the week",
  },
  "weigh-in-missing": {
    headline: "No weigh-in logged this week",
    action: "Log tomorrow’s morning weight before breakfast",
  },
  "outside-food": {
    headline: "Outside food is breaking the fuel run",
    action: "Eat every remaining meal at home today",
  },
  "home-fuel-pace": {
    headline: "Home-fuel days below pace",
    action: "Log two home protein items at the next meal",
  },
  recovery: {
    headline: "Recovery mode — today is the restart",
    action: "Full-clear one day to restart the chain",
  },
};

export function nudgeId(snapshot: CoachSnapshot, signals: NudgeSignals): string {
  const top = signals.reasons[0];
  return `${snapshot.today}:${nudgeBucket(snapshot.hourOfDay)}:${top?.code ?? "coach"}`;
}

export function buildFallbackNudge(snapshot: CoachSnapshot, signals: NudgeSignals): CoachNudge {
  const top = signals.reasons[0] ?? {
    code: "coach",
    label: "Coach check",
    detail: "The numbers show a gap today.",
    track: "system" as PlanTrack,
    minutes: 15,
  };
  const template = TEMPLATES[top.code] ?? {
    headline: "One small move beats a perfect plan",
    action: "Do the smallest unfinished action now",
  };
  return {
    id: nudgeId(snapshot, signals),
    level: signals.level,
    headline: template.headline,
    message: top.detail,
    action: template.action,
    minutes: top.minutes,
    track: top.track,
    source: "fallback",
    signals: signals.reasons.map((reason) => reason.label),
  };
}
