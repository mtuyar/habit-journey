import React, { useState } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  format,
  addMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
} from "date-fns";
import { tr } from "date-fns/locale";
import { XStack, YStack, useTheme } from "tamagui";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import {
  useProgressStore,
  Goal,
  computeStreak,
  getBestStreak,
  getTotalCompletedTasks,
  getOverallCompletionRate,
  getTotalActiveDays,
  getPerfectDayStats,
  getThisWeekDayStats,
  getMonthActivity,
  getDayTaskDetail,
  getComebackCount,
  getCompletedGoalsCount,
  getCompletedStagesCount,
  DayLevel,
  DayTaskDetail,
} from "@/store/useProgressStore";
import { useTranslation } from "@/lib/i18n";

// ─── Achievement builder ──────────────────────────────────────────────────────
type AchievementProgress = { current: number; total: number };
type Achievement = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  titleKey: string;
  descKey: string;
  unlocked: boolean;
  progress?: AchievementProgress;
};

function buildAchievements(
  goals: Goal[],
  streak: number,
  total: number,
  perfectDayCount: number,
  perfectWeekStreak: number,
  comebacks: number,
  completedGoals: number,
  completedStages: number,
): Achievement[] {
  return [
    { id: "first_journey", icon: "leaf-outline", iconColor: "#22C55E", titleKey: "ach_first_journey_title", descKey: "ach_first_journey_desc", unlocked: goals.length >= 1 },
    { id: "first_task", icon: "checkmark-circle-outline", iconColor: "#16A34A", titleKey: "ach_first_task_title", descKey: "ach_first_task_desc", unlocked: total >= 1 },
    { id: "streak_3", icon: "flame-outline", iconColor: "#F97316", titleKey: "ach_streak_3_title", descKey: "ach_streak_3_desc", unlocked: streak >= 3, progress: { current: Math.min(streak, 3), total: 3 } },
    { id: "streak_7", icon: "moon-outline", iconColor: "#A78BFA", titleKey: "ach_streak_7_title", descKey: "ach_streak_7_desc", unlocked: streak >= 7, progress: { current: Math.min(streak, 7), total: 7 } },
    { id: "streak_14", icon: "moon", iconColor: "#8B5CF6", titleKey: "ach_streak_14_title", descKey: "ach_streak_14_desc", unlocked: streak >= 14, progress: { current: Math.min(streak, 14), total: 14 } },
    { id: "streak_30", icon: "planet-outline", iconColor: "#EAB308", titleKey: "ach_streak_30_title", descKey: "ach_streak_30_desc", unlocked: streak >= 30, progress: { current: Math.min(streak, 30), total: 30 } },
    { id: "streak_60", icon: "leaf", iconColor: "#14B8A6", titleKey: "ach_streak_60_title", descKey: "ach_streak_60_desc", unlocked: streak >= 60, progress: { current: Math.min(streak, 60), total: 60 } },
    { id: "streak_100", icon: "star-outline", iconColor: "#F59E0B", titleKey: "ach_streak_100_title", descKey: "ach_streak_100_desc", unlocked: streak >= 100, progress: { current: Math.min(streak, 100), total: 100 } },
    { id: "tasks_10", icon: "flag-outline", iconColor: "#0EA5E9", titleKey: "ach_tasks_10_title", descKey: "ach_tasks_10_desc", unlocked: total >= 10, progress: { current: Math.min(total, 10), total: 10 } },
    { id: "tasks_50", icon: "list-outline", iconColor: "#8B5CF6", titleKey: "ach_tasks_50_title", descKey: "ach_tasks_50_desc", unlocked: total >= 50, progress: { current: Math.min(total, 50), total: 50 } },
    { id: "tasks_100", icon: "diamond-outline", iconColor: "#6366F1", titleKey: "ach_tasks_100_title", descKey: "ach_tasks_100_desc", unlocked: total >= 100, progress: { current: Math.min(total, 100), total: 100 } },
    { id: "tasks_250", icon: "sparkles-outline", iconColor: "#F59E0B", titleKey: "ach_tasks_250_title", descKey: "ach_tasks_250_desc", unlocked: total >= 250, progress: { current: Math.min(total, 250), total: 250 } },
    { id: "tasks_500", icon: "medal-outline", iconColor: "#CA8A04", titleKey: "ach_tasks_500_title", descKey: "ach_tasks_500_desc", unlocked: total >= 500, progress: { current: Math.min(total, 500), total: 500 } },
    { id: "perfect_day", icon: "sunny-outline", iconColor: "#EC4899", titleKey: "ach_perfect_day_title", descKey: "ach_perfect_day_desc", unlocked: perfectDayCount >= 1 },
    { id: "perfect_week", icon: "calendar-outline", iconColor: "#0D9488", titleKey: "ach_perfect_week_title", descKey: "ach_perfect_week_desc", unlocked: perfectWeekStreak >= 7, progress: { current: Math.min(perfectWeekStreak, 7), total: 7 } },
    { id: "perfect_30", icon: "sparkles", iconColor: "#14B8A6", titleKey: "ach_perfect_30_title", descKey: "ach_perfect_30_desc", unlocked: perfectDayCount >= 30, progress: { current: Math.min(perfectDayCount, 30), total: 30 } },
    { id: "stage_complete", icon: "ribbon-outline", iconColor: "#F59E0B", titleKey: "ach_stage_title", descKey: "ach_stage_desc", unlocked: completedStages >= 1 },
    { id: "five_stages", icon: "layers-outline", iconColor: "#0F766E", titleKey: "ach_five_stages_title", descKey: "ach_five_stages_desc", unlocked: completedStages >= 5, progress: { current: Math.min(completedStages, 5), total: 5 } },
    { id: "goal_complete", icon: "trophy-outline", iconColor: "#A855F7", titleKey: "ach_goal_title", descKey: "ach_goal_desc", unlocked: completedGoals >= 1 },
    { id: "three_goals", icon: "podium-outline", iconColor: "#EAB308", titleKey: "ach_three_goals_title", descKey: "ach_three_goals_desc", unlocked: completedGoals >= 3, progress: { current: Math.min(completedGoals, 3), total: 3 } },
    { id: "comeback", icon: "refresh-outline", iconColor: "#22C55E", titleKey: "ach_comeback_title", descKey: "ach_comeback_desc", unlocked: comebacks >= 1 },
  ];
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  value,
  label,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  accent: string;
}) {
  const { upper } = useTranslation();
  return (
    <Card flex={1} paddingHorizontal={16} paddingVertical={16}>
      <YStack
        width={36}
        height={36}
        borderRadius={12}
        backgroundColor={`${accent}20`}
        alignItems="center"
        justifyContent="center"
        marginBottom={10}
      >
        <Ionicons name={icon} size={18} color={accent} />
      </YStack>
      <Text fontSize={24} fontWeight="800" lineHeight={28} style={{ color: accent }}>
        {value}
      </Text>
      <Text
        fontSize={11}
        color="$textMuted"
        fontWeight="600"
        marginTop={4}
        letterSpacing={0.8}
        numberOfLines={1}
      >
        {upper(label)}
      </Text>
    </Card>
  );
}

// ─── Week Strip ───────────────────────────────────────────────────────────────
const DOW_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function dotColorForLevel(level: DayLevel, theme: ReturnType<typeof useTheme>): string {
  switch (level) {
    case "perfect": return theme.success?.val ?? "#059669";
    case "partial": return theme.warning?.val ?? "#F59E0B";
    case "missed": return theme.danger?.val ?? "#EF4444";
    case "empty": return theme.borderStrong?.val ?? "#CBD5E1";
    case "future": return "transparent";
  }
}

function WeekStrip({
  goals,
  selectedDate,
  onSelectDate,
}: {
  goals: Goal[];
  selectedDate: string | null;
  onSelectDate: (d: string | null) => void;
}) {
  const { t, upper } = useTranslation();
  const theme = useTheme();
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const dayStats = getThisWeekDayStats(goals);

  const surface = theme.surface?.val ?? "#FFFFFF";
  const border = theme.border?.val ?? "#E2E8F0";
  const accent = theme.accent?.val ?? "#0D9488";
  const textMuted = theme.textMuted?.val ?? "#64748B";
  const text = theme.text?.val ?? "#0F172A";

  return (
    <XStack justifyContent="space-between">
      {dayStats.map((d, i) => {
        const isToday = d.date === todayStr;
        const isSelected = d.date === selectedDate;
        const dayKey = DOW_KEYS[new Date(d.date).getDay()];
        const dot = dotColorForLevel(d.level, theme);
        const isFuture = d.level === "future";
        const levelAccent = !isFuture && dot !== "transparent" ? dot : border;

        const borderColor = isSelected ? levelAccent : isToday ? accent : border;
        const borderWidth = isSelected ? 2.5 : isToday ? 2 : 1.5;
        const cellBg = isSelected && !isFuture ? `${levelAccent}1A` : surface;
        const headerBg = isSelected
          ? `${levelAccent}22`
          : isToday
          ? `${accent}18`
          : `${border}40`;

        const dayLabelColor = isSelected ? levelAccent : isToday ? accent : textMuted;
        const numColor = isSelected ? levelAccent : isToday ? accent : text;

        return (
          <YStack
            key={i}
            flex={1}
            marginHorizontal={3}
            borderRadius={14}
            overflow="hidden"
            backgroundColor={cellBg}
            borderWidth={borderWidth}
            borderColor={borderColor}
            onPress={() => onSelectDate(isSelected ? null : d.date)}
            pressStyle={{ opacity: 0.75 }}
          >
            <YStack
              width="100%"
              alignItems="center"
              paddingVertical={5}
              backgroundColor={headerBg}
            >
              <Text
                fontSize={9}
                fontWeight="700"
                letterSpacing={0.4}
                style={{ color: dayLabelColor }}
              >
                {upper(t(dayKey))}
              </Text>
            </YStack>

            <YStack alignItems="center" justifyContent="center" paddingVertical={7}>
              <Text
                fontSize={17}
                fontWeight={isToday || isSelected ? "800" : "600"}
                lineHeight={20}
                style={{ color: numColor }}
              >
                {format(new Date(d.date), "d")}
              </Text>
            </YStack>

            <YStack alignItems="center" paddingBottom={7}>
              <YStack
                width={7}
                height={7}
                borderRadius={3.5}
                backgroundColor={isFuture ? "transparent" : dot}
              />
            </YStack>
          </YStack>
        );
      })}
    </XStack>
  );
}

// ─── Day Detail Panel ─────────────────────────────────────────────────────────
function DayDetailPanel({ goals, dateStr }: { goals: Goal[]; dateStr: string }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const detail: DayTaskDetail[] = getDayTaskDetail(goals, dateStr);
  const dateLabel = format(new Date(dateStr), "d MMMM, EEEE", { locale: tr });

  const success = theme.success?.val ?? "#059669";
  const warning = theme.warning?.val ?? "#F59E0B";
  const danger = theme.danger?.val ?? "#EF4444";
  const borderStrong = theme.borderStrong?.val ?? "#CBD5E1";
  const border = theme.border?.val ?? "#E2E8F0";

  return (
    <YStack marginTop={12}>
      <Card paddingHorizontal={16} paddingTop={16} paddingBottom={12}>
        <XStack alignItems="center" marginBottom={12}>
          <YStack width={6} height={6} borderRadius={3} backgroundColor="$warning" marginRight={8} />
          <Text fontSize={13} fontWeight="700" color="$accent" textTransform="capitalize">
            {dateLabel}
          </Text>
        </XStack>

        {detail.length === 0 ? (
          <Text color="$textMuted" fontSize={13} textAlign="center" paddingVertical={8}>
            {t("noDayActivity")}
          </Text>
        ) : (
          detail.map((item, i) => {
            const pct = item.totalCount === 0 ? 0 : item.completedCount / item.totalCount;
            const pctColor = pct >= 0.9 ? success : pct >= 0.5 ? warning : danger;
            return (
              <YStack key={i} marginBottom={i < detail.length - 1 ? 14 : 4}>
                <XStack alignItems="center" justifyContent="space-between" marginBottom={8}>
                  <Text fontSize={12} fontWeight="700" color="$textMuted" flex={1} numberOfLines={1}>
                    {item.groupName}
                  </Text>
                  <YStack
                    paddingHorizontal={8}
                    paddingVertical={2}
                    borderRadius={99}
                    backgroundColor={`${pctColor}20`}
                  >
                    <Text fontSize={11} fontWeight="800" style={{ color: pctColor }}>
                      {item.completedCount}/{item.totalCount}
                    </Text>
                  </YStack>
                </XStack>

                {item.tasks.map((task, j) => (
                  <XStack
                    key={j}
                    alignItems="center"
                    paddingVertical={5}
                    paddingHorizontal={4}
                    borderBottomWidth={j < item.tasks.length - 1 ? 0.5 : 0}
                    borderBottomColor="$border"
                  >
                    <YStack
                      width={20}
                      height={20}
                      borderRadius={10}
                      borderWidth={1.5}
                      borderColor={task.done ? success : borderStrong}
                      backgroundColor={task.done ? success : "transparent"}
                      alignItems="center"
                      justifyContent="center"
                      marginRight={10}
                    >
                      {task.done && <Ionicons name="checkmark" size={12} color="#FFF" />}
                    </YStack>
                    <Text
                      fontSize={13}
                      color={task.done ? "$text" : "$textSubtle"}
                      fontWeight={task.done ? "500" : "400"}
                      flex={1}
                      numberOfLines={2}
                    >
                      {task.name}
                    </Text>
                  </XStack>
                ))}

                <YStack
                  height={3}
                  backgroundColor={border}
                  borderRadius={99}
                  marginTop={8}
                  overflow="hidden"
                >
                  <YStack
                    width={`${pct * 100}%`}
                    height="100%"
                    borderRadius={99}
                    backgroundColor={pctColor}
                  />
                </YStack>
              </YStack>
            );
          })
        )}
      </Card>
    </YStack>
  );
}

// ─── Monthly Calendar ─────────────────────────────────────────────────────────
const CAL_DAY_LABELS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];

function MonthlyCalendar({
  goals,
  selectedDate,
  onSelectDate,
}: {
  goals: Goal[];
  selectedDate: string | null;
  onSelectDate: (d: string | null) => void;
}) {
  const theme = useTheme();
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const activity = getMonthActivity(goals, year, month);
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const firstDay = startOfMonth(viewDate);
  const lastDay = endOfMonth(viewDate);
  const calStart = startOfWeek(firstDay, { weekStartsOn: 1 });
  const calEnd = endOfWeek(lastDay, { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const now = new Date();
  const canGoNext = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth());
  const monthLabel = format(viewDate, "MMMM yyyy", { locale: tr });

  const accent = theme.accent?.val ?? "#0D9488";
  const accentSoft = theme.accentSoft?.val ?? "#0D948818";
  const textMuted = theme.textMuted?.val ?? "#64748B";
  const textSubtle = theme.textSubtle?.val ?? "#94A3B8";
  const surfaceAlt = theme.surfaceAlt?.val ?? "#F1F5F9";
  const border = theme.border?.val ?? "#E2E8F0";
  const warning = theme.warning?.val ?? "#F59E0B";

  // Activity-level swatches: stronger teal as the level goes up.
  const levelBg: string[] = [
    "transparent",
    "#99E6D8",
    "#14B8A6",
    "#0D9488",
  ];

  function textColor(level: 0 | 1 | 2 | 3, inMonth: boolean, isFuture: boolean): string {
    if (!inMonth) return "transparent";
    if (isFuture) return textSubtle;
    if (level === 0) return textMuted;
    if (level === 1) return theme.text?.val ?? "#0F172A";
    return "#FFF";
  }

  return (
    <YStack>
      <XStack alignItems="center" justifyContent="space-between" marginBottom={16}>
        <YStack
          padding={6}
          onPress={() => setViewDate((d) => addMonths(d, -1))}
          pressStyle={{ opacity: 0.6 }}
        >
          <Ionicons name="chevron-back" size={20} color={textMuted} />
        </YStack>
        <Text fontWeight="700" color="$accent" fontSize={15} textTransform="capitalize">
          {monthLabel}
        </Text>
        <YStack
          padding={6}
          opacity={canGoNext ? 1 : 0.25}
          onPress={() => canGoNext && setViewDate((d) => addMonths(d, 1))}
          pressStyle={canGoNext ? { opacity: 0.6 } : undefined}
        >
          <Ionicons name="chevron-forward" size={20} color={textMuted} />
        </YStack>
      </XStack>

      <XStack marginBottom={8}>
        {CAL_DAY_LABELS.map((d) => (
          <Text
            key={d}
            flex={1}
            textAlign="center"
            fontSize={10}
            fontWeight="700"
            color="$textMuted"
            letterSpacing={0.5}
          >
            {d}
          </Text>
        ))}
      </XStack>

      <XStack flexWrap="wrap">
        {allDays.map((day, i) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, viewDate);
          const isFuture = dateStr > todayStr;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const level = (inMonth && !isFuture ? activity[dateStr] ?? 0 : 0) as 0 | 1 | 2 | 3;
          const bg = inMonth && !isFuture ? levelBg[level] : "transparent";
          const tColor = textColor(level, inMonth, isFuture);
          const todayBg = isToday && level === 0 ? accentSoft : bg;

          return (
            <YStack
              key={i}
              width="14.28%"
              aspectRatio={1}
              alignItems="center"
              justifyContent="center"
              marginBottom={4}
              opacity={!inMonth || isFuture ? 1 : 1}
              onPress={() => {
                if (!inMonth || isFuture) return;
                onSelectDate(isSelected ? null : dateStr);
              }}
              pressStyle={inMonth && !isFuture ? { opacity: 0.7 } : undefined}
            >
              <YStack
                width={34}
                height={34}
                borderRadius={10}
                alignItems="center"
                justifyContent="center"
                backgroundColor={todayBg}
                borderWidth={isSelected ? 2.5 : isToday ? 2 : 0}
                borderColor={isSelected ? warning : isToday ? accent : "transparent"}
              >
                <Text
                  fontSize={13}
                  fontWeight={isToday ? "800" : level > 0 ? "700" : "400"}
                  style={{ color: isToday && level === 0 ? accent : tColor }}
                >
                  {inMonth ? format(day, "d") : ""}
                </Text>
              </YStack>
            </YStack>
          );
        })}
      </XStack>

      <XStack alignItems="center" justifyContent="flex-end" gap={4} marginTop={8}>
        {levelBg.map((c, i) => (
          <YStack
            key={i}
            width={12}
            height={12}
            borderRadius={3}
            backgroundColor={c === "transparent" ? surfaceAlt : c}
            borderWidth={c === "transparent" ? 1 : 0}
            borderColor={border}
          />
        ))}
      </XStack>
    </YStack>
  );
}

// ─── Achievement Card ─────────────────────────────────────────────────────────
function AchievementCard({
  icon,
  iconColor,
  title,
  desc,
  unlocked,
  progress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  desc: string;
  unlocked: boolean;
  progress?: { current: number; total: number };
}) {
  const theme = useTheme();
  const pct = progress ? progress.current / progress.total : 0;
  const showProgress = !unlocked && !!progress && progress.current > 0;

  const lockedIconColor = theme.textSubtle?.val ?? "#94A3B8";
  const accent = theme.accent?.val ?? "#0D9488";

  return (
    <Card
      flex={1}
      padding={14}
      tinted={unlocked ? "accent" : undefined}
      borderColor={unlocked ? "$accent" : "$border"}
      borderWidth={1.5}
      opacity={unlocked ? 1 : showProgress ? 0.85 : 0.55}
    >
      <XStack alignItems="center" justifyContent="space-between" marginBottom={10}>
        <YStack
          width={44}
          height={44}
          borderRadius={14}
          backgroundColor={unlocked ? `${iconColor}22` : "$surfaceAlt"}
          alignItems="center"
          justifyContent="center"
        >
          <Ionicons name={icon} size={22} color={unlocked ? iconColor : lockedIconColor} />
        </YStack>
        {unlocked ? (
          <YStack
            width={22}
            height={22}
            borderRadius={11}
            backgroundColor="$accent"
            alignItems="center"
            justifyContent="center"
          >
            <Ionicons name="checkmark" size={13} color="#FFF" />
          </YStack>
        ) : (
          <Ionicons name="lock-closed" size={14} color={lockedIconColor} />
        )}
      </XStack>
      <Text
        fontSize={13}
        fontWeight="700"
        color={unlocked ? "$text" : "$textMuted"}
        marginBottom={3}
        numberOfLines={1}
      >
        {title}
      </Text>
      <Text fontSize={11} color="$textMuted" lineHeight={15} numberOfLines={2}>
        {desc}
      </Text>
      {showProgress && (
        <YStack marginTop={10}>
          <XStack justifyContent="space-between" marginBottom={4}>
            <Text fontSize={10} color="$textMuted" fontWeight="600">
              {progress!.current}/{progress!.total}
            </Text>
            <Text fontSize={10} color="$textMuted" fontWeight="600">
              {Math.round(pct * 100)}%
            </Text>
          </XStack>
          <YStack height={4} backgroundColor="$border" borderRadius={99} overflow="hidden">
            <YStack
              width={`${pct * 100}%`}
              height="100%"
              borderRadius={99}
              style={{ backgroundColor: accent }}
            />
          </YStack>
        </YStack>
      )}
    </Card>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, badge }: { title: string; badge?: string }) {
  return (
    <XStack alignItems="center" justifyContent="space-between" marginBottom={14}>
      <Text fontSize={16} fontWeight="700" color="$text">
        {title}
      </Text>
      {badge !== undefined && (
        <Text fontSize={13} fontWeight="700" color="$accent">
          {badge}
        </Text>
      )}
    </XStack>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function InsightsScreen() {
  const goals = useProgressStore((s) => s.goals);
  const theme = useTheme();
  const { t } = useTranslation();

  const [weekSelectedDate, setWeekSelectedDate] = useState<string | null>(null);
  const [calSelectedDate, setCalSelectedDate] = useState<string | null>(null);

  const streak = computeStreak(goals);
  const best = getBestStreak(goals);
  const total = getTotalCompletedTasks(goals);
  const rate = getOverallCompletionRate(goals);
  const activeDays = getTotalActiveDays(goals);
  const { count: perfectCount, bestStreak: perfectStreak } = getPerfectDayStats(goals);
  const comebacks = getComebackCount(goals);
  const completedGoals = getCompletedGoalsCount(goals);
  const completedStages = getCompletedStagesCount(goals);

  const achievements = buildAchievements(
    goals,
    streak,
    total,
    perfectCount,
    perfectStreak,
    comebacks,
    completedGoals,
    completedStages,
  );
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const pairs: (typeof achievements)[] = [];
  for (let i = 0; i < achievements.length; i += 2) pairs.push(achievements.slice(i, i + 2));

  const bg = theme.bg?.val ?? "#F8FAFC";
  const success = theme.success?.val ?? "#059669";
  const warning = theme.warning?.val ?? "#F59E0B";
  const accent = theme.accent?.val ?? "#0D9488";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <YStack
        paddingHorizontal={24}
        paddingTop={20}
        paddingBottom={12}
        borderBottomWidth={1}
        borderBottomColor="$border"
      >
        <Text fontSize={26} fontWeight="800" letterSpacing={-0.5} color="$text">
          {t("insightsTitle")}
        </Text>
        {activeDays > 0 && (
          <Text fontSize={11} color="$textMuted" marginTop={2} fontWeight="600">
            {activeDays} {t("totalActiveDays").toLowerCase()}
          </Text>
        )}
      </YStack>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 110 }}
      >
        {/* This week */}
        <YStack marginBottom={16}>
          <SectionHeader title={t("thisWeekTitle")} />
          <Card padding={16}>
            <WeekStrip
              goals={goals}
              selectedDate={weekSelectedDate}
              onSelectDate={setWeekSelectedDate}
            />
          </Card>
          {weekSelectedDate && <DayDetailPanel goals={goals} dateStr={weekSelectedDate} />}
        </YStack>

        {/* This month */}
        <YStack marginBottom={24}>
          <SectionHeader title={format(new Date(), "MMMM yyyy", { locale: tr })} />
          <Card padding={16}>
            <MonthlyCalendar
              goals={goals}
              selectedDate={calSelectedDate}
              onSelectDate={setCalSelectedDate}
            />
          </Card>
          {calSelectedDate && <DayDetailPanel goals={goals} dateStr={calSelectedDate} />}
        </YStack>

        {/* Stat cards */}
        <XStack gap={12} marginBottom={12}>
          <StatCard icon="flame" value={streak} label={t("currentStreak")} accent={warning} />
          <StatCard icon="trophy-outline" value={best} label={t("bestStreak")} accent={accent} />
        </XStack>
        <XStack gap={12} marginBottom={12}>
          <StatCard
            icon="checkmark-circle-outline"
            value={total}
            label={t("totalTasksDone")}
            accent={success}
          />
          <StatCard
            icon="stats-chart-outline"
            value={`${rate}%`}
            label={t("completionRate")}
            accent="#7C3AED"
          />
        </XStack>
        <XStack gap={12} marginBottom={28}>
          <StatCard
            icon="calendar-outline"
            value={activeDays}
            label={t("totalActiveDays")}
            accent="#0891B2"
          />
          <StatCard
            icon="star-outline"
            value={perfectCount}
            label={t("perfectDays")}
            accent="#BE185D"
          />
        </XStack>

        {/* Achievements */}
        <YStack>
          <SectionHeader
            title={t("achievementsTitle")}
            badge={`${unlockedCount}/${achievements.length}`}
          />
          {pairs.map((pair, i) => (
            <XStack key={i} gap={12} marginBottom={12}>
              {pair.map((a) => (
                <AchievementCard
                  key={a.id}
                  icon={a.icon}
                  iconColor={a.iconColor}
                  title={t(a.titleKey as any)}
                  desc={t(a.descKey as any)}
                  unlocked={a.unlocked}
                  progress={a.progress}
                />
              ))}
              {pair.length === 1 && <YStack flex={1} />}
            </XStack>
          ))}
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
