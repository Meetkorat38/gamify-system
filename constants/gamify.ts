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
