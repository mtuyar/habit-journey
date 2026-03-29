import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/Text';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProgressStore, Goal, computeStreak, getTodayProgress } from '@/store/useProgressStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTranslation } from '@/lib/i18n';
import { router, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getRandomQuote } from '@/lib/quotes';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

function progressColor(perc: number): string {
  if (perc >= 90) return '#059669';
  if (perc >= 50) return '#0D9488';
  if (perc > 0) return '#F59E0B';
  return '#B2F0E8';
}

function ProgressRing({ perc, size = 64 }: { perc: number; size?: number }) {
  const color = progressColor(perc);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 4,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: color + '18',
      }}
    >
      {perc === 100 ? (
        <Ionicons name="checkmark" size={size * 0.38} color={color} />
      ) : (
        <Text style={{ color, fontWeight: '800', fontSize: size * 0.22, lineHeight: size * 0.28 }}>
          {perc}%
        </Text>
      )}
    </View>
  );
}

function TodayFocusCard({ goals }: { goals: Goal[] }) {
  const { t } = useTranslation();
  const { completed, total } = getTodayProgress(goals);

  if (total === 0) return null;

  const perc = Math.round((completed / total) * 100);
  const allDone = completed === total;

  return (
    <Animated.View
      entering={FadeInDown.delay(150).springify()}
      className="mx-6 mb-5 bg-journeyAccent rounded-[28px] p-5 overflow-hidden"
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-white/80 text-[11px] font-bold uppercase tracking-[2px]">
          {t('todaysFocus')}
        </Text>
        {allDone && <Text style={{ fontSize: 20 }}>🎉</Text>}
      </View>

      <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', lineHeight: 32 }}>
        {completed}
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: '400' }}>
          /{total} {t('tasksToday')}
        </Text>
      </Text>

      <View
        style={{
          width: '100%',
          height: 6,
          backgroundColor: 'rgba(255,255,255,0.2)',
          borderRadius: 99,
          marginTop: 14,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${perc}%`,
            height: '100%',
            backgroundColor: '#fff',
            borderRadius: 99,
          }}
        />
      </View>
    </Animated.View>
  );
}

function GoalCard({ goal, index }: { goal: Goal; index: number }) {
  const { t } = useTranslation();
  let totalTasks = 0;
  let completedTasks = 0;

  goal.groups.forEach(gr => {
    totalTasks += gr.durationInDays * gr.tasks.length;
    Object.values(gr.progress).forEach(dayRecord => {
      Object.values(dayRecord).forEach(done => { if (done) completedTasks++; });
    });
  });

  const perc = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const activeGroup = goal.groups.find(g => g.status === 'active');
  const completedGroups = goal.groups.filter(g => g.status === 'completed').length;
  const color = progressColor(perc);

  return (
    <AnimatedTouchableOpacity
      entering={FadeInDown.delay(index * 100).springify()}
      activeOpacity={0.7}
      onPress={() => router.push(`/goal/${goal.id}`)}
      className="bg-journeyCard dark:bg-journeyDarkCard border border-journeyBorder dark:border-journeyDarkBorder rounded-[32px] p-5 mb-4 flex-row items-center"
    >
      <View className="flex-1 mr-4">
        <Text
          className="text-journeyText dark:text-journeyDarkText text-[18px] font-bold tracking-tight mb-1"
          numberOfLines={2}
        >
          {goal.name}
        </Text>
        <Text className="text-journeyMuted text-[11px] font-semibold uppercase tracking-wider">
          {completedGroups}/{goal.groups.length} {t('stage')}
          {activeGroup ? ` · ${activeGroup.name}` : ''}
        </Text>

        <View
          style={{
            width: '100%',
            height: 4,
            backgroundColor: '#B2F0E8',
            borderRadius: 99,
            overflow: 'hidden',
            marginTop: 12,
          }}
        >
          <View style={{ width: `${perc}%`, height: '100%', backgroundColor: color, borderRadius: 99 }} />
        </View>
      </View>

      <ProgressRing perc={perc} size={64} />
    </AnimatedTouchableOpacity>
  );
}

export default function HomeDashboardScreen() {
  const goals = useProgressStore(state => state.goals);
  const hasCompletedOnboarding = useSettingsStore(state => state.hasCompletedOnboarding);
  const { t } = useTranslation();
  const [quote, setQuote] = useState('');

  useEffect(() => { setQuote(getRandomQuote()); }, []);

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  const streak = computeStreak(goals);

  if (goals.length === 0) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-journeyBg dark:bg-journeyDarkBg px-8">
        <Animated.View
          entering={FadeInDown.springify()}
          className="w-24 h-24 rounded-full bg-journeyBorder dark:bg-journeyDarkBorder items-center justify-center mb-6"
        >
          <Ionicons name="leaf-outline" size={40} color="#0D9488" />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text className="text-journeyText dark:text-journeyDarkText text-2xl font-light text-center mb-2">
            {t('noJourneyTitle')}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text className="text-journeyMuted text-sm text-center mb-6 leading-relaxed">
            {t('noJourneyDesc')}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text className="text-journeyAccent/80 text-[13px] italic font-medium text-center mb-10 mx-4 leading-snug">
            "{quote}"
          </Text>
        </Animated.View>

        <AnimatedTouchableOpacity
          entering={FadeInUp.delay(500).springify()}
          activeOpacity={0.8}
          onPress={() => router.push('/create')}
          className="bg-journeyAccent px-8 py-4 rounded-[24px]"
        >
          <Text className="text-white font-semibold tracking-wide">{t('newJourneyBtn')}</Text>
        </AnimatedTouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-journeyBg dark:bg-journeyDarkBg">
      {/* Header */}
      <Animated.View
        entering={FadeInDown.springify()}
        className="px-6 pt-6 pb-3 flex-row justify-between items-center"
      >
        <View>
          <Text className="text-[28px] text-journeyText dark:text-journeyDarkText font-bold tracking-tight">
            {t('dashboardTitle')}
          </Text>
          <Text className="text-journeyMuted text-xs font-medium uppercase tracking-[2px] mt-0.5">
            {goals.length} {t('activeJourneys')}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          {/* Streak Badge */}
          {streak > 0 && (
            <Animated.View
              entering={FadeInDown.delay(200).springify()}
              className="flex-row items-center bg-journeyGold/15 border border-journeyGold/40 px-3 py-2 rounded-full"
            >
              <Text style={{ fontSize: 14 }}>🔥</Text>
              <Text className="text-journeyGold font-bold text-[13px] ml-1">{streak}</Text>
            </Animated.View>
          )}

          <TouchableOpacity
            onPress={() => router.push('/settings')}
            className="w-11 h-11 bg-journeyCard dark:bg-journeyDarkCard border border-journeyBorder dark:border-journeyDarkBorder rounded-full items-center justify-center"
          >
            <Ionicons name="settings-outline" size={20} color="#5F8B8A" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/create')}
            className="w-11 h-11 bg-journeyAccent rounded-full items-center justify-center"
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Quote */}
      <Animated.View entering={FadeInDown.delay(100).springify()} className="px-6 mb-4">
        <Text className="text-journeyMuted text-[12px] italic leading-snug">"{quote}"</Text>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Today's Focus Panel */}
        <TodayFocusCard goals={goals} />

        {/* Goal Cards */}
        <View className="px-6">
          {goals.map((goal, i) => (
            <GoalCard key={goal.id} goal={goal} index={i} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
