import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  format,
  addMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { Text } from '@/components/ui/Text';
import { useSettingsStore } from '@/store/useSettingsStore';
import {
  useProgressStore,
  Goal,
  computeStreak,
  getBestStreak,
  getTotalCompletedTasks,
  getOverallCompletionRate,
  getTotalActiveDays,
  getPerfectDayStats,
  getThisWeekDayStats,
  getMonthActivity,
  getDayTaskDetail,
  getComebackCount,
  getCompletedGoalsCount,
  getCompletedStagesCount,
  DayLevel,
  DayTaskDetail,
} from '@/store/useProgressStore';
import { useTranslation } from '@/lib/i18n';

// ─── Achievement builder ──────────────────────────────────────────────────────
function buildAchievements(
  goals: Goal[],
  streak: number,
  total: number,
  perfectDayCount: number,
  perfectWeekStreak: number,
  comebacks: number,
  completedGoals: number,
  completedStages: number,
) {
  return [
    { id: 'first_journey', icon: '🌱', titleKey: 'ach_first_journey_title', descKey: 'ach_first_journey_desc', unlocked: goals.length >= 1 },
    { id: 'first_task', icon: '✅', titleKey: 'ach_first_task_title', descKey: 'ach_first_task_desc', unlocked: total >= 1 },
    { id: 'streak_3', icon: '🔥', titleKey: 'ach_streak_3_title', descKey: 'ach_streak_3_desc', unlocked: streak >= 3, progress: { current: Math.min(streak, 3), total: 3 } },
    { id: 'streak_7', icon: '🌙', titleKey: 'ach_streak_7_title', descKey: 'ach_streak_7_desc', unlocked: streak >= 7, progress: { current: Math.min(streak, 7), total: 7 } },
    { id: 'streak_14', icon: '☪️', titleKey: 'ach_streak_14_title', descKey: 'ach_streak_14_desc', unlocked: streak >= 14, progress: { current: Math.min(streak, 14), total: 14 } },
    { id: 'streak_30', icon: '🌕', titleKey: 'ach_streak_30_title', descKey: 'ach_streak_30_desc', unlocked: streak >= 30, progress: { current: Math.min(streak, 30), total: 30 } },
    { id: 'streak_60', icon: '🌿', titleKey: 'ach_streak_60_title', descKey: 'ach_streak_60_desc', unlocked: streak >= 60, progress: { current: Math.min(streak, 60), total: 60 } },
    { id: 'streak_100', icon: '⭐', titleKey: 'ach_streak_100_title', descKey: 'ach_streak_100_desc', unlocked: streak >= 100, progress: { current: Math.min(streak, 100), total: 100 } },
    { id: 'tasks_10', icon: '🎯', titleKey: 'ach_tasks_10_title', descKey: 'ach_tasks_10_desc', unlocked: total >= 10, progress: { current: Math.min(total, 10), total: 10 } },
    { id: 'tasks_50', icon: '📿', titleKey: 'ach_tasks_50_title', descKey: 'ach_tasks_50_desc', unlocked: total >= 50, progress: { current: Math.min(total, 50), total: 50 } },
    { id: 'tasks_100', icon: '💎', titleKey: 'ach_tasks_100_title', descKey: 'ach_tasks_100_desc', unlocked: total >= 100, progress: { current: Math.min(total, 100), total: 100 } },
    { id: 'tasks_250', icon: '🌟', titleKey: 'ach_tasks_250_title', descKey: 'ach_tasks_250_desc', unlocked: total >= 250, progress: { current: Math.min(total, 250), total: 250 } },
    { id: 'tasks_500', icon: '🏅', titleKey: 'ach_tasks_500_title', descKey: 'ach_tasks_500_desc', unlocked: total >= 500, progress: { current: Math.min(total, 500), total: 500 } },
    { id: 'perfect_day', icon: '💯', titleKey: 'ach_perfect_day_title', descKey: 'ach_perfect_day_desc', unlocked: perfectDayCount >= 1 },
    { id: 'perfect_week', icon: '📅', titleKey: 'ach_perfect_week_title', descKey: 'ach_perfect_week_desc', unlocked: perfectWeekStreak >= 7, progress: { current: Math.min(perfectWeekStreak, 7), total: 7 } },
    { id: 'perfect_30', icon: '✨', titleKey: 'ach_perfect_30_title', descKey: 'ach_perfect_30_desc', unlocked: perfectDayCount >= 30, progress: { current: Math.min(perfectDayCount, 30), total: 30 } },
    { id: 'stage_complete', icon: '⭐', titleKey: 'ach_stage_title', descKey: 'ach_stage_desc', unlocked: completedStages >= 1 },
    { id: 'five_stages', icon: '🕌', titleKey: 'ach_five_stages_title', descKey: 'ach_five_stages_desc', unlocked: completedStages >= 5, progress: { current: Math.min(completedStages, 5), total: 5 } },
    { id: 'goal_complete', icon: '🏆', titleKey: 'ach_goal_title', descKey: 'ach_goal_desc', unlocked: completedGoals >= 1 },
    { id: 'three_goals', icon: '🥇', titleKey: 'ach_three_goals_title', descKey: 'ach_three_goals_desc', unlocked: completedGoals >= 3, progress: { current: Math.min(completedGoals, 3), total: 3 } },
    { id: 'comeback', icon: '🌱', titleKey: 'ach_comeback_title', descKey: 'ach_comeback_desc', unlocked: comebacks >= 1 },
  ];
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, accent, delay: _delay, isDark }: { icon: string; value: string | number; label: string; accent: string; delay: number; isDark: boolean }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDark ? '#0E3330' : '#FFFFFF',
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: isDark ? '#1B5E58' : '#B2F0E8',
      }}
    >
      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: accent + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <Ionicons name={icon as any} size={18} color={accent} />
      </View>
      <Text style={{ fontSize: 24, fontWeight: '800', color: accent, lineHeight: 28 }}>{value}</Text>
      <Text style={{ fontSize: 11, color: '#5F8B8A', fontWeight: '600', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.8 }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// ─── Week Strip ───────────────────────────────────────────────────────────────
const WEEK_DOT_COLOR: Record<DayLevel, string> = {
  perfect: '#059669',
  partial: '#F59E0B',
  missed:  '#EF4444',
  empty:   '#CBD5E1',
  future:  'transparent',
};
const DOW_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

function WeekStrip({ goals, selectedDate, onSelectDate, isDark }: { goals: Goal[]; selectedDate: string | null; onSelectDate: (d: string | null) => void; isDark: boolean }) {
  const { t } = useTranslation();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const dayStats = getThisWeekDayStats(goals);
  const cardBg = isDark ? '#0E3330' : '#FFFFFF';
  const cardBorder = isDark ? '#1B5E58' : '#E2E8F0';

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {dayStats.map((d, i) => {
        const isToday = d.date === todayStr;
        const isSelected = d.date === selectedDate;
        const dayKey = DOW_KEYS[new Date(d.date).getDay()];
        const dotColor = WEEK_DOT_COLOR[d.level];

        return (
          <TouchableOpacity
            key={i}
            activeOpacity={0.75}
            onPress={() => onSelectDate(isSelected ? null : d.date)}
            style={{
              flex: 1,
              marginHorizontal: 3,
              height: 74,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 10,
              backgroundColor: cardBg,
              borderWidth: isSelected ? 2.5 : isToday ? 2 : 1.5,
              borderColor: isSelected ? '#F59E0B' : isToday ? '#0D9488' : cardBorder,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#5F8B8A', letterSpacing: 0.5 }}>
              {t(dayKey)}
            </Text>
            <Text style={{ fontSize: 15, fontWeight: isToday ? '800' : '500', color: isToday ? '#0D9488' : isDark ? '#CCFBF1' : '#134E4A' }}>
              {format(new Date(d.date), 'd')}
            </Text>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor }} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Day Detail Panel ─────────────────────────────────────────────────────────
function DayDetailPanel({ goals, dateStr, isDark }: { goals: Goal[]; dateStr: string; isDark: boolean }) {
  const { t } = useTranslation();
  const detail: DayTaskDetail[] = getDayTaskDetail(goals, dateStr);
  const dateLabel = format(new Date(dateStr), 'd MMMM, EEEE', { locale: tr });
  const cardBg = isDark ? '#0E3330' : '#FFFFFF';
  const cardBorder = isDark ? '#1B5E58' : '#B2F0E8';
  const doneText = isDark ? '#CCFBF1' : '#134E4A';
  const undoneText = isDark ? '#475569' : '#94A3B8';
  const divider = isDark ? '#1B5E5840' : '#E2E8F040';
  const progressBg = isDark ? '#1B5E58' : '#E2E8F0';

  return (
    <View style={{ marginTop: 12 }}>
      <View style={{ backgroundColor: cardBg, borderRadius: 22, borderWidth: 1, borderColor: cardBorder, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B', marginRight: 8 }} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#0D9488', textTransform: 'capitalize' }}>
            {dateLabel}
          </Text>
        </View>

        {detail.length === 0 ? (
          <Text style={{ color: '#5F8B8A', fontSize: 13, textAlign: 'center', paddingVertical: 8 }}>
            {t('noDayActivity')}
          </Text>
        ) : (
          detail.map((item, i) => {
            const pct = item.totalCount === 0 ? 0 : item.completedCount / item.totalCount;
            const pctColor = pct >= 0.9 ? '#059669' : pct >= 0.5 ? '#D97706' : '#EF4444';
            return (
              <View key={i} style={{ marginBottom: i < detail.length - 1 ? 14 : 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#5F8B8A', flex: 1 }} numberOfLines={1}>{item.groupName}</Text>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, backgroundColor: pctColor + '20' }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: pctColor }}>{item.completedCount}/{item.totalCount}</Text>
                  </View>
                </View>

                {item.tasks.map((task, j) => (
                  <View key={j} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 4, borderBottomWidth: j < item.tasks.length - 1 ? 0.5 : 0, borderBottomColor: divider }}>
                    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: task.done ? '#059669' : isDark ? '#1B5E58' : '#CBD5E1', backgroundColor: task.done ? '#059669' : 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                      {task.done && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                    <Text style={{ fontSize: 13, color: task.done ? doneText : undoneText, fontWeight: task.done ? '500' : '400', flex: 1 }} numberOfLines={2}>
                      {task.name}
                    </Text>
                  </View>
                ))}

                <View style={{ height: 3, backgroundColor: progressBg, borderRadius: 99, marginTop: 8, overflow: 'hidden' }}>
                  <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: pctColor, borderRadius: 99 }} />
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

// ─── Monthly Calendar ─────────────────────────────────────────────────────────
const CAL_LEVEL_BG = ['transparent', '#99E6D8', '#14B8A6', '#0D9488'];
const CAL_LEVEL_BG_DARK = ['transparent', '#1B5E58', '#0D9488', '#0a7a6f'];
const CAL_DAY_LABELS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

function MonthlyCalendar({ goals, selectedDate, onSelectDate, isDark }: { goals: Goal[]; selectedDate: string | null; onSelectDate: (d: string | null) => void; isDark: boolean }) {
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const activity = getMonthActivity(goals, year, month);
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const firstDay = startOfMonth(viewDate);
  const lastDay = endOfMonth(viewDate);
  const calStart = startOfWeek(firstDay, { weekStartsOn: 1 });
  const calEnd = endOfWeek(lastDay, { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const now = new Date();
  const canGoNext = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth());
  const monthLabel = format(viewDate, 'MMMM yyyy', { locale: tr });
  const levelBg = isDark ? CAL_LEVEL_BG_DARK : CAL_LEVEL_BG;

  // Level 0 text: muted. Level 1 on dark: light teal. Level 2-3: white
  function textColor(level: 0 | 1 | 2 | 3, inMonth: boolean, isFuture: boolean): string {
    if (!inMonth) return 'transparent';
    if (isFuture) return isDark ? '#2D4A47' : '#CBD5E1';
    if (level === 0) return isDark ? '#5F8B8A' : '#94A3B8';
    if (level === 1) return isDark ? '#CCFBF1' : '#134E4A';
    return '#fff';
  }

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <TouchableOpacity onPress={() => setViewDate(d => addMonths(d, -1))} style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={20} color="#5F8B8A" />
        </TouchableOpacity>
        <Text style={{ fontWeight: '700', color: '#0D9488', fontSize: 15, textTransform: 'capitalize' }}>
          {monthLabel}
        </Text>
        <TouchableOpacity onPress={() => canGoNext && setViewDate(d => addMonths(d, 1))} style={{ padding: 6, opacity: canGoNext ? 1 : 0.25 }} disabled={!canGoNext}>
          <Ionicons name="chevron-forward" size={20} color="#5F8B8A" />
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        {CAL_DAY_LABELS.map(d => (
          <Text key={d} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700', color: '#5F8B8A', letterSpacing: 0.5 }}>
            {d}
          </Text>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {allDays.map((day, i) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const inMonth = isSameMonth(day, viewDate);
          const isFuture = dateStr > todayStr;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const level = (inMonth && !isFuture ? (activity[dateStr] ?? 0) : 0) as 0 | 1 | 2 | 3;
          const bg = inMonth && !isFuture ? levelBg[level] : 'transparent';
          const tColor = textColor(level, inMonth, isFuture);

          const todayBg = isToday && level === 0 ? (isDark ? '#0D948830' : '#CCFBF1') : bg;

          return (
            <TouchableOpacity
              key={i}
              activeOpacity={inMonth && !isFuture ? 0.75 : 1}
              onPress={() => { if (!inMonth || isFuture) return; onSelectDate(isSelected ? null : dateStr); }}
              style={{ width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}
            >
              <View style={{
                width: 34, height: 34, borderRadius: 10,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: todayBg,
                borderWidth: isSelected ? 2.5 : isToday ? 2 : 0,
                borderColor: isSelected ? '#F59E0B' : isToday ? '#0D9488' : 'transparent',
              }}>
                <Text style={{ fontSize: 13, fontWeight: isToday ? '800' : level > 0 ? '700' : '400', color: isToday && level === 0 ? '#0D9488' : tColor }}>
                  {inMonth ? format(day, 'd') : ''}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 8 }}>
        {levelBg.map((c, i) => (
          <View key={i} style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: c === 'transparent' ? (isDark ? '#1B5E5830' : '#F1F5F9') : c, borderWidth: c === 'transparent' ? 1 : 0, borderColor: isDark ? '#1B5E58' : '#E2E8F0' }} />
        ))}
      </View>
    </View>
  );
}

// ─── Achievement Card ─────────────────────────────────────────────────────────
function AchievementCard({ icon, title, desc, unlocked, progress, isDark }: { icon: string; title: string; desc: string; unlocked: boolean; progress?: { current: number; total: number }; isDark: boolean }) {
  const pct = progress ? progress.current / progress.total : 0;
  const showProgress = !unlocked && !!progress && progress.current > 0;

  const cardBg = isDark ? (unlocked ? '#0E3330' : '#0a2826') : (unlocked ? '#F0FDFA' : '#F9FAFB');
  const cardBorder = isDark ? (unlocked ? '#14B8A6' : '#1B5E58') : (unlocked ? '#5EEAD4' : '#E5E7EB');
  const iconBg = isDark ? (unlocked ? '#134e4a' : '#142825') : (unlocked ? '#CCFBF1' : '#F3F4F6');
  const titleColor = isDark ? (unlocked ? '#CCFBF1' : '#64748B') : (unlocked ? '#134E4A' : '#6B7280');
  const descColor = isDark ? (unlocked ? '#5F8B8A' : '#475569') : (unlocked ? '#5F8B8A' : '#9CA3AF');
  const progressBg = isDark ? '#1B5E58' : '#E5E7EB';

  return (
    <View style={{ flex: 1, borderRadius: 22, padding: 14, borderWidth: 1.5, borderColor: cardBorder, backgroundColor: cardBg, opacity: unlocked ? 1 : showProgress ? 0.85 : 0.55 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 22 }}>{icon}</Text>
        </View>
        {unlocked
          ? <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#0D9488', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="checkmark" size={13} color="#FFF" /></View>
          : <Ionicons name="lock-closed" size={14} color={isDark ? '#2D4A47' : '#D1D5DB'} />
        }
      </View>
      <Text style={{ fontSize: 13, fontWeight: '700', color: titleColor, marginBottom: 3 }} numberOfLines={1}>{title}</Text>
      <Text style={{ fontSize: 11, color: descColor, lineHeight: 15 }} numberOfLines={2}>{desc}</Text>
      {showProgress && (
        <View style={{ marginTop: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 10, color: isDark ? '#5F8B8A' : '#9CA3AF', fontWeight: '600' }}>{progress!.current}/{progress!.total}</Text>
            <Text style={{ fontSize: 10, color: isDark ? '#5F8B8A' : '#9CA3AF', fontWeight: '600' }}>{Math.round(pct * 100)}%</Text>
          </View>
          <View style={{ height: 4, backgroundColor: progressBg, borderRadius: 99, overflow: 'hidden' }}>
            <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: '#14B8A6', borderRadius: 99 }} />
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, badge, isDark }: { title: string; badge?: string; isDark: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#CCFBF1' : '#134E4A' }}>{title}</Text>
      {badge !== undefined && <Text style={{ fontSize: 13, fontWeight: '700', color: '#0D9488' }}>{badge}</Text>}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function InsightsScreen() {
  const goals = useProgressStore(state => state.goals);
  const isDarkMode = useSettingsStore(state => state.isDarkMode);
  const { t } = useTranslation();

  const [weekSelectedDate, setWeekSelectedDate] = useState<string | null>(null);
  const [calSelectedDate, setCalSelectedDate] = useState<string | null>(null);

  const streak          = computeStreak(goals);
  const best            = getBestStreak(goals);
  const total           = getTotalCompletedTasks(goals);
  const rate            = getOverallCompletionRate(goals);
  const activeDays      = getTotalActiveDays(goals);
  const { count: perfectCount, bestStreak: perfectStreak } = getPerfectDayStats(goals);
  const comebacks       = getComebackCount(goals);
  const completedGoals  = getCompletedGoalsCount(goals);
  const completedStages = getCompletedStagesCount(goals);

  const achievements = buildAchievements(goals, streak, total, perfectCount, perfectStreak, comebacks, completedGoals, completedStages);
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const pairs: (typeof achievements)[] = [];
  for (let i = 0; i < achievements.length; i += 2) pairs.push(achievements.slice(i, i + 2));

  const cardBg = isDarkMode ? '#0E3330' : '#FFFFFF';
  const cardBorder = isDarkMode ? '#1B5E58' : '#B2F0E8';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#07211F' : '#F0FDFA' }}>
      {/* ── Header ── */}
      <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#1B5E58' : '#B2F0E8' }}>
        <Text style={{ fontSize: 26, fontWeight: '800', color: isDarkMode ? '#CCFBF1' : '#134E4A', letterSpacing: -0.5 }}>
          {t('insightsTitle')}
        </Text>
        {activeDays > 0 && (
          <Text style={{ fontSize: 11, color: '#5F8B8A', marginTop: 2, fontWeight: '600' }}>
            {activeDays} {t('totalActiveDays').toLowerCase()}
          </Text>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 110 }}>

        {/* ── Son 7 Gün ── */}
        <View style={{ marginBottom: 16 }}>
          <SectionHeader title={t('thisWeekTitle')} isDark={isDarkMode} />
          <View style={{ backgroundColor: cardBg, borderRadius: 24, borderWidth: 1, borderColor: cardBorder, padding: 16 }}>
            <WeekStrip goals={goals} selectedDate={weekSelectedDate} onSelectDate={setWeekSelectedDate} isDark={isDarkMode} />
          </View>
          {weekSelectedDate && (
            <DayDetailPanel goals={goals} dateStr={weekSelectedDate} isDark={isDarkMode} />
          )}
        </View>

        {/* ── Bu Ay ── */}
        <View style={{ marginBottom: 24 }}>
          <SectionHeader title={format(new Date(), 'MMMM yyyy', { locale: tr })} isDark={isDarkMode} />
          <View style={{ backgroundColor: cardBg, borderRadius: 24, borderWidth: 1, borderColor: cardBorder, padding: 16 }}>
            <MonthlyCalendar goals={goals} selectedDate={calSelectedDate} onSelectDate={setCalSelectedDate} isDark={isDarkMode} />
          </View>
          {calSelectedDate && (
            <DayDetailPanel goals={goals} dateStr={calSelectedDate} isDark={isDarkMode} />
          )}
        </View>

        {/* ── Stat Cards ── */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <StatCard icon="flame"           value={streak}       label={t('currentStreak')}  accent="#F59E0B" delay={0} isDark={isDarkMode} />
          <StatCard icon="trophy-outline"  value={best}         label={t('bestStreak')}      accent="#0D9488" delay={0} isDark={isDarkMode} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <StatCard icon="checkmark-circle-outline" value={total}        label={t('totalTasksDone')} accent="#059669" delay={0} isDark={isDarkMode} />
          <StatCard icon="stats-chart-outline"      value={`${rate}%`}  label={t('completionRate')} accent="#7C3AED" delay={0} isDark={isDarkMode} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 28 }}>
          <StatCard icon="calendar-outline" value={activeDays}   label={t('totalActiveDays')} accent="#0891B2" delay={0} isDark={isDarkMode} />
          <StatCard icon="star-outline"     value={perfectCount} label={t('perfectDays')}     accent="#BE185D" delay={0} isDark={isDarkMode} />
        </View>

        {/* ── Achievements ── */}
        <View>
          <SectionHeader title={t('achievementsTitle')} badge={`${unlockedCount}/${achievements.length}`} isDark={isDarkMode} />
          {pairs.map((pair, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              {pair.map(a => (
                <AchievementCard key={a.id} icon={a.icon} title={t(a.titleKey as any)} desc={t(a.descKey as any)} unlocked={a.unlocked} progress={(a as any).progress} isDark={isDarkMode} />
              ))}
              {pair.length === 1 && <View style={{ flex: 1 }} />}
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
