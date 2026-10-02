# Life Gamify MVP

A mobile-first personal progression system for a 90-day campaign: become interview-ready for AI engineering roles while improving English speaking and building sustainable health habits.

## Quick start

```bash
pnpm install
pnpm dev
```

Then open the Expo web preview at `http://localhost:8081`, or use Expo Go with the native development command.

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Start Expo/Metro and the API server |
| `pnpm dev:metro` | Start Expo/Metro only on port 8081 |
| `pnpm dev:server` | Start the API server only on port 3000 |
| `pnpm android` | Start the Android development target |
| `pnpm ios` | Start the iOS development target (macOS/Xcode required) |
| `pnpm check` | Run TypeScript validation |
| `pnpm lint` | Run Expo ESLint |
| `pnpm test` | Run Vitest |
| `pnpm db:push` | Generate and migrate database schema when needed |

## Local testing

Use the four tabs to test the full loop:

1. **Command** — see campaign state and next action.
2. **Quests** — complete Career, English, and Health missions using Full, Partial, or Minimum.
3. **Tracks** — save English feedback and health/weight entries.
4. **Review** — save the nightly check-in, review weekly progress, claim unlocked rewards, or reset local test data.

Progress is local-first and stored in AsyncStorage. It is not synced between devices.

See [`AGENTS.md`](./AGENTS.md) for the complete local-development guide and contribution rules.
