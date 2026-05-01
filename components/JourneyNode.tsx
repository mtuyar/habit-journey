import React from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { XStack, YStack, useTheme } from "tamagui";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Group } from "@/store/useProgressStore";
import { useTranslation } from "@/lib/i18n";

export function JourneyNode({
  group,
  index,
  isLast,
  prevCompleted = false,
}: {
  group: Group;
  index: number;
  isLast: boolean;
  prevCompleted?: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  const totalTasksPossible = group.durationInDays * group.tasks.length;
  let completedTasks = 0;
  Object.values(group.progress || {}).forEach((day) => {
    Object.values(day).forEach((done) => {
      if (done) completedTasks++;
    });
  });
  const ratio = totalTasksPossible === 0 ? 0 : completedTasks / totalTasksPossible;
  const perc = Math.round(ratio * 100);

  const isLocked = group.status === "locked";
  const isActive = group.status === "active";
  const isCompleted = group.status === "completed";

  const accent = theme.accent?.val ?? "#0D9488";
  const success = theme.success?.val ?? "#059669";
  const locked = theme.locked?.val ?? "#CBD5E1";

  const nodeBorder = isCompleted ? success : isActive ? accent : locked;

  return (
    <XStack alignItems="stretch">
      {/* Left vertical timeline track */}
      <YStack
        width={48}
        alignItems="center"
        justifyContent="center"
        marginRight={12}
        position="relative"
      >
        {index > 0 && (
          <YStack
            position="absolute"
            top={0}
            height="50%"
            width={3}
            borderRadius={99}
            backgroundColor={prevCompleted ? success : locked}
          />
        )}
        {!isLast && (
          <YStack
            position="absolute"
            top="50%"
            bottom={-20}
            width={3}
            borderRadius={99}
            backgroundColor={isCompleted ? success : locked}
          />
        )}
        <YStack
          width={40}
          height={40}
          borderRadius={20}
          marginBottom={24}
          alignItems="center"
          justifyContent="center"
          backgroundColor={isCompleted ? success : "$surface"}
          borderWidth={isCompleted ? 0 : 2}
          borderColor={nodeBorder}
          zIndex={10}
        >
          {isCompleted ? (
            <Ionicons name="checkmark" size={18} color="#FFF" />
          ) : isActive ? (
            <Text color={accent} fontWeight="800" fontSize={13}>
              {index + 1}
            </Text>
          ) : (
            <Ionicons name="lock-closed" size={13} color={locked} />
          )}
        </YStack>
      </YStack>

      {/* Main card */}
      <Card
        flex={1}
        marginBottom={20}
        opacity={isLocked ? 0.5 : 1}
        interactive
        onPress={() => router.push(`/group/${group.id}`)}
      >
        {!isLocked && (
          <XStack alignItems="center" justifyContent="space-between" marginBottom={8}>
            <XStack alignItems="center" gap={8}>
              <Badge tone={isCompleted ? "success" : "accent"}>
                {isCompleted ? t("statusCompleted") : t("statusActive")}
              </Badge>
              {!!group.retryCount && group.retryCount > 0 && (
                <Badge tone="warning">
                  {t("retryAttempt")} #{group.retryCount + 1}
                </Badge>
              )}
            </XStack>
            <Text fontSize={11} color="$textMuted" fontWeight="600">
              {perc}%
            </Text>
          </XStack>
        )}

        <Text
          fontSize={17}
          letterSpacing={-0.2}
          marginBottom={4}
          fontWeight={isLocked ? "400" : "600"}
          color={isLocked ? "$textMuted" : "$text"}
        >
          {group.name}
        </Text>

        <Text fontSize={11} color="$textMuted" letterSpacing={0.2} fontWeight="500" marginBottom={12}>
          {group.durationInDays} {t("days")} · {group.tasks.length} {t("task")}
        </Text>

        {!isLocked && <ProgressBar value={ratio} tone={isCompleted ? "success" : "accent"} />}
      </Card>
    </XStack>
  );
}
