import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProgressStore, Goal } from '@/store/useProgressStore';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getRandomQuote } from '@/lib/quotes';

function GoalCard({ goal }: { goal: Goal }) {
  let totalTasks = 0;
  let completedTasks = 0;
  
  goal.groups.forEach(gr => {
     totalTasks += gr.durationInDays * gr.tasks.length;
     Object.values(gr.progress).forEach(dayRecord => {
        Object.values(dayRecord).forEach(done => { if (done) completedTasks++; });
     });
  });
  
  const perc = totalTasks === 0 ? 0 : Math.round((completedTasks/totalTasks)*100);

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={() => router.push(`/goal/${goal.id}`)}
      className="bg-white border border-journeyBorder/40 rounded-[32px] p-6 mb-5 flex-row items-center justify-between"
    >
      <View className="flex-1 mr-4">
        <Text className="text-journeyText text-[20px] font-bold tracking-tight mb-2 leading-tight" numberOfLines={2}>{goal.name}</Text>
        <Text className="text-[#64748B] text-[11px] font-semibold uppercase tracking-wider">{goal.groups.length} Aşama • {totalTasks} Görev</Text>
      </View>
      <View className="w-14 h-14 rounded-full border-[3px] border-journeyAccent/10 items-center justify-center bg-journeyAccent/5">
         <Text className="text-journeyAccent font-bold text-[13px]">%{perc}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeDashboardScreen() {
  const goals = useProgressStore(state => state.goals);

  const [quote, setQuote] = useState("");
  useEffect(() => { setQuote(getRandomQuote()); }, []);

  if (goals.length === 0) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-journeyBg px-8">
        <View className="w-20 h-20 rounded-full bg-journeyBorder/30 items-center justify-center mb-6">
          <Ionicons name="leaf-outline" size={32} color="#94A3B8" />
        </View>
        <Text className="text-journeyText text-2xl font-light text-center mb-2">Yolculuk Başlamadı</Text>
        <Text className="text-journeyMuted text-sm font-normal text-center mb-6 leading-relaxed">Henüz hedefe giden bir yol haritası oluşturmadın. Tamamen temiz bir sayfa.</Text>
        <Text className="text-journeyAccent/80 text-[13px] italic font-medium text-center mb-10 mx-6 leading-snug">"{quote}"</Text>

        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => router.push('/create')}
          className="bg-journeyAccent px-8 py-4 rounded-[24px]"
        >
          <Text className="text-white font-semibold flex-row items-center tracking-wide">
             Yeni Hedef Belirle
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-journeyBg">
       <View className="px-8 pt-8 pb-4 flex-row justify-between items-end">
          <View>
            <Text className="text-[28px] text-journeyText font-semibold tracking-tight">Hedeflerim</Text>
            <Text className="text-[#64748B] text-xs font-medium uppercase tracking-[2px] mt-1">{goals.length} Aktif Yolculuk</Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/create')}
            className="w-12 h-12 bg-journeyAccent rounded-full items-center justify-center shadow-sm"
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
       </View>

       <View className="px-8 mt-1 mb-2">
         <Text className="text-journeyMuted text-[13px] italic font-medium">"{quote}"</Text>
       </View>

       <ScrollView 
         showsVerticalScrollIndicator={false} 
         contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 100 }}
       >
         {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
         ))}
       </ScrollView>
    </SafeAreaView>
  );
}
