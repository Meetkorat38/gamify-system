# Life Gamify MVP — Implementation & Design Plan

## Product scope

Life Gamify is a mobile-first personal progression system for Meet's 90-day campaign: become interview-ready for ₹6–7 LPA AI engineering roles while improving English speaking and building sustainable health/weight-gain habits. The MVP is local-first for fast testing: no login, no backend dependency for core state, and no complex productivity database.

## Design direction

- **Design movement:** Solo Leveling-inspired tactical RPG dashboard, interpreted as a calm professional command center rather than a literal anime replica.
- **Core principles:** decisive next action; forgiving progression; high signal with low maintenance; evidence over vague motivation.
- **Color philosophy:** near-black navy creates a focused “hunter terminal” field; electric cyan marks system intelligence and progress; acid lime signals completed actions and health; violet separates communication/English; amber highlights the current phase and rewards.
- **Layout paradigm:** vertically stacked command cards with a persistent bottom mission rail. The dashboard starts with identity and campaign state, then narrows into progress, main quest, next action, and today’s missions.
- **Signature elements:** bracketed section labels (`// HUNTER PROFILE`), thin neon progress rails, and compact status chips for rank, phase, and recovery mode.
- **Interaction philosophy:** every tap either records evidence or reveals the next action. Quest cards offer full, partial, and minimum routes so a difficult day still counts.
- **Animation:** keep motion restrained and functional: press opacity, progress fill, and a short rank-up pulse can be added later. Avoid decorative motion that increases cognitive load.
- **Typography system:** bold condensed-looking system display hierarchy through weight and uppercase micro-labels; readable system body text for quick one-handed scanning.
- **Brand essence:** a personal command center that turns ambitious life goals into three doable daily missions. Personality: tactical, forgiving, energizing.
- **Brand voice:** direct and supportive. Example lines: “Choose the smallest action that keeps the run alive.” and “Partial progress is still evidence.”
- **Wordmark / mark concept:** a simple angular `L`-shaped quest sigil with a cyan core and lime completion notch; use the current bundled icon until a branded asset is checkpointed.
- **Signature brand color:** electric cyan `#5CE1E6`.

## Technical approach

- Fixed Expo Router / React Native / TypeScript starter, portrait-first.
- `LifeGamifyProvider` in `lib/lifegamify-store.tsx` owns campaign state and serializes it to AsyncStorage.
- Shared visual primitives live in `components/`.
- Four tab routes: Command, Quests, Tracks, Review.
- Local persistence covers quest statuses, XP, streak, check-ins, weight entries, English feedback entries, and reward claims.
- No image generation is required for this internal dashboard MVP; the product is a functional tool, not a marketing page.

## Project structure

- `app/_layout.tsx`: providers and global navigation shell.
- `app/(tabs)/_layout.tsx`: four-tab mission navigation.
- `app/(tabs)/index.tsx`: campaign command center and next action.
- `app/(tabs)/quests.tsx`: daily quest scoring and recovery mode.
- `app/(tabs)/tracks.tsx`: career roadmap, English feedback logger, health habit/weight logger.
- `app/(tabs)/review.tsx`: nightly check-in, weekly review, rewards.
- `lib/lifegamify-store.tsx`: data model, XP rules, recovery rules, AsyncStorage persistence.
- `components/quest-card.tsx`, `components/progress-bar.tsx`: reusable UI units.
- `constants/gamify.ts`: palette, track metadata, rank and phase helpers.

## AI coach layer (OpenRouter)

- **Transport:** tRPC `ai` router (`server/ai.ts`) on the app API server; OpenRouter client in `server/_core/openrouter.ts`; client hook `lib/use-coach.ts` with typed plan shapes in `lib/coach.ts`.
- **Credentials:** `OPENROUTER_API_KEY` stored as a platform secret (never committed, never bundled to the client); optional `OPENROUTER_MODEL` env override. Optional public vars documented in `.env.example`.
- **Model preference (catalog checked 2026-10-02):** `deepseek/deepseek-v4.1-flash` → `meta/muse-spark-1.3` (Muse Spark 2 is not listed on OpenRouter yet) → `deepseek/deepseek-v4-flash` → free fallbacks `google/gemma-4-31b-it:free`, `qwen/qwen3.8-27b:free`, `google/gemma-4-26b-a4b-it:free`. Automatic per-request fallback; 30-minute response cache.
- **Features:**
  - Daily customized to-do list aligned with the long-term (₹6–7 LPA) and weekly goals, with checkable items; regenerated automatically each new day when the app opens (application-native daily automation).
  - Goal-alignment check: aligned / at-risk / off-track, 0–100 score, three observations, one 48-hour correction.
  - Weekly personalized diet plan: vegetarian + eggs, home food only, weight-gain toward the editable goal.
  - Weekly personalized learning plan driven by the skill-gap checklist, with interview-prep items.
- **State snapshots:** compact snapshot builder (`buildCoachSnapshot`) sends only aggregates (week activity, skill states, weight trend, recent English scores) to the model.
