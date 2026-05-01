import React, { useRef, useState } from "react";
import {
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { XStack, YStack, useTheme } from "tamagui";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { useProgressStore, Group } from "@/store/useProgressStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTranslation } from "@/lib/i18n";
import { generateJourneyRoadmap } from "@/lib/ai";

type DraftGroup = Omit<Group, "id" | "startDate" | "progress" | "status">;

export default function CreateGoalScreen() {
  const { editGoalId } = useLocalSearchParams<{ editGoalId: string }>();
  const { t, upper } = useTranslation();
  const theme = useTheme();

  const goals = useProgressStore((s) => s.goals);
  const addGoal = useProgressStore((s) => s.addGoal);
  const updateGoal = useProgressStore((s) => s.updateGoal);

  const editingGoal = goals.find((g) => g.id === editGoalId);

  const [name, setName] = useState(editingGoal ? editingGoal.name : "");
  const [groups, setGroups] = useState<DraftGroup[]>(
    editingGoal ? editingGoal.groups : []
  );

  const [groupName, setGroupName] = useState("");
  const [groupDuration, setGroupDuration] = useState("");
  const [tasks, setTasks] = useState<{ name: string; description?: string }[]>([]);
  const [currentTask, setCurrentTask] = useState("");
  const [currentTaskDesc, setCurrentTaskDesc] = useState("");
  const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(null);

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const geminiApiKey = useSettingsStore((s) => s.geminiApiKey);

  const scrollRef = useRef<ScrollView>(null);

  const muted = theme.textMuted?.val ?? "#64748B";
  const subtle = theme.textSubtle?.val ?? "#94A3B8";
  const accent = theme.accent?.val ?? "#0D9488";
  const textColor = theme.text?.val ?? "#0F172A";
  const bg = theme.bg?.val ?? "#F8FAFC";

  // ── Stage CRUD ────────────────────────────────────────────────────────────────

  const resetForm = () => {
    setGroupName("");
    setGroupDuration("");
    setTasks([]);
    setCurrentTask("");
    setCurrentTaskDesc("");
    setEditingGroupIndex(null);
  };

  const handleEditExistingGroup = (index: number) => {
    const g = groups[index];
    setGroupName(g.name);
    setGroupDuration(g.durationInDays.toString());
    setTasks(g.tasks.map((tk) => ({ name: tk.name, description: tk.description })));
    setCurrentTask("");
    setCurrentTaskDesc("");
    setEditingGroupIndex(index);
  };

  const openNewStageModal = () => {
    resetForm();
    setIsStageModalOpen(true);
  };

  const openEditStageModal = (index: number) => {
    handleEditExistingGroup(index);
    setIsStageModalOpen(true);
  };

  const closeStageModal = () => {
    setIsStageModalOpen(false);
    resetForm();
  };

  const handleRemoveGroup = (index: number) => {
    if (editingGroupIndex === index) resetForm();
    else if (editingGroupIndex !== null && index < editingGroupIndex) {
      setEditingGroupIndex(editingGroupIndex - 1);
    }
    setGroups(groups.filter((_, i) => i !== index));
  };

  const moveGroupUp = (index: number) => {
    if (index === 0) return;
    const updated = [...groups];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setGroups(updated);
    if (editingGroupIndex === index) setEditingGroupIndex(index - 1);
    else if (editingGroupIndex === index - 1) setEditingGroupIndex(index);
  };

  const moveGroupDown = (index: number) => {
    if (index === groups.length - 1) return;
    const updated = [...groups];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setGroups(updated);
    if (editingGroupIndex === index) setEditingGroupIndex(index + 1);
    else if (editingGroupIndex === index + 1) setEditingGroupIndex(index);
  };

  const handleAddTask = () => {
    if (currentTask.trim()) {
      setTasks([
        ...tasks,
        { name: currentTask.trim(), description: currentTaskDesc.trim() || undefined },
      ]);
      setCurrentTask("");
      setCurrentTaskDesc("");
      setIsTaskModalOpen(false);
    }
  };

  const openTaskModal = () => {
    setCurrentTask("");
    setCurrentTaskDesc("");
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setCurrentTask("");
    setCurrentTaskDesc("");
  };

  const handleRemoveTask = (idx: number) => {
    setTasks(tasks.filter((_, i) => i !== idx));
  };

  const handleSaveStage = () => {
    if (!groupName.trim() || !groupDuration.trim() || isNaN(Number(groupDuration))) return;
    const newGroup: DraftGroup = {
      name: groupName.trim(),
      durationInDays: Number(groupDuration),
      tasks: tasks.map((tk) => ({
        id: Math.random().toString(),
        name: tk.name,
        description: tk.description,
      })),
    };

    if (editingGroupIndex !== null) {
      const updated = [...groups];
      updated[editingGroupIndex] = newGroup;
      setGroups(updated);
    } else {
      setGroups([...groups, newGroup]);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
    resetForm();
    setIsStageModalOpen(false);
  };

  const handleAiGeneration = async () => {
    if (!geminiApiKey) {
      Alert.alert(t("aiErrorNoKey"));
      return;
    }
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const roadmap = await generateJourneyRoadmap(aiPrompt, geminiApiKey);
      setName(roadmap.goalName);
      setGroups(roadmap.groups as DraftGroup[]);
      setAiPrompt("");
      setIsAiModalOpen(false);
    } catch {
      Alert.alert(t("aiErrorGeneration"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveGoal = () => {
    if (!name.trim()) {
      Alert.alert(t("errorEmptyGoalName"));
      return;
    }
    if (groups.length === 0 || groups.some((g) => g.tasks.length === 0)) {
      Alert.alert(t("errorZeroTasks"));
      return;
    }

    if (editingGoal) {
      const updatedGroups = groups.map((g, i) => {
        const existingGr = editingGoal.groups.find((eg) => eg.name === g.name);
        return {
          ...g,
          id: existingGr ? existingGr.id : Math.random().toString(),
          startDate: existingGr
            ? existingGr.startDate
            : i === 0
            ? new Date().toISOString()
            : null,
          status: existingGr ? existingGr.status : i === 0 ? "active" : "locked",
          progress: existingGr ? existingGr.progress : {},
        } as Group;
      });
      updateGoal({ ...editingGoal, name: name.trim(), groups: updatedGroups });
      router.back();
    } else {
      addGoal({
        id: Math.random().toString(),
        name: name.trim(),
        targetLevel: "",
        groups: groups.map((g, i) => ({
          ...g,
          id: Math.random().toString(),
          startDate: i === 0 ? new Date().toISOString() : null,
          status: i === 0 ? "active" : "locked",
          progress: {},
        })),
      });
      if (router.canGoBack()) router.back();
      else router.replace("/");
    }
  };

  const isFormValid =
    groupName.trim() && groupDuration.trim() && !isNaN(Number(groupDuration));
  const canSaveGoal = name.trim() && groups.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <XStack
          paddingHorizontal={24}
          paddingTop={16}
          paddingBottom={8}
          alignItems="center"
          justifyContent="space-between"
        >
          <IconButton
            icon="close-outline"
            size="lg"
            onPress={() => router.back()}
            marginLeft={-8}
          />
          <Text
            fontSize={11}
            color="$textMuted"
            fontWeight="700"
            letterSpacing={3}
          >
            {upper(editingGoal ? t("editJourney") : t("planning"))}
          </Text>
          <YStack width={44} height={44} />
        </XStack>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 24, paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
        >
          {!editingGoal && !!geminiApiKey?.trim() && (
            <XStack
              backgroundColor="$accentSoft"
              borderColor="$border"
              borderWidth={1}
              padding={20}
              borderRadius={20}
              marginBottom={24}
              alignItems="center"
              gap={16}
              onPress={() => setIsAiModalOpen(true)}
              pressStyle={{ opacity: 0.85 }}
            >
              <YStack
                width={44}
                height={44}
                backgroundColor="$surface"
                borderRadius={14}
                borderColor="$border"
                borderWidth={1}
                alignItems="center"
                justifyContent="center"
              >
                <Ionicons name="sparkles" size={20} color={accent} />
              </YStack>
              <YStack flex={1}>
                <Text fontSize={15} fontWeight="800" color="$accent" letterSpacing={-0.2}>
                  {t("aiCreateButton")}
                </Text>
                <Text fontSize={11} color="$textMuted" marginTop={2} lineHeight={16}>
                  {t("aiSubtitle")}
                </Text>
              </YStack>
              <Ionicons name="chevron-forward" size={18} color={accent} />
            </XStack>
          )}

          <YStack marginBottom={32}>
            <TextInput
              placeholder={t("journeySubject")}
              placeholderTextColor={subtle}
              value={name}
              onChangeText={setName}
              style={{
                borderBottomWidth: 2,
                borderBottomColor: theme.border?.val ?? "#E2E8F0",
                paddingVertical: 12,
                fontSize: 22,
                fontWeight: "600",
                color: textColor,
                letterSpacing: -0.3,
              }}
            />
          </YStack>

          {groups.length > 0 && (
            <YStack marginBottom={24}>
              <Text
                fontSize={11}
                fontWeight="700"
                color="$textMuted"
                letterSpacing={2}
                marginBottom={12}
              >
                {upper(`${t("currentStages")} · ${groups.length}`)}
              </Text>

              {groups.map((g, i) => {
                const isEditing = editingGroupIndex === i;
                const isMenuOpen = openMenuIndex === i;
                return (
                  <XStack
                    key={`${g.name}-${i}`}
                    alignItems="center"
                    backgroundColor={isEditing ? "$accentSoft" : "$surface"}
                    borderColor={isEditing ? "$accent" : "$border"}
                    borderWidth={1.5}
                    borderRadius={20}
                    padding={12}
                    marginBottom={8}
                    position="relative"
                    zIndex={isMenuOpen ? 100 : undefined}
                  >
                    <YStack
                      width={30}
                      height={30}
                      borderRadius={10}
                      backgroundColor={isEditing ? "$accent" : "$surfaceAlt"}
                      alignItems="center"
                      justifyContent="center"
                      marginRight={12}
                    >
                      <Text
                        fontSize={13}
                        fontWeight="800"
                        color={isEditing ? "$textInverse" : "$textMuted"}
                      >
                        {i + 1}
                      </Text>
                    </YStack>

                    <YStack flex={1}>
                      <Text
                        fontSize={14}
                        fontWeight="700"
                        color={isEditing ? "$accent" : "$text"}
                        numberOfLines={1}
                      >
                        {g.name}
                      </Text>
                      <Text fontSize={11} color="$textSubtle" marginTop={2}>
                        {g.durationInDays} {t("days")} · {g.tasks.length} {t("task")}
                      </Text>
                    </YStack>

                    <XStack alignItems="center">
                      <YStack marginRight={6}>
                        <YStack
                          paddingHorizontal={4}
                          paddingVertical={2}
                          opacity={i === 0 ? 0.25 : 1}
                          onPress={() => moveGroupUp(i)}
                          disabled={i === 0}
                        >
                          <Ionicons name="chevron-up" size={14} color={muted} />
                        </YStack>
                        <YStack
                          paddingHorizontal={4}
                          paddingVertical={2}
                          opacity={i === groups.length - 1 ? 0.25 : 1}
                          onPress={() => moveGroupDown(i)}
                          disabled={i === groups.length - 1}
                        >
                          <Ionicons name="chevron-down" size={14} color={muted} />
                        </YStack>
                      </YStack>

                      {isEditing ? (
                        <IconButton
                          size="sm"
                          icon="close-circle-outline"
                          tone="accent"
                          onPress={resetForm}
                        />
                      ) : (
                        <IconButton
                          size="sm"
                          icon="ellipsis-vertical"
                          tone="neutral"
                          onPress={() => setOpenMenuIndex(isMenuOpen ? null : i)}
                        />
                      )}
                    </XStack>

                    {isMenuOpen && (
                      <>
                        <YStack
                          position="absolute"
                          top={-1000}
                          left={-1000}
                          right={-1000}
                          bottom={-1000}
                          zIndex={50}
                          onPress={() => setOpenMenuIndex(null)}
                        />
                        <YStack
                          position="absolute"
                          top={48}
                          right={12}
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
                          minWidth={160}
                          paddingVertical={4}
                        >
                          <XStack
                            paddingHorizontal={14}
                            paddingVertical={10}
                            alignItems="center"
                            gap={10}
                            pressStyle={{ backgroundColor: "$surfaceAlt" }}
                            onPress={() => {
                              setOpenMenuIndex(null);
                              openEditStageModal(i);
                            }}
                          >
                            <Ionicons name="create-outline" size={16} color={muted} />
                            <Text fontSize={14} fontWeight="500">
                              {t("edit")}
                            </Text>
                          </XStack>
                          <XStack
                            paddingHorizontal={14}
                            paddingVertical={10}
                            alignItems="center"
                            gap={10}
                            pressStyle={{ backgroundColor: "$dangerSoft" }}
                            onPress={() => {
                              setOpenMenuIndex(null);
                              handleRemoveGroup(i);
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
                  </XStack>
                );
              })}
            </YStack>
          )}

          <XStack
            alignItems="center"
            justifyContent="center"
            paddingVertical={18}
            borderRadius={20}
            borderWidth={1.5}
            borderStyle="dashed"
            borderColor="$borderStrong"
            backgroundColor="$surface"
            gap={10}
            marginBottom={16}
            onPress={openNewStageModal}
            pressStyle={{ opacity: 0.75, backgroundColor: "$accentSoft" }}
          >
            <Ionicons name="add-circle-outline" size={20} color={accent} />
            <Text fontSize={14} fontWeight="700" color="$accent" letterSpacing={0.2}>
              {groups.length === 0 ? t("newStageStop") : t("addStage")}
            </Text>
          </XStack>
        </ScrollView>

        {canSaveGoal && (
          <YStack
            position="absolute"
            bottom={40}
            left={0}
            right={0}
            paddingHorizontal={32}
            style={{ pointerEvents: "box-none" }}
          >
            <Button size="lg" fullWidth onPress={handleSaveGoal}>
              {editingGoal ? t("saveChanges") : t("startJourney")}
            </Button>
          </YStack>
        )}
      </KeyboardAvoidingView>

      {isAiModalOpen && (
        <YStack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={50}
          justifyContent="flex-start"
          alignItems="center"
          paddingTop={72}
        >
          <YStack
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            backgroundColor="rgba(0,0,0,0.5)"
            onPress={() => !isGenerating && setIsAiModalOpen(false)}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
            style={{ width: "100%", alignItems: "center", paddingHorizontal: 20 }}
          >
            <YStack
              backgroundColor="$surface"
              padding={24}
              borderRadius={28}
              width="100%"
              maxWidth={480}
            >
              <XStack alignItems="center" justifyContent="space-between" marginBottom={20}>
                <XStack alignItems="center" gap={8}>
                  <Ionicons name="sparkles" size={22} color={accent} />
                  <Text fontSize={18} fontWeight="800" letterSpacing={-0.3}>
                    {t("aiModalTitle")}
                  </Text>
                </XStack>
                {!isGenerating && (
                  <YStack
                    padding={8}
                    backgroundColor="$surfaceAlt"
                    borderRadius={99}
                    onPress={() => setIsAiModalOpen(false)}
                  >
                    <Ionicons name="close" size={18} color={subtle} />
                  </YStack>
                )}
              </XStack>

              <TextInput
                multiline
                autoFocus
                editable={!isGenerating}
                value={aiPrompt}
                onChangeText={setAiPrompt}
                placeholder={t("aiModalPromptPlaceholder")}
                placeholderTextColor={subtle}
                style={{
                  backgroundColor: theme.surfaceAlt?.val ?? "#F1F5F9",
                  borderColor: theme.border?.val ?? "#E2E8F0",
                  borderWidth: 1,
                  borderRadius: 16,
                  padding: 20,
                  height: 144,
                  fontSize: 15,
                  fontWeight: "500",
                  color: textColor,
                  textAlignVertical: "top",
                }}
              />

              <YStack marginTop={20}>
                <Button
                  size="lg"
                  fullWidth
                  loading={isGenerating}
                  disabled={isGenerating || !aiPrompt.trim()}
                  onPress={handleAiGeneration}
                >
                  {isGenerating ? t("aiGenerating") : t("aiGenerateAction")}
                </Button>
              </YStack>
            </YStack>
          </KeyboardAvoidingView>
        </YStack>
      )}

      {isStageModalOpen && (
        <YStack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={40}
          justifyContent="flex-start"
          alignItems="center"
          paddingTop={56}
        >
          <YStack
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            backgroundColor="rgba(0,0,0,0.5)"
            onPress={closeStageModal}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
            style={{ width: "100%", alignItems: "center", paddingHorizontal: 20, flex: 1 }}
          >
            <YStack
              backgroundColor="$surface"
              padding={24}
              borderRadius={28}
              width="100%"
              maxWidth={480}
              flex={1}
              marginBottom={40}
            >
              <XStack alignItems="center" justifyContent="space-between" marginBottom={20}>
                <XStack alignItems="center" gap={8} flex={1}>
                  <Ionicons
                    name={editingGroupIndex !== null ? "create-outline" : "flag-outline"}
                    size={22}
                    color={accent}
                  />
                  <Text fontSize={18} fontWeight="800" letterSpacing={-0.3} numberOfLines={1}>
                    {editingGroupIndex !== null
                      ? `${t("editStageTitle")} — ${editingGroupIndex + 1}.`
                      : t("newStageStop")}
                  </Text>
                </XStack>
                <YStack
                  padding={8}
                  backgroundColor="$surfaceAlt"
                  borderRadius={99}
                  onPress={closeStageModal}
                >
                  <Ionicons name="close" size={18} color={subtle} />
                </YStack>
              </XStack>

              <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets
              >
                <TextInput
                  placeholder={t("stageNamePlaceholder")}
                  placeholderTextColor={subtle}
                  value={groupName}
                  onChangeText={setGroupName}
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border?.val ?? "#E2E8F0",
                    paddingVertical: 12,
                    fontSize: 15,
                    fontWeight: "500",
                    color: textColor,
                    marginBottom: 16,
                  }}
                />

                <TextInput
                  placeholder={t("requiredDurationPlaceholder")}
                  placeholderTextColor={subtle}
                  keyboardType="numeric"
                  value={groupDuration}
                  onChangeText={setGroupDuration}
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border?.val ?? "#E2E8F0",
                    paddingVertical: 12,
                    fontSize: 15,
                    fontWeight: "500",
                    color: textColor,
                    marginBottom: 20,
                  }}
                />

                <Text
                  fontSize={11}
                  fontWeight="700"
                  color="$textMuted"
                  letterSpacing={2}
                  marginBottom={12}
                >
                  {upper(t("dailyTasks"))}
                </Text>

                {tasks.map((task, idx) => (
                  <XStack
                    key={idx}
                    alignItems="flex-start"
                    justifyContent="space-between"
                    marginBottom={8}
                    backgroundColor="$surfaceAlt"
                    paddingHorizontal={12}
                    paddingVertical={10}
                    borderRadius={12}
                    borderWidth={1}
                    borderColor="$border"
                  >
                    <XStack flex={1} alignItems="flex-start">
                      <YStack
                        width={6}
                        height={6}
                        borderRadius={3}
                        backgroundColor="$accent"
                        marginRight={12}
                        marginTop={7}
                        opacity={0.5}
                      />
                      <YStack flex={1}>
                        <Text fontSize={13} fontWeight="500" numberOfLines={2}>
                          {task.name}
                        </Text>
                        {!!task.description && (
                          <Text fontSize={11} color="$textMuted" marginTop={2} numberOfLines={1}>
                            {task.description}
                          </Text>
                        )}
                      </YStack>
                    </XStack>
                    <YStack
                      marginLeft={8}
                      padding={4}
                      marginTop={2}
                      onPress={() => handleRemoveTask(idx)}
                    >
                      <Ionicons name="close" size={15} color={subtle} />
                    </YStack>
                  </XStack>
                ))}

                <XStack
                  marginTop={tasks.length === 0 ? 0 : 4}
                  alignItems="center"
                  justifyContent="center"
                  paddingVertical={12}
                  borderRadius={12}
                  borderWidth={1}
                  borderStyle="dashed"
                  borderColor="$borderStrong"
                  backgroundColor="$surfaceAlt"
                  gap={8}
                  onPress={openTaskModal}
                  pressStyle={{ opacity: 0.7 }}
                >
                  <Ionicons name="add" size={16} color={accent} />
                  <Text fontSize={13} fontWeight="600" color="$accent" letterSpacing={0.2}>
                    {t("addTask")}
                  </Text>
                </XStack>
              </ScrollView>

              <YStack marginTop={20}>
                <Button
                  size="lg"
                  fullWidth
                  disabled={!isFormValid}
                  onPress={handleSaveStage}
                >
                  {editingGroupIndex !== null ? t("updateStageBtn") : t("addStageToList")}
                </Button>
              </YStack>
            </YStack>
          </KeyboardAvoidingView>
        </YStack>
      )}

      {isTaskModalOpen && (
        <YStack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={50}
          justifyContent="flex-start"
          alignItems="center"
          paddingTop={72}
        >
          <YStack
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            backgroundColor="rgba(0,0,0,0.5)"
            onPress={closeTaskModal}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
            style={{ width: "100%", alignItems: "center", paddingHorizontal: 20 }}
          >
            <YStack
              backgroundColor="$surface"
              padding={24}
              borderRadius={28}
              width="100%"
              maxWidth={480}
            >
              <XStack alignItems="center" justifyContent="space-between" marginBottom={20}>
                <XStack alignItems="center" gap={8}>
                  <Ionicons name="add-circle-outline" size={22} color={accent} />
                  <Text fontSize={18} fontWeight="800" letterSpacing={-0.3}>
                    {t("addTask")}
                  </Text>
                </XStack>
                <YStack
                  padding={8}
                  backgroundColor="$surfaceAlt"
                  borderRadius={99}
                  onPress={closeTaskModal}
                >
                  <Ionicons name="close" size={18} color={subtle} />
                </YStack>
              </XStack>

              <TextInput
                autoFocus
                value={currentTask}
                onChangeText={setCurrentTask}
                placeholder={t("addTaskPlaceholder")}
                placeholderTextColor={subtle}
                returnKeyType="next"
                style={{
                  backgroundColor: theme.surfaceAlt?.val ?? "#F1F5F9",
                  borderColor: theme.border?.val ?? "#E2E8F0",
                  borderWidth: 1,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 15,
                  fontWeight: "500",
                  color: textColor,
                  marginBottom: 12,
                }}
              />

              <TextInput
                value={currentTaskDesc}
                onChangeText={setCurrentTaskDesc}
                placeholder={t("taskNotePlaceholder")}
                placeholderTextColor={subtle}
                returnKeyType="done"
                onSubmitEditing={handleAddTask}
                style={{
                  backgroundColor: theme.surfaceAlt?.val ?? "#F1F5F9",
                  borderColor: theme.border?.val ?? "#E2E8F0",
                  borderWidth: 1,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 13,
                  color: textColor,
                }}
              />

              <YStack marginTop={20}>
                <Button
                  size="lg"
                  fullWidth
                  disabled={!currentTask.trim()}
                  onPress={handleAddTask}
                >
                  {t("add")}
                </Button>
              </YStack>
            </YStack>
          </KeyboardAvoidingView>
        </YStack>
      )}
    </SafeAreaView>
  );
}
