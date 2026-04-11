import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, addDays } from 'date-fns';

export type Task = {
  id: string;
  name: string;
  description?: string;
};

export type GroupProgress = Record<string, Record<string, boolean>>;

export type Group = {
  id: string;
  name: string;
  durationInDays: number;
  tasks: Task[];
  startDate: string | null;
  progress: GroupProgress;
  status: 'locked' | 'active' | 'completed' | 'failed';
  retryCount?: number;
};

export type Goal = {
  id: string;
  name: string;
  targetLevel: string;
  groups: Group[];
  archived?: boolean;
};

interface ProgressState {
  goals: Goal[];
  addGoal: (goal: Goal) => void;
  deleteGoal: (goalId: string) => void;
  updateGoalName: (goalId: string, newName: string) => void;
  updateGoal: (updatedGoal: Goal) => void;
  archiveGoal: (goalId: string, archived: boolean) => void;
  startGroup: (goalId: string, groupId: string, startDate: string) => void;
  toggleTaskCompletion: (goalId: string, groupId: string, date: string, taskId: string) => void;
  evaluateGroupCompletion: (goalId: string, groupId: string) => void;
  retryExpiredGroups: (goalId: string) => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      goals: [],

      addGoal: (goal) => set((state) => ({ goals: [...state.goals, goal] })),

      deleteGoal: (goalId) => set((state) => ({ goals: state.goals.filter(g => g.id !== goalId) })),

      archiveGoal: (goalId, archived) => set((state) => ({
        goals: state.goals.map(g => g.id === goalId ? { ...g, archived } : g)
      })),

      updateGoalName: (goalId, newName) => set((state) => ({
        goals: state.goals.map(g => g.id === goalId ? { ...g, name: newName } : g)
      })),

      updateGoal: (updatedGoal) => set((state) => ({
        goals: state.goals.map(g => g.id === updatedGoal.id ? updatedGoal : g)
      })),

      startGroup: (goalId, groupId, startDate) => set((state) => {
        const goals = state.goals.map(g => {
          if (g.id !== goalId) return g;
          return {
            ...g,
            groups: g.groups.map(gr => {
              if (gr.id !== groupId) return gr;
              return { ...gr, startDate, status: 'active' as const };
            })
          };
        });
        return { goals };
      }),

      toggleTaskCompletion: (goalId, groupId, date, taskId) => set((state) => {
        let goalsSnapshot = state.goals.map(g => {
          if (g.id !== goalId) return g;
          return {
            ...g,
            groups: g.groups.map(gr => {
              if (gr.id !== groupId) return gr;
              const dayProgress = gr.progress[date] || {};
              const isCompleted = dayProgress[taskId] || false;
              return {
                ...gr,
                progress: {
                  ...gr.progress,
                  [date]: { ...dayProgress, [taskId]: !isCompleted }
                }
              };
            })
          };
        });

        goalsSnapshot = goalsSnapshot.map(g => {
          if (g.id !== goalId) return g;
          let nextGroupUnlocked = false;
          let nextGroupShouldLock = false;

          const updatedGroups = g.groups.map((gr) => {
            if (gr.id !== groupId) return gr;
            const wasCompleted = gr.status === 'completed';
            const totalTasksPossible = gr.durationInDays * gr.tasks.length;
            let completedTasks = 0;

            Object.values(gr.progress).forEach(dayRecord => {
              Object.values(dayRecord).forEach(done => { if (done) completedTasks++; });
            });

            const ratio = totalTasksPossible === 0 ? 0 : completedTasks / totalTasksPossible;

            if (ratio >= 0.9) {
              nextGroupUnlocked = true;
              return { ...gr, status: 'completed' as const };
            } else {
              if (wasCompleted) nextGroupShouldLock = true;
              return { ...gr, status: 'active' as const };
            }
          });

          let finalGroups = [...updatedGroups];
          if (nextGroupUnlocked) {
            const groupIndex = finalGroups.findIndex(gr => gr.id === groupId);
            if (groupIndex !== -1 && groupIndex + 1 < finalGroups.length) {
              if (finalGroups[groupIndex + 1].status === 'locked') {
                finalGroups[groupIndex + 1] = {
                  ...finalGroups[groupIndex + 1],
                  status: 'active',
                  startDate: new Date().toISOString()
                };
              }
            }
          }

          // Re-lock the next stage if the current stage dropped below 90%
          // but only if the next stage has zero progress (don't erase user's work)
          if (nextGroupShouldLock) {
            const groupIndex = finalGroups.findIndex(gr => gr.id === groupId);
            if (groupIndex !== -1 && groupIndex + 1 < finalGroups.length) {
              const nextGr = finalGroups[groupIndex + 1];
              const nextHasProgress = Object.values(nextGr.progress).some(
                dayRec => Object.values(dayRec).some(v => v)
              );
              if (!nextHasProgress) {
                finalGroups[groupIndex + 1] = {
                  ...finalGroups[groupIndex + 1],
                  status: 'locked' as const,
                  startDate: null,
                };
              }
            }
          }

          return { ...g, groups: finalGroups };
        });

        return { goals: goalsSnapshot };
      }),

      evaluateGroupCompletion: (_goalId, _groupId) => {
        // Handled automatically inside toggleTaskCompletion
      },

      retryExpiredGroups: (goalId) => set((state) => {
        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd');

        const goals = state.goals.map(g => {
          if (g.id !== goalId) return g;

          const groups = g.groups.map(gr => {
            if (gr.status !== 'active' || !gr.startDate) return gr;

            const endDate = addDays(new Date(gr.startDate), gr.durationInDays - 1);
            if (today <= endDate) return gr; // still within period

            // Period expired — check completion
            const totalTasksPossible = gr.durationInDays * gr.tasks.length;
            let completedTasks = 0;
            Object.values(gr.progress).forEach(dayRecord => {
              Object.values(dayRecord).forEach(done => { if (done) completedTasks++; });
            });
            const ratio = totalTasksPossible === 0 ? 0 : completedTasks / totalTasksPossible;

            if (ratio >= 0.9) return gr; // already completed or will be — leave as-is

            // Retry: fresh start, same duration
            return {
              ...gr,
              startDate: todayStr,
              progress: {},
              retryCount: (gr.retryCount || 0) + 1,
              status: 'active' as const,
            };
          });

          return { ...g, groups };
        });

        return { goals };
      })
    }),
    {
      name: 'habit-journey-zen-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ── Pure helper functions ──────────────────────────────────────────────────

/** Total completed task instances across all goals. */
export function getTotalCompletedTasks(goals: Goal[]): number {
  let total = 0;
  for (const goal of goals) {
    for (const group of goal.groups) {
      for (const dayRecord of Object.values(group.progress)) {
        for (const done of Object.values(dayRecord)) {
          if (done) total++;
        }
      }
    }
  }
  return total;
}

/** Overall completion rate across all non-locked groups (0–100). */
export function getOverallCompletionRate(goals: Goal[]): number {
  let completed = 0;
  let total = 0;
  for (const goal of goals) {
    for (const group of goal.groups) {
      if (group.status === 'locked') continue;
      total += group.durationInDays * group.tasks.length;
      for (const dayRecord of Object.values(group.progress)) {
        for (const done of Object.values(dayRecord)) {
          if (done) completed++;
        }
      }
    }
  }
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

/** All-time best streak (longest consecutive active days ever). */
export function getBestStreak(goals: Goal[]): number {
  const activeDates = new Set<string>();
  for (const goal of goals) {
    for (const group of goal.groups) {
      for (const [date, dayRecord] of Object.entries(group.progress)) {
        if (Object.values(dayRecord).some(v => v)) activeDates.add(date);
      }
    }
  }
  if (activeDates.size === 0) return 0;

  const sorted = Array.from(activeDates).sort();
  let best = 1;
  let cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000;
    if (diff === 1) { cur++; best = Math.max(best, cur); }
    else cur = 1;
  }
  return best;
}

/** Active days this week (Mon–today) and days elapsed. */
export function getThisWeekStats(goals: Goal[]): { activeDays: number; elapsed: number } {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const elapsed = dayOfWeek === 0 ? 7 : dayOfWeek;
  let activeDays = 0;
  for (let i = 0; i < elapsed; i++) {
    const date = format(addDays(today, -i), 'yyyy-MM-dd');
    outer: for (const goal of goals) {
      for (const group of goal.groups) {
        if (group.status === 'locked') continue;
        const rec = group.progress[date];
        if (rec && Object.values(rec).some(v => v)) { activeDays++; break outer; }
      }
    }
  }
  return { activeDays, elapsed };
}

/** Activity heatmap data for the last `weeks` weeks (oldest → newest).
 *  Always starts on a Monday so day-of-week labels align correctly. */
export function getActivityHeatmap(goals: Goal[], weeks = 16): { date: string; level: 0 | 1 | 2 | 3 }[] {
  const today = new Date();
  // Align to Monday: JS getDay() returns 0=Sun, 1=Mon, …, 6=Sat
  const dow = today.getDay();
  const daysFromMon = dow === 0 ? 6 : dow - 1;
  // First cell = Monday of the week that is (weeks-1) weeks before this week
  const startDate = addDays(today, -daysFromMon - (weeks - 1) * 7);

  const result: { date: string; level: 0 | 1 | 2 | 3 }[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    const date = format(addDays(startDate, i), 'yyyy-MM-dd');
    let completed = 0;
    let total = 0;
    for (const goal of goals) {
      for (const group of goal.groups) {
        if (!group.startDate || group.status === 'locked') continue;
        const start = new Date(group.startDate);
        const end = addDays(start, group.durationInDays - 1);
        const d = new Date(date);
        if (d < start || d > end) continue;
        total += group.tasks.length;
        const rec = group.progress[date] || {};
        group.tasks.forEach(t => { if (rec[t.id]) completed++; });
      }
    }
    let level: 0 | 1 | 2 | 3 = 0;
    if (total > 0) {
      const p = completed / total;
      level = p >= 0.9 ? 3 : p >= 0.5 ? 2 : 1;
    }
    result.push({ date, level });
  }
  return result;
}

/** Returns the number of consecutive days where at least one task was done. */
export function computeStreak(goals: Goal[]): number {
  const today = new Date();
  let streak = 0;

  for (let i = 0; i < 365; i++) {
    const date = format(addDays(today, -i), 'yyyy-MM-dd');
    let hadActivity = false;

    outer: for (const goal of goals) {
      for (const group of goal.groups) {
        if (group.status === 'locked') continue;
        const dayRecord = group.progress[date];
        if (dayRecord && Object.values(dayRecord).some(v => v)) {
          hadActivity = true;
          break outer;
        }
      }
    }

    if (hadActivity) {
      streak++;
    } else if (i === 0) {
      // Today hasn't been filled yet — don't break streak
      continue;
    } else {
      break;
    }
  }

  return streak;
}

// ── New analytics helpers ──────────────────────────────────────────────────

export type DayLevel = 'perfect' | 'partial' | 'missed' | 'empty' | 'future';

/** Per-day stats for the last 7 days (6 days ago → today, oldest first). */
export function getThisWeekDayStats(goals: Goal[]): { date: string; level: DayLevel }[] {
  const today = new Date();

  const result: { date: string; level: DayLevel }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dateStr = format(addDays(today, -i), 'yyyy-MM-dd');

    let completed = 0;
    let total = 0;
    for (const goal of goals) {
      for (const group of goal.groups) {
        if (!group.startDate || group.status === 'locked') continue;
        const start = new Date(group.startDate);
        const end = addDays(start, group.durationInDays - 1);
        const d = new Date(dateStr);
        if (d < start || d > end) continue;
        total += group.tasks.length;
        const rec = group.progress[dateStr] || {};
        group.tasks.forEach(t => { if (rec[t.id]) completed++; });
      }
    }

    const level: DayLevel =
      total === 0 ? 'empty'
      : completed === total ? 'perfect'
      : completed > 0 ? 'partial'
      : 'missed';
    result.push({ date: dateStr, level });
  }
  return result;
}

/** Count of "perfect days" (every active task completed) and the best consecutive perfect-day streak. */
export function getPerfectDayStats(goals: Goal[]): { count: number; bestStreak: number } {
  const allDates = new Set<string>();
  for (const goal of goals) {
    for (const group of goal.groups) {
      if (!group.startDate || group.status === 'locked') continue;
      Object.keys(group.progress).forEach(d => allDates.add(d));
    }
  }

  const perfectDates: string[] = [];
  for (const dateStr of allDates) {
    let hasActive = false;
    let allPerfect = true;

    outer: for (const goal of goals) {
      for (const group of goal.groups) {
        if (!group.startDate || group.status === 'locked') continue;
        const start = new Date(group.startDate);
        const end = addDays(start, group.durationInDays - 1);
        const d = new Date(dateStr);
        if (d < start || d > end || group.tasks.length === 0) continue;
        hasActive = true;
        const rec = group.progress[dateStr] || {};
        if (!group.tasks.every(t => rec[t.id] === true)) { allPerfect = false; break outer; }
      }
    }
    if (hasActive && allPerfect) perfectDates.push(dateStr);
  }

  const count = perfectDates.length;
  if (count === 0) return { count: 0, bestStreak: 0 };
  perfectDates.sort();
  let best = 1; let cur = 1;
  for (let i = 1; i < perfectDates.length; i++) {
    const diff = (new Date(perfectDates[i]).getTime() - new Date(perfectDates[i - 1]).getTime()) / 86400000;
    if (diff === 1) { cur++; best = Math.max(best, cur); } else cur = 1;
  }
  return { count, bestStreak: best };
}

/** Total number of distinct days where at least one task was completed. */
export function getTotalActiveDays(goals: Goal[]): number {
  const active = new Set<string>();
  for (const goal of goals) {
    for (const group of goal.groups) {
      for (const [date, rec] of Object.entries(group.progress)) {
        if (Object.values(rec).some(v => v)) active.add(date);
      }
    }
  }
  return active.size;
}

/** Returns completed/total task counts for today across all active groups.
 *  Only counts a group if today falls within its [startDate, startDate + durationInDays - 1] range.
 */
export function getTodayProgress(goals: Goal[]): { completed: number; total: number } {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayMs = new Date(todayStr).getTime();
  let completed = 0;
  let total = 0;

  for (const goal of goals) {
    for (const group of goal.groups) {
      if (group.status !== 'active') continue;
      if (!group.startDate) continue;

      // Only count if today is within the group's valid date range
      const startMs = new Date(format(new Date(group.startDate), 'yyyy-MM-dd')).getTime();
      const endMs = addDays(new Date(group.startDate), group.durationInDays - 1).getTime();
      if (todayMs < startMs || todayMs > endMs) continue;

      total += group.tasks.length;
      const dayRecord = group.progress[todayStr] || {};
      group.tasks.forEach(t => {
        if (dayRecord[t.id]) completed++;
      });
    }
  }

  return { completed, total };
}

/** Activity level per day for a given month (0=none, 1=partial, 2=mid, 3=full) */
export function getMonthActivity(
  goals: Goal[],
  year: number,
  month: number,
): Record<string, 0 | 1 | 2 | 3> {
  const result: Record<string, 0 | 1 | 2 | 3> = {};
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = format(new Date(year, month, day), 'yyyy-MM-dd');
    let completed = 0;
    let total = 0;
    for (const goal of goals) {
      for (const group of goal.groups) {
        if (!group.startDate || group.status === 'locked') continue;
        const start = new Date(group.startDate);
        const end = addDays(start, group.durationInDays - 1);
        const d = new Date(dateStr);
        if (d < start || d > end) continue;
        total += group.tasks.length;
        const rec = group.progress[dateStr] || {};
        group.tasks.forEach(t => { if (rec[t.id]) completed++; });
      }
    }
    let level: 0 | 1 | 2 | 3 = 0;
    if (total > 0) {
      const p = completed / total;
      level = p >= 0.9 ? 3 : p >= 0.5 ? 2 : 1;
    }
    result[dateStr] = level;
  }
  return result;
}

export type DayTaskDetail = {
  goalName: string;
  groupName: string;
  completedCount: number;
  totalCount: number;
  tasks: { name: string; done: boolean }[];
};

/** Per-task breakdown for a specific date across all active groups */
export function getDayTaskDetail(goals: Goal[], dateStr: string): DayTaskDetail[] {
  const result: DayTaskDetail[] = [];
  for (const goal of goals) {
    for (const group of goal.groups) {
      if (!group.startDate || group.status === 'locked') continue;
      const start = new Date(group.startDate);
      const end = addDays(start, group.durationInDays - 1);
      const d = new Date(dateStr);
      if (d < start || d > end || group.tasks.length === 0) continue;
      const rec = group.progress[dateStr] || {};
      const tasks = group.tasks.map(t => ({ name: t.name, done: !!rec[t.id] }));
      result.push({
        goalName: goal.name,
        groupName: group.name,
        completedCount: tasks.filter(t => t.done).length,
        totalCount: tasks.length,
        tasks,
      });
    }
  }
  return result;
}

/** Times user completed tasks after a gap of 3+ inactive days */
export function getComebackCount(goals: Goal[]): number {
  const activeDates = new Set<string>();
  for (const goal of goals) {
    for (const group of goal.groups) {
      for (const [date, rec] of Object.entries(group.progress)) {
        if (Object.values(rec).some(v => v)) activeDates.add(date);
      }
    }
  }
  const sorted = Array.from(activeDates).sort();
  let count = 0;
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000;
    if (diff >= 4) count++;
  }
  return count;
}

/** Count of fully completed goals */
export function getCompletedGoalsCount(goals: Goal[]): number {
  return goals.filter(g => g.groups.length > 0 && g.groups.every(gr => gr.status === 'completed')).length;
}

/** Count of completed stages across all goals */
export function getCompletedStagesCount(goals: Goal[]): number {
  let count = 0;
  for (const goal of goals) {
    count += goal.groups.filter(gr => gr.status === 'completed').length;
  }
  return count;
}
