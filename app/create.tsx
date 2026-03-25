import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useProgressStore, Group, Goal } from '@/store/useProgressStore';
import { Ionicons } from '@expo/vector-icons';

export default function CreateGoalScreen() {
  const { editGoalId } = useLocalSearchParams<{ editGoalId: string }>();
  
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
      Keyboard.dismiss();
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
    if (name.trim() && groups.length > 0) {
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
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-journeyBg" edges={['top']}>
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
          <Text className="text-[11px] text-journeyMuted font-medium uppercase tracking-[3px]">
            {editingGoal ? 'Yolculuğu Düzenle' : 'Planlama'}
          </Text>
          <View className="w-10 h-10" />
        </View>

        <ScrollView 
          contentContainerStyle={{ padding: 24, paddingBottom: 160 }} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled" 
        >
          
          <Text className="text-2xl font-light text-journeyText tracking-tight mb-8">
            {editingGoal ? `Yolculuğunu\n` : `Temiz bir `} 
            <Text className="font-medium">{editingGoal ? 'Geliştir.' : 'sayfa aç.'}</Text>
          </Text>

          <View className="mb-10">
            <TextInput
              className="border-b border-journeyBorder/40 py-3 text-[22px] font-semibold tracking-tight text-journeyText"
              placeholder="Yolculuğun Konusu"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />
          </View>

          {groups.length > 0 && (
            <View className="mb-10">
              <Text className="text-xs font-semibold text-journeyMuted uppercase tracking-widest mb-4">Mevcut Aşamalar</Text>
              {groups.map((g, i) => (
                <View key={i} className="flex-row justify-between items-center py-4 border-b border-journeyBorder/30">
                   <View className="flex-1 mr-4">
                     <Text className="text-[16px] font-semibold text-journeyText mb-1">{g.name}</Text>
                     <Text className="text-[11px] font-medium text-journeyMuted uppercase">{g.durationInDays} Gün</Text>
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

          <View className="bg-white border rounded-[32px] border-journeyBorder/40 p-6">
            <Text className="text-sm font-semibold text-journeyText tracking-tight mb-4">Yeni Aşama / Durak</Text>
            
            <TextInput
              className="border-b border-journeyBorder/40 py-3 text-[15px] font-medium text-journeyText mb-4"
              placeholder="Aşama Adı (Örn. Başlangıç)"
              placeholderTextColor="#94A3B8"
              value={groupName}
              onChangeText={setGroupName}
            />
            <TextInput
              className="border-b border-journeyBorder/40 py-3 text-[15px] font-medium text-journeyText mb-6"
              placeholder="Gereken Süre (Örn. 21 Gün)"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={groupDuration}
              onChangeText={setGroupDuration}
            />

            <View className="mb-6 mt-2">
               <Text className="text-[11px] font-bold text-[#64748B] uppercase tracking-[2px] mb-4">Günlük Yapılacaklar</Text>
               {tasks.map((t, idx) => (
                 <View key={idx} className="flex-row items-center justify-between mb-3 bg-[#F8FAFC] p-3 rounded-xl border border-journeyBorder/20">
                   <View className="flex-row items-center flex-1">
                     <View className="w-1.5 h-1.5 rounded-full bg-journeyAccent/50 mr-3" />
                     <Text className="text-[13px] text-journeyText font-medium" numberOfLines={2}>{t}</Text>
                   </View>
                   <TouchableOpacity onPress={() => handleRemoveTask(idx)} className="ml-2 px-2 py-1">
                     <Ionicons name="close" size={16} color="#94A3B8" />
                   </TouchableOpacity>
                 </View>
               ))}
               <View className="flex-row items-center mt-2 border-b border-journeyBorder/40 pb-2">
                 <TextInput
                   className="flex-1 py-2 text-[13px] font-medium text-journeyText"
                   placeholder="Görev Yaz ve Ekle..."
                   placeholderTextColor="#94A3B8"
                   value={currentTask}
                   onChangeText={setCurrentTask}
                   onSubmitEditing={handleAddTask}
                   returnKeyType="done"
                   blurOnSubmit={false}
                 />
                 <TouchableOpacity onPress={handleAddTask} className="pl-3 py-2 bg-journeyAccent/10 px-4 rounded-[12px] ml-2">
                   <Text className="text-journeyAccent font-bold text-[11px] tracking-wide uppercase">Ekle</Text>
                 </TouchableOpacity>
               </View>
            </View>

            <TouchableOpacity 
               onPress={handleAddGroup} 
               activeOpacity={0.8}
               className="bg-[#F8FAFC] border border-journeyBorder/40 rounded-[24px] py-4 items-center justify-center mt-2"
            >
               <Text className="text-journeyText text-[13px] font-bold">Listeye Aşama Olarak Ekle</Text>
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
    </SafeAreaView>
  );
}
