import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProgressStore } from '@/store/useProgressStore';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { JourneyNode } from '@/components/JourneyNode';

export default function GoalJourneyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const goals = useProgressStore(state => state.goals);
  const deleteGoal = useProgressStore(state => state.deleteGoal);
  const updateGoalName = useProgressStore(state => state.updateGoalName);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");

  const activeGoal = goals.find(g => g.id === id);

  if (!activeGoal) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-journeyBg px-8">
        <Text className="text-journeyMuted text-sm font-normal text-center mb-8">Bu yolculuk bulunamadı veya silinmiş.</Text>
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => router.replace('/')}
          className="bg-journeyAccent px-8 py-4 rounded-[24px] shadow-sm"
        >
          <Text className="text-white font-semibold flex-row items-center">
             Geri Dön
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleEditStart = () => {
    setEditNameValue(activeGoal.name);
    setIsEditingName(true);
  };

  const handleEditSave = () => {
    if (editNameValue.trim()) {
      updateGoalName(activeGoal.id, editNameValue.trim());
    }
    setIsEditingName(false);
  };

  const handleDelete = () => {
    Alert.alert(
      "Yolculuğu Sil",
      "Bu yolculuğu tamamen silmek istediğine emin misin? Tüm verilerin ve ilerlemen kaybolacak.",
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive", 
          onPress: () => {
            router.replace('/');
            setTimeout(() => deleteGoal(activeGoal.id), 100);
          }
        }
      ]
    );
  };

  const handleDetailedEdit = () => {
    router.push(`/create?editGoalId=${activeGoal.id}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-journeyBg">
       {/* Soft Minimalist Top Header */}
       <View className="px-6 pt-4 pb-2 flex-row items-center">
         <TouchableOpacity 
           onPress={() => router.replace('/')} 
           className="w-10 h-10 items-center justify-center -ml-2 mr-2"
         >
           <Ionicons name="chevron-back" size={24} color="#94A3B8" />
         </TouchableOpacity>
         
         {isEditingName ? (
           <View className="flex-1 flex-row items-center justify-between">
              <TextInput 
                value={editNameValue}
                onChangeText={setEditNameValue}
                autoFocus
                className="flex-1 text-[24px] text-journeyText font-semibold tracking-tight border-b border-journeyAccent/30 pb-1 bg-transparent"
                onSubmitEditing={handleEditSave}
              />
              <TouchableOpacity onPress={handleEditSave} className="ml-4 bg-journeyAccent/10 px-4 py-2 rounded-[14px]">
                <Text className="text-journeyAccent font-bold text-[10px] uppercase tracking-wider">Kaydet</Text>
              </TouchableOpacity>
           </View>
         ) : (
           <View className="flex-1 flex-row items-center justify-between pr-2">
             <Text className="flex-1 text-[24px] text-journeyText font-semibold tracking-tight leading-[30px]" numberOfLines={2}>
               {activeGoal.name}
             </Text>
             <View className="flex-row gap-1 ml-2">
               <TouchableOpacity onPress={handleEditStart} className="w-8 h-8 items-center justify-center rounded-full" activeOpacity={0.6}>
                 <Ionicons name="pencil-outline" size={16} color="#94A3B8" />
               </TouchableOpacity>
               <TouchableOpacity onPress={handleDetailedEdit} className="w-8 h-8 items-center justify-center rounded-full" activeOpacity={0.6}>
                 <Ionicons name="settings-outline" size={16} color="#64748B" />
               </TouchableOpacity>
               <TouchableOpacity onPress={handleDelete} className="w-8 h-8 items-center justify-center rounded-full" activeOpacity={0.6}>
                 <Ionicons name="trash-outline" size={16} color="#EF4444" />
               </TouchableOpacity>
             </View>
           </View>
         )}
       </View>

       <View className="px-8 mb-4">
         <Text className="text-journeyMuted text-xs font-medium uppercase tracking-[2px] mt-2">Hedef Haritası</Text>
       </View>

       {/* Map List */}
       <ScrollView 
         showsVerticalScrollIndicator={false} 
         contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
       >
         {activeGoal.groups.map((group, index) => (
            <JourneyNode 
              key={group.id} 
              group={group} 
              index={index} 
              isLast={index === activeGoal.groups.length - 1}
            />
         ))}
       </ScrollView>
    </SafeAreaView>
  );
}
