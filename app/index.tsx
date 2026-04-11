import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProgressStore, Goal, computeStreak, getTodayProgress, getThisWeekStats } from '@/store/useProgressStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTranslation } from '@/lib/i18n';
import { router, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getRandomQuote } from '@/lib/quotes';

function progressColor(perc: number): string {
  if (perc >= 90) return '#059669';
  if (perc >= 50) return '#0D9488';
  if (perc > 0) return '#F59E0B';
  return '#B2F0E8';
}

function ProgressRing({ perc, size = 52 }: { perc: number; size?: number }) {
  const color = progressColor(perc);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 3,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: color + '18',
        flexShrink: 0,
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
    <View className="mx-6 mb-4 bg-journeyAccent rounded-[24px] p-5 overflow-hidden">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-white/80 text-[11px] font-bold uppercase tracking-[2px]">
          {t('todaysFocus')}
        </Text>
        {allDone && <Text style={{ fontSize: 18 }}>🤲</Text>}
      </View>
      <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', lineHeight: 32 }}>
        {completed}
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: '400' }}>
          /{total} {t('tasksToday')}
        </Text>
      </Text>
      <View style={{ width: '100%', height: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 99, marginTop: 14, overflow: 'hidden' }}>
        <View style={{ width: `${perc}%`, height: '100%', backgroundColor: '#fff', borderRadius: 99 }} />
      </View>
    </View>
  );
}

function GoalCard({ goal, isDark }: { goal: Goal; isDark: boolean }) {
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
    <TouchableOpacity
      activeOpacity={0.68}
      onPress={() => router.push(`/goal/${goal.id}`)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? '#0E3330' : '#FFFFFF',
        borderRadius: 22,
        marginBottom: 10,
        paddingHorizontal: 18,
        paddingVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.2 : 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View style={{ flex: 1, marginRight: 14 }}>
        <Text
          style={{ color: isDark ? '#CCFBF1' : '#134E4A', fontSize: 16, fontWeight: '600', letterSpacing: -0.2, marginBottom: 5, lineHeight: 21 }}
          numberOfLines={2}
        >
          {goal.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color, marginRight: 6 }} />
          <Text style={{ fontSize: 11, color: '#5F8B8A', fontWeight: '500', letterSpacing: 0.2 }} numberOfLines={1}>
            {completedGroups}/{goal.groups.length} {t('stage')}
            {activeGroup ? ` · ${activeGroup.name}` : ''}
          </Text>
        </View>
      </View>
      <ProgressRing perc={perc} size={52} />
    </TouchableOpacity>
  );
}

export default function HomeDashboardScreen() {
  const goals = useProgressStore(state => state.goals);
  const hasCompletedOnboarding = useSettingsStore(state => state.hasCompletedOnboarding);
  const isDarkMode = useSettingsStore(state => state.isDarkMode);
  const { t } = useTranslation();
  const [quote, setQuote] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => { setQuote(getRandomQuote()); }, []);

  if (!hasCompletedOnboarding) return <Redirect href="/onboarding" />;

  const activeGoals = goals.filter(g => !g.archived);
  const archivedGoals = goals.filter(g => g.archived);
  const streak = computeStreak(goals);
  const { activeDays, elapsed } = getThisWeekStats(goals);

  if (goals.length === 0) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-journeyBg dark:bg-journeyDarkBg px-8">
        <View className="w-24 h-24 rounded-full bg-journeyBorder dark:bg-journeyDarkBorder items-center justify-center mb-6">
          <Ionicons name="leaf-outline" size={40} color="#0D9488" />
        </View>
        <Text className="text-journeyText dark:text-journeyDarkText text-2xl font-light text-center mb-2">
          {t('noJourneyTitle')}
        </Text>
        <Text className="text-journeyMuted text-sm text-center mb-6 leading-relaxed">
          {t('noJourneyDesc')}
        </Text>
        <Text className="text-journeyAccent/80 text-[13px] italic font-medium text-center mb-10 mx-4 leading-snug">
          &ldquo;{quote}&rdquo;
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/create')}
          className="bg-journeyAccent px-8 py-4 rounded-[24px]"
        >
          <Text className="text-white font-semibold tracking-wide">{t('newJourneyBtn')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-journeyBg dark:bg-journeyDarkBg">
      {/* Header */}
      <View className="px-6 pt-5 pb-3 flex-row justify-between items-center">
        <View className="flex-1 mr-3">
          <Text className="text-[26px] text-journeyText dark:text-journeyDarkText font-bold tracking-tight leading-[32px]">
            {t('dashboardTitle')}
          </Text>
          <View className="flex-row items-center gap-2 mt-0.5">
            <Text className="text-journeyMuted text-[11px] font-medium uppercase tracking-[1.2px]">
              {activeGoals.length} {t('activeJourneys')}
            </Text>
            {elapsed > 0 && (
              <View className="flex-row items-center bg-journeyBorder/60 dark:bg-journeyDarkBorder/40 px-2 py-0.5 rounded-full">
                <Text className="text-journeyAccent text-[10px] font-bold">{activeDays}/{elapsed}</Text>
                <Text className="text-journeyMuted text-[10px] ml-0.5">{t('activeDaysLabel')}</Text>
              </View>
            )}
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => router.push('/create')}
            className="w-11 h-11 bg-journeyAccent rounded-full items-center justify-center"
            style={{ shadowColor: '#0D9488', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 8, elevation: 4 }}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quote */}
      <View className="px-6 mb-3">
        <Text className="text-journeyMuted text-[12px] italic leading-snug" numberOfLines={2}>
          &ldquo;{quote}&rdquo;
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        <TodayFocusCard goals={activeGoals} />
        <View className="px-6">
          {activeGoals.map(goal => (
            <GoalCard key={goal.id} goal={goal} isDark={isDarkMode} />
          ))}

          {/* Archived goals section */}
          {archivedGoals.length > 0 && (
            <View className="mt-4 mb-2">
              <TouchableOpacity
                onPress={() => setShowArchived(!showArchived)}
                activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 4 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="archive-outline" size={16} color="#94A3B8" />
                  <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: '600', letterSpacing: 0.5 }}>
                    {t('archivedGoals')} · {archivedGoals.length}
                  </Text>
                </View>
                <Ionicons name={showArchived ? "chevron-up" : "chevron-down"} size={14} color="#94A3B8" />
              </TouchableOpacity>

              {showArchived && archivedGoals.map(goal => (
                <View key={goal.id} style={{ opacity: 0.6 }}>
                  <GoalCard goal={goal} isDark={isDarkMode} />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
