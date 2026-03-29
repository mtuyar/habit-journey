import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      goals: [], // Başlangıçta hiçbir veri yok, tamamen boş ve temiz bir sayfa
      
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
              
              const updatedProgress = {
                ...gr.progress,
                [date]: { ...dayProgress, [taskId]: !isCompleted }
              };
              
              return { ...gr, progress: updatedProgress };
            })
          };
        });

        // Tetiklenen veri ile otomatik tamamlama değerlendirmesi
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
            
            // Başarı oranı %90'a ulaştığında başarıyla tamamlandı say (Zen kuralı)
            if (ratio >= 0.9) {
              nextGroupUnlocked = true;
              return { ...gr, status: 'completed' as const };
            } else {
               // Geri işaretleme yapıldıysa tekrar ana duruma dön
               return { ...gr, status: 'active' as const };
            }
          });

          let finalGroups = [...updatedGroups];
          if (nextGroupUnlocked) {
            const groupIndex = finalGroups.findIndex(gr => gr.id === groupId);
            if (groupIndex !== -1 && groupIndex + 1 < finalGroups.length) {
              // Sonraki aşama kilitliyse otomatik kilidini aç
              if (finalGroups[groupIndex + 1].status === 'locked') {
                 finalGroups[groupIndex + 1] = {
                   ...finalGroups[groupIndex + 1],
                   status: 'active',
                   startDate: new Date().toISOString()
                 }
              }
            }
          }

          return { ...g, groups: finalGroups };
        });

        return { goals: goalsSnapshot };
      }),

      evaluateGroupCompletion: (goalId, groupId) => {
        // Otomatik hesaplama toggleTaskCompletion içinde entegre edildi
      }
    }),
    {
      name: 'habit-journey-zen-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
