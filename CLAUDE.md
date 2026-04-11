# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npx expo start          # Start dev server (scan QR with Expo Go)
npx expo start --ios    # iOS simulator
npx expo start --android
npm run lint            # ESLint via expo lint
```

No test suite is configured.

## Architecture

**Habit Journey** is an Expo Router app (file-based routing under `app/`) where users set goals, break them into sequential stages, and track daily task completions. AI (Gemini) generates roadmaps automatically.

### Data Model (`store/useProgressStore.ts`)

The core hierarchy: **Goal → Groups (stages) → Tasks**

- A `Goal` has multiple `Group` stages, each with a `status`: `locked | active | completed | failed`
- Stages unlock sequentially: completing a group with ≥90% task completion auto-unlocks the next one
- `GroupProgress` is a nested map: `Record<date_string, Record<task_id, boolean>>`
- All progress is persisted to AsyncStorage under key `habit-journey-zen-storage`

Pure stat helpers exported from `useProgressStore.ts`: `computeStreak`, `getTodayProgress`, `getThisWeekStats`, `getBestStreak`, `getOverallCompletionRate`, `getTotalCompletedTasks`, `getActivityHeatmap`, `getThisWeekDayStats`, `getPerfectDayStats`, `getTotalActiveDays`.

**`getTodayProgress` important rule:** Only counts groups where today falls within `[startDate, startDate + durationInDays - 1]`. Groups that are `active` but whose duration has already elapsed are excluded.

### State (`store/`)

Two Zustand stores, both persisted via AsyncStorage:

- `useProgressStore` — goals, groups, task completion, streak/stats logic
- `useSettingsStore` — language (`tr` | `en`), dark mode, font scale, Gemini API key, notification time, onboarding flag

### Screens (`app/`)

| Route | Purpose |
|---|---|
| `index.tsx` | Dashboard — goal cards, streak badge, today's focus |
| `onboarding.tsx` | First-launch: language + API key setup (gated by `hasCompletedOnboarding`) |
| `create.tsx` | Modal — create/edit a goal manually or via AI |
| `goal/[id].tsx` | Journey map showing all stages as nodes |
| `group/[id].tsx` | Daily checklist for a specific stage |
| `insights.tsx` | Stats, achievements, activity heatmap |
| `settings.tsx` | Appearance, notifications, language, danger zone |

Navigation gate: `index.tsx` redirects to `/onboarding` if `hasCompletedOnboarding === false`.

### AI Integration (`lib/ai.ts`)

Calls Gemini 2.5 Flash with a Turkish-language system prompt. The API key is stored in `useSettingsStore` (via AsyncStorage — **not** Expo SecureStore, despite what the workspace CLAUDE.md says). Trim the key before passing to the SDK — invisible trailing spaces cause a 404 "model not found" error.

### Styling

NativeWind v4 with a teal palette defined in `tailwind.config.js`. Custom color tokens: `journeyBg`, `journeyAccent` (`#0D9488`), `journeyText`, `journeyMuted`, `journeyBorder`, `journeyCard`, `journeyGold`, `journeySuccess`, and their `journeyDark*` counterparts. Dark mode uses `darkMode: 'class'`, toggled by `useColorScheme` from NativeWind in `_layout.tsx`.

### Custom `Text` Component (`components/ui/Text.tsx`)

Wraps RN's `Text` to apply global `fontScale` from `useSettingsStore`. **Always use this component instead of RN's `Text`** so font scaling works app-wide. It parses Tailwind class names to compute base sizes before scaling.

### i18n (`lib/i18n.ts`)

All UI strings live in `lib/i18n.ts` as a two-language dictionary (`tr` / `en`). Use the `useTranslation()` hook (`const { t } = useTranslation()`) to access strings — never hardcode user-visible text.

### Create/Edit Flow

`create.tsx` handles both creating and editing goals (via `?editGoalId=<id>`). Stage list supports:
- In-place edit (`editingGroupIndex` state) — pencil icon on a stage loads it into the form without removing it from the list
- Reorder with up/down arrows (`moveGroupUp` / `moveGroupDown`)
- When `editingGroupIndex !== null`, the save button becomes "Güncelle" and a Cancel button appears

`goal/[id].tsx` has a single edit button (create-outline icon) that navigates to `/create?editGoalId=`. Inline name editing was removed — full edit via `create.tsx` only.

### Dev Test Data

`lib/testData.ts` exports `generateTestGoals()` — 4 goals with realistic historical progress:
1. "Sabah Rutini Ustası" — 2 stages, stage 1 completed, stage 2 active (14 days, all done)
2. "Günlük Okuma" — fresh, 2nd stage locked
3. "28 Günlük Spor Meydan Okuması" — fully completed (triggers Champion achievement)
4. "90 Günlük Sağlık Programı" — 4 stages spanning Feb–May; first 3 completed, stage 4 active in April

Loaded via Settings → 🧪 Test Verisi Yükle (only visible in `__DEV__` mode). Merges with existing data, replacing previous test goals.
