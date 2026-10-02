import { z } from "zod";

import { chatJSON } from "./_core/openrouter";
import { publicProcedure, router } from "./_core/trpc";

const snapshotSchema = z.object({}).passthrough();

const COACH_CONTEXT = [
  "You are the personal AI agent inside Life Gamify for Meet Korat. You decide what he does each day — he should never have to ask or prompt you.",
  "Profile: 22, AI automation engineer earning ₹3.6 LPA, targeting ₹6-7 LPA AI engineering roles. 90-day campaign from 2026-10-01; phase 1 (days 1-46) is learning and proof building, phase 2 (days 47-90) is interviews and offers; interviews start mid-November.",
  "Tracks: Career (LLM systems, RAG, agents and workflows, cloud, AI system design), English (20-25 minutes of ChatGPT Voice speaking, hard cap 25, scored out of 10 for pronunciation, grammar, vocabulary, clarity), Health (56 kg at 5 ft 9 in targeting 60 kg; vegetarian plus eggs; tomatoes and bananas welcome; home food only, no outside food).",
  "Specificity rules: always name the exact sub-topic (for example 'chunk-size trade-offs in RAG'), never a bare field name like 'learn LLM'. Every action carries one concrete question or executable task with a deliverable. Use topicsCovered and recentActions to advance the curriculum: never repeat finished work, always pick the logical next step from what he already knows.",
  "Timing rules: respect hourOfDay and weekday — late hours get lighter, recovery-friendly loads; mornings get the deep work.",
  "Resource rule: every action and every learning block includes 1 to 2 real, well-known learning resources in links (official docs or famous evergreen articles from OpenAI platform docs, HuggingFace, Pinecone learn, LangChain docs, Google Cloud blog, MDN, Docker docs, AWS docs, n8n docs, freeCodeCamp, Lilian Weng or Jay Alammar). Only give URLs you are confident exist; prefer stable documentation homepages over deep pages.",
  "Tone: direct, concrete and forgiving. Partial progress counts. Never shame a missed day. Reply with ONLY valid JSON matching the exact schema in the request. No markdown, no commentary.",
].join(" ");

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asNumber(value: unknown, fallback = 0, min = 0, max = 10000) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function asLinks(value: unknown, limit = 2): { title: string; url: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const entry = (item ?? {}) as Record<string, unknown>;
      return { title: asString(entry.title, "Learning resource"), url: asString(entry.url) };
    })
    .filter((link) => link.url.startsWith("http"))
    .slice(0, limit);
}

function asStringArray(value: unknown, limit = 6): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, limit);
}

const TRACKS = ["career", "english", "health", "system"] as const;
type Track = (typeof TRACKS)[number];

function asTrack(value: unknown): Track {
  const key = asString(value, "system");
  return (TRACKS as readonly string[]).includes(key) ? (key as Track) : "system";
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
        maxTokens: 2000,
        user: promptWithSnapshot(
          "Decide TODAY's mission automatically. Pick exactly one focus sub-topic that is the logical next step in his curriculum after topicsCovered, then give one specific question or executable task with a deliverable, and 4 to 6 concrete actions for today. Each action names its exact sub-topic and its own concrete question or task. Respect hourOfDay, weekday, phase and the three tracks; English stays at or under 25 minutes.",
          '{"focus":"the exact sub-topic advanced today","focusQuestion":"one specific question or executable task with a clear deliverable","links":[{"title":"resource name","url":"https://..."}],"items":[{"title":"exact sub-topic action","question":"the concrete question or task for this item","why":"why this next, given what is already covered","minutes":30,"track":"career|english|health|system","links":[{"title":"resource name","url":"https://..."}]}]} with 4 to 6 items',
          input,
        ),
      }).then((raw) => ({
        focus: asString(raw.focus, "Advance one exact sub-topic today."),
        focusQuestion: asString(raw.focusQuestion, "What is the smallest thing you can ship or explain today that proves progress?"),
        links: asLinks(raw.links),
        items: (Array.isArray(raw.items) ? raw.items : [])
          .slice(0, 6)
          .map((item) => {
            const entry = (item ?? {}) as Record<string, unknown>;
            return {
              title: asString(entry.title, "Small daily action"),
              question: asString(entry.question, "What exact output will you produce?"),
              why: asString(entry.why, "Moves the campaign forward."),
              minutes: Math.round(asNumber(entry.minutes, 30, 5, 240)),
              track: asTrack(entry.track),
              links: asLinks(entry.links),
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
          "Judge honestly whether he is aligned with the goal right now. Compare real effort across Career, English and Health against the 90-day campaign and the mid-November interview target. Score alignment 0-100.",
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
          "Create this week's learning curriculum for AI automation interviews. List the most recently covered topics, then sequence exact sub-topics as next/upcoming so he always knows what to learn after what. Every block names one exercise with an output. Include interview practice items.",
          '{"summary":"one line strategy","covered":["recently covered sub-topic"],"weekFocus":["focus 1","focus 2","focus 3"],"blocks":[{"skill":"track or skill","task":"exact sub-topic plus one exercise with an output","status":"next|upcoming","minutes":45,"links":[{"title":"resource name","url":"https://..."}]}],"interviewPrep":["practice item"]}',
          input,
        ),
      }).then((raw) => ({
        summary: asString(raw.summary, "Close one gap deeply and turn it into proof."),
        covered: asStringArray(raw.covered, 5),
        weekFocus: asStringArray(raw.weekFocus, 3),
        blocks: (Array.isArray(raw.blocks) ? raw.blocks : [])
          .slice(0, 6)
          .map((item) => {
            const block = (item ?? {}) as Record<string, unknown>;
            return {
              skill: asString(block.skill, "Learning block"),
              task: asString(block.task, "Focused practice with a written output."),
              status: asString(block.status, "next") === "upcoming" ? "upcoming" : "next",
              minutes: Math.round(asNumber(block.minutes, 45, 15, 240)),
              links: asLinks(block.links),
            };
          }),
        interviewPrep: asStringArray(raw.interviewPrep, 6),
      })),
    ),
});
