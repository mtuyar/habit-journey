# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start           # expo start — Metro bundler with QR for device / simulator menu
npm run ios         # expo start --ios
npm run android     # expo start --android
npm run web         # expo start --web
npm run lint        # expo lint (ESLint, expo flat config)
```

No test runner and no typecheck script are configured — run `npx tsc --noEmit` manually for a type-check pass.

`npm run reset-project` is a starter-template script (`scripts/reset-project.js`) that moves the current `app/` aside into `app-example/` and scaffolds a blank one. **Do not run it** — it would wipe the working app. It is a leftover from `create-expo-app`.

EAS build profiles live in `eas.json` (development / preview / production). The production profile auto-increments build numbers.

## Architecture

**Habit Journey** is an **Expo Router** app (file-based routing under `app/`, typed routes enabled in `app.json`) styled with **NativeWind v4**. Users set goals, break them into sequential stages, and track daily task completions; AI (Gemini) generates roadmaps automatically. Offline-first — there is no backend; all state lives in two Zustand stores persisted to AsyncStorage.

### Data Model (`store/useProgressStore.ts`)

Core hierarchy: **Goal → Groups (stages) → Tasks**

- A `Goal` has multiple `Group` stages, each with a `status`: `locked | active | completed | failed`.
- `GroupProgress` is a nested map: `Record<date_string, Record<task_id, boolean>>`.
- Persisted to AsyncStorage under key `habit-journey-zen-storage`.
- **Stage unlocking is automatic and lives inside `toggleTaskCompletion`** (not in a separate action): when a group's completion ratio crosses 0.9 it flips to `completed` and the next `locked` group is auto-set to `active` with `startDate = now`. The exported `evaluateGroupCompletion` is intentionally a no-op placeholder. Don't duplicate that logic elsewhere.

Pure stat helpers exported from `useProgressStore.ts` (use these instead of recomputing inline): `computeStreak`, `getTodayProgress`, `getThisWeekStats`, `getBestStreak`, `getOverallCompletionRate`, `getTotalCompletedTasks`, `getActivityHeatmap`, `getThisWeekDayStats`, `getPerfectDayStats`, `getTotalActiveDays`.

**`getTodayProgress` important rule:** Only counts groups where today falls within `[startDate, startDate + durationInDays - 1]`. Groups that are `active` but whose duration has already elapsed are excluded.

### State (`store/`)

Two Zustand stores, both persisted via AsyncStorage:

- `useProgressStore` — goals, groups, task completion, streak/stats logic.
- `useSettingsStore` — language (`tr` | `en`), dark mode, font scale, Gemini API key, notification time, `hasCompletedOnboarding`. Persisted under `habit-journey-settings-storage`.
  - `setNotificationsEnabled` / `setNotificationTime` have **side effects**: they call into `lib/notifications.ts` to schedule or cancel the daily reminder. Keep that wiring in the store setters — don't schedule notifications from screens.

### Screens (`app/`)

`app/_layout.tsx` defines a single `Stack`.

| Route | Purpose |
|---|---|
| `index.tsx` | Dashboard — goal cards, streak badge, today's focus |
| `onboarding.tsx` | First-launch: language + Gemini API key setup |
| `create.tsx` | Modal — create/edit a goal manually or via AI |
| `goal/[id].tsx` | Journey map showing all stages as nodes |
| `group/[id].tsx` | Daily checklist for a specific stage |
| `insights.tsx` | Stats, achievements, activity heatmap |
| `settings.tsx` | Appearance, notifications, language, danger zone |

Navigation gate: `index.tsx` redirects to `/onboarding` if `hasCompletedOnboarding === false` using `<Redirect />` rather than imperative router calls — the previous attempt at gating from the layout caused issues (see commit `fbb19c8`).

### Create/Edit Flow

`create.tsx` handles both creating and editing goals (via `?editGoalId=<id>`). Stage list supports:
- In-place edit (`editingGroupIndex` state) — pencil icon on a stage loads it into the form without removing it from the list.
- Reorder with up/down arrows (`moveGroupUp` / `moveGroupDown`).
- When `editingGroupIndex !== null`, the save button becomes "Güncelle" and a Cancel button appears.

`goal/[id].tsx` has a single edit button (create-outline icon) that navigates to `/create?editGoalId=`. Inline name editing was removed — full edit via `create.tsx` only.

### AI Integration (`lib/ai.ts`)

Calls Google's Generative AI SDK with model `gemini-2.5-flash`, using the user-supplied API key from `useSettingsStore.geminiApiKey` (entered during onboarding or in settings, stored in AsyncStorage — note: not in SecureStore, despite the dependency being installed). The system prompt is in Turkish and instructs the model to return raw JSON (no markdown fences); the parser strips ` ```json ` fences defensively.

- Throws `Error('NO_API_KEY')` when the key is empty — surface that distinctly in UI flows.
- Trim the key before passing to the SDK — invisible trailing spaces cause a 404 "model not found" error.

### Theming and Styling

- NativeWind config in `tailwind.config.js`. Teal palette exposed as `journey*` color tokens: `journeyBg`, `journeyAccent` (`#0D9488`), `journeyText`, `journeyMuted`, `journeyBorder`, `journeyCard`, `journeyGold`, `journeySuccess`, plus `journeyDark*` counterparts. Reuse these tokens — don't introduce ad-hoc hex codes in className strings.
- Dark mode uses Tailwind's `class` strategy. `ThemeController` in `app/_layout.tsx` syncs `useSettingsStore.isDarkMode` → `nativewind`'s `setColorScheme`. Components branch via `dark:` variants.
- `app/global.css` is imported once in the root layout and bundled by `metro.config.js` via `withNativeWind`.

### Custom `Text` Component

**Always import `Text` from `@/components/ui/Text`, not from `react-native`.** This wrapper reads `fontScale` from settings and, when scale ≠ 1.0, parses the Tailwind `text-*` / `leading-*` class to compute a scaled `fontSize`/`lineHeight` style override. Plain `RNText` won't respect the user's accessibility scale.

The supported size classes it can parse are `text-xs`…`text-4xl` and `text-[<px>px]`. If you use a size class outside that set the scale won't apply.

### i18n (`lib/i18n.ts`)

Hand-rolled translator: a `dictionaries` object with `tr` and `en` keys, exposed via `useTranslation()` which reads `language` from `useSettingsStore`. **Add new strings to both `tr` and `en` dictionaries** — there is no fallback locale, missing keys render as the key string. Default language is `tr`. Never hardcode user-visible text.

### Path alias

`@/*` resolves to the repo root (see `tsconfig.json`). Use `@/components/...`, `@/store/...`, `@/lib/...` rather than relative imports.

### Dev Test Data

`lib/testData.ts` exports `generateTestGoals()` — 4 goals with realistic historical progress:
1. "Sabah Rutini Ustası" — 2 stages, stage 1 completed, stage 2 active (14 days, all done)
2. "Günlük Okuma" — fresh, 2nd stage locked
3. "28 Günlük Spor Meydan Okuması" — fully completed (triggers Champion achievement)
4. "90 Günlük Sağlık Programı" — 4 stages spanning Feb–May; first 3 completed, stage 4 active in April

Loaded via Settings → 🧪 Test Verisi Yükle (only visible in `__DEV__` mode). Merges with existing data, replacing previous test goals.

### Conventions worth knowing

- The starter-template files `components/themed-text.tsx`, `themed-view.tsx`, `parallax-scroll-view.tsx`, `hello-wave.tsx`, `external-link.tsx`, `haptic-tab.tsx`, and `components/ui/collapsible.tsx` / `icon-symbol*.tsx` are leftovers from `create-expo-app` and aren't used by the actual screens. Prefer the in-use primitives in `components/ui/` (`Text`, `Button`, `Card`, plus `cn()` from `Card.tsx` which wraps `clsx + tailwind-merge`) and the `JourneyNode` component.
- Animations use `react-native-reanimated` v4 + worklets (`react-native-worklets`). The Reanimated babel plugin is required and is set up in `babel.config.js`.
- Haptics: `expo-haptics` is wired into task-completion flows on the group detail screen; mirror that pattern for new interactive moments.
- New Architecture is enabled (`newArchEnabled: true` in `app.json`) and `expo-router` typed routes are on — `router.push('/goal/${id}')` etc. are type-checked.
