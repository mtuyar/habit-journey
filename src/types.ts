export interface Goal {
  id: string;
  title: string;
  createdAt: string;
}

export interface Stage {
  id: string;
  goalId: string;
  title: string;
  durationDays: number;
  order: number;
  tasks: string[];
  status: 'locked' | 'active' | 'completed' | 'failed';
  startDate?: string;
  endDate?: string;
  successRate?: number;
}

export interface DailyLog {
  stageId: string;
  date: string; // YYYY-MM-DD
  completedTasks: number[]; // Indices of completed tasks
}

export interface AppState {
  goal: Goal | null;
  stages: Stage[];
  logs: Record<string, DailyLog>; // Keyed by `${stageId}_${date}`
}
