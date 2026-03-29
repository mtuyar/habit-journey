import React from 'react';
import { View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import {
  useProgressStore,
  Goal,
  computeStreak,
  getBestStreak,
  getTotalCompletedTasks,
  getOverallCompletionRate,
  getActivityHeatmap,
} from '@/store/useProgressStore';
import { useTranslation } from '@/lib/i18n';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HEATMAP_WEEKS = 16;
const HEATMAP_PADDING = 48;
const CELL_GAP = 3;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - HEATMAP_PADDING - CELL_GAP * (HEATMAP_WEEKS - 1)) / HEATMAP_WEEKS);

const LEVEL_COLORS = ['#E0FAF5', '#5EEAD4', '#14B8A6', '#0D9488'];

// ── Achievements definition ────────────────────────────────────────────────
function buildAchievements(goals: Goal[], streak: number, total: number) {
  return [
    {
      id: 'first_journey',
      icon: '🗺️',
      titleKey: 'ach_first_journey_title' as const,
      descKey: 'ach_first_journey_desc' as const,
      unlocked: goals.length >= 1,
    },
    {
      id: 'streak_3',
      icon: '✨',
      titleKey: 'ach_streak_3_title' as const,
      descKey: 'ach_streak_3_desc' as const,
      unlocked: streak >= 3,
    },
    {
      id: 'streak_7',
      icon: '🔥',
      titleKey: 'ach_streak_7_title' as const,
      descKey: 'ach_streak_7_desc' as const,
      unlocked: streak >= 7,
    },
    {
      id: 'streak_30',
      icon: '⚡',
      titleKey: 'ach_streak_30_title' as const,
      descKey: 'ach_streak_30_desc' as const,
      unlocked: streak >= 30,
    },
    {
      id: 'tasks_10',
      icon: '🎯',
      titleKey: 'ach_tasks_10_title' as const,
      descKey: 'ach_tasks_10_desc' as const,
      unlocked: total >= 10,
    },
    {
      id: 'tasks_100',
      icon: '💎',
      titleKey: 'ach_tasks_100_title' as const,
      descKey: 'ach_tasks_100_desc' as const,
      unlocked: total >= 100,
    },
    {
      id: 'stage_complete',
      icon: '🌟',
      titleKey: 'ach_stage_title' as const,
      descKey: 'ach_stage_desc' as const,
      unlocked: goals.some(g => g.groups.some(gr => gr.status === 'completed')),
    },
    {
      id: 'goal_complete',
      icon: '🏆',
      titleKey: 'ach_goal_title' as const,
      descKey: 'ach_goal_desc' as const,
      unlocked: goals.some(g => g.groups.length > 0 && g.groups.every(gr => gr.status === 'completed')),
    },
  ];
}

// ── Sub-components ─────────────────────────────────────────────────────────
function StatCard({
  icon,
  value,
  label,
  color,
  delay,
}: {
  icon: string;
  value: string | number;
  label: string;
  color: string;
  delay: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      className="flex-1 bg-journeyCard dark:bg-journeyDarkCard border border-journeyBorder dark:border-journeyDarkBorder rounded-[24px] p-4 items-center"
    >
      <Text style={{ fontSize: 22, marginBottom: 4 }}>{icon}</Text>
      <Text style={{ fontSize: 24, fontWeight: '800', color, lineHeight: 28 }}>{value}</Text>
      <Text className="text-journeyMuted text-[11px] font-semibold text-center mt-1 uppercase tracking-wide">
        {label}
      </Text>
    </Animated.View>
  );
}

function Heatmap({ goals }: { goals: Goal[] }) {
  const data = getActivityHeatmap(goals, HEATMAP_WEEKS);
  // Reshape: columns = weeks, rows = days-of-week
  const columns: typeof data[] = [];
  for (let w = 0; w < HEATMAP_WEEKS; w++) {
    columns.push(data.slice(w * 7, w * 7 + 7));
  }

  return (
    <View style={{ flexDirection: 'row', gap: CELL_GAP }}>
      {columns.map((col, ci) => (
        <View key={ci} style={{ flexDirection: 'column', gap: CELL_GAP }}>
          {col.map((cell, ri) => (
            <View
              key={ri}
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                borderRadius: 3,
                backgroundColor: LEVEL_COLORS[cell.level],
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function AchievementBadge({
  icon,
  title,
  desc,
  unlocked,
}: {
  icon: string;
  title: string;
  desc: string;
  unlocked: boolean;
}) {
  return (
    <View
      className="flex-1 rounded-[20px] p-4 border"
      style={{
        borderColor: unlocked ? '#B2F0E8' : '#E5E7EB',
        backgroundColor: unlocked ? '#F0FDFA' : '#F9FAFB',
        opacity: unlocked ? 1 : 0.55,
      }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text style={{ fontSize: 26 }}>{icon}</Text>
        {!unlocked && <Ionicons name="lock-closed" size={13} color="#9CA3AF" />}
        {unlocked && (
          <View className="w-5 h-5 rounded-full bg-journeyAccent items-center justify-center">
            <Ionicons name="checkmark" size={11} color="#FFF" />
          </View>
        )}
      </View>
      <Text
        className="font-bold text-[13px] mb-0.5"
        style={{ color: unlocked ? '#134E4A' : '#6B7280' }}
      >
        {title}
      </Text>
      <Text className="text-[11px]" style={{ color: unlocked ? '#5F8B8A' : '#9CA3AF' }}>
        {desc}
      </Text>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────
export default function InsightsScreen() {
  const goals = useProgressStore(state => state.goals);
  const { t } = useTranslation();

  const streak = computeStreak(goals);
  const best = getBestStreak(goals);
  const total = getTotalCompletedTasks(goals);
  const rate = getOverallCompletionRate(goals);
  const achievements = buildAchievements(goals, streak, total);
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  // Group achievements into pairs for 2-column layout
  const achievementPairs: typeof achievements[] = [];
  for (let i = 0; i < achievements.length; i += 2) {
    achievementPairs.push(achievements.slice(i, i + 2));
  }

  return (
    <SafeAreaView className="flex-1 bg-journeyBg dark:bg-journeyDarkBg">
      {/* Header */}
      <View className="px-6 pt-4 pb-2 flex-row items-center border-b border-journeyBorder dark:border-journeyDarkBorder">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center -ml-2 mr-2"
        >
          <Ionicons name="chevron-back" size={24} color="#5F8B8A" />
        </TouchableOpacity>
        <Text className="text-[20px] font-bold text-journeyText dark:text-journeyDarkText">
          {t('insightsTitle')}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
      >
        {/* Stat Cards */}
        <Animated.View entering={FadeInDown.delay(50).springify()} className="flex-row gap-3 mb-3">
          <StatCard icon="🔥" value={streak} label={t('currentStreak')} color="#F59E0B" delay={60} />
          <StatCard icon="⚡" value={best} label={t('bestStreak')} color="#0D9488" delay={120} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(100).springify()} className="flex-row gap-3 mb-8">
          <StatCard icon="✅" value={total} label={t('totalTasksDone')} color="#059669" delay={180} />
          <StatCard icon="📊" value={`${rate}%`} label={t('completionRate')} color="#7C3AED" delay={240} />
        </Animated.View>

        {/* Activity Heatmap */}
        <Animated.View entering={FadeInDown.delay(200).springify()} className="mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-journeyText dark:text-journeyDarkText font-bold text-[16px]">
              {t('activityTitle')}
            </Text>
            <View className="flex-row items-center gap-1.5">
              {LEVEL_COLORS.map((c, i) => (
                <View key={i} style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: c }} />
              ))}
            </View>
          </View>

          <View className="bg-journeyCard dark:bg-journeyDarkCard border border-journeyBorder dark:border-journeyDarkBorder rounded-[24px] p-4">
            <Heatmap goals={goals} />

            {/* Weekday labels below */}
            <View style={{ flexDirection: 'row', marginTop: 8, paddingLeft: 1 }}>
              {['P', 'S', 'Ç', 'P', 'C', 'C', 'P'].map((d, i) => (
                <View
                  key={i}
                  style={{
                    width: CELL_SIZE,
                    marginRight: i < 6 ? CELL_GAP : 0,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 9, color: '#5F8B8A', fontWeight: '600' }}>{d}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Achievements */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-journeyText dark:text-journeyDarkText font-bold text-[16px]">
              {t('achievementsTitle')}
            </Text>
            <Text className="text-journeyAccent font-bold text-[13px]">
              {unlockedCount}/{achievements.length}
            </Text>
          </View>

          {achievementPairs.map((pair, i) => (
            <View key={i} className="flex-row gap-3 mb-3">
              {pair.map(a => (
                <AchievementBadge
                  key={a.id}
                  icon={a.icon}
                  title={t(a.titleKey)}
                  desc={t(a.descKey)}
                  unlocked={a.unlocked}
                />
              ))}
              {pair.length === 1 && <View className="flex-1" />}
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
