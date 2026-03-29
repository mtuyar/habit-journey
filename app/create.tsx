import React, { useState } from 'react';
import { ScrollView, View, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from '@/components/ui/Text';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProgressStore, Group, Task } from '@/store/useProgressStore';
import Animated, { FadeInDown, SlideInRight, FadeInUp } from 'react-native-reanimated';
import { cn } from '@/components/ui/Card';
import { useTranslation } from '@/lib/i18n';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { useSettingsStore } from '@/store/useSettingsStore';
import { generateJourneyRoadmap } from '@/lib/ai';

export default function CreateGoalScreen() {
  const { editGoalId } = useLocalSearchParams<{ editGoalId: string }>();
  const { t } = useTranslation();
  
  const goals = useProgressStore(state => state.goals);
  const addGoal = useProgressStore(state => state.addGoal);
  const updateGoal = useProgressStore(state => state.updateGoal);

  const editingGoal = goals.find(g => g.id === editGoalId);

  const [name, setName] = useState(editingGoal ? editingGoal.name : '');
  const [groups, setGroups] = useState<Omit<Group, 'id' | 'startDate' | 'progress' | 'status'>[]>(
    editingGoal ? editingGoal.groups : []
  );

  // Current group drafting
  const [groupName, setGroupName] = useState('');
  const [groupDuration, setGroupDuration] = useState('');
  const [tasks, setTasks] = useState<string[]>([]);
  const [currentTask, setCurrentTask] = useState('');

  // AI Integration
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const geminiApiKey = useSettingsStore(state => state.geminiApiKey);

  const handleAiGeneration = async () => {
    if (!geminiApiKey) {
      alert(t('aiErrorNoKey'));
      return;
    }
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    try {
      const roadmap = await generateJourneyRoadmap(aiPrompt, geminiApiKey);
      setName(roadmap.goalName);
      setGroups(roadmap.groups as Omit<Group, 'id' | 'startDate' | 'progress'>[]);
      setAiPrompt('');
      setIsAiModalOpen(false);
    } catch (err) {
      alert(t('aiErrorGeneration'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddTask = () => {
    if (currentTask.trim()) {
      setTasks([...tasks, currentTask.trim()]);
      setCurrentTask('');
    }
  };

  const handleRemoveTask = (idx: number) => {
    setTasks(tasks.filter((_, i) => i !== idx));
  };

  const handleAddGroup = () => {
    if (groupName.trim() && groupDuration.trim() && !isNaN(Number(groupDuration))) {
      setGroups([
        ...groups,
        {
          name: groupName.trim(),
          durationInDays: Number(groupDuration),
          tasks: tasks.map(t => ({ id: Math.random().toString(), name: t }))
        }
      ]);
      setGroupName('');
      setGroupDuration('');
      setTasks([]);
      // Keyboard.dismiss(); // Removed as per instruction to remove Keyboard import
    }
  };

  const handleEditExistingGroup = (index: number) => {
    const g = groups[index];
    setGroupName(g.name);
    setGroupDuration(g.durationInDays.toString());
    setTasks(g.tasks.map(t => t.name));
    setGroups(groups.filter((_, i) => i !== index));
  };

  const handleRemoveGroup = (index: number) => {
    setGroups(groups.filter((_, i) => i !== index));
  };

  const handleSaveGoal = () => {
    if (!name.trim()) {
      alert(t('errorEmptyGoalName'));
      return;
    }
    if (groups.length === 0) {
      alert(t('errorEmptyGoal'));
      return;
    }
    if (groups.some(g => g.tasks.length === 0)) {
      alert(t('errorZeroTasks'));
      return;
    }

    if (editingGoal) {
      // Update existing goal while preserving overall progress mapping if possible
      const updatedGroups = groups.map((g, i) => {
        // If the group already existed, try to preserve its status/progress
        const existingGr = editingGoal.groups.find(eg => eg.name === g.name);
        return {
          ...g,
          id: existingGr ? existingGr.id : Math.random().toString(),
          startDate: existingGr ? existingGr.startDate : (i === 0 ? new Date().toISOString() : null),
          status: existingGr ? existingGr.status : (i === 0 ? 'active' : 'locked'),
          progress: existingGr ? existingGr.progress : {}
        } as Group;
      });

      updateGoal({
        ...editingGoal,
        name: name.trim(),
        groups: updatedGroups
      });
      router.back(); // Go back to goal dashboard
    } else {
      // Create completely new goal
      addGoal({
        id: Math.random().toString(),
        name: name.trim(),
        targetLevel: '',
        groups: groups.map((g, i) => ({
          ...g,
          id: Math.random().toString(),
          startDate: i === 0 ? new Date().toISOString() : null,
          status: i === 0 ? 'active' : 'locked',
          progress: {}
        }))
      });
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-journeyBg dark:bg-[#0F172A]" edges={['top']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="w-10 h-10 items-center justify-center -ml-2"
          >
             <Ionicons name="close-outline" size={28} color="#94A3B8" />
          </TouchableOpacity>
          <Text className="text-[11px] text-journeyMuted dark:text-[#94A3B8] font-medium uppercase tracking-[3px]">
            {editingGoal ? t('editJourney') : t('planning')}
          </Text>
          <View className="w-10 h-10" />
        </View>

        <ScrollView 
          contentContainerStyle={{ padding: 24, paddingBottom: 160 }} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled" 
        >
          
          <Text className="text-2xl font-light text-journeyText dark:text-[#F8FAFC] tracking-tight mb-8">
            {editingGoal ? `${t('yourJourney')}\n` : `${t('cleanSlate')} `} 
            <Text className="font-medium">{editingGoal ? t('improve') : t('openPage')}</Text>
          </Text>

          {!editingGoal && (
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => setIsAiModalOpen(true)}
              className="flex-row items-center bg-[#F0FDF4] dark:bg-[#1E293B] border border-[#14B8A6]/30 dark:border-[#14B8A6]/40 p-5 rounded-[24px] mb-8 shadow-sm flex-none"
            >
              <View className="w-12 h-12 bg-white dark:bg-[#0F172A] rounded-[16px] items-center justify-center mr-4 border border-[#14B8A6]/20 shadow-[0_4px_12px_rgba(20,184,166,0.15)]">
                <Ionicons name="sparkles" size={22} color="#14B8A6" />
              </View>
              <View className="flex-1">
                <Text className="text-[16px] font-extrabold text-[#0D9488] dark:text-[#5EEAD4] tracking-tight">{t('aiCreateButton')}</Text>
                <Text className="text-[12px] font-semibold text-[#0F766E]/70 dark:text-[#99F6E4]/60 mt-1 leading-snug tracking-wide">Sadece hedefini yaz, süreci otonom çizelim.</Text>
              </View>
              <View className="w-8 h-8 rounded-full bg-[#CCFBF1] dark:bg-[#14B8A6]/20 items-center justify-center -mr-1">
                 <Ionicons name="chevron-forward" size={18} color="#0F766E" />
              </View>
            </TouchableOpacity>
          )}

          <View className="mb-10">
            <TextInput
              className="border-b border-journeyBorder/40 dark:border-[#334155]/40 py-3 text-[22px] font-semibold tracking-tight text-journeyText dark:text-[#F8FAFC]"
              placeholder={t('journeySubject')}
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />
          </View>

          {groups.length > 0 && (
            <View className="mb-10">
              <Text className="text-xs font-semibold text-journeyMuted dark:text-[#94A3B8] uppercase tracking-widest mb-4">{t('currentStages')}</Text>
              {groups.map((g, i) => (
                <View key={i} className="flex-row justify-between items-center py-4 border-b border-journeyBorder/30 dark:border-[#334155]/30">
                   <View className="flex-1 mr-4">
                     <Text className="text-[16px] font-semibold text-journeyText dark:text-[#F8FAFC] mb-1">{g.name}</Text>
                     <Text className="text-[11px] font-medium text-journeyMuted dark:text-[#94A3B8] uppercase">{g.durationInDays} {t('days')}</Text>
                   </View>
                   <View className="flex-row gap-4">
                     <TouchableOpacity onPress={() => handleEditExistingGroup(i)}>
                       <Ionicons name="pencil-outline" size={18} color="#64748B" />
                     </TouchableOpacity>
                     <TouchableOpacity onPress={() => handleRemoveGroup(i)}>
                       <Ionicons name="trash-outline" size={18} color="#EF4444" />
                     </TouchableOpacity>
                   </View>
                </View>
              ))}
            </View>
          )}

          <View className="bg-journeyCard dark:bg-[#1E293B] border rounded-[32px] border-journeyBorder/40 dark:border-[#334155]/40 p-6">
            <Text className="text-sm font-semibold text-journeyText dark:text-[#F8FAFC] tracking-tight mb-4">{t('newStageStop')}</Text>
            
            <TextInput
              className="border-b border-journeyBorder/40 dark:border-[#334155]/40 py-3 text-[15px] font-medium text-journeyText dark:text-[#F8FAFC] mb-4"
              placeholder={t('stageNamePlaceholder')}
              placeholderTextColor="#94A3B8"
              value={groupName}
              onChangeText={setGroupName}
            />
            <TextInput
              className="border-b border-journeyBorder/40 dark:border-[#334155]/40 py-3 text-[15px] font-medium text-journeyText dark:text-[#F8FAFC] mb-6"
              placeholder={t('requiredDurationPlaceholder')}
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={groupDuration}
              onChangeText={setGroupDuration}
            />

            <View className="mb-6 mt-2">
               <Text className="text-[11px] font-bold text-[#64748B] uppercase tracking-[2px] mb-4">{t('dailyTasks')}</Text>
               {tasks.map((t, idx) => (
                 <View key={idx} className="flex-row items-center justify-between mb-3 bg-[#F8FAFC] p-3 rounded-xl border border-journeyBorder/20 dark:border-[#334155]/20">
                   <View className="flex-row items-center flex-1">
                     <View className="w-1.5 h-1.5 rounded-full bg-journeyAccent/50 mr-3" />
                     <Text className="text-[13px] text-journeyText dark:text-[#F8FAFC] font-medium" numberOfLines={2}>{t}</Text>
                   </View>
                   <TouchableOpacity onPress={() => handleRemoveTask(idx)} className="ml-2 px-2 py-1">
                     <Ionicons name="close" size={16} color="#94A3B8" />
                   </TouchableOpacity>
                 </View>
               ))}
               <View className="flex-row items-center mt-2 border-b border-journeyBorder/40 dark:border-[#334155]/40 pb-2">
                 <TextInput
                   className="flex-1 py-2 text-[13px] font-medium text-journeyText dark:text-[#F8FAFC]"
                   placeholder={t('addTaskPlaceholder')}
                   placeholderTextColor="#94A3B8"
                   value={currentTask}
                   onChangeText={setCurrentTask}
                   onSubmitEditing={handleAddTask}
                   returnKeyType="done"
                   blurOnSubmit={false}
                 />
                 <TouchableOpacity onPress={handleAddTask} className="pl-3 py-2 bg-journeyAccent/10 px-4 rounded-[12px] ml-2">
                   <Text className="text-journeyAccent font-bold text-[11px] tracking-wide uppercase">{t('add')}</Text>
                 </TouchableOpacity>
               </View>
            </View>

            <TouchableOpacity 
               onPress={handleAddGroup}
               activeOpacity={0.8}
               className="bg-[#F8FAFC] dark:bg-[#0F172A] border border-journeyBorder/40 dark:border-[#334155]/40 rounded-[24px] py-4 items-center justify-center mt-2"
            >
               <Text className="text-journeyText dark:text-[#F8FAFC] text-[13px] font-bold">{t('addStageToList')}</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>

        {/* Floating Save Button */}
        {name && groups.length > 0 && (
          <View className="absolute bottom-10 w-full px-8" pointerEvents="box-none">
             <TouchableOpacity 
               activeOpacity={0.8}
               onPress={handleSaveGoal}
               className="bg-journeyAccent rounded-[24px] py-4 items-center justify-center shadow-sm"
             >
               <Text className="font-bold tracking-wide text-white text-[15px]">
                 {editingGoal ? 'Değişiklikleri Kaydet' : 'Rotayı Oluştur'}
               </Text>
             </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* AI Prompt Modal (Bottom Sheet Style) */}
      {isAiModalOpen && (
        <View className="absolute inset-0 z-50 bg-black/50 justify-end">
          <TouchableOpacity 
            activeOpacity={1} 
            className="flex-1 w-full"
            onPress={() => !isGenerating && setIsAiModalOpen(false)}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 20}
            className="w-full"
          >
            <Animated.View entering={FadeInDown.springify().damping(14)} className="bg-white dark:bg-[#0F172A] w-full pt-6 pb-14 px-6 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] border-t border-journeyBorder/40 dark:border-[#334155]/40 mt-auto">
              <View className="flex-row items-center justify-between mb-5">
                 <View className="flex-row items-center">
                   <Ionicons name="sparkles" size={24} color="#14B8A6" />
                   <Text className="text-[19px] font-extrabold text-journeyText dark:text-[#F8FAFC] ml-2 tracking-tight">{t('aiModalTitle')}</Text>
                 </View>
                 {!isGenerating && (
                   <TouchableOpacity onPress={() => setIsAiModalOpen(false)} className="p-2 -mr-2 bg-[#F8FAFC] dark:bg-[#1E293B] rounded-full">
                     <Ionicons name="close" size={20} color="#94A3B8" />
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
                className="bg-[#F8FAFC] dark:bg-[#1E293B] border border-journeyBorder/50 dark:border-[#334155]/50 rounded-2xl p-5 h-40 text-[15px] font-medium text-journeyText dark:text-[#F8FAFC] flex-col justify-start"
                style={{ textAlignVertical: 'top' }}
              />

              <TouchableOpacity 
                activeOpacity={0.8}
                disabled={isGenerating || !aiPrompt.trim()}
                onPress={handleAiGeneration}
                className={cn(
                  "mt-6 py-4 rounded-[20px] items-center flex-row justify-center shadow-sm",
                  isGenerating || !aiPrompt.trim() ? "bg-journeyMuted/30 dark:bg-[#334155]/30" : "bg-gradient-to-r bg-[#0D9488]"
                )}
              >
                {isGenerating ? (
                  <>
                    <Text className="text-white font-bold text-[16px] mr-2">⏳</Text>
                    <Text className="text-white font-bold text-[16px] ml-1">{t('aiGenerating')}</Text>
                  </>
                ) : (
                  <Text className="text-white font-extrabold text-[16px] tracking-wide">{t('aiGenerateAction')}</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      )}
    </SafeAreaView>
  );
}
