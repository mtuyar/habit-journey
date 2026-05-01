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

**Habit Journey** is an **Expo Router** app (file-based routing under `app/`, typed routes enabled in `app.json`) styled with **Tamagui v2**. Users set goals, break them into sequential stages, and track daily task completions; AI (Gemini) generates roadmaps automatically. Offline-first — there is no backend; all state lives in two Zustand stores persisted to AsyncStorage.

### Data Model (`store/useProgressStore.ts`)

Core hierarchy: **Goal → Groups (stages) → Tasks**

- A `Goal` has multiple `Group` stages, each with a `status`: `locked | active | completed | failed`.
- `GroupProgress` is a nested map: `Record<date_string, Record<task_id, boolean>>`.
- Persisted to AsyncStorage under key `habit-journey-zen-storage`.
- **Stage unlocking is automatic and lives inside `toggleTaskCompletion`** (not in a separate action): when a group's completion ratio crosses 0.9 it flips to `completed` and the next `locked` group is auto-set to `active` with `startDate = now`. The exported `evaluateGroupCompletion` is intentionally a no-op placeholder. Don't duplicate that logic elsewhere.

Pure stat helpers exported from `useProgressStore.ts` (use these instead of recomputing inline): `computeStreak`, `getTodayProgress`, `getThisWeekStats`, `getBestStreak`, `getOverallCompletionRate`, `getTotalCompletedTasks`, `getActivityHeatmap`, `getThisWeekDayStats`, `getPerfectDayStats`, `getTotalActiveDays`, `getMonthActivity`, `getDayTaskDetail`, `getComebackCount`, `getCompletedGoalsCount`, `getCompletedStagesCount`.

**`getTodayProgress` important rule:** Only counts groups where today falls within `[startDate, startDate + durationInDays - 1]`. Groups that are `active` but whose duration has already elapsed are excluded.

### State (`store/`)

Two Zustand stores, both persisted via AsyncStorage:

- `useProgressStore` — goals, groups, task completion, streak/stats logic.
- `useSettingsStore` — language (`tr` | `en`), dark mode, font scale, Gemini API key, notification time, `hasCompletedOnboarding`. Persisted under `habit-journey-settings-storage`.
  - `setNotificationsEnabled` / `setNotificationTime` have **side effects**: they call into `lib/notifications.ts` to schedule or cancel the daily reminder. Keep that wiring in the store setters — don't schedule notifications from screens.

### Screens (`app/`)

`app/_layout.tsx` wraps the app in `<TamaguiProvider config={config}>` + `<Theme name={isDarkMode ? "dark" : "light"}>`, then defines a single `Stack`. The `BottomTabBar` is rendered as a sibling to the `Stack` so it floats over every route.

| Route | Purpose |
|---|---|
| `index.tsx` | Dashboard — goal cards, today's focus card, archived goals collapsible |
| `onboarding.tsx` | First-launch: language + Gemini API key setup |
| `create.tsx` | Modal — create/edit a goal manually or via AI |
| `goal/[id].tsx` | Journey map showing all stages as nodes |
| `group/[id].tsx` | Daily checklist for a specific stage (day-strip and calendar views) |
| `insights.tsx` | Stats, achievements, week strip, monthly heatmap, day detail |
| `settings.tsx` | Appearance, notifications, language, danger zone |

Navigation gate: `index.tsx` redirects to `/onboarding` if `hasCompletedOnboarding === false` using `<Redirect />` rather than imperative router calls — the previous attempt at gating from the layout caused issues (see commit `fbb19c8`).

### Create/Edit Flow

`create.tsx` handles both creating and editing goals (via `?editGoalId=<id>`). Stage list supports:
- In-place edit (`editingGroupIndex` state) — pencil icon on a stage loads it into the form without removing it from the list.
- Reorder with up/down arrows (`moveGroupUp` / `moveGroupDown`).
- When `editingGroupIndex !== null`, the save button label switches and a Cancel button appears.

`goal/[id].tsx` has a single edit button (`create-outline` icon) that navigates to `/create?editGoalId=`. Inline name editing was removed — full edit via `create.tsx` only.

### AI Integration (`lib/ai.ts`)

Calls Google's Generative AI SDK with model `gemini-2.5-flash`, using the user-supplied API key from `useSettingsStore.geminiApiKey` (entered during onboarding or in settings, stored in AsyncStorage — note: not in SecureStore, despite the dependency being installed). The system prompt is in Turkish and instructs the model to return raw JSON (no markdown fences); the parser strips ` ```json ` fences defensively.

- Throws `Error('NO_API_KEY')` when the key is empty — surface that distinctly in UI flows.
- Trim the key before passing to the SDK — invisible trailing spaces cause a 404 "model not found" error.

## Theming and Styling — Tamagui

The app is styled with **Tamagui v2**. There is **no NativeWind / Tailwind**. Don't reintroduce them.

### Config (`tamagui.config.ts`)

Single source of truth — palette, sizes, space, radius, fonts, animations, and the two themes (`light`, `dark`) live there.

**Design philosophy: neutral surfaces, teal as accent only.**
Page bg is slate-50, cards are white, borders are slate-200 — teal is reserved for CTAs, active states, badges, and primary brand moments. Don't sprinkle teal across borders, text, and backgrounds. The dark theme is teal-tinted (matching the prior approved look) but follows the same neutral-vs-accent rule internally.

### Theme tokens (use these, not hex literals)

Reference tokens via `$tokenName` in Tamagui props or via `useTheme().tokenName.val` when you need a hex string (e.g. for `Ionicons` `color`).

| Token | Light | Dark | Usage |
|---|---|---|---|
| `$bg` | `slate50` | `#07211F` | Screen background |
| `$surface` | `#FFFFFF` | `#0E3330` | Card / panel surface |
| `$surfaceAlt` | `slate100` | `#0A2A28` | Inset rows, pill backgrounds |
| `$border` | `slate200` | `#1B5E58` | Default border |
| `$borderStrong` | `slate300` | `#2A7A72` | Stronger separator |
| `$text` | `slate900` | `#CCFBF1` | Primary text |
| `$textMuted` | `slate500` | `#94B8B5` | Secondary text |
| `$textSubtle` | `slate400` | `#5F8B8A` | Tertiary / placeholder text |
| `$accent` | `teal600` | `teal500` | Brand — CTAs, active state, links |
| `$accentSoft` | `teal600 @ 9%` | `teal500 @ 15%` | Tinted accent backgrounds |
| `$accentTint` | `teal50` | `teal600 @ 9%` | Soft accent surface |
| `$success` / `$successSoft` | `#059669` | `#10B981` | Completion, perfect-day |
| `$warning` / `$warningSoft` | `#F59E0B` | `#FBBF24` | Partial progress, attention |
| `$danger` / `$dangerSoft` | `#EF4444` | `#F87171` | Errors, destructive |
| `$locked` / `$lockedSoft` | `slate300` / `slate100` | `slate700` / `darkSurfaceAlt` | Locked stage chrome |

Dark/light switching is automatic — write `backgroundColor="$surface"` and Tamagui swaps the underlying value when the `<Theme name>` flips. Don't branch on `isDarkMode` in components.

### Primitives (`components/ui/`)

| Component | Purpose | Notes |
|---|---|---|
| `Text` | Tamagui `Text` wrapper | Multiplies numeric `fontSize` / `lineHeight` props by `useSettingsStore.fontScale`. **Always import from `@/components/ui/Text`**, not from `tamagui` or `react-native` — plain Text won't respect the accessibility scale. Defaults `color="$text"`. |
| `Card` | Standard chassis (`styled(YStack)`) | `$surface` bg, `$border` border, radius 20, soft shadow. Variants: `interactive`, `flush`, `tinted={accent\|success\|warning\|danger\|surface}`. Accent should come from content (badges, progress) — not the card border. |
| `Button` | `styled(XStack)` ButtonFrame + label/spinner wrapper | Variants: `primary` / `secondary` / `outline` / `ghost` / `danger`; sizes `sm` / `md` / `lg`. Supports `iconLeft`, `iconRight`, `loading`. |
| `Badge` | Pill chip | `tone={accent\|success\|warning\|danger\|neutral}` — content uppercase by default. |
| `ProgressBar` | Track + fill | `tone` variants; `inverse` flag for white-on-accent contexts (e.g. inside the today-focus hero card). |
| `Screen` | SafeArea wrapper | Sets `$bg` and a flex frame. Use directly or copy the SafeAreaView pattern. |

**Don't use `<Stack>`** — it doesn't exist in Tamagui v2. Use `<YStack>` (vertical) or `<XStack>` (horizontal). For row/column-agnostic layouts, fall back to `<View>` from `tamagui`.

### Layout shape

Most screens follow:

```
<SafeAreaView style={{ flex: 1, backgroundColor: theme.bg.val }}>
  <YStack ...header chrome>...</YStack>
  <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
    ...content with Card / YStack / XStack...
  </ScrollView>
</SafeAreaView>
```

`paddingBottom: 110` accounts for the floating `BottomTabBar`. `BottomTabBar.tsx` already floors its bottom inset at `Math.max(Platform.OS === "android" ? 36 : 14, insets.bottom)` to avoid clipping on Android nav-bar gesture handles — preserve that.

### Ionicons

Ionicons takes a hex string `color`, not a Tamagui token. Pull it via `useTheme()`:

```tsx
const theme = useTheme();
const accent = theme.accent?.val ?? "#0D9488"; // fallback for safety
<Ionicons name="leaf" size={18} color={accent} />
```

Keep a fallback hex — `theme.foo?.val` returns `undefined` outside a `<Theme>` context (rare, but cheap to guard).

### styled() patterns

Define styled components once at module scope, not per-render:

```tsx
const ChipFrame = styled(YStack, {
  name: "ChipFrame",
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 999,
  backgroundColor: "$surfaceAlt",
  variants: {
    tone: {
      accent: { backgroundColor: "$accentSoft" },
    },
  } as const,
});
```

`as const` on `variants` is required for variant-name autocomplete. Don't put `animation` inside the styled config (Tamagui v2 disallows it there) — set it on the instance instead.

### Build wiring

- **Babel** (`babel.config.js`): includes `@tamagui/babel-plugin` with `components: ["tamagui"]` and `config: "./tamagui.config.ts"`. The Reanimated plugin is also required (must be last).
- **Metro** (`metro.config.js`): wraps with `withTamagui({ ...config, isCSSEnabled: true })`.
- **Provider** (`app/_layout.tsx`): the root must be `<TamaguiProvider config={config}>` → `<Theme name={...}>` → tree.

If you change `tamagui.config.ts`, you may need to clear the Metro cache (`npx expo start -c`) for new tokens to surface.

## Custom `Text` Component

`components/ui/Text.tsx` wraps Tamagui's `Text`. It reads `fontScale` from `useSettingsStore`, and when scale ≠ 1.0 it multiplies any **numeric** `fontSize` / `lineHeight` prop by the scale. String tokens (`fontSize="$5"`) are passed through unchanged — the token system handles them.

Always pass numeric sizes as numbers (`fontSize={14}`) when you want them scaled by the accessibility setting. Plain `Text` from `tamagui` or `react-native` skips this scaling.

## i18n (`lib/i18n.ts`)

Hand-rolled translator: a `dictionaries` object with `tr` and `en` keys, exposed via `useTranslation()` which reads `language` from `useSettingsStore`. **Add new strings to both `tr` and `en` dictionaries** — there is no fallback locale, missing keys render as the key string. Default language is `tr`. Never hardcode user-visible text.

## Path alias

`@/*` resolves to the repo root (see `tsconfig.json`). Use `@/components/...`, `@/store/...`, `@/lib/...` rather than relative imports.

## Dev Test Data

`lib/testData.ts` exports `generateTestGoals()` — 4 goals with realistic historical progress:
1. "Sabah Rutini Ustası" — 2 stages, stage 1 completed, stage 2 active (14 days, all done)
2. "Günlük Okuma" — fresh, 2nd stage locked
3. "28 Günlük Spor Meydan Okuması" — fully completed (triggers Champion achievement)
4. "90 Günlük Sağlık Programı" — 4 stages spanning Feb–May; first 3 completed, stage 4 active in April

Loaded via Settings → 🧪 Test Verisi Yükle (only visible in `__DEV__` mode). Merges with existing data, replacing previous test goals.

## Conventions worth knowing

- The starter-template files `components/themed-text.tsx`, `themed-view.tsx`, `parallax-scroll-view.tsx`, `hello-wave.tsx`, `external-link.tsx`, `haptic-tab.tsx`, and `components/ui/collapsible.tsx` / `icon-symbol*.tsx` are leftovers from `create-expo-app` and aren't used by the actual screens. Prefer the in-use primitives in `components/ui/` and the `JourneyNode` / `BottomTabBar` components.
- A deprecated `cn()` helper still re-exports from `components/ui/Card.tsx` for migration safety. **Don't use it in new code** — styling lives in Tamagui themes / `styled()` components, not in className strings.
- Animations use `react-native-reanimated` v4 + worklets (`react-native-worklets`). The Reanimated babel plugin is required and is set up in `babel.config.js` (must be the **last** plugin, after the Tamagui plugin).
- Haptics: `expo-haptics` is wired into task-completion flows on the group detail screen; mirror that pattern for new interactive moments.
- New Architecture is enabled (`newArchEnabled: true` in `app.json`) and `expo-router` typed routes are on — `router.push('/goal/${id}')` etc. are type-checked.
