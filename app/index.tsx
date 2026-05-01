import React, { useState, useEffect } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { XStack, YStack, useTheme } from "tamagui";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  useProgressStore,
  Goal,
  getTodayProgress,
  getThisWeekStats,
  getGoalTodayProgress,
  computeStreak,
} from "@/store/useProgressStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTranslation } from "@/lib/i18n";
import { getRandomQuote } from "@/lib/quotes";

function progressColorHex(perc: number, theme: ReturnType<typeof useTheme>): string {
  if (perc >= 90) return theme.success?.val ?? "#059669";
  if (perc >= 50) return theme.accent?.val ?? "#0D9488";
  if (perc > 0) return theme.warning?.val ?? "#F59E0B";
  return theme.borderStrong?.val ?? "#CBD5E1";
}

function ProgressRing({ perc, size = 52 }: { perc: number; size?: number }) {
  const theme = useTheme();
  const color = progressColorHex(perc, theme);
  return (
    <YStack
      width={size}
      height={size}
      borderRadius={size / 2}
      borderWidth={3}
      borderColor={color}
      alignItems="center"
      justifyContent="center"
      backgroundColor={`${color}18`}
      flexShrink={0}
    >
      {perc === 100 ? (
        <Ionicons name="checkmark" size={size * 0.38} color={color} />
      ) : (
        <Text color={color} fontWeight="800" fontSize={size * 0.22} lineHeight={size * 0.28}>
          {perc}%
        </Text>
      )}
    </YStack>
  );
}

function TodayFocusCard({ goals }: { goals: Goal[] }) {
  const { t, upper } = useTranslation();
  const { completed, total } = getTodayProgress(goals);
  if (total === 0) return null;
  const allDone = completed === total;
  const streak = computeStreak(goals);
  const { activeDays, elapsed } = getThisWeekStats(goals);

  return (
    <YStack
      marginHorizontal={24}
      marginBottom={16}
      backgroundColor="$accent"
      borderRadius={20}
      padding={20}
      overflow="hidden"
    >
      <Text
        color="rgba(255,255,255,0.8)"
        fontSize={11}
        fontWeight="700"
        letterSpacing={2}
        marginBottom={8}
      >
        {upper(t("todaysFocus"))}
      </Text>
      <Text color="#FFFFFF" fontSize={26} fontWeight="800" lineHeight={32}>
        {completed}
        <Text color="rgba(255,255,255,0.6)" fontSize={16} fontWeight="400">
          /{total} {t("tasksToday")}
        </Text>
      </Text>

      {allDone && streak > 0 ? (
        <XStack alignItems="center" gap={8} marginTop={14}>
          <Ionicons name="flame" size={18} color="#FFFFFF" />
          <Text color="#FFFFFF" fontSize={15} fontWeight="700">
            {streak} {t("dayStreakInline")}
          </Text>
        </XStack>
      ) : (
        <YStack marginTop={14}>
          <ProgressBar value={total === 0 ? 0 : completed / total} inverse />
        </YStack>
      )}

      {elapsed > 0 && (
        <XStack alignItems="center" gap={6} marginTop={12}>
          <YStack
            width={4}
            height={4}
            borderRadius={2}
            backgroundColor="rgba(255,255,255,0.7)"
          />
          <Text color="rgba(255,255,255,0.75)" fontSize={11} fontWeight="600" letterSpacing={0.3}>
            {activeDays}/{elapsed} {t("activeDaysLabel")}
          </Text>
        </XStack>
      )}
    </YStack>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const { t } = useTranslation();
  const theme = useTheme();

  let totalTasks = 0;
  let completedTasks = 0;
  goal.groups.forEach((gr) => {
    totalTasks += gr.durationInDays * gr.tasks.length;
    Object.values(gr.progress).forEach((dayRecord) => {
      Object.values(dayRecord).forEach((done) => {
        if (done) completedTasks++;
      });
    });
  });

  const perc = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const activeGroup = goal.groups.find((g) => g.status === "active");
  const completedGroups = goal.groups.filter((g) => g.status === "completed").length;
  const dotColor = progressColorHex(perc, theme);
  const today = getGoalTodayProgress(goal);
  const todayPerc =
    today.total === 0 ? 0 : Math.round((today.completed / today.total) * 100);
  const todayColor = progressColorHex(todayPerc, theme);

  return (
    <Card
      interactive
      flexDirection="row"
      alignItems="center"
      marginBottom={10}
      onPress={() => router.push(`/goal/${goal.id}`)}
    >
      <YStack flex={1} marginRight={14}>
        <Text
          fontSize={16}
          fontWeight="600"
          letterSpacing={-0.2}
          marginBottom={5}
          lineHeight={21}
          numberOfLines={2}
        >
          {goal.name}
        </Text>
        <XStack alignItems="center">
          <YStack width={5} height={5} borderRadius={3} backgroundColor={dotColor} marginRight={6} />
          <Text fontSize={11} color="$textMuted" fontWeight="500" letterSpacing={0.2} numberOfLines={1}>
            {completedGroups}/{goal.groups.length} {t("stage")}
            {activeGroup ? ` · ${activeGroup.name}` : ""}
          </Text>
        </XStack>
        {today.hasActiveToday && (
          <XStack alignItems="center" marginTop={4} gap={5}>
            <Ionicons name="checkmark-circle-outline" size={11} color={todayColor} />
            <Text fontSize={11} color={todayColor} fontWeight="600" letterSpacing={0.2}>
              {t("today")} {today.completed}/{today.total}
            </Text>
          </XStack>
        )}
      </YStack>
      <ProgressRing perc={perc} size={52} />
    </Card>
  );
}

export default function HomeDashboardScreen() {
  const goals = useProgressStore((s) => s.goals);
  const hasCompletedOnboarding = useSettingsStore((s) => s.hasCompletedOnboarding);
  const theme = useTheme();
  const { t, upper } = useTranslation();
  const [quote, setQuote] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    setQuote(getRandomQuote());
  }, []);

  if (!hasCompletedOnboarding) return <Redirect href="/onboarding" />;

  const activeGoals = goals.filter((g) => !g.archived);
  const archivedGoals = goals.filter((g) => g.archived);

  const bg = theme.bg?.val ?? "#F8FAFC";

  if (goals.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        <YStack flex={1} alignItems="center" justifyContent="center" paddingHorizontal={32}>
          <YStack
            width={96}
            height={96}
            borderRadius={48}
            backgroundColor="$accentSoft"
            alignItems="center"
            justifyContent="center"
            marginBottom={24}
          >
            <Ionicons name="leaf-outline" size={40} color={theme.accent?.val ?? "#0D9488"} />
          </YStack>
          <Text fontSize={24} fontWeight="300" textAlign="center" marginBottom={8}>
            {t("noJourneyTitle")}
          </Text>
          <Text fontSize={14} color="$textMuted" textAlign="center" marginBottom={24} lineHeight={22}>
            {t("noJourneyDesc")}
          </Text>
          <Text
            fontSize={13}
            color="$accent"
            fontStyle="italic"
            fontWeight="500"
            textAlign="center"
            marginBottom={40}
            marginHorizontal={16}
            lineHeight={18}
          >
            &ldquo;{quote}&rdquo;
          </Text>
          <YStack
            backgroundColor="$accent"
            paddingHorizontal={32}
            paddingVertical={16}
            borderRadius={24}
            onPress={() => router.push("/create")}
            pressStyle={{ opacity: 0.85 }}
          >
            <Text color="#FFFFFF" fontWeight="600" letterSpacing={0.3}>
              {t("newJourneyBtn")}
            </Text>
          </YStack>
        </YStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <XStack
        paddingHorizontal={24}
        paddingTop={20}
        paddingBottom={12}
        justifyContent="space-between"
        alignItems="center"
      >
        <YStack flex={1} marginRight={12}>
          <Text fontSize={26} fontWeight="700" letterSpacing={-0.5} lineHeight={32}>
            {t("dashboardTitle")}
          </Text>
          <Text
            fontSize={11}
            color="$textMuted"
            fontWeight="500"
            letterSpacing={1.2}
            marginTop={2}
          >
            {upper(`${activeGoals.length} ${t("activeJourneys")}`)}
          </Text>
        </YStack>
        <YStack
          width={44}
          height={44}
          backgroundColor="$accent"
          borderRadius={14}
          alignItems="center"
          justifyContent="center"
          shadowColor="$accent"
          shadowOffset={{ width: 0, height: 4 }}
          shadowOpacity={0.28}
          shadowRadius={8}
          onPress={() => router.push("/create")}
          pressStyle={{ opacity: 0.85 }}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </YStack>
      </XStack>

      <YStack paddingHorizontal={24} marginBottom={12}>
        <Text fontSize={12} color="$textMuted" fontStyle="italic" lineHeight={18} numberOfLines={2}>
          &ldquo;{quote}&rdquo;
        </Text>
      </YStack>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        <TodayFocusCard goals={activeGoals} />
        <YStack paddingHorizontal={24}>
          {activeGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}

          {archivedGoals.length > 0 && (
            <YStack marginTop={16} marginBottom={8}>
              <XStack
                alignItems="center"
                justifyContent="space-between"
                paddingVertical={10}
                paddingHorizontal={4}
                onPress={() => setShowArchived(!showArchived)}
                pressStyle={{ opacity: 0.7 }}
              >
                <XStack alignItems="center" gap={8}>
                  <Ionicons name="archive-outline" size={16} color={theme.textSubtle?.val ?? "#94A3B8"} />
                  <Text fontSize={12} color="$textSubtle" fontWeight="600" letterSpacing={0.5}>
                    {t("archivedGoals")} · {archivedGoals.length}
                  </Text>
                </XStack>
                <Ionicons
                  name={showArchived ? "chevron-up" : "chevron-down"}
                  size={14}
                  color={theme.textSubtle?.val ?? "#94A3B8"}
                />
              </XStack>
              {showArchived &&
                archivedGoals.map((goal) => (
                  <YStack key={goal.id} opacity={0.6}>
                    <GoalCard goal={goal} />
                  </YStack>
                ))}
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
