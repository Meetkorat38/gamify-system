import { z } from "zod";

import { chatJSON } from "./_core/openrouter";
import { publicProcedure, router } from "./_core/trpc";

const snapshotSchema = z.object({}).passthrough();

const COACH_CONTEXT = [
  "You are the AI coach inside Life Gamify, a personal progression app for Meet Korat.",
  "Profile: 22 years old, AI automation engineer earning ₹3.6 LPA, targeting ₹6-7 LPA AI engineering roles.",
  "Campaign: 90 days starting 2026-10-01. Phase 1 (days 1-46) is learning and proof building; phase 2 (days 47-90) is interviews and offers. Interviews should start by mid-November.",
  "Three daily tracks: Career (AI systems, agents/workflows, cloud, system design), English (20-25 minutes of ChatGPT Voice speaking practice, capped at 25 minutes, scored out of 10 for pronunciation, grammar, vocabulary, clarity), Health (56 kg at 5 ft 9 in, underweight, target 60 kg; vegetarian who eats eggs; tomatoes and bananas welcome; home food only, no outside food).",
  "Style rules: be direct, specific and forgiving. Partial progress counts. Small actions beat vague motivation. Never shame a missed day.",
  "Always reply with ONLY valid JSON matching the exact schema given in the request. No markdown, no commentary.",
].join(" ");

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asNumber(value: unknown, fallback = 0, min = 0, max = 10000) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function asStringArray(value: unknown, limit = 6): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, limit);
}

const TRACKS = ["career", "english", "health", "system"] as const;

function asTrack(value: unknown): "career" | "english" | "health" | "system" {
  const key = asString(value, "system");
  return (TRACKS as readonly string[]).includes(key) ? (key as "career" | "english" | "health" | "system") : "system";
}

function promptWithSnapshot(task: string, schema: string, snapshot: unknown) {
  return `${task}\n\nCurrent state snapshot:\n${JSON.stringify(snapshot)}\n\nReply with ONLY JSON matching this schema:\n${schema}`;
}

export const aiRouter = router({
  dailyPlan: publicProcedure
    .input(snapshotSchema)
    .mutation(({ input }) =>
      chatJSON<Record<string, unknown>>({
        system: COACH_CONTEXT,
        user: promptWithSnapshot(
          "Create today's customized to-do list. Align every item with the long-term goal (₹6-7 LPA offer), this week's goals, and the current snapshot. Blend the three tracks plus one small system/recovery action if useful. Make items concrete and finishable today.",
          '{"focus":"one line focus for today","items":[{"title":"short action title","why":"one sentence why this matters now","minutes":30,"track":"career|english|health|system"}]} with 4 to 6 items, total realistic for one day',
          input,
        ),
      }).then((raw) => ({
        focus: asString(raw.focus, "Keep the run alive."),
        items: (Array.isArray(raw.items) ? raw.items : [])
          .slice(0, 6)
          .map((item) => {
            const entry = (item ?? {}) as Record<string, unknown>;
            return {
              title: asString(entry.title, "Small daily action"),
              why: asString(entry.why, "Moves the campaign forward."),
              minutes: Math.round(asNumber(entry.minutes, 20, 5, 240)),
              track: asTrack(entry.track),
            };
          }),
      })),
    ),

  alignment: publicProcedure
    .input(snapshotSchema)
    .mutation(({ input }) =>
      chatJSON<Record<string, unknown>>({
        system: COACH_CONTEXT,
        user: promptWithSnapshot(
          "Judge honestly whether the user is aligned with the goal right now. Compare effort across Career, English and Health against the 90-day campaign and the mid-November interview target. Score alignment 0-100.",
          '{"status":"aligned|at-risk|off-track","score":70,"observations":["observation 1","observation 2","observation 3"],"correction":"the single most important correction for the next 48 hours"}',
          input,
        ),
      }).then((raw) => {
        const status = asString(raw.status, "at-risk");
        return {
          status: status === "aligned" || status === "off-track" ? status : "at-risk",
          score: Math.round(asNumber(raw.score, 50, 0, 100)),
          observations: asStringArray(raw.observations, 3),
          correction: asString(raw.correction, "Pick the smallest missing action and complete it today."),
        };
      }),
    ),

  dietPlan: publicProcedure
    .input(snapshotSchema)
    .mutation(({ input }) =>
      chatJSON<Record<string, unknown>>({
        system: COACH_CONTEXT,
        user: promptWithSnapshot(
          "Create a personalized 7-day vegetarian-plus-eggs weight-gain meal plan for steady healthy gain toward 60 kg. Home food only, use tomatoes and bananas, include affordable Indian staples. Keep portions realistic for a 22-year-old with a job.",
          '{"summary":"one line strategy","rules":["rule 1","rule 2","rule 3"],"days":[{"day":"Mon","breakfast":["item"],"lunch":["item"],"dinner":["item"],"snacks":["item"]}]} with exactly 7 days',
          input,
        ),
      }).then((raw) => ({
        summary: asString(raw.summary, "Small surplus, home food, protein with every meal."),
        rules: asStringArray(raw.rules, 5),
        days: (Array.isArray(raw.days) ? raw.days : [])
          .slice(0, 7)
          .map((item) => {
            const day = (item ?? {}) as Record<string, unknown>;
            return {
              day: asString(day.day, "Day"),
              breakfast: asStringArray(day.breakfast, 4),
              lunch: asStringArray(day.lunch, 4),
              dinner: asStringArray(day.dinner, 4),
              snacks: asStringArray(day.snacks, 4),
            };
          }),
      })),
    ),

  learningPlan: publicProcedure
    .input(snapshotSchema)
    .mutation(({ input }) =>
      chatJSON<Record<string, unknown>>({
        system: COACH_CONTEXT,
        user: promptWithSnapshot(
          "Create a personalized weekly learning plan that closes the biggest interview skill gaps first and produces portfolio proof for AI automation roles. Respect the skill states in the snapshot. Include one interview-prep practice list.",
          '{"summary":"one line strategy","weekFocus":["focus 1","focus 2","focus 3"],"blocks":[{"skill":"skill name","task":"concrete task with an output","minutes":45}],"interviewPrep":["practice item"]}',
          input,
        ),
      }).then((raw) => ({
        summary: asString(raw.summary, "Close one gap deeply and turn it into proof."),
        weekFocus: asStringArray(raw.weekFocus, 3),
        blocks: (Array.isArray(raw.blocks) ? raw.blocks : [])
          .slice(0, 6)
          .map((item) => {
            const block = (item ?? {}) as Record<string, unknown>;
            return {
              skill: asString(block.skill, "Learning block"),
              task: asString(block.task, "Focused practice with a written output."),
              minutes: Math.round(asNumber(block.minutes, 45, 15, 240)),
            };
          }),
        interviewPrep: asStringArray(raw.interviewPrep, 6),
      })),
    ),
});
