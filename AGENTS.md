# AGENTS.md

## Project

Life Gamify is a mobile-first Expo Router app that turns a 90-day career, English-speaking, and health plan into daily quests. Core progress is local-first and persisted on the device with AsyncStorage.

## Local development

### Prerequisites

- Node.js 22 or a compatible current LTS release
- pnpm 9 (`corepack enable` can be used if pnpm is not installed)
- Expo Go on a physical phone, or an Android/iOS simulator
- A terminal opened at the repository root

### Install

```bash
pnpm install
```

### Start the development app

```bash
pnpm dev
```

This starts:

- Expo web preview on `http://localhost:8081`
- Development API server on `http://localhost:3000`

For a phone connected to the same network, use the Expo CLI's LAN/tunnel options or run the native scripts below.

### Start only one service

```bash
pnpm dev:metro     # Expo web/Metro on port 8081
pnpm dev:server    # API server on port 3000
```

### Run on a device or simulator

```bash
pnpm android       # Android emulator or connected Android device
pnpm ios           # iOS simulator; macOS/Xcode required
```

You can also run `npx expo start` and scan the QR code with Expo Go. Keep the phone and development computer on the same network when using LAN mode.

## Validation commands

Run these before committing changes:

```bash
pnpm check        # TypeScript
pnpm lint         # Expo ESLint
pnpm test         # Vitest tests
pnpm db:push      # Only when database schema changes or database setup is needed
```

## Useful local test flow

1. Open the Command tab.
2. Open Quests and choose Full, Partial, or Minimum for each mission.
3. Confirm XP, clear rate, and streak update.
4. Open Tracks and save an English feedback entry and a weight entry.
5. Open Review, choose energy, enter tomorrow's first action, and save the check-in.
6. Use `RESET LOCAL TEST DATA` on Review to restart the local test loop.

## Project structure

- `app/_layout.tsx` — providers and root navigation
- `app/(tabs)/_layout.tsx` — Command, Quests, Tracks, and Review tabs
- `app/(tabs)/index.tsx` — campaign command center
- `app/(tabs)/quests.tsx` — daily quest actions and XP
- `app/(tabs)/tracks.tsx` — career, English, and health logging
- `app/(tabs)/review.tsx` — nightly check-in and rewards
- `lib/lifegamify-store.tsx` — local state, XP rules, recovery, and persistence
- `constants/gamify.ts` — palette, tracks, rank, and campaign helpers
- `components/` — reusable UI components

## Data and secrets

- Core MVP progress is stored locally in the browser/device; there is no login required for the core flow.
- Never commit `.env`, `.env.local`, API keys, database credentials, or tokens.
- Use `.env.example` for any new non-secret variable documentation.
- Do not place server-only secrets in `app.config.ts` or other Expo client-bundled files.

## Change guidelines

- Preserve the existing Expo/React Native/TypeScript stack.
- Keep the app portrait-first and usable with one hand.
- Prefer reversible local-first changes for MVP features.
- Keep full, partial, and minimum quest routes intact; difficult days should still be able to earn progress.
- Run `pnpm check` and `pnpm lint` after source changes.
