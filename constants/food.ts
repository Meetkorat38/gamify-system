export type ParsedFood = { text: string; kcal: number; protein: number };

const NUMBER_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  half: 0.5,
  quarter: 0.25,
};

type FoodEntry = { keys: string[]; label: string; kcal: number; protein: number };

const FOOD_DB: FoodEntry[] = [
  { keys: ["banana"], label: "banana", kcal: 105, protein: 1.3 },
  { keys: ["egg"], label: "egg", kcal: 78, protein: 6 },
  { keys: ["paneer"], label: "paneer (100g)", kcal: 265, protein: 18 },
  { keys: ["curd", "yogurt", "dahi"], label: "curd (cup)", kcal: 120, protein: 6 },
  { keys: ["milk", "shake"], label: "milk (glass)", kcal: 150, protein: 8 },
  { keys: ["sprout"], label: "sprouts (bowl)", kcal: 120, protein: 8 },
  { keys: ["peanut", "nuts", "cashew", "almond"], label: "nuts (handful)", kcal: 170, protein: 9 },
  { keys: ["tomato"], label: "tomato", kcal: 22, protein: 1 },
  { keys: ["dal", "lentil", "sambar"], label: "dal (bowl)", kcal: 150, protein: 9 },
  { keys: ["roti", "chapati", "phulka"], label: "roti", kcal: 100, protein: 3 },
  { keys: ["rice"], label: "rice (cup)", kcal: 200, protein: 4 },
  { keys: ["poha"], label: "poha (plate)", kcal: 250, protein: 6 },
  { keys: ["oat"], label: "oats (bowl)", kcal: 220, protein: 8 },
  { keys: ["chilla", "cheela"], label: "besan chilla", kcal: 150, protein: 7 },
  { keys: ["idli"], label: "idli", kcal: 60, protein: 2 },
  { keys: ["dosa"], label: "dosa", kcal: 130, protein: 3.5 },
  { keys: ["upma"], label: "upma (plate)", kcal: 230, protein: 6 },
  { keys: ["khichdi"], label: "khichdi (bowl)", kcal: 250, protein: 10 },
  { keys: ["rajma"], label: "rajma (bowl)", kcal: 180, protein: 10 },
  { keys: ["chole", "chana", "chickpea"], label: "chole (bowl)", kcal: 190, protein: 11 },
  { keys: ["paratha"], label: "paratha", kcal: 210, protein: 5 },
  { keys: ["salad"], label: "salad (bowl)", kcal: 60, protein: 2 },
  { keys: ["fruit"], label: "fruit (serving)", kcal: 90, protein: 1 },
  { keys: ["juice"], label: "juice (glass)", kcal: 110, protein: 1 },
  { keys: ["tea", "chai"], label: "chai (cup)", kcal: 90, protein: 3 },
  { keys: ["coffee"], label: "coffee (cup)", kcal: 60, protein: 2 },
  { keys: ["pav bhaji", "bhaji"], label: "pav bhaji (plate)", kcal: 400, protein: 10 },
  { keys: ["pulao", "biryani"], label: "rice dish (plate)", kcal: 320, protein: 9 },
  { keys: ["sandwich"], label: "sandwich", kcal: 250, protein: 8 },
  { keys: ["pasta", "noodles"], label: "pasta/noodles (plate)", kcal: 300, protein: 9 },
];

const DEFAULT_ENTRY: Omit<FoodEntry, "keys" | "label"> = { kcal: 120, protein: 4 };

function matchFood(fragment: string): { entry: FoodEntry | null; quantity: number } {
  const lower = fragment.toLowerCase();
  const tokens = lower.replace(/[^a-z0-9. ]/g, " ").split(/\s+/).filter(Boolean);
  let quantity = 1;
  for (const token of tokens) {
    const asNumber = Number(token);
    if (Number.isFinite(asNumber) && asNumber > 0) {
      quantity = Math.min(30, asNumber);
      break;
    }
    if (NUMBER_WORDS[token] !== undefined) {
      quantity = NUMBER_WORDS[token];
      break;
    }
  }
  let best: FoodEntry | null = null;
  let bestKeyLength = 0;
  for (const item of FOOD_DB) {
    for (const key of item.keys) {
      if (lower.includes(key) && key.length > bestKeyLength) {
        best = item;
        bestKeyLength = key.length;
      }
    }
  }
  return { entry: best, quantity };
}

export function parseFoodEntry(text: string): ParsedFood[] {
  return text
    .split(/,| and |&|\+|\n/gi)
    .map((fragment) => fragment.trim())
    .filter((fragment) => fragment.length > 1)
    .slice(0, 8)
    .map((fragment) => {
      const { entry, quantity } = matchFood(fragment);
      const nutrition = entry ?? DEFAULT_ENTRY;
      return {
        text: fragment.length > 42 ? `${fragment.slice(0, 40)}…` : fragment,
        kcal: Math.round(nutrition.kcal * quantity),
        protein: Math.round(nutrition.protein * quantity * 10) / 10,
      };
    });
}

export function foodTotals(entries: ParsedFood[]) {
  return entries.reduce(
    (sum, entry) => ({ kcal: sum.kcal + entry.kcal, protein: Math.round((sum.protein + entry.protein) * 10) / 10 }),
    { kcal: 0, protein: 0 },
  );
}

export function fuelTarget(currentKg: number, goalKg: number) {
  const gaining = goalKg > currentKg;
  return {
    kcal: gaining ? 2500 : 2200,
    protein: gaining ? 95 : 75,
  };
}
