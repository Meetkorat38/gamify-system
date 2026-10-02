# Life Gamify — Session Summary

A quick record for Meet Korat: what was built, how much time went into it, and what the OpenRouter AI layer costs.

## What this is

Life Gamify is a mobile-first Expo app that turns Meet's 90-day campaign (₹3.6 LPA → ₹6–7 LPA AI-automation roles, 56 → 60 kg, daily English practice) into a gamified daily loop: an agent-style mission hero with one exact topic and a specific question per day, quest XP with weekly reward locks, a career/English/health tracker set, and AI plans for diet and learning with per-topic reference links. It is a local-first MVP: all progress lives on the device (AsyncStorage), the AI coach runs through a small Express/tRPC API that calls OpenRouter, and a built-in curriculum engine keeps the app useful even with no key or no network.

## Time spent

Work ran across roughly 25 hours of wall-clock (Oct 1, 22:50 IST → Oct 2, 23:45 IST) in four active blocks, about **9.5 hours of build time** total:

| Block | When (IST) | Focus | Time |
| --- | --- | --- | --- |
| 1 | Oct 1, 22:50 → Oct 2, 02:10 | Planning, design system, full MVP (dashboard, quests, tracks, review, XP/streak/reward logic) | ~3h 20m |
| 2 | Oct 2, 07:42 → 08:31 | Health check of the running app, local test loop fixes, README/AGENTS.md | ~50m |
| 3 | Oct 2, 08:39 → 12:07 | Feature expansion (Learn tab, English scorecard, health fuel), AI coach on OpenRouter, automatic daily missions, GitHub push | ~3h 30m |
| 4 | Oct 2, 18:25 → 20:05 | Minimalist redesign with illustrations, learning-resource links, custom food logging | ~1h 40m |
| 5 | Oct 2, 23:37 → 23:45 | Shutdown, final push, this summary | ~15m |

## AI model and cost (OpenRouter)

The app's coach calls OpenRouter in this order (overridable with `OPENROUTER_MODEL`): **deepseek/deepseek-v4.1-flash** → deepseek/deepseek-v4-pro → meta/muse-spark-1.3 → deepseek/deepseek-v4-flash → free fallbacks (google/gemma-4-31b-it:free, qwen/qwen3.8-27b:free). All live testing and app calls used **deepseek/deepseek-v4.1-flash**; MiMo v2.6 was not used by the project, but is priced below since it was asked about.

OpenRouter prices per 1M tokens (from the live model catalog, Oct 2):

| Model | Input / 1M | Output / 1M | Used by app |
| --- | --- | --- | --- |
| deepseek/deepseek-v4.1-flash | $0.02 | $0.60 | Yes (primary) |
| xiaomi/mimo-v2.6-flash | $0.14 | $0.28 | No |
| xiaomi/mimo-v2.6-pro | $0.435 | $0.87 | No |
| xiaomi/mimo-v2.6-pro-ultraspeed | $4.35 | $8.70 | No |
| meta/muse-spark-1.3 | $1.25 | $4.25 | Fallback only |

Account figures read live from the OpenRouter API (`/auth/key` and `/credits`) at the time of writing: this key shows **total usage 2.37** (daily 1.43, weekly 2.37), and the account shows **277.36 of 300 credits used all-time** (most of that predates this project). The project's own share — roughly 25–30 cached coach calls (daily plan, alignment, diet, learning, plus testing), each with a few thousand prompt tokens and short outputs — is estimated at about **$0.02–0.05** at DeepSeek v4.1-Flash pricing. Plans are cached per day/week in the app, so a normal day makes only 2–4 AI calls and typically costs well under one cent.

To move the coach to MiMo v2.6 instead, set `OPENROUTER_MODEL=xiaomi/mimo-v2.6-flash` (or `-pro`): roughly 7x the input price and half the output price of the current model, still in the same cheap tier.
