export const COLORS = {
  ink: "#070B16",
  panel: "#10182A",
  panelRaised: "#16223A",
  panelSoft: "#0D1424",
  line: "#263451",
  text: "#F3F7FF",
  muted: "#8F9DB7",
  cyan: "#5CE1E6",
  cyanDim: "#173C4A",
  lime: "#B8F36B",
  limeDim: "#2F4625",
  violet: "#B39DFF",
  violetDim: "#332C59",
  amber: "#FFC857",
  amberDim: "#4C3D20",
  red: "#FF7A90",
  redDim: "#4D2735",
  white: "#FFFFFF",
} as const;

export const TRACKS = {
  career: {
    label: "CAREER",
    short: "Career",
    color: COLORS.cyan,
    dim: COLORS.cyanDim,
    icon: "⚡",
    subtitle: "AI engineer upgrade",
  },
  english: {
    label: "ENGLISH",
    short: "English",
    color: COLORS.violet,
    dim: COLORS.violetDim,
    icon: "◈",
    subtitle: "Speak with authority",
  },
  health: {
    label: "HEALTH",
    short: "Health",
    color: COLORS.lime,
    dim: COLORS.limeDim,
    icon: "＋",
    subtitle: "Build vitality",
  },
} as const;

export type TrackKey = keyof typeof TRACKS;

export const BASE_WEIGHT = 56;

export type SkillState = "idle" | "learning" | "ready";

export const SKILL_STATES: SkillState[] = ["idle", "learning", "ready"];

export const SKILLS: { id: string; label: string; hint: string }[] = [
  { id: "llm", label: "LLM systems & RAG", hint: "Embeddings, retrieval, context, evaluation." },
  { id: "agents", label: "AI agents & workflows", hint: "n8n, tool use, orchestration, automation." },
  { id: "cloud", label: "Cloud & deployment", hint: "Docker, servers, APIs, monitoring." },
  { id: "design", label: "AI system design", hint: "Architecture, trade-offs, case studies." },
  { id: "ts", label: "TypeScript & APIs", hint: "Solid code and clean interfaces." },
  { id: "problem", label: "Problem solving", hint: "Logic, DSA-lite, debugging under pressure." },
  { id: "speak", label: "Interview English", hint: "Explain systems clearly in English." },
];

export const LEARN_CATEGORIES = [
  { id: "coding", label: "CODING" },
  { id: "finance", label: "FINANCE" },
  { id: "useful", label: "USEFUL" },
] as const;

export type LearnCategory = (typeof LEARN_CATEGORIES)[number]["id"];

export const MEAL_ITEMS: { id: string; label: string }[] = [
  { id: "banana-milk", label: "Banana + milk" },
  { id: "eggs", label: "2 eggs" },
  { id: "paneer", label: "Paneer" },
  { id: "curd", label: "Curd / yogurt" },
  { id: "sprouts", label: "Sprouts" },
  { id: "nuts", label: "Peanuts / nuts" },
  { id: "tomato", label: "Tomato salad" },
  { id: "dal", label: "Home-cooked dal" },
];

export const REWARDS: { id: string; title: string; detail: string; threshold: number; icon: string }[] = [
  { id: "video", title: "Watch a useful short video", detail: "Coding, finance, or a topic that moves the build forward.", threshold: 120, icon: "▶" },
  { id: "outing", title: "Take a small outing", detail: "A reset that gets you out of the room and back into life.", threshold: 220, icon: "↗" },
  { id: "purchase", title: "Buy one useful thing", detail: "A bounded reward with a spending limit you choose.", threshold: 300, icon: "＋" },
];

export const BONUS_XP = {
  english: 10,
  learn: 5,
  network: 5,
  meals: 5,
  checkIn: 5,
  dailyClear: 15,
} as const;

export function rankForLevel(level: number) {
  if (level >= 10) return "S-RANK";
  if (level >= 7) return "A-RANK";
  if (level >= 4) return "B-RANK";
  if (level >= 2) return "C-RANK";
  return "E-RANK";
}

export function levelForXp(xp: number) {
  return Math.max(1, Math.floor(xp / 100) + 1);
}

export function xpIntoLevel(xp: number) {
  return xp % 100;
}

export function campaignDay(startDate = "2026-10-01") {
  const start = new Date(`${startDate}T00:00:00`);
  const now = new Date();
  const diff = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return Math.min(90, Math.max(1, diff + 1));
}

export function campaignPhase(day: number) {
  return day <= 46 ? "BUILD STRENGTH" : "INTERVIEW BATTLEFIELD";
}

export function phaseDescription(day: number) {
  return day <= 46
    ? "Close the technical gaps. Build proof. Start the interview run by mid-November."
    : "Apply, interview, learn from every round, and climb toward ₹6–7 LPA.";
}

export function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function prettyDate(date = new Date()) {
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export function yesterdayKey() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return dateKey(date);
}

export function weekStartKey(input = new Date()) {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  return dateKey(date);
}

export function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
