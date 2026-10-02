import { TRPCError } from "@trpc/server";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Preference order requested by the owner: DeepSeek v4.1 first, Meta Muse Spark
 * second (Spark 2 is not listed yet, 1.3 is the newest), then free models as
 * automatic fallback if credits or availability fail. Set OPENROUTER_MODEL to pin
 * any other model id.
 */
const MODEL_PREFERENCES = [
  "deepseek/deepseek-v4.1-flash",
  "meta/muse-spark-1.3",
  "deepseek/deepseek-v4-flash",
  "google/gemma-4-31b-it:free",
  "qwen/qwen3.8-27b:free",
  "google/gemma-4-26b-a4b-it:free",
];

const CACHE_MS = 30 * 60 * 1000;
const responseCache = new Map<string, { at: number; data: unknown }>();
let lastGoodModel: string | null = null;

type ChatArgs = {
  system: string;
  user: string;
  maxTokens?: number;
};

function extractJson(content: string): unknown {
  const text = content.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("ai_output_not_json");
  }
  return JSON.parse(text.slice(start, end + 1));
}

function modelCandidates(): string[] {
  const list = [process.env.OPENROUTER_MODEL, lastGoodModel, ...MODEL_PREFERENCES].filter(
    (value): value is string => Boolean(value),
  );
  return Array.from(new Set(list));
}

export async function chatJSON<T>({ system, user, maxTokens = 1600 }: ChatArgs): Promise<T> {
  const cacheKey = `${system}::${user}`;
  const hit = responseCache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data as T;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "ai_not_configured" });
  }

  let lastError = "ai_unavailable";
  for (const model of modelCandidates()) {
    try {
      const response = await fetch(OPENROUTER_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://koratmeet.in",
          "X-Title": "Life Gamify",
        },
        body: JSON.stringify({
          model,
          temperature: 0.7,
          max_tokens: maxTokens,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });
      if (!response.ok) {
        lastError = `openrouter_${response.status}`;
        continue;
      }
      const payload = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) {
        lastError = "ai_empty_response";
        continue;
      }
      const data = extractJson(content) as T;
      lastGoodModel = model;
      responseCache.set(cacheKey, { at: Date.now(), data });
      return data;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "ai_failed";
    }
  }

  throw new TRPCError({ code: "BAD_GATEWAY", message: lastError });
}
