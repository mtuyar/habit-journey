import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/Text';
import Animated, { FadeInDown, FadeInUp, SlideInLeft, SlideInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProgressStore, Goal } from '@/store/useProgressStore';
import { useTranslation } from '@/lib/i18n';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getRandomQuote } from '@/lib/quotes';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const ScaledAnimatedText = Animated.createAnimatedComponent(Text);

function GoalCard({ goal, index }: { goal: Goal, index: number }) {
  const { t } = useTranslation();
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
    <AnimatedTouchableOpacity 
      entering={FadeInDown.delay(index * 100).springify()}
      activeOpacity={0.7} 
      onPress={() => router.push(`/goal/${goal.id}`)}
      className="bg-journeyCard dark:bg-[#1E293B] border border-journeyBorder/40 dark:border-[#334155]/40 rounded-[32px] p-6 mb-5 flex-row items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
    >
      <View className="flex-1 mr-4">
        <Text className="text-journeyText dark:text-[#F8FAFC] text-[20px] font-bold tracking-tight mb-2 leading-tight" numberOfLines={2}>{goal.name}</Text>
        <Text className="text-[#64748B] text-[11px] font-semibold uppercase tracking-wider">{goal.groups.length} {t('stage')} • {totalTasks} {t('task')}</Text>
      </View>
      <View className="w-14 h-14 rounded-full border-[3px] border-journeyAccent/10 items-center justify-center bg-journeyAccent/5">
         <Text className="text-journeyAccent font-bold text-[13px]">%{perc}</Text>
      </View>
    </AnimatedTouchableOpacity>
  );
}

export default function HomeDashboardScreen() {
  const goals = useProgressStore(state => state.goals);
  const { t } = useTranslation();

  const [quote, setQuote] = useState("");
  useEffect(() => { setQuote(getRandomQuote()); }, []);

  if (goals.length === 0) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-journeyBg dark:bg-[#0F172A] px-8">
        <Animated.View entering={FadeInDown.springify()} className="w-20 h-20 rounded-full bg-journeyBorder/30 items-center justify-center mb-6">
          <Ionicons name="leaf-outline" size={32} color="#94A3B8" />
        </Animated.View>
        <ScaledAnimatedText entering={FadeInDown.delay(100).springify()} className="text-journeyText dark:text-[#F8FAFC] text-2xl font-light text-center mb-2">{t('noJourneyTitle')}</ScaledAnimatedText>
        <ScaledAnimatedText entering={FadeInDown.delay(200).springify()} className="text-journeyMuted dark:text-[#94A3B8] text-sm font-normal text-center mb-6 leading-relaxed">{t('noJourneyDesc')}</ScaledAnimatedText>
        <ScaledAnimatedText entering={FadeInDown.delay(300).springify()} className="text-journeyAccent/80 text-[13px] italic font-medium text-center mb-10 mx-6 leading-snug">"{quote}"</ScaledAnimatedText>

        <AnimatedTouchableOpacity 
          entering={FadeInUp.delay(500).springify()}
          activeOpacity={0.8}
          onPress={() => router.push('/create')}
          className="bg-journeyAccent px-8 py-4 rounded-[24px] shadow-sm"
        >
          <Text className="text-white font-semibold flex-row items-center tracking-wide">
             {t('newJourneyBtn')}
          </Text>
        </AnimatedTouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-journeyBg dark:bg-[#0F172A]">
       <Animated.View entering={FadeInDown.springify()} className="px-8 pt-8 pb-4 flex-row justify-between items-end">
          <View>
            <Text className="text-[28px] text-journeyText dark:text-[#F8FAFC] font-semibold tracking-tight">{t('dashboardTitle')}</Text>
            <Text className="text-[#64748B] text-xs font-medium uppercase tracking-[2px] mt-1">{goals.length} {t('activeJourneys')}</Text>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => router.push('/settings')}
              className="w-12 h-12 bg-journeyCard dark:bg-[#1E293B] border border-journeyBorder/40 dark:border-[#334155]/40 rounded-full items-center justify-center mr-2 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
            >
              <Ionicons name="settings-outline" size={22} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => router.push('/create')}
              className="w-12 h-12 bg-journeyAccent rounded-full items-center justify-center shadow-sm"
            >
              <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
       </Animated.View>

       <Animated.View entering={FadeInDown.delay(100).springify()} className="px-8 mt-1 mb-2">
         <Text className="text-journeyMuted dark:text-[#94A3B8] text-[13px] italic font-medium">"{quote}"</Text>
       </Animated.View>

       <ScrollView 
         showsVerticalScrollIndicator={false} 
         contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 100 }}
       >
         {goals.map((goal, i) => (
            <GoalCard key={goal.id} goal={goal} index={i} />
         ))}
       </ScrollView>
    </SafeAreaView>
  );
}
