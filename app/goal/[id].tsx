import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Text } from '@/components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProgressStore } from '@/store/useProgressStore';
import { useSettingsStore } from '@/store/useSettingsStore'; // Added import
import { router, useLocalSearchParams, useRouter } from 'expo-router'; // Added useRouter
import { Ionicons } from '@expo/vector-icons';
import { JourneyNode } from '@/components/JourneyNode';
import { useTranslation } from '@/lib/i18n'; // Added import

export default function GoalMapScreen() { // Changed component name
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter(); // Added useRouter hook
  const { t } = useTranslation(); // Added useTranslation hook
  
  const goals = useProgressStore(state => state.goals);
  const deleteGoal = useProgressStore(state => state.deleteGoal);
  const updateGoalName = useProgressStore(state => state.updateGoalName);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");

  const activeGoal = goals.find(g => g.id === id);

  if (!activeGoal) {
    return (
      <View className="flex-1 items-center justify-center bg-journeyBg dark:bg-journeyDarkBg px-8"> {/* Changed to View, added px-8 */}
        <Ionicons name="alert-circle-outline" size={48} color="#5F8B8A" className="mb-4" /> {/* Added icon */}
        <Text className="text-journeyMuted dark:text-journeyMuted text-sm font-normal text-center mb-8">{t('journeyNotFound')}</Text> {/* Used t() and updated classNames */}
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => router.back()} // Changed to router.back()
          className="bg-journeyAccent px-8 py-4 rounded-[24px] shadow-sm"
        >
          <Text className="text-white font-semibold flex-row items-center">
             {t('goBack')} {/* Used t() */}
          </Text>
        </TouchableOpacity>
      </View>
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

  // New handleDelete function for actual deletion
  const handleDelete = () => {
    router.replace('/');
    setTimeout(() => deleteGoal(activeGoal.id), 100);
  };

  const confirmDelete = () => { // Renamed original handleDelete to confirmDelete
    Alert.alert(
      t('deleteJourneyTitle'), // Used t()
      t('deleteJourneyDesc'), // Used t()
      [
        { text: t('cancel'), style: "cancel" }, // Used t()
        { 
          text: t('delete'), // Used t()
          style: "destructive", 
          onPress: handleDelete // Calls the new handleDelete
        }
      ]
    );
  };

  const handleDetailedEdit = () => {
    router.push(`/create?editGoalId=${activeGoal.id}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-journeyBg dark:bg-journeyDarkBg">
       {/* Soft Minimalist Top Header */}
       <View className="px-6 pt-4 pb-2 flex-row items-center">
         <TouchableOpacity 
           onPress={() => router.back()} // Changed to router.back()
           className="w-10 h-10 items-center justify-center -ml-2 mr-2"
         >
           <Ionicons name="chevron-back" size={24} color="#5F8B8A" />
         </TouchableOpacity>
         
         {isEditingName ? (
           <View className="flex-1 flex-row items-center justify-between">
              <TextInput 
                value={editNameValue}
                onChangeText={setEditNameValue}
                autoFocus
                className="flex-1 text-[24px] text-journeyText dark:text-journeyDarkText font-semibold tracking-tight border-b border-journeyAccent/30 pb-1 bg-transparent"
                onSubmitEditing={handleEditSave}
              />
              <TouchableOpacity onPress={handleEditSave} className="ml-4 bg-journeyAccent/10 px-4 py-2 rounded-[14px]">
                <Text className="text-journeyAccent font-bold text-[10px] uppercase tracking-wider">Kaydet</Text>
              </TouchableOpacity>
           </View>
         ) : (
           <View className="flex-1 flex-row items-center justify-between pr-2">
             <Text className="flex-1 text-[24px] text-journeyText dark:text-journeyDarkText font-semibold tracking-tight leading-[30px]" numberOfLines={2}>
               {activeGoal.name}
             </Text>
             <View className="flex-row gap-1 ml-2">
               <TouchableOpacity onPress={handleEditStart} className="w-8 h-8 items-center justify-center rounded-full" activeOpacity={0.6}>
                 <Ionicons name="pencil-outline" size={16} color="#5F8B8A" />
               </TouchableOpacity>
               <TouchableOpacity onPress={handleDetailedEdit} className="w-8 h-8 items-center justify-center rounded-full" activeOpacity={0.6}>
                 <Ionicons name="settings-outline" size={16} color="#5F8B8A" />
               </TouchableOpacity>
               <TouchableOpacity onPress={confirmDelete} className="w-8 h-8 items-center justify-center rounded-full" activeOpacity={0.6}>
                 <Ionicons name="trash-outline" size={16} color="#EF4444" />
               </TouchableOpacity>
             </View>
           </View>
         )}
       </View>

       <View className="px-8 mb-4">
         <Text className="text-journeyMuted dark:text-journeyMuted text-xs font-medium uppercase tracking-[2px] mt-2">Hedef Haritası</Text>
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
