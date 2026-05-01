import React, { useState, useEffect, useRef } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  differenceInDays,
  addDays,
  format,
  isToday,
  startOfMonth,
  startOfWeek,
  endOfMonth,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
} from "date-fns";
import { tr } from "date-fns/locale";
import * as Haptics from "expo-haptics";
import { XStack, YStack, useTheme } from "tamagui";
import { Text } from "@/components/ui/Text";
import { IconButton } from "@/components/ui/IconButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useProgressStore } from "@/store/useProgressStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTranslation } from "@/lib/i18n";

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, upper } = useTranslation();
  const theme = useTheme();
  const isDarkMode = useSettingsStore((s) => s.isDarkMode);

  const goals = useProgressStore((s) => s.goals);
  const toggleTask = useProgressStore((s) => s.toggleTaskCompletion);

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [isCalendarView, setIsCalendarView] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const celebratedDays = useRef<Set<string>>(new Set());
  const lastProgressByDate = useRef<Map<string, number>>(new Map());
  const dayStripRef = useRef<ScrollView>(null);

  let currentGoal = null as null | (typeof goals)[number];
  let currentGroup = null as null | (typeof goals)[number]["groups"][number];
  for (const g of goals) {
    const gr = g.groups.find((x) => x.id === id);
    if (gr) {
      currentGoal = g;
      currentGroup = gr;
      break;
    }
  }

  let groupCompletedTasks = 0;
  let groupTotalTasks = 0;
  if (currentGroup) {
    groupTotalTasks = currentGroup.durationInDays * currentGroup.tasks.length;
    Object.values(currentGroup.progress).forEach((dayRecord) => {
      Object.values(dayRecord).forEach((done) => {
        if (done) groupCompletedTasks++;
      });
    });
  }
  const groupPercentage =
    groupTotalTasks === 0 ? 0 : Math.round((groupCompletedTasks / groupTotalTasks) * 100);

  const startDate = currentGroup?.startDate ? new Date(currentGroup.startDate) : new Date();
  const days = currentGroup
    ? Array.from({ length: currentGroup.durationInDays }).map((_, i) => {
        const date = addDays(startDate, i);
        const dateStr = format(date, "yyyy-MM-dd");
        const dayProgress = currentGroup!.progress[dateStr] || {};
        let completedCount = 0;
        currentGroup!.tasks.forEach((task) => {
          if (dayProgress[task.id]) completedCount++;
        });
        return {
          index: i,
          dateStr,
          displayDay: format(date, "d", { locale: tr }),
          displayWeekday: format(date, "EE", { locale: tr }),
          isCurrentDay: isToday(date),
          isAllCompleted:
            completedCount === currentGroup!.tasks.length && currentGroup!.tasks.length > 0,
          progressPerc: currentGroup!.tasks.length === 0 ? 0 : completedCount / currentGroup!.tasks.length,
          progressNum: completedCount,
          total: currentGroup!.tasks.length,
        };
      })
    : [];
  const selectedDayData = days[selectedDayIndex] ?? null;

  useEffect(() => {
    if (currentGroup && currentGroup.startDate) {
      const start = new Date(currentGroup.startDate);
      const diff = Math.max(0, differenceInDays(new Date(), start));
      const idx = diff < currentGroup.durationInDays ? diff : currentGroup.durationInDays - 1;
      setSelectedDayIndex(idx);
      if (idx > 2) {
        setTimeout(() => {
          dayStripRef.current?.scrollTo({ x: Math.max(0, idx * 60 - 64), animated: false });
        }, 80);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!currentGroup || currentGroup.status === "locked" || !selectedDayData) return;
    const { dateStr, progressNum, total } = selectedDayData;
    const prev = lastProgressByDate.current.get(dateStr);
    lastProgressByDate.current.set(dateStr, progressNum);
    if (prev === undefined) return;
    const justCompleted = total > 0 && prev < total && progressNum === total;
    if (justCompleted && !celebratedDays.current.has(dateStr)) {
      celebratedDays.current.add(dateStr);
      setShowCelebration(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const timer = setTimeout(() => setShowCelebration(false), 2400);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDayData?.progressNum, selectedDayData?.dateStr]);

  const bg = theme.bg?.val ?? "#F8FAFC";
  const muted = theme.textMuted?.val ?? "#64748B";
  const subtle = theme.textSubtle?.val ?? "#94A3B8";
  const accent = theme.accent?.val ?? "#0D9488";
  const success = theme.success?.val ?? "#059669";
  const warning = theme.warning?.val ?? "#F59E0B";

  if (!currentGroup || !currentGoal) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Text color="$textMuted" fontWeight="300">
            {t("groupNotFound")}
          </Text>
        </YStack>
      </SafeAreaView>
    );
  }

  const isLastGroup = currentGoal.groups.indexOf(currentGroup) === currentGoal.groups.length - 1;
  const isLocked = currentGroup.status === "locked";
  const endDate = addDays(startDate, currentGroup.durationInDays - 1);
  const sd = selectedDayData ?? days[0]!;

  // Heatmap calendar setup
  const calendarStart = startOfWeek(startOfMonth(startDate), { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(endOfMonth(endDate), { weekStartsOn: 1 });
  const gridDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const isMultiMonth = format(startDate, "M") !== format(endDate, "M");
  const monthLabel = isMultiMonth
    ? `${format(startDate, "MMMM")} - ${format(endDate, "MMMM yyyy", { locale: tr })}`
    : format(startDate, "MMMM yyyy", { locale: tr });

  const levelBg = isDarkMode
    ? ["transparent", "#1B5E58", "#0D9488", "#0a7a6f"]
    : ["transparent", "#99E6D8", "#14B8A6", "#0D9488"];

  const levelTextColor = (level: 0 | 1 | 2 | 3, inMonth: boolean, isFuture: boolean): string => {
    if (!inMonth) return "transparent";
    if (isFuture) return isDarkMode ? "#2D4A47" : "#CBD5E1";
    if (level === 0) return isDarkMode ? "#5F8B8A" : "#94A3B8";
    if (level === 1) return isDarkMode ? "#CCFBF1" : "#134E4A";
    return "#fff";
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <YStack paddingHorizontal={24} paddingTop={16} paddingBottom={16}>
        <XStack height={48} alignItems="center" justifyContent="space-between" position="relative">
          <IconButton
            icon="chevron-back"
            size="lg"
            onPress={() => router.back()}
            marginLeft={-8}
            zIndex={20}
          />

          <YStack
            position="absolute"
            left={0}
            right={0}
            height="100%"
            alignItems="center"
            justifyContent="center"
            pointerEvents="none"
          >
            <Text fontSize={15} fontWeight="600" letterSpacing={0.3} textAlign="center" paddingHorizontal={40} numberOfLines={1}>
              {currentGroup.name}
            </Text>
          </YStack>

          <IconButton
            icon={isCalendarView ? "list-outline" : "calendar-outline"}
            tone="accent"
            size="lg"
            onPress={() => setIsCalendarView(!isCalendarView)}
            marginRight={-8}
            zIndex={20}
          />
        </XStack>
      </YStack>

      {/* Stage progress strip */}
      <YStack paddingHorizontal={24} marginBottom={8} marginTop={16}>
        <YStack
          backgroundColor="$surface"
          borderColor="$border"
          borderWidth={1}
          paddingVertical={14}
          paddingHorizontal={16}
          borderRadius={20}
          gap={10}
        >
          <XStack justifyContent="space-between" alignItems="center">
            <Text
              fontSize={11}
              fontWeight="700"
              color="$textMuted"
              letterSpacing={1.4}
            >
              {upper(t("totalStageProgress"))}
            </Text>
            <Text color="$text" fontWeight="700" fontSize={13}>
              %{groupPercentage}
            </Text>
          </XStack>
          <ProgressBar value={groupPercentage / 100} tone="accent" height={6} />
          <Text color="$textSubtle" fontSize={11}>
            {format(startDate, "d MMM", { locale: tr })} —{" "}
            {format(endDate, "d MMM yyyy", { locale: tr })}
          </Text>
        </YStack>
      </YStack>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <YStack paddingHorizontal={32} marginTop={24} marginBottom={32} alignItems="center">
          <Text
            fontSize={11}
            color="$textMuted"
            letterSpacing={3}
            fontWeight="500"
            marginBottom={4}
          >
            {upper(t("dailyFlow"))}
          </Text>
          <Text fontSize={26} fontWeight="300" textAlign="center" lineHeight={32}>
            {currentGroup.durationInDays} {t("dayChain")}
            {`\n`}
            <Text fontWeight="600" color="$accent">
              {t("break")}
            </Text>
          </Text>
        </YStack>

        {/* Day views */}
        <YStack marginBottom={40} width="100%">
          {isCalendarView ? (
            <YStack paddingHorizontal={20} width="100%">
              <YStack
                backgroundColor="$surface"
                borderRadius={20}
                borderWidth={1}
                borderColor="$border"
                padding={16}
              >
                <Text
                  textAlign="center"
                  fontWeight="700"
                  color="$accent"
                  fontSize={15}
                  textTransform="capitalize"
                  marginBottom={16}
                >
                  {monthLabel}
                </Text>

                <XStack marginBottom={8}>
                  {(["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const).map((w) => (
                    <Text
                      key={w}
                      flex={1}
                      textAlign="center"
                      fontSize={10}
                      fontWeight="700"
                      color="$textMuted"
                      letterSpacing={0.5}
                    >
                      {upper(t(w))}
                    </Text>
                  ))}
                </XStack>

                <XStack flexWrap="wrap">
                  {gridDays.map((d, i) => {
                    const dateStr = format(d, "yyyy-MM-dd");
                    const dayData = days.find((x) => x.dateStr === dateStr);
                    const inMonth = !!dayData;
                    const isFuture = dateStr > format(new Date(), "yyyy-MM-dd");
                    const isCurrentDay = dayData?.isCurrentDay ?? false;
                    const isSelected = !!dayData && selectedDayIndex === dayData.index;
                    const isCurrentMonth =
                      isSameMonth(d, startDate) || isSameMonth(d, endDate);

                    const level: 0 | 1 | 2 | 3 = !inMonth || isFuture
                      ? 0
                      : dayData!.isAllCompleted
                      ? 3
                      : dayData!.progressPerc >= 0.5
                      ? 2
                      : dayData!.progressPerc > 0
                      ? 1
                      : 0;

                    const cellBg = inMonth && !isFuture ? levelBg[level] : "transparent";
                    const todayBg =
                      isCurrentDay && level === 0
                        ? isDarkMode
                          ? "#0D948830"
                          : "#CCFBF1"
                        : cellBg;
                    const tColor = levelTextColor(level, inMonth, isFuture);
                    const fadedColor = isDarkMode ? "#2D4A47" : "#CBD5E1";

                    return (
                      <YStack
                        key={i}
                        width="14.28%"
                        aspectRatio={1}
                        alignItems="center"
                        justifyContent="center"
                        marginBottom={4}
                        onPress={() => {
                          if (inMonth && !isFuture) setSelectedDayIndex(dayData!.index);
                        }}
                        pressStyle={inMonth && !isFuture ? { opacity: 0.75 } : undefined}
                      >
                        <YStack
                          width={34}
                          height={34}
                          borderRadius={10}
                          alignItems="center"
                          justifyContent="center"
                          backgroundColor={todayBg}
                          borderWidth={isSelected ? 2.5 : isCurrentDay ? 2 : 0}
                          borderColor={isSelected ? warning : isCurrentDay ? accent : "transparent"}
                        >
                          <Text
                            fontSize={13}
                            fontWeight={isCurrentDay ? "800" : level > 0 ? "700" : "400"}
                            color={
                              isCurrentDay && level === 0
                                ? accent
                                : inMonth
                                ? tColor
                                : isCurrentMonth
                                ? fadedColor
                                : "transparent"
                            }
                          >
                            {format(d, "d")}
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
                      backgroundColor={
                        c === "transparent" ? (isDarkMode ? "#1B5E5830" : "#F1F5F9") : c
                      }
                      borderWidth={c === "transparent" ? 1 : 0}
                      borderColor={isDarkMode ? "#1B5E58" : "#E2E8F0"}
                    />
                  ))}
                </XStack>
              </YStack>
            </YStack>
          ) : (
            <ScrollView
              ref={dayStripRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
              snapToInterval={60}
              decelerationRate="fast"
            >
              {days.map((day, i) => {
                const isSelected = selectedDayIndex === i;
                const todayStr = format(new Date(), "yyyy-MM-dd");
                const isFuture = day.dateStr > todayStr;
                const isCurrentDay = day.isCurrentDay;
                const isPicked = isSelected && !isCurrentDay;

                // Three visual states: today (accent), picked-not-today (muted), default (surface)
                const cellBg = isCurrentDay
                  ? isDarkMode
                    ? "#0D948820"
                    : "#F0FDFA"
                  : isPicked
                  ? isDarkMode
                    ? "#16332F"
                    : "#F1F5F9"
                  : isDarkMode
                  ? "#0E3330"
                  : "#FFFFFF";
                const cellBorder = isCurrentDay
                  ? accent
                  : isPicked
                  ? subtle
                  : isDarkMode
                  ? "#1B5E58"
                  : "#E2E8F0";
                const cellBorderWidth = isCurrentDay ? 2 : isPicked ? 2 : 1;

                const headerBg = isCurrentDay
                  ? isDarkMode
                    ? "#0D948830"
                    : "#CCFBF1"
                  : isPicked
                  ? isDarkMode
                    ? "#1F4541"
                    : "#E2E8F0"
                  : isDarkMode
                  ? "#0a2826"
                  : "#F8FAFC";
                const headerBorder = isCurrentDay
                  ? accent
                  : isPicked
                  ? subtle
                  : isDarkMode
                  ? "#1B5E58"
                  : "#E2E8F0";
                const dayLabelColor = isCurrentDay ? accent : muted;
                const numColor = isCurrentDay
                  ? accent
                  : isPicked
                  ? muted
                  : isDarkMode
                  ? "#CCFBF1"
                  : "#0F172A";
                const dotColor = day.isAllCompleted
                  ? success
                  : day.progressPerc > 0
                  ? warning
                  : isFuture
                  ? "transparent"
                  : isDarkMode
                  ? "#1B5E58"
                  : "#CBD5E1";

                return (
                  <YStack
                    key={i}
                    width={52}
                    borderRadius={16}
                    overflow="hidden"
                    backgroundColor={cellBg}
                    borderWidth={cellBorderWidth}
                    borderColor={cellBorder}
                    onPress={() => setSelectedDayIndex(i)}
                    pressStyle={{ opacity: 0.75 }}
                  >
                    <YStack
                      width="100%"
                      alignItems="center"
                      paddingVertical={5}
                      backgroundColor={headerBg}
                      borderBottomWidth={0.5}
                      borderBottomColor={headerBorder}
                    >
                      <Text
                        fontSize={9}
                        fontWeight="700"
                        color={dayLabelColor}
                        letterSpacing={0.4}
                      >
                        {upper(day.displayWeekday)}
                      </Text>
                    </YStack>

                    <YStack alignItems="center" justifyContent="center" paddingVertical={7}>
                      <Text
                        fontSize={17}
                        fontWeight={isCurrentDay ? "800" : isPicked ? "700" : "600"}
                        color={numColor}
                        lineHeight={20}
                      >
                        {day.displayDay}
                      </Text>
                    </YStack>

                    <YStack alignItems="center" paddingBottom={7}>
                      <YStack width={7} height={7} borderRadius={4} backgroundColor={dotColor} />
                    </YStack>
                  </YStack>
                );
              })}
            </ScrollView>
          )}
        </YStack>

        <XStack paddingHorizontal={32} marginBottom={24} alignItems="baseline" justifyContent="space-between" marginTop={8}>
          <Text fontSize={20} fontWeight="500" letterSpacing={-0.3}>
            {t("todaysTasks")}
          </Text>
          <Text fontSize={12} color="$textMuted" fontWeight="300">
            {sd.progressNum} / {sd.total} {isLocked ? t("task") : t("completed")}
          </Text>
        </XStack>

        {currentGroup.status === "completed" && (
          <YStack paddingHorizontal={24} marginBottom={16}>
            <YStack
              backgroundColor="$accentSoft"
              paddingHorizontal={20}
              paddingVertical={16}
              borderRadius={20}
              borderWidth={1}
              borderColor="$accent"
            >
              <Text color="$accent" fontWeight="700" fontSize={15} marginBottom={4}>
                {isLastGroup ? t("goalCompletedTitle") : t("newStageUnlockedTitle")}
              </Text>
              <Text fontSize={13} fontWeight="500" lineHeight={18}>
                {isLastGroup ? t("goalCompletedDesc") : t("newStageUnlockedDesc")}
              </Text>
            </YStack>
          </YStack>
        )}

        {isLocked && (
          <YStack paddingHorizontal={24} marginBottom={16}>
            <XStack
              backgroundColor="$surfaceAlt"
              paddingHorizontal={16}
              paddingVertical={14}
              borderRadius={16}
              alignItems="center"
              borderWidth={1}
              borderColor="$border"
            >
              <Ionicons name="lock-closed-outline" size={16} color={muted} />
              <Text color="$textMuted" fontSize={13} marginLeft={10} flex={1} lineHeight={18}>
                {t("stageLocked")}
              </Text>
            </XStack>
          </YStack>
        )}

        <YStack paddingHorizontal={24}>
          {currentGroup.tasks.length === 0 && (
            <Text textAlign="center" color="$textMuted" fontSize={13} fontWeight="300" marginTop={16}>
              {t("noTasksDefined")}
            </Text>
          )}
          {currentGroup.tasks.map((task) => {
            const isTaskDone = currentGroup!.progress[sd.dateStr]?.[task.id] || false;

            return (
              <XStack
                key={task.id}
                alignItems="center"
                padding={16}
                borderRadius={20}
                marginBottom={12}
                backgroundColor={isLocked ? "$surface" : isTaskDone ? "$bg" : "$surface"}
                borderWidth={1}
                borderColor={isLocked ? "transparent" : "$border"}
                opacity={isLocked ? 0.55 : 1}
                onPress={() => {
                  if (!isLocked) {
                    const willComplete = !isTaskDone;
                    toggleTask(currentGoal!.id, currentGroup!.id, sd.dateStr, task.id);
                    if (willComplete) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }
                }}
                pressStyle={isLocked ? undefined : { opacity: 0.7 }}
              >
                <YStack
                  width={24}
                  height={24}
                  borderRadius={12}
                  borderWidth={1}
                  marginRight={16}
                  alignItems="center"
                  justifyContent="center"
                  backgroundColor={isTaskDone ? "$accent" : "transparent"}
                  borderColor={isTaskDone ? "$accent" : "$borderStrong"}
                >
                  {isTaskDone && <Ionicons name="checkmark" size={14} color="#FFF" />}
                  {isLocked && !isTaskDone && (
                    <Ionicons name="lock-closed" size={10} color={subtle} />
                  )}
                </YStack>
                <YStack flex={1}>
                  <Text fontSize={15} color={isTaskDone ? "$textMuted" : "$text"}>
                    {task.name}
                  </Text>
                  {!!task.description && (
                    <Text fontSize={11} color="$textMuted" marginTop={2} lineHeight={14}>
                      {task.description}
                    </Text>
                  )}
                </YStack>
              </XStack>
            );
          })}
        </YStack>
      </ScrollView>

      {showCelebration && (
        <YStack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          alignItems="center"
          justifyContent="center"
          backgroundColor="rgba(7,33,31,0.55)"
        >
          <YStack
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            onPress={() => setShowCelebration(false)}
          />
          <YStack
            backgroundColor="$surface"
            borderRadius={36}
            alignItems="center"
            marginHorizontal={28}
            position="relative"
            overflow="hidden"
            shadowColor="$accent"
            shadowOffset={{ width: 0, height: 12 }}
            shadowOpacity={0.25}
            shadowRadius={32}
            paddingHorizontal={36}
            paddingTop={36}
            paddingBottom={32}
          >
            <YStack position="absolute" top={0} left={0} right={0} height={5} backgroundColor="$accent" />

            <YStack
              position="absolute"
              top={16}
              right={16}
              width={32}
              height={32}
              alignItems="center"
              justifyContent="center"
              borderRadius={16}
              backgroundColor="rgba(0,0,0,0.06)"
              onPress={() => setShowCelebration(false)}
            >
              <Ionicons name="close" size={15} color={subtle} />
            </YStack>

            <YStack
              width={72}
              height={72}
              borderRadius={20}
              backgroundColor="$accentTint"
              borderWidth={2}
              borderColor="$accent"
              alignItems="center"
              justifyContent="center"
              marginBottom={18}
            >
              <Ionicons name="sparkles" size={32} color={accent} />
            </YStack>

            <Text fontSize={22} color="$accent" fontWeight="300" letterSpacing={3} marginBottom={10} textAlign="center">
              {t("celebrationSub")}
            </Text>
            <Text fontSize={24} fontWeight="700" textAlign="center" marginBottom={12} letterSpacing={-0.3}>
              {t("celebrationTitle")}
            </Text>
            <Text color="$textMuted" fontSize={13} textAlign="center" lineHeight={20} maxWidth={230}>
              {t("celebrationDesc")}
            </Text>

            <XStack gap={6} marginTop={20} marginBottom={4}>
              {[0, 1, 2].map((i) => (
                <YStack
                  key={i}
                  width={5}
                  height={5}
                  borderRadius={3}
                  backgroundColor={i === 1 ? warning : "$borderStrong"}
                />
              ))}
            </XStack>
          </YStack>
        </YStack>
      )}
    </SafeAreaView>
  );
}
