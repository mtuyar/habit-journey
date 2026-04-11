/**
 * Dev-only test data generator.
 * Produces 3 realistic goals with historical progress to exercise
 * every part of the app: streaks, heatmap, achievements, today's focus,
 * locked/active/completed stages, and the insights screen.
 *
 * Expected results with today = any date:
 *   currentStreak  ≈ 28+ days
 *   bestStreak     ≈ same
 *   totalTasks     ≈ 116
 *   completionRate ≈ 87%
 *   achievements   7/8 (streak_30 requires 30 days — just shy)
 */

import { format, addDays } from 'date-fns';
import { Goal } from '@/store/useProgressStore';

const f = (d: Date) => format(d, 'yyyy-MM-dd');

export function generateTestGoals(): Goal[] {
  const today = new Date();

  // ── Goal 1: Sabah Rutini (Stage 1 completed, Stage 2 active 100%) ────────
  //   Stage 1: 21 days, started 35 days ago. Skip day 5 only → 20/21 = 95% → completed
  //   Stage 2: 14 days, started 14 days ago.  All 14 days done → 100% → active (needs toggle to evaluate)
  const s1Start = addDays(today, -35);
  const s1Tasks = [
    { id: 'g1-s1-t1', name: '5 dk meditasyon' },
    { id: 'g1-s1-t2', name: '1 litre su iç' },
    { id: 'g1-s1-t3', name: '10 dk yürüyüş' },
  ];
  const s1Progress: Record<string, Record<string, boolean>> = {};
  for (let i = 0; i < 21; i++) {
    if (i === 5) continue; // one missed day → 20/21 = 95%
    const d = f(addDays(s1Start, i));
    s1Progress[d] = Object.fromEntries(s1Tasks.map(t => [t.id, true]));
  }

  const s2Start = addDays(today, -14);
  const s2Tasks = [
    { id: 'g1-s2-t1', name: '20 dk egzersiz' },
    { id: 'g1-s2-t2', name: 'Sağlıklı kahvaltı' },
  ];
  const s2Progress: Record<string, Record<string, boolean>> = {};
  for (let i = 0; i < 14; i++) {
    const d = f(addDays(s2Start, i));
    // Day 3 only partial (one task) to test partial-day state in week strip
    if (i === 3) {
      s2Progress[d] = { 'g1-s2-t1': true, 'g1-s2-t2': false };
    } else {
      s2Progress[d] = Object.fromEntries(s2Tasks.map(t => [t.id, true]));
    }
  }

  const goal1: Goal = {
    id: 'test-goal-1',
    name: 'Sabah Rutini Ustası',
    targetLevel: '',
    groups: [
      {
        id: 'test-g1-s1',
        name: 'Temel Alışkanlıklar',
        durationInDays: 21,
        tasks: s1Tasks,
        startDate: s1Start.toISOString(),
        progress: s1Progress,
        status: 'completed',
      },
      {
        id: 'test-g1-s2',
        name: 'Gelişmiş Rutin',
        durationInDays: 14,
        tasks: s2Tasks,
        startDate: s2Start.toISOString(),
        progress: s2Progress,
        status: 'active',
      },
    ],
  };

  // ── Goal 2: Okuma Alışkanlığı (Just started today, 2nd stage locked) ─────
  const g2Tasks = [
    { id: 'g2-t1', name: '20 sayfa oku' },
    { id: 'g2-t2', name: 'Notlar al' },
  ];
  const goal2: Goal = {
    id: 'test-goal-2',
    name: 'Günlük Okuma',
    targetLevel: '',
    groups: [
      {
        id: 'test-g2-s1',
        name: 'İlk 7 Gün',
        durationInDays: 7,
        tasks: g2Tasks,
        startDate: today.toISOString(),
        progress: {},
        status: 'active',
      },
      {
        id: 'test-g2-s2',
        name: 'Momentum',
        durationInDays: 21,
        tasks: g2Tasks,
        startDate: null,
        progress: {},
        status: 'locked',
      },
    ],
  };

  // ── Goal 3: Spor Meydan Okuması (ALL stages completed → "Şampiyon" badge) ─
  //   Runs from 65 days ago — well in the past, fills heatmap with older data
  const g3Start = addDays(today, -65);
  const g3Tasks = [{ id: 'g3-t1', name: 'Antrenman' }];

  const g3s1Progress: Record<string, Record<string, boolean>> = {};
  for (let i = 0; i < 14; i++) {
    g3s1Progress[f(addDays(g3Start, i))] = { 'g3-t1': true };
  }
  const g3s2Progress: Record<string, Record<string, boolean>> = {};
  for (let i = 0; i < 14; i++) {
    g3s2Progress[f(addDays(g3Start, i + 14))] = { 'g3-t1': true };
  }

  const goal3: Goal = {
    id: 'test-goal-3',
    name: '28 Günlük Spor Meydan Okuması',
    targetLevel: '',
    groups: [
      {
        id: 'test-g3-s1',
        name: 'Başlangıç',
        durationInDays: 14,
        tasks: g3Tasks,
        startDate: g3Start.toISOString(),
        progress: g3s1Progress,
        status: 'completed',
      },
      {
        id: 'test-g3-s2',
        name: 'İvme',
        durationInDays: 14,
        tasks: g3Tasks,
        startDate: addDays(g3Start, 14).toISOString(),
        progress: g3s2Progress,
        status: 'completed',
      },
    ],
  };

  // ── Goal 4: 90-Gün Sağlık Programı (Şubat → Nisan aktif) ────────────────────
  //   Stage 1: Feb 1-21 (21 gün), tamamlandı – 20/21 gün (%95)
  //   Stage 2: Feb 22 – Mar 14 (21 gün), tamamlandı – 19/21 gün (%90)
  //   Stage 3: Mar 15 – Apr 4 (21 gün), tamamlandı – 20/21 gün (%95)
  //   Stage 4: Apr 5 – May 4 (30 gün), aktif – Apr 5-10 = 6 gün tamamlandı
  const g4Tasks = [
    { id: 'g4-t1', name: '8 bardak su iç' },
    { id: 'g4-t2', name: '30 dk yürüyüş' },
    { id: 'g4-t3', name: 'Erken uyu (23:00)' },
  ];

  const g4s1Start = addDays(today, -68); // Feb 1
  const g4s1Progress: Record<string, Record<string, boolean>> = {};
  for (let i = 0; i < 21; i++) {
    if (i === 10) continue; // 1 gün eksik
    g4s1Progress[f(addDays(g4s1Start, i))] = Object.fromEntries(g4Tasks.map(t => [t.id, true]));
  }

  const g4s2Start = addDays(today, -47); // Feb 22
  const g4s2Progress: Record<string, Record<string, boolean>> = {};
  for (let i = 0; i < 21; i++) {
    if (i === 4 || i === 13) continue; // 2 gün eksik
    g4s2Progress[f(addDays(g4s2Start, i))] = Object.fromEntries(g4Tasks.map(t => [t.id, true]));
  }

  const g4s3Start = addDays(today, -26); // Mar 15
  const g4s3Progress: Record<string, Record<string, boolean>> = {};
  for (let i = 0; i < 21; i++) {
    if (i === 7) continue; // 1 gün eksik
    g4s3Progress[f(addDays(g4s3Start, i))] = Object.fromEntries(g4Tasks.map(t => [t.id, true]));
  }

  const g4s4Start = addDays(today, -5); // Apr 5
  const g4s4Progress: Record<string, Record<string, boolean>> = {};
  for (let i = 0; i <= 5; i++) { // Apr 5–10 (6 gün)
    g4s4Progress[f(addDays(g4s4Start, i))] = Object.fromEntries(g4Tasks.map(t => [t.id, true]));
  }

  const goal4: Goal = {
    id: 'test-goal-4',
    name: '90 Günlük Sağlık Programı',
    targetLevel: '',
    groups: [
      {
        id: 'test-g4-s1',
        name: 'Temeller',
        durationInDays: 21,
        tasks: g4Tasks,
        startDate: g4s1Start.toISOString(),
        progress: g4s1Progress,
        status: 'completed',
      },
      {
        id: 'test-g4-s2',
        name: 'İlerleme',
        durationInDays: 21,
        tasks: g4Tasks,
        startDate: g4s2Start.toISOString(),
        progress: g4s2Progress,
        status: 'completed',
      },
      {
        id: 'test-g4-s3',
        name: 'Kararlılık',
        durationInDays: 21,
        tasks: g4Tasks,
        startDate: g4s3Start.toISOString(),
        progress: g4s3Progress,
        status: 'completed',
      },
      {
        id: 'test-g4-s4',
        name: 'Ustalık',
        durationInDays: 30,
        tasks: g4Tasks,
        startDate: g4s4Start.toISOString(),
        progress: g4s4Progress,
        status: 'active',
      },
    ],
  };

  return [goal1, goal2, goal3, goal4];
}
