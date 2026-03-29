import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, addDays } from 'date-fns';

export type Task = {
  id: string;
  name: string;
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
};

export type Goal = {
  id: string;
  name: string;
  targetLevel: string;
  groups: Group[];
};

interface ProgressState {
  goals: Goal[];
  addGoal: (goal: Goal) => void;
  deleteGoal: (goalId: string) => void;
  updateGoalName: (goalId: string, newName: string) => void;
  updateGoal: (updatedGoal: Goal) => void;
  startGroup: (goalId: string, groupId: string, startDate: string) => void;
  toggleTaskCompletion: (goalId: string, groupId: string, date: string, taskId: string) => void;
  evaluateGroupCompletion: (goalId: string, groupId: string) => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      goals: [],

      addGoal: (goal) => set((state) => ({ goals: [...state.goals, goal] })),

      deleteGoal: (goalId) => set((state) => ({ goals: state.goals.filter(g => g.id !== goalId) })),

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

          const updatedGroups = g.groups.map((gr) => {
            if (gr.id !== groupId) return gr;
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

          return { ...g, groups: finalGroups };
        });

        return { goals: goalsSnapshot };
      }),

      evaluateGroupCompletion: (_goalId, _groupId) => {
        // Handled automatically inside toggleTaskCompletion
      }
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

/** Activity heatmap data for the last `weeks` weeks (oldest → newest). */
export function getActivityHeatmap(goals: Goal[], weeks = 16): { date: string; level: 0 | 1 | 2 | 3 }[] {
  const today = new Date();
  const result: { date: string; level: 0 | 1 | 2 | 3 }[] = [];
  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const date = format(addDays(today, -i), 'yyyy-MM-dd');
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

/** Returns completed/total task counts for today across all active groups. */
export function getTodayProgress(goals: Goal[]): { completed: number; total: number } {
  const today = format(new Date(), 'yyyy-MM-dd');
  let completed = 0;
  let total = 0;

  for (const goal of goals) {
    for (const group of goal.groups) {
      if (group.status !== 'active') continue;
      total += group.tasks.length;
      const dayRecord = group.progress[today] || {};
      group.tasks.forEach(t => {
        if (dayRecord[t.id]) completed++;
      });
    }
  }

  return { completed, total };
}
