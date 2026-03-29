import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
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

const HEATMAP_WEEKS = 20;
const CELL = 13;
const GAP = 3;
// Alternating day labels — show only Mon / Wed / Fri / Sun for readability
const DAY_LABELS = ['Pt', '', 'Ça', '', 'Cu', '', 'Pz'];
const LEVEL_COLORS = ['#D1FAF0', '#5EEAD4', '#14B8A6', '#0D9488'];

// ── Achievements ──────────────────────────────────────────────────────────
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

// ── Stat Card ─────────────────────────────────────────────────────────────
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
      className="flex-1 bg-journeyCard dark:bg-journeyDarkCard border border-journeyBorder dark:border-journeyDarkBorder rounded-[22px] p-4 items-center"
    >
      <Text style={{ fontSize: 20, marginBottom: 4 }}>{icon}</Text>
      <Text style={{ fontSize: 22, fontWeight: '800', color, lineHeight: 26 }}>{value}</Text>
      <Text
        className="text-journeyMuted text-[10px] font-semibold text-center mt-1 uppercase tracking-wide"
        numberOfLines={1}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

// ── Heatmap ───────────────────────────────────────────────────────────────
// Layout: day labels (vertical, left) + scrollable week columns (right)
function Heatmap({ goals }: { goals: Goal[] }) {
  const data = getActivityHeatmap(goals, HEATMAP_WEEKS);

  // Reshape: columns[w] = 7 days of that week (index 0 = Monday)
  const columns: typeof data[] = [];
  for (let w = 0; w < HEATMAP_WEEKS; w++) {
    columns.push(data.slice(w * 7, w * 7 + 7));
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>

      {/* Day-of-week labels — vertical, left side */}
      <View style={{ flexDirection: 'column', marginRight: 6 }}>
        {DAY_LABELS.map((label, i) => (
          <View
            key={i}
            style={{ height: CELL, marginBottom: i < 6 ? GAP : 0, justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 9, color: '#5F8B8A', fontWeight: '600', width: 16 }}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Scrollable week grid */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: 'row', gap: GAP }}
      >
        {columns.map((col, ci) => (
          <View key={ci} style={{ flexDirection: 'column', gap: GAP }}>
            {col.map((cell, ri) => (
              <View
                key={ri}
                style={{
                  width: CELL,
                  height: CELL,
                  borderRadius: 3,
                  backgroundColor: LEVEL_COLORS[cell.level],
                }}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ── Achievement Badge ─────────────────────────────────────────────────────
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
        opacity: unlocked ? 1 : 0.5,
      }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text style={{ fontSize: 26 }}>{icon}</Text>
        {unlocked ? (
          <View className="w-5 h-5 rounded-full bg-journeyAccent items-center justify-center">
            <Ionicons name="checkmark" size={11} color="#FFF" />
          </View>
        ) : (
          <Ionicons name="lock-closed" size={13} color="#9CA3AF" />
        )}
      </View>
      <Text
        className="font-bold text-[13px] mb-0.5"
        style={{ color: unlocked ? '#134E4A' : '#6B7280' }}
        numberOfLines={1}
      >
        {title}
      </Text>
      <Text
        className="text-[11px] leading-snug"
        style={{ color: unlocked ? '#5F8B8A' : '#9CA3AF' }}
        numberOfLines={2}
      >
        {desc}
      </Text>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────
export default function InsightsScreen() {
  const goals = useProgressStore(state => state.goals);
  const { t } = useTranslation();

  const streak = computeStreak(goals);
  const best = getBestStreak(goals);
  const total = getTotalCompletedTasks(goals);
  const rate = getOverallCompletionRate(goals);
  const achievements = buildAchievements(goals, streak, total);
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const achievementPairs: typeof achievements[] = [];
  for (let i = 0; i < achievements.length; i += 2) {
    achievementPairs.push(achievements.slice(i, i + 2));
  }

  return (
    <SafeAreaView className="flex-1 bg-journeyBg dark:bg-journeyDarkBg">
      {/* Header */}
      <View className="px-6 pt-4 pb-3 flex-row items-center border-b border-journeyBorder dark:border-journeyDarkBorder">
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
        {/* 2×2 Stat Cards */}
        <Animated.View entering={FadeInDown.delay(60).springify()} className="flex-row gap-3 mb-3">
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
            {/* Legend */}
            <View className="flex-row items-center gap-1.5">
              {LEVEL_COLORS.map((c, i) => (
                <View
                  key={i}
                  style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: c }}
                />
              ))}
            </View>
          </View>

          <View className="bg-journeyCard dark:bg-journeyDarkCard border border-journeyBorder dark:border-journeyDarkBorder rounded-[24px] p-4">
            <Heatmap goals={goals} />
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
