import type { AlignmentReport, CoachSnapshot, DailyPlan, DietPlan, LearningPlan, LearnLink } from "@/lib/coach";

type CurriculumEntry = { skill: string; topic: string; question: string };

const LINKS: Record<string, LearnLink[]> = {
  "Tokens, context windows and attention limits": [
    { title: "OpenAI · What are tokens", url: "https://help.openai.com/en/articles/4936850-what-are-tokens-and-how-to-count-them" },
    { title: "HuggingFace · Tokenizers docs", url: "https://huggingface.co/docs/tokenizers" },
  ],
  "Prompt design and strict structured output": [
    { title: "OpenAI · Prompt engineering guide", url: "https://platform.openai.com/docs/guides/prompt-engineering" },
    { title: "OpenAI · Structured outputs", url: "https://platform.openai.com/docs/guides/structured-outputs" },
  ],
  "Embeddings and vector search basics": [
    { title: "Google Cloud · What are embeddings", url: "https://cloud.google.com/blog/topics/machine-learning/what-are-embeddings" },
    { title: "Pinecone · Vector databases explained", url: "https://www.pinecone.io/learn/vector-database/" },
  ],
  "Chunk-size trade-offs": [
    { title: "Pinecone · Chunking strategies", url: "https://www.pinecone.io/learn/chunking-strategies/" },
    { title: "LangChain · Text splitters", url: "https://python.langchain.com/docs/concepts/text_splitters/" },
  ],
  "Retrieval evaluation": [
    { title: "RAGAS · Evaluation docs", url: "https://docs.ragas.io/" },
    { title: "OpenAI cookbook · RAG research", url: "https://cookbook.openai.com/examples/research_rag" },
  ],
  "Reranking and hybrid search": [
    { title: "Cohere · Rerank docs", url: "https://docs.cohere.com/docs/rerank" },
    { title: "Pinecone · Hybrid search", url: "https://www.pinecone.io/learn/hybrid-search-fast-retrieval/" },
  ],
  "Tool calling and function schemas": [
    { title: "OpenAI · Function calling", url: "https://platform.openai.com/docs/guides/function-calling" },
    { title: "Anthropic · Tool use", url: "https://docs.anthropic.com/en/docs/build-with-claude/tool-use" },
  ],
  "Agent loops and hard stopping conditions": [
    { title: "Lilian Weng · LLM agents", url: "https://lilianweng.github.io/posts/2023-06-23-agent/" },
    { title: "Prompting Guide · ReAct", url: "https://www.promptingguide.ai/techniques/react" },
  ],
  "n8n reliability: retries and idempotency": [
    { title: "n8n · Error handling", url: "https://docs.n8n.io/workflows/error-handling/" },
    { title: "Stripe · Idempotent requests", url: "https://stripe.com/docs/api/idempotent_requests" },
  ],
  "Docker and EC2 deployment basics": [
    { title: "Docker · Get started", url: "https://docs.docker.com/get-started/" },
    { title: "AWS · EC2 concepts", url: "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html" },
  ],
  "AI system design: latency, cost and caching": [
    { title: "12-factor app methodology", url: "https://12factor.net/" },
    { title: "Google SRE · Monitoring", url: "https://sre.google/sre-book/monitoring-distributed-systems/" },
  ],
  "Explaining your shipped AI systems": [
    { title: "The Muse · STAR interview method", url: "https://www.themuse.com/advice/star-interview-method" },
    { title: "Coding Interview University", url: "https://github.com/jwasham/coding-interview-university" },
  ],
};

export const CURRICULUM: CurriculumEntry[] = [
  {
    skill: "LLM foundations",
    topic: "Tokens, context windows and attention limits",
    question: "Write a 5-line explanation of why a 128k-token model still misses instructions placed at the edges, and where you would place critical instructions in a prompt.",
  },
  {
    skill: "LLM foundations",
    topic: "Prompt design and strict structured output",
    question: "Take one prompt you use daily, rewrite it to return strict JSON with a schema, and note what broke and how you fixed it.",
  },
  {
    skill: "RAG",
    topic: "Embeddings and vector search basics",
    question: "Explain in plain words why cosine similarity works for sentence embeddings, and give one real case where it fails.",
  },
  {
    skill: "RAG",
    topic: "Chunk-size trade-offs",
    question: "Split one document at 200 / 500 / 1000 tokens and write which chunk size retrieves best for one question, and why.",
  },
  {
    skill: "RAG",
    topic: "Retrieval evaluation",
    question: "Design a 10-question eval set for one knowledge base and define what good retrieval means with one concrete metric.",
  },
  {
    skill: "RAG",
    topic: "Reranking and hybrid search",
    question: "Compare BM25 + vector hybrid search against vector-only for one query type; write exactly when keyword search wins.",
  },
  {
    skill: "Agents",
    topic: "Tool calling and function schemas",
    question: "Design one tool schema (name, arguments, error cases) for an agent that books calendar slots, and write the failure message it returns.",
  },
  {
    skill: "Agents",
    topic: "Agent loops and hard stopping conditions",
    question: "Write a ReAct agent loop in 8 lines of pseudocode and define 3 hard stop conditions that prevent infinite runs.",
  },
  {
    skill: "Workflow automation",
    topic: "n8n reliability: retries and idempotency",
    question: "Sketch an n8n lead-intake flow with retry and an idempotency key; write what happens when the same webhook fires twice.",
  },
  {
    skill: "Cloud",
    topic: "Docker and EC2 deployment basics",
    question: "Write the Dockerfile and the 4 deploy commands for one FastAPI AI service on EC2, including the health check.",
  },
  {
    skill: "System design",
    topic: "AI system design: latency, cost and caching",
    question: "Sketch a text architecture for a RAG app that answers under 2 seconds on a $100/month budget, and mark the cache layer.",
  },
  {
    skill: "Interview",
    topic: "Explaining your shipped AI systems",
    question: "Write your 90-second story for one automation you built: problem, approach, metric, lesson.",
  },
];

const WEEK_TARGETS = {
  englishMinutes: 105,
  learnEntries: 5,
  networkTouches: 12,
  homeFuelDays: 5,
  activeDays: 5,
};

function pickCurriculumEntry(snapshot: CoachSnapshot): CurriculumEntry {
  const covered = new Set(snapshot.topicsCovered.map((topic) => topic.toLowerCase()));
  const start = Math.max(0, snapshot.day - 1) % CURRICULUM.length;
  for (let offset = 0; offset < CURRICULUM.length; offset += 1) {
    const entry = CURRICULUM[(start + offset) % CURRICULUM.length];
    const alreadyCovered = [...covered].some((topic) => topic.includes(entry.topic.toLowerCase()));
    if (!alreadyCovered) return entry;
  }
  return CURRICULUM[start];
}

export function buildFallbackDailyPlan(snapshot: CoachSnapshot): DailyPlan {
  const entry = pickCurriculumEntry(snapshot);
  const late = snapshot.hourOfDay >= 20;
  return {
    focus: entry.topic,
    focusQuestion: entry.question,
    items: [
      {
        title: `${entry.skill}: ${entry.topic}`,
        question: entry.question,
        why: "This is the next exact sub-topic after what you already covered.",
        minutes: late ? 30 : 45,
        track: "career",
        links: LINKS[entry.topic] ?? [],
      },
      {
        title: "Voice room: explain today's topic out loud",
        question: "Speak for 20 minutes in ChatGPT Voice about today's topic, then score pronunciation, grammar, vocabulary and clarity out of 10.",
        why: "English multiplies every interview answer; the topic doubles as speaking material.",
        minutes: 20,
        track: "english",
      },
      {
        title: "Home fuel: two protein items today",
        question: "Which two vegetarian-plus-egg protein items will you eat at home today?",
        why: "You are 4 kg under target; consistent home protein is the whole health track.",
        minutes: 10,
        track: "health",
      },
      {
        title: "Two LinkedIn touches",
        question: "Who will you connect with today, and what is your one-line message?",
        why: "The ₹6–7 LPA jump comes through people as much as skills.",
        minutes: 15,
        track: "system",
        links: [{ title: "LinkedIn help center", url: "https://www.linkedin.com/help/linkedin" }],
      },
    ],
    links: LINKS[entry.topic] ?? [],
  };
}

export function buildFallbackAlignment(snapshot: CoachSnapshot): AlignmentReport {
  const week = snapshot.week;
  const networkTouches = week.network.connections + week.network.messages + week.network.applications + week.network.referrals;
  const dims: { name: string; value: number; copy: string; fix: string }[] = [
    {
      name: "Career",
      value: Math.min(1, week.learnEntries / WEEK_TARGETS.learnEntries),
      copy: `Learning entries this week: ${week.learnEntries} of ${WEEK_TARGETS.learnEntries}.`,
      fix: "Log one focused lesson with a takeaway today.",
    },
    {
      name: "English",
      value: Math.min(1, week.englishMinutes / WEEK_TARGETS.englishMinutes),
      copy: `Speaking minutes this week: ${week.englishMinutes} of ${WEEK_TARGETS.englishMinutes}.`,
      fix: "Run one 20-minute voice session today.",
    },
    {
      name: "Health",
      value: Math.min(1, (week.homeFuelDays / WEEK_TARGETS.homeFuelDays + week.weighIns) / 2),
      copy: `Home-fuel days: ${week.homeFuelDays} of ${WEEK_TARGETS.homeFuelDays}; weigh-ins: ${week.weighIns}.`,
      fix: "Eat two home protein items today and weigh in this week.",
    },
    {
      name: "Network",
      value: Math.min(1, networkTouches / WEEK_TARGETS.networkTouches),
      copy: `Network touches this week: ${networkTouches} of ${WEEK_TARGETS.networkTouches}.`,
      fix: "Send two LinkedIn touches today.",
    },
    {
      name: "Consistency",
      value: Math.min(1, week.activeDays / WEEK_TARGETS.activeDays),
      copy: `Active days this week: ${week.activeDays} of ${WEEK_TARGETS.activeDays}; streak ${snapshot.streak}.`,
      fix: "Clear at least one quest today to keep the chain alive.",
    },
  ];
  const score = Math.round((dims.reduce((sum, dim) => sum + dim.value, 0) / dims.length) * 100);
  const worst = dims.reduce((low, dim) => (dim.value < low.value ? dim : low), dims[0]);
  return {
    status: score >= 70 ? "aligned" : score >= 45 ? "at-risk" : "off-track",
    score,
    observations: dims
      .slice()
      .sort((a, b) => a.value - b.value)
      .slice(0, 3)
      .map((dim) => `${dim.name}: ${dim.copy}`),
    correction: worst.fix,
  };
}

export function buildFallbackLearningPlan(snapshot: CoachSnapshot): LearningPlan {
  const covered = new Set(snapshot.topicsCovered.map((topic) => topic.toLowerCase()));
  const upcoming = CURRICULUM.filter((entry) => ![...covered].some((topic) => topic.includes(entry.topic.toLowerCase())));
  const blocks = (upcoming.length ? upcoming : CURRICULUM).slice(0, 4).map((entry, index) => ({
    skill: entry.skill,
    task: `${entry.topic} — ${entry.question}`,
    status: (index === 0 ? "next" : "upcoming") as "next" | "upcoming",
    minutes: 45,
    links: LINKS[entry.topic] ?? [],
  }));
  return {
    summary: "Advance the AI-automation curriculum one exact sub-topic at a time; every block ends in a written or built output.",
    covered: snapshot.topicsCovered.slice(0, 5).map((topic) => topic.split(" — ")[0]),
    weekFocus: [blocks[0]?.skill ?? "RAG", "Interview speaking", "Portfolio proof"],
    blocks,
    interviewPrep: [
      "Record a 60-second 'tell me about yourself' aimed at AI automation roles.",
      "Answer 5 LLM/RAG interview questions out loud and score clarity out of 10.",
      "Write STAR stories for 2 projects you shipped, with one metric each.",
    ],
  };
}

export function buildFallbackDietPlan(): DietPlan {
  return {
    summary: "Small calorie surplus with protein at every meal: vegetarian plus eggs, home food only.",
    rules: [
      "Protein with every meal: eggs, paneer, dal, curd, sprouts or peanuts.",
      "Banana + milk shake daily between meals; add tomato to salads.",
      "No outside food; if it happens, log it and return to home food the next meal.",
    ],
    days: [
      { day: "Mon", breakfast: ["Banana milkshake", "2 eggs or poha with peanuts"], lunch: ["Dal", "rice", "paneer sabzi", "curd"], dinner: ["2 chapati", "rajma", "salad"], snacks: ["Banana", "handful of peanuts"] },
      { day: "Tue", breakfast: ["Oats with milk and banana", "boiled egg"], lunch: ["Chole", "rice", "curd"], dinner: ["2 chapati", "mix-veg sabzi", "dal"], snacks: ["Sprouts chaat", "milk"] },
      { day: "Wed", breakfast: ["Besan chilla", "banana milkshake"], lunch: ["Rice", "sambar", "curd", "salad"], dinner: ["2 chapati", "paneer bhurji"], snacks: ["Roasted chana", "banana"] },
      { day: "Thu", breakfast: ["Upma with peanuts", "boiled egg"], lunch: ["Rajma", "rice", "curd"], dinner: ["2 chapati", "dal fry", "tomato salad"], snacks: ["Peanut butter toast", "milk"] },
      { day: "Fri", breakfast: ["Poha with sprouts", "banana milkshake"], lunch: ["Paneer curry", "rice", "curd"], dinner: ["2 chapati", "egg curry or dal", "salad"], snacks: ["Banana", "curd"] },
      { day: "Sat", breakfast: ["Idli with sambar", "boiled egg"], lunch: ["Veg pulao", "raita", "dal"], dinner: ["2 chapati", "palak paneer"], snacks: ["Sprouts", "milk"] },
      { day: "Sun", breakfast: ["Paratha with curd", "banana milkshake"], lunch: ["Dal khichdi", "curd", "salad"], dinner: ["2 chapati", "mix-veg", "paneer"], snacks: ["Peanuts", "banana"] },
    ],
  };
}


const KEYWORD_MAP: { words: string[]; topic: string }[] = [
  { words: ["chunk"], topic: "Chunk-size trade-offs" },
  { words: ["sampling", "temperature", "top-p", "structured output", "json schema", "prompt"], topic: "Prompt design and strict structured output" },
  { words: ["embedding", "vector"], topic: "Embeddings and vector search basics" },
  { words: ["retrieval", "recall", "evaluation", "mrr"], topic: "Retrieval evaluation" },
  { words: ["rerank", "hybrid", "bm25"], topic: "Reranking and hybrid search" },
  { words: ["tool", "function call"], topic: "Tool calling and function schemas" },
  { words: ["agent", "react", "loop"], topic: "Agent loops and hard stopping conditions" },
  { words: ["n8n", "idempot", "retry", "retries"], topic: "n8n reliability: retries and idempotency" },
  { words: ["docker", "ec2", "deploy", "container"], topic: "Docker and EC2 deployment basics" },
  { words: ["latency", "cost", "caching", "cache", "system design"], topic: "AI system design: latency, cost and caching" },
  { words: ["interview", "story", "explain", "behaviour", "behavior"], topic: "Explaining your shipped AI systems" },
  { words: ["token", "context window", "attention"], topic: "Tokens, context windows and attention limits" },
];

const GENERIC_LINKS: LearnLink[] = [
  { title: "Prompting Guide · Learn", url: "https://www.promptingguide.ai/" },
  { title: "HuggingFace · Courses", url: "https://huggingface.co/learn" },
];

export function linksForText(text: string): LearnLink[] {
  const lower = text.toLowerCase();
  for (const mapping of KEYWORD_MAP) {
    if (mapping.words.some((word) => lower.includes(word))) {
      return LINKS[mapping.topic] ?? GENERIC_LINKS;
    }
  }
  return GENERIC_LINKS;
}

export function ensurePlanLinks(plan: DailyPlan): DailyPlan {
  return {
    ...plan,
    links: plan.links?.length ? plan.links : linksForText(`${plan.focus} ${plan.focusQuestion}`),
    items: plan.items.map((item) => ({
      ...item,
      links: item.links?.length ? item.links : linksForText(`${item.title} ${item.question}`),
    })),
  };
}

export function ensureLearningLinks(plan: LearningPlan): LearningPlan {
  return {
    ...plan,
    blocks: plan.blocks.map((block) => ({
      ...block,
      links: block.links?.length ? block.links : linksForText(`${block.skill} ${block.task}`),
    })),
  };
}
