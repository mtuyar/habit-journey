import React, { useState } from 'react';
import { ScrollView, View, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from '@/components/ui/Text';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProgressStore, Group, Task } from '@/store/useProgressStore';
import { cn } from '@/components/ui/Card';
import { useTranslation } from '@/lib/i18n';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '@/store/useSettingsStore';
import { generateJourneyRoadmap } from '@/lib/ai';

type DraftGroup = Omit<Group, 'id' | 'startDate' | 'progress' | 'status'>;

export default function CreateGoalScreen() {
  const { editGoalId } = useLocalSearchParams<{ editGoalId: string }>();
  const { t } = useTranslation();

  const goals = useProgressStore(state => state.goals);
  const addGoal = useProgressStore(state => state.addGoal);
  const updateGoal = useProgressStore(state => state.updateGoal);

  const editingGoal = goals.find(g => g.id === editGoalId);

  const [name, setName] = useState(editingGoal ? editingGoal.name : '');
  const [groups, setGroups] = useState<DraftGroup[]>(
    editingGoal ? editingGoal.groups : []
  );

  // Inline stage form state
  const [groupName, setGroupName] = useState('');
  const [groupDuration, setGroupDuration] = useState('');
  const [tasks, setTasks] = useState<{ name: string; description?: string }[]>([]);
  const [currentTask, setCurrentTask] = useState('');
  const [currentTaskDesc, setCurrentTaskDesc] = useState('');
  const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(null);

  // AI Integration
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const geminiApiKey = useSettingsStore(state => state.geminiApiKey);

  // ── Stage CRUD ────────────────────────────────────────────────────────────────

  const resetForm = () => {
    setGroupName('');
    setGroupDuration('');
    setTasks([]);
    setCurrentTask('');
    setCurrentTaskDesc('');
    setEditingGroupIndex(null);
  };

  const handleEditExistingGroup = (index: number) => {
    const g = groups[index];
    setGroupName(g.name);
    setGroupDuration(g.durationInDays.toString());
    setTasks(g.tasks.map(tk => ({ name: tk.name, description: tk.description })));
    setCurrentTask('');
    setCurrentTaskDesc('');
    setEditingGroupIndex(index);
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
      setTasks([...tasks, { name: currentTask.trim(), description: currentTaskDesc.trim() || undefined }]);
      setCurrentTask('');
      setCurrentTaskDesc('');
    }
  };

  const handleRemoveTask = (idx: number) => {
    setTasks(tasks.filter((_, i) => i !== idx));
  };

  const handleSaveStage = () => {
    if (!groupName.trim() || !groupDuration.trim() || isNaN(Number(groupDuration))) return;
    const newGroup: DraftGroup = {
      name: groupName.trim(),
      durationInDays: Number(groupDuration),
      tasks: tasks.map(tk => ({ id: Math.random().toString(), name: tk.name, description: tk.description })),
    };

    if (editingGroupIndex !== null) {
      const updated = [...groups];
      updated[editingGroupIndex] = newGroup;
      setGroups(updated);
    } else {
      setGroups([...groups, newGroup]);
    }
    resetForm();
  };

  // ── AI ────────────────────────────────────────────────────────────────────────

  const handleAiGeneration = async () => {
    if (!geminiApiKey) { alert(t('aiErrorNoKey')); return; }
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const roadmap = await generateJourneyRoadmap(aiPrompt, geminiApiKey);
      setName(roadmap.goalName);
      setGroups(roadmap.groups as DraftGroup[]);
      setAiPrompt('');
      setIsAiModalOpen(false);
    } catch {
      alert(t('aiErrorGeneration'));
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Save Goal ─────────────────────────────────────────────────────────────────

  const handleSaveGoal = () => {
    if (!name.trim()) { alert(t('errorEmptyGoalName')); return; }
    if (groups.length === 0) { alert(t('errorZeroTasks')); return; }
    if (groups.some(g => g.tasks.length === 0)) { alert(t('errorZeroTasks')); return; }

    if (editingGoal) {
      const updatedGroups = groups.map((g, i) => {
        const existingGr = editingGoal.groups.find(eg => eg.name === g.name);
        return {
          ...g,
          id: existingGr ? existingGr.id : Math.random().toString(),
          startDate: existingGr ? existingGr.startDate : (i === 0 ? new Date().toISOString() : null),
          status: existingGr ? existingGr.status : (i === 0 ? 'active' : 'locked'),
          progress: existingGr ? existingGr.progress : {},
        } as Group;
      });
      updateGoal({ ...editingGoal, name: name.trim(), groups: updatedGroups });
      router.back();
    } else {
      addGoal({
        id: Math.random().toString(),
        name: name.trim(),
        targetLevel: '',
        groups: groups.map((g, i) => ({
          ...g,
          id: Math.random().toString(),
          startDate: i === 0 ? new Date().toISOString() : null,
          status: i === 0 ? 'active' : 'locked',
          progress: {},
        })),
      });
      if (router.canGoBack()) router.back();
      else router.replace('/');
    }
  };

  const isFormValid = groupName.trim() && groupDuration.trim() && !isNaN(Number(groupDuration));
  const canSaveGoal = name.trim() && groups.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-journeyBg dark:bg-journeyDarkBg" edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* ── Header ── */}
        <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center -ml-2"
          >
            <Ionicons name="close-outline" size={28} color="#94A3B8" />
          </TouchableOpacity>
          <Text className="text-[11px] text-journeyMuted font-bold uppercase tracking-[3px]">
            {editingGoal ? t('editJourney') : t('planning')}
          </Text>
          <View className="w-10 h-10" />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── AI Button (new only) ── */}
          {!editingGoal && (
            <View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsAiModalOpen(true)}
                className="flex-row items-center bg-[#F0FDF4] dark:bg-journeyDarkCard border border-[#14B8A6]/30 dark:border-[#14B8A6]/40 p-5 rounded-[24px] mb-6 shadow-sm"
              >
                <View className="w-11 h-11 bg-white dark:bg-journeyDarkBg rounded-[14px] items-center justify-center mr-4 border border-[#14B8A6]/20 shadow-[0_4px_12px_rgba(20,184,166,0.15)]">
                  <Ionicons name="sparkles" size={20} color="#14B8A6" />
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-extrabold text-[#0D9488] dark:text-[#5EEAD4] tracking-tight">{t('aiCreateButton')}</Text>
                  <Text className="text-[11px] text-[#0F766E]/70 dark:text-[#99F6E4]/60 mt-0.5 leading-snug">{t('aiSubtitle')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#0F766E" />
              </TouchableOpacity>
            </View>
          )}


          {/* ── Goal Name ── */}
          <View className="mb-8">
            <TextInput
              className="border-b-2 border-journeyBorder/50 dark:border-journeyDarkBorder/50 py-3 text-[22px] font-semibold tracking-tight text-journeyText dark:text-journeyDarkText"
              placeholder={t('journeySubject')}
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* ── Stage List ── */}
          {groups.length > 0 && (
            <View className="mb-6">
              <Text className="text-[11px] font-bold text-journeyMuted uppercase tracking-[2px] mb-3">
                {t('currentStages')} · {groups.length}
              </Text>

              {groups.map((g, i) => {
                const isEditing = editingGroupIndex === i;
                return (
                  <View
                    key={`${g.name}-${i}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: isEditing ? '#F0FDFA' : '#fff',
                      borderColor: isEditing ? '#0D9488' : '#E2E8F0',
                      borderWidth: 1.5,
                      borderRadius: 20,
                      padding: 12,
                      marginBottom: 8,
                    }}
                    className="dark:bg-journeyDarkCard dark:border-journeyDarkBorder"
                  >
                    {/* Number badge */}
                    <View
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 10,
                        backgroundColor: isEditing ? '#0D9488' : '#F1F5F9',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '800', color: isEditing ? '#fff' : '#64748B' }}>
                        {i + 1}
                      </Text>
                    </View>

                    {/* Content */}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ fontSize: 14, fontWeight: '700', color: isEditing ? '#0D9488' : '#1E293B' }}
                        className="dark:text-journeyDarkText"
                        numberOfLines={1}
                      >
                        {g.name}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                        {g.durationInDays} {t('days')} · {g.tasks.length} {t('task')}
                      </Text>
                    </View>

                    {/* Reorder + Actions */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 0 }}>
                      {/* Up/Down arrows column */}
                      <View style={{ marginRight: 6 }}>
                        <TouchableOpacity
                          onPress={() => moveGroupUp(i)}
                          disabled={i === 0}
                          style={{ paddingHorizontal: 4, paddingVertical: 2, opacity: i === 0 ? 0.25 : 1 }}
                        >
                          <Ionicons name="chevron-up" size={14} color="#64748B" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => moveGroupDown(i)}
                          disabled={i === groups.length - 1}
                          style={{ paddingHorizontal: 4, paddingVertical: 2, opacity: i === groups.length - 1 ? 0.25 : 1 }}
                        >
                          <Ionicons name="chevron-down" size={14} color="#64748B" />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        onPress={() => isEditing ? resetForm() : handleEditExistingGroup(i)}
                        style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Ionicons
                          name={isEditing ? 'close-circle-outline' : 'pencil-outline'}
                          size={16}
                          color={isEditing ? '#0D9488' : '#64748B'}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleRemoveGroup(i)}
                        style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Ionicons name="trash-outline" size={15} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── Add / Edit Stage Form ── */}
          <View
            style={{
              borderRadius: 28,
              borderWidth: 1.5,
              borderColor: editingGroupIndex !== null ? '#0D9488' : '#E2E8F0',
              backgroundColor: editingGroupIndex !== null ? '#F0FDFA' : '#FAFAFA',
              padding: 20,
              marginBottom: 16,
            }}
            className="dark:bg-journeyDarkCard dark:border-journeyDarkBorder"
          >
            {/* Form title */}
            <View className="flex-row items-center justify-between mb-4">
              <Text style={{ fontSize: 13, fontWeight: '700', color: editingGroupIndex !== null ? '#0D9488' : '#64748B', textTransform: 'uppercase', letterSpacing: 1 }}>
                {editingGroupIndex !== null
                  ? `${t('editStageTitle')} — ${editingGroupIndex + 1}.`
                  : t('newStageStop')}
              </Text>
              {editingGroupIndex !== null && (
                <TouchableOpacity onPress={resetForm} className="px-3 py-1 bg-[#0D9488]/10 rounded-full">
                  <Text style={{ fontSize: 11, color: '#0D9488', fontWeight: '700' }}>{t('cancel')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Stage name */}
            <TextInput
              className="border-b border-journeyBorder/40 dark:border-journeyDarkBorder/40 py-3 text-[15px] font-medium text-journeyText dark:text-journeyDarkText mb-4"
              placeholder={t('stageNamePlaceholder')}
              placeholderTextColor="#94A3B8"
              value={groupName}
              onChangeText={setGroupName}
            />

            {/* Duration */}
            <TextInput
              className="border-b border-journeyBorder/40 dark:border-journeyDarkBorder/40 py-3 text-[15px] font-medium text-journeyText dark:text-journeyDarkText mb-5"
              placeholder={t('requiredDurationPlaceholder')}
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={groupDuration}
              onChangeText={setGroupDuration}
            />

            {/* Daily tasks */}
            <Text className="text-[11px] font-bold text-[#64748B] uppercase tracking-[2px] mb-3">{t('dailyTasks')}</Text>
            {tasks.map((task, idx) => (
              <View
                key={idx}
                className="flex-row items-start justify-between mb-2 bg-white dark:bg-journeyDarkBg px-3 py-2.5 rounded-xl border border-journeyBorder/30 dark:border-journeyDarkBorder/30"
              >
                <View className="flex-row items-start flex-1">
                  <View className="w-1.5 h-1.5 rounded-full bg-journeyAccent/50 mr-3 mt-[7px]" />
                  <View className="flex-1">
                    <Text className="text-[13px] text-journeyText dark:text-journeyDarkText font-medium" numberOfLines={2}>
                      {task.name}
                    </Text>
                    {!!task.description && (
                      <Text className="text-[11px] text-journeyMuted dark:text-journeyMuted mt-0.5" numberOfLines={1}>
                        {task.description}
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleRemoveTask(idx)} className="ml-2 p-1 mt-0.5">
                  <Ionicons name="close" size={15} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            ))}
            <View className="mt-2 border-b border-journeyBorder/40 dark:border-journeyDarkBorder/40 pb-2 mb-5">
              <View className="flex-row items-center">
                <TextInput
                  className="flex-1 py-2 text-[13px] font-medium text-journeyText dark:text-journeyDarkText"
                  placeholder={t('addTaskPlaceholder')}
                  placeholderTextColor="#94A3B8"
                  value={currentTask}
                  onChangeText={setCurrentTask}
                  onSubmitEditing={handleAddTask}
                  returnKeyType="done"
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  onPress={handleAddTask}
                  className="ml-2 px-4 py-2 bg-journeyAccent/10 rounded-[12px]"
                >
                  <Text className="text-journeyAccent font-bold text-[11px] uppercase tracking-wide">{t('add')}</Text>
                </TouchableOpacity>
              </View>
              {currentTask.trim().length > 0 && (
                <TextInput
                  className="py-1.5 text-[11px] text-journeyMuted dark:text-journeyMuted"
                  placeholder={t('taskNotePlaceholder')}
                  placeholderTextColor="#B2C4C3"
                  value={currentTaskDesc}
                  onChangeText={setCurrentTaskDesc}
                  returnKeyType="done"
                />
              )}
            </View>

            {/* Save stage button */}
            <TouchableOpacity
              onPress={handleSaveStage}
              disabled={!isFormValid}
              activeOpacity={0.8}
              style={{
                backgroundColor: isFormValid
                  ? (editingGroupIndex !== null ? '#0D9488' : '#F8FAFC')
                  : '#F1F5F9',
                borderWidth: 1,
                borderColor: isFormValid
                  ? (editingGroupIndex !== null ? '#0D9488' : '#CBD5E1')
                  : '#E2E8F0',
                borderRadius: 20,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: isFormValid
                    ? (editingGroupIndex !== null ? '#fff' : '#334155')
                    : '#CBD5E1',
                }}
              >
                {editingGroupIndex !== null ? t('updateStageBtn') : t('addStageToList')}
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>

        {/* ── Floating Save Goal Button ── */}
        {canSaveGoal && (
          <View className="absolute bottom-10 w-full px-8" pointerEvents="box-none">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSaveGoal}
              className="bg-journeyAccent rounded-[24px] py-4 items-center justify-center shadow-sm"
            >
              <Text className="font-bold tracking-wide text-white text-[15px]">
                {editingGoal ? t('saveChanges') : t('startJourney')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ── AI Prompt Modal ── */}
      {isAiModalOpen && (
        <View className="absolute inset-0 z-50 bg-black/50 justify-end">
          <TouchableOpacity
            activeOpacity={1}
            className="flex-1 w-full"
            onPress={() => !isGenerating && setIsAiModalOpen(false)}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 20}
            className="w-full"
          >
            <View
              className="bg-white dark:bg-journeyDarkBg w-full pt-6 pb-14 px-6 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] border-t border-journeyBorder/40 dark:border-journeyDarkBorder/40"
            >
              <View className="flex-row items-center justify-between mb-5">
                <View className="flex-row items-center">
                  <Ionicons name="sparkles" size={22} color="#14B8A6" />
                  <Text className="text-[18px] font-extrabold text-journeyText dark:text-journeyDarkText ml-2 tracking-tight">
                    {t('aiModalTitle')}
                  </Text>
                </View>
                {!isGenerating && (
                  <TouchableOpacity
                    onPress={() => setIsAiModalOpen(false)}
                    className="p-2 bg-[#F8FAFC] dark:bg-journeyDarkCard rounded-full"
                  >
                    <Ionicons name="close" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                multiline
                autoFocus
                editable={!isGenerating}
                value={aiPrompt}
                onChangeText={setAiPrompt}
                placeholder={t('aiModalPromptPlaceholder')}
                placeholderTextColor="#94A3B8"
                className="bg-[#F8FAFC] dark:bg-journeyDarkCard border border-journeyBorder/50 dark:border-journeyDarkBorder/50 rounded-2xl p-5 h-36 text-[15px] font-medium text-journeyText dark:text-journeyDarkText"
                style={{ textAlignVertical: 'top' }}
              />

              <TouchableOpacity
                activeOpacity={0.8}
                disabled={isGenerating || !aiPrompt.trim()}
                onPress={handleAiGeneration}
                className={cn(
                  'mt-5 py-4 rounded-[20px] items-center flex-row justify-center',
                  isGenerating || !aiPrompt.trim() ? 'bg-journeyMuted/30' : 'bg-[#0D9488]'
                )}
              >
                {isGenerating ? (
                  <>
                    <Text className="text-white font-bold text-[15px] mr-2">⏳</Text>
                    <Text className="text-white font-bold text-[15px]">{t('aiGenerating')}</Text>
                  </>
                ) : (
                  <Text className="text-white font-extrabold text-[15px] tracking-wide">{t('aiGenerateAction')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </SafeAreaView>
  );
}
