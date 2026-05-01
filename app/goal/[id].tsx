import React, { useEffect, useState } from "react";
import { ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { XStack, YStack, useTheme } from "tamagui";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { JourneyNode } from "@/components/JourneyNode";
import { useProgressStore } from "@/store/useProgressStore";
import { useTranslation } from "@/lib/i18n";

export default function GoalMapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, upper } = useTranslation();
  const theme = useTheme();

  const goals = useProgressStore((s) => s.goals);
  const deleteGoal = useProgressStore((s) => s.deleteGoal);
  const archiveGoal = useProgressStore((s) => s.archiveGoal);
  const retryExpiredGroups = useProgressStore((s) => s.retryExpiredGroups);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const activeGoal = goals.find((g) => g.id === id);

  useEffect(() => {
    if (activeGoal) retryExpiredGroups(activeGoal.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGoal?.id]);

  const bg = theme.bg?.val ?? "#F8FAFC";
  const muted = theme.textMuted?.val ?? "#64748B";

  if (!activeGoal) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        <YStack flex={1} alignItems="center" justifyContent="center" paddingHorizontal={32}>
          <Ionicons name="alert-circle-outline" size={48} color={muted} />
          <Text fontSize={14} color="$textMuted" textAlign="center" marginTop={16} marginBottom={32}>
            {t("journeyNotFound")}
          </Text>
          <Button onPress={() => router.back()} size="lg">
            {t("goBack")}
          </Button>
        </YStack>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    router.replace("/");
    setTimeout(() => deleteGoal(activeGoal.id), 100);
  };

  const confirmDelete = () => {
    Alert.alert(t("deleteJourneyTitle"), t("deleteJourneyDesc"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("delete"), style: "destructive", onPress: handleDelete },
    ]);
  };

  const completedGroups = activeGoal.groups.filter((g) => g.status === "completed").length;
  const totalGroups = activeGoal.groups.length;
  const isFullyCompleted = completedGroups === totalGroups && totalGroups > 0;
  const isArchived = !!activeGoal.archived;

  const handleArchive = () => {
    Alert.alert(
      isArchived ? t("unarchiveGoal") : t("archiveGoalTitle"),
      isArchived ? "" : t("archiveGoalConfirm"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: isArchived ? t("unarchiveGoal") : t("archiveGoal"),
          onPress: () => {
            archiveGoal(activeGoal.id, !isArchived);
            if (!isArchived) router.replace("/");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <XStack paddingHorizontal={24} paddingTop={16} paddingBottom={8} alignItems="center">
        <IconButton
          icon="chevron-back"
          size="lg"
          onPress={() => router.back()}
          marginLeft={-8}
          marginRight={4}
        />

        <XStack flex={1} alignItems="center" justifyContent="space-between" paddingRight={4}>
          <YStack flex={1} marginRight={12}>
            <Text fontSize={22} fontWeight="700" letterSpacing={-0.3} lineHeight={28} numberOfLines={2}>
              {activeGoal.name}
            </Text>
            <XStack alignItems="center" gap={8} marginTop={2}>
              <Text
                fontSize={11}
                color="$textMuted"
                fontWeight="500"
                letterSpacing={1.5}
              >
                {upper(`${t("goalMap")} · ${completedGroups}/${totalGroups} ${t("stage")}`)}
              </Text>
              {isArchived && <Badge tone="warning">{t("archivedBadge")}</Badge>}
            </XStack>
          </YStack>

          <YStack position="relative" zIndex={isMenuOpen ? 100 : undefined}>
            <IconButton
              onPress={() => setIsMenuOpen((v) => !v)}
              icon="ellipsis-vertical"
              tone="neutral"
            />
            {isMenuOpen && (
              <>
                <YStack
                  position="absolute"
                  top={-1000}
                  left={-1000}
                  right={-1000}
                  bottom={-1000}
                  zIndex={50}
                  onPress={() => setIsMenuOpen(false)}
                />
                <YStack
                  position="absolute"
                  top={48}
                  right={0}
                  zIndex={60}
                  backgroundColor="$surface"
                  borderRadius={14}
                  borderWidth={1}
                  borderColor="$border"
                  shadowColor="$shadowColor"
                  shadowOffset={{ width: 0, height: 6 }}
                  shadowOpacity={0.12}
                  shadowRadius={16}
                  elevation={8}
                  minWidth={180}
                  paddingVertical={4}
                >
                  <XStack
                    paddingHorizontal={14}
                    paddingVertical={10}
                    alignItems="center"
                    gap={10}
                    pressStyle={{ backgroundColor: "$surfaceAlt" }}
                    onPress={() => {
                      setIsMenuOpen(false);
                      router.push(`/create?editGoalId=${activeGoal.id}`);
                    }}
                  >
                    <Ionicons name="create-outline" size={16} color={muted} />
                    <Text fontSize={14} fontWeight="500">
                      {t("edit")}
                    </Text>
                  </XStack>
                  {(isFullyCompleted || isArchived) && (
                    <XStack
                      paddingHorizontal={14}
                      paddingVertical={10}
                      alignItems="center"
                      gap={10}
                      pressStyle={{ backgroundColor: "$surfaceAlt" }}
                      onPress={() => {
                        setIsMenuOpen(false);
                        handleArchive();
                      }}
                    >
                      <Ionicons name="archive-outline" size={16} color={muted} />
                      <Text fontSize={14} fontWeight="500">
                        {isArchived ? t("unarchiveGoal") : t("archiveGoal")}
                      </Text>
                    </XStack>
                  )}
                  <XStack
                    paddingHorizontal={14}
                    paddingVertical={10}
                    alignItems="center"
                    gap={10}
                    pressStyle={{ backgroundColor: "$dangerSoft" }}
                    onPress={() => {
                      setIsMenuOpen(false);
                      confirmDelete();
                    }}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={theme.danger?.val ?? "#EF4444"}
                    />
                    <Text fontSize={14} fontWeight="500" color="$danger">
                      {t("delete")}
                    </Text>
                  </XStack>
                </YStack>
              </>
            )}
          </YStack>
        </XStack>
      </XStack>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 100 }}
      >
        {activeGoal.groups.map((group, index) => (
          <JourneyNode
            key={group.id}
            group={group}
            index={index}
            isLast={index === activeGoal.groups.length - 1}
            prevCompleted={
              index > 0 && activeGoal.groups[index - 1].status === "completed"
            }
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

