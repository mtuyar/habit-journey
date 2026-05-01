# Habit Journey

An offline-first habit and goal tracker built with Expo Router and Tamagui. Set a long-term goal, break it into sequential stages, and check off daily tasks. An optional Gemini integration generates a stage-by-stage roadmap from a single sentence.

Bilingual interface (Türkçe / English), neutral surfaces with teal accents, and a dark theme.

## Tech stack

- **Expo SDK 54** with **Expo Router** (file-based, typed routes, New Architecture enabled)
- **Tamagui v2** for theming, primitives, and styled components
- **Zustand** with `persist` middleware on top of **AsyncStorage** for offline-first state
- **Google Generative AI** (`gemini-2.5-flash`) for AI-assisted journey planning
- **expo-notifications** for daily reminders, **expo-haptics** for task completion feedback
- **react-native-reanimated v4** for transitions

There is no backend — all goals, progress, and settings live on-device.

## Getting started

```bash
npm install
npm start
```

The Metro CLI will print options to launch on iOS, Android, web, or a development build. For native Expo modules used in this project (notifications, haptics, dev-client) you'll want a development build rather than Expo Go:

```bash
npm run ios       # iOS simulator
npm run android   # Android emulator
npm run web       # web preview
```

### Gemini API key (optional)

The "AI ile Otonom Planla" / "Generate with AI" flow on the create screen needs a Gemini API key. The user enters it during onboarding (or later in Settings) — it is stored in AsyncStorage on-device. Without a key the app still works as a fully manual habit tracker.

Get a free key from [Google AI Studio](https://aistudio.google.com/app/apikey).

## Scripts

| Command | Purpose |
|---|---|
| `npm start` | Metro bundler with QR for device / simulator menu |
| `npm run ios` / `android` / `web` | Launch a specific platform |
| `npm run lint` | `expo lint` (ESLint flat config) |
| `npm run icons` | Regenerate app icons from the SVG source |
| `npx tsc --noEmit` | Type-check (no script wired) |

EAS build profiles (`development`, `preview`, `production`) are defined in `eas.json`. Production auto-increments build numbers.

## Project layout

```
app/                  Expo Router screens
  _layout.tsx         Root stack + Tamagui provider + theme switch
  index.tsx           Dashboard — goals, today's focus, archived list
  onboarding.tsx      First-launch language + API key setup
  create.tsx          Create / edit a goal (manual or AI-assisted)
  goal/[id].tsx       Journey map of all stages for a goal
  group/[id].tsx      Daily checklist for a stage
  insights.tsx        Stats, achievements, heatmap, streak history
  settings.tsx        Appearance, notifications, language, danger zone
components/
  BottomTabBar.tsx    Floating bottom navigation
  JourneyNode.tsx     Stage node on the goal map
  ui/                 Tamagui primitives: Text, Button, Card, Badge,
                      IconButton, ProgressBar, Screen
store/
  useProgressStore.ts Goals + groups + tasks + stat helpers
  useSettingsStore.ts Language, theme, notifications, API key
lib/
  ai.ts               Gemini roadmap generation
  i18n.ts             tr/en dictionaries + useTranslation()
  notifications.ts    Daily reminder scheduling
  quotes.ts           Inline motivational quotes
tamagui.config.ts     Single source of truth for tokens & themes
```

## Data model

```
Goal
 └─ Group (stage)            status: locked | active | completed | failed
     ├─ Tasks                daily checklist items
     └─ Progress             Record<dateString, Record<taskId, boolean>>
```

Stage unlocking is automatic: when a stage's completion ratio crosses **0.9**, it flips to `completed` and the next `locked` stage is auto-set to `active` with `startDate = now`. This logic lives inside `toggleTaskCompletion` in `store/useProgressStore.ts`.

Stat helpers (streaks, weekly stats, heatmaps, achievements) are exported as pure functions from the same file — use those instead of recomputing inline.

## Theming

All colors flow through Tamagui theme tokens (`$bg`, `$surface`, `$accent`, `$text`, `$textMuted`, `$success`, `$warning`, `$danger`, …). Light and dark themes are defined in `tamagui.config.ts`; switching is automatic when the user toggles dark mode in Settings — components don't branch on `isDarkMode`.

Design rule: **neutral surfaces, teal as accent only**. Page backgrounds are slate, cards are surface, borders are subtle. Teal is reserved for CTAs, active states, badges, and primary brand moments.

For Ionicons (which take a hex string `color`, not a token), pull from `useTheme()`:

```tsx
const theme = useTheme();
<Ionicons name="leaf" size={18} color={theme.accent?.val ?? "#0D9488"} />
```

## i18n

Hand-rolled translator in `lib/i18n.ts` with `tr` and `en` dictionaries. Default language is Turkish. Add new strings to **both** dictionaries — there is no fallback locale, missing keys render as the key itself.

Use `useTranslation()` and the locale-aware `upper()` helper for uppercase strings (so İ/I render correctly with Turkish locale rules):

```tsx
const { t, upper } = useTranslation();
<Text>{upper(t("currentStages"))}</Text>
```

Don't use CSS `textTransform: "uppercase"` for translatable text — it doesn't apply locale rules.

## Notes for contributors

- Custom `Text` from `@/components/ui/Text` — always import from there. It applies the user's accessibility `fontScale` to numeric `fontSize` / `lineHeight` props. Plain `Text` from `tamagui` or `react-native` skips scaling.
- Tamagui v2 has no `<Stack>`. Use `<YStack>` (vertical) or `<XStack>` (horizontal). For row/column-agnostic layout, fall back to `<View>` from `tamagui`.
- The starter-template files (`themed-text.tsx`, `themed-view.tsx`, `parallax-scroll-view.tsx`, etc.) are leftovers from `create-expo-app` and aren't used. Prefer the in-use primitives in `components/ui/`.
- `npm run reset-project` is a starter-template helper that wipes `app/`. **Don't run it.**
- More architectural detail (data model, Tamagui token table, stage-unlocking logic, build wiring) lives in [`CLAUDE.md`](./CLAUDE.md).
