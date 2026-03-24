import { useState, useEffect } from 'react';
import { AppState, Goal, Stage, DailyLog } from './types';
import { format, differenceInDays, addDays, isAfter, isBefore, startOfDay } from 'date-fns';

const STORAGE_KEY = 'ascend_app_state';

const defaultState: AppState = {
  goal: null,
  stages: [],
  logs: {},
};

export function useAppStore() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse state', e);
      }
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setGoal = (goal: Goal, stages: Stage[]) => {
    setState({ goal, stages, logs: {} });
  };

  const toggleTask = (stageId: string, date: string, taskIndex: number) => {
    setState((prev) => {
      const logKey = `${stageId}_${date}`;
      const currentLog = prev.logs[logKey] || { stageId, date, completedTasks: [] };
      
      const isCompleted = currentLog.completedTasks.includes(taskIndex);
      const newCompletedTasks = isCompleted
        ? currentLog.completedTasks.filter((i) => i !== taskIndex)
        : [...currentLog.completedTasks, taskIndex];

      return {
        ...prev,
        logs: {
          ...prev.logs,
          [logKey]: { ...currentLog, completedTasks: newCompletedTasks },
        },
      };
    });
  };

  const startStage = (stageId: string, startDate: string) => {
    setState((prev) => {
      const newStages = prev.stages.map((s) => {
        if (s.id === stageId) {
          return { ...s, status: 'active' as const, startDate };
        }
        return s;
      });

      // Clear any existing logs for this stage (e.g., if retrying)
      const newLogs = { ...prev.logs };
      Object.keys(newLogs).forEach((key) => {
        if (key.startsWith(`${stageId}_`)) {
          delete newLogs[key];
        }
      });

      return { ...prev, stages: newStages, logs: newLogs };
    });
  };

  const completeStage = (stageId: string, successRate: number, passed: boolean) => {
    setState((prev) => {
      const stageIndex = prev.stages.findIndex(s => s.id === stageId);
      if (stageIndex === -1) return prev;

      const newStages = [...prev.stages];
      newStages[stageIndex] = { 
        ...newStages[stageIndex], 
        status: passed ? 'completed' : 'failed', 
        successRate 
      };

      // Unlock next stage if passed
      if (passed && stageIndex + 1 < newStages.length) {
        newStages[stageIndex + 1] = {
          ...newStages[stageIndex + 1],
          status: 'active',
          startDate: new Date().toISOString()
        };
      }

      return { ...prev, stages: newStages };
    });
  };

  const resetApp = () => {
    setState(defaultState);
  };

  return {
    state,
    setGoal,
    toggleTask,
    startStage,
    completeStage,
    resetApp,
  };
}
