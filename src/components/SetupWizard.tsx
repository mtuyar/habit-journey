import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Goal, Stage } from '../types';

interface SetupWizardProps {
  onComplete: (goal: Goal, stages: Stage[]) => void;
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [goalTitle, setGoalTitle] = useState('');
  const [stages, setStages] = useState<Partial<Stage>[]>([
    { id: '1', title: '1. Aşama', durationDays: 21, tasks: [''] },
  ]);

  const addStage = () => {
    setStages([
      ...stages,
      { id: Date.now().toString(), title: `${stages.length + 1}. Aşama`, durationDays: 21, tasks: [''] },
    ]);
  };

  const updateStage = (index: number, field: keyof Stage, value: any) => {
    const newStages = [...stages];
    newStages[index] = { ...newStages[index], [field]: value };
    setStages(newStages);
  };

  const removeStage = (index: number) => {
    if (stages.length === 1) return;
    setStages(stages.filter((_, i) => i !== index));
  };

  const addTask = (stageIndex: number) => {
    const newStages = [...stages];
    newStages[stageIndex].tasks = [...(newStages[stageIndex].tasks || []), ''];
    setStages(newStages);
  };

  const updateTask = (stageIndex: number, taskIndex: number, value: string) => {
    const newStages = [...stages];
    const tasks = [...(newStages[stageIndex].tasks || [])];
    tasks[taskIndex] = value;
    newStages[stageIndex].tasks = tasks;
    setStages(newStages);
  };

  const removeTask = (stageIndex: number, taskIndex: number) => {
    const newStages = [...stages];
    const tasks = [...(newStages[stageIndex].tasks || [])];
    if (tasks.length === 1) return;
    tasks.splice(taskIndex, 1);
    newStages[stageIndex].tasks = tasks;
    setStages(newStages);
  };

  const handleComplete = () => {
    const goal: Goal = {
      id: Date.now().toString(),
      title: goalTitle,
      createdAt: new Date().toISOString(),
    };

    const finalStages: Stage[] = stages.map((s, i) => ({
      id: s.id || Date.now().toString() + i,
      goalId: goal.id,
      title: s.title || `${i + 1}. Aşama`,
      durationDays: s.durationDays || 21,
      order: i,
      tasks: (s.tasks || []).filter((t) => t.trim() !== ''),
      status: i === 0 ? 'active' : 'locked',
      ...(i === 0 ? { startDate: new Date().toISOString() } : {}),
    }));

    onComplete(goal, finalStages);
  };

  return (
    <div className="min-h-screen bg-[#F9F8F4] text-stone-900 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-stone-900">Hedefini Belirle.</h1>
                <p className="text-stone-500 text-lg">Ulaşmak istediğin nihai hedef nedir?</p>
              </div>
              <input
                type="text"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="Örn: İngilizce Öğrenmek, Kilo Vermek"
                className="w-full bg-transparent border-b-2 border-stone-300 py-4 text-2xl md:text-3xl focus:outline-none focus:border-amber-500 transition-colors placeholder:text-stone-400 text-stone-900"
                autoFocus
              />
              <button
                onClick={() => setStep(2)}
                disabled={!goalTitle.trim()}
                className="flex items-center justify-center gap-2 bg-amber-500 text-white px-8 py-4 rounded-full font-medium text-lg hover:bg-amber-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
              >
                Devam Et <ArrowRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-stone-900">Yolculuğu Planla.</h1>
                <p className="text-stone-500">Hedefini aşamalara böl. Her aşamayı geçmek için %90 başarı oranına ulaşmalısın.</p>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                {stages.map((stage, stageIndex) => (
                  <div key={stage.id} className="bg-white border border-stone-200 rounded-3xl p-6 space-y-6 relative group shadow-sm">
                    {stages.length > 1 && (
                      <button
                        onClick={() => removeStage(stageIndex)}
                        className="absolute top-4 right-4 text-stone-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider text-stone-500 font-semibold">Aşama Adı</label>
                        <input
                          type="text"
                          value={stage.title}
                          onChange={(e) => updateStage(stageIndex, 'title', e.target.value)}
                          className="w-full bg-transparent border-b border-stone-200 py-2 focus:outline-none focus:border-amber-500 transition-colors text-stone-900"
                          placeholder="Örn: 1. Ay: Temeller"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider text-stone-500 font-semibold">Süre (Gün)</label>
                        <input
                          type="number"
                          min="1"
                          value={stage.durationDays}
                          onChange={(e) => updateStage(stageIndex, 'durationDays', parseInt(e.target.value) || 21)}
                          className="w-full bg-transparent border-b border-stone-200 py-2 focus:outline-none focus:border-amber-500 transition-colors text-stone-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs uppercase tracking-wider text-stone-500 font-semibold">Günlük Görevler</label>
                      {stage.tasks?.map((task, taskIndex) => (
                        <div key={taskIndex} className="flex gap-2 items-center">
                          <div className="w-2 h-2 rounded-full bg-amber-400" />
                          <input
                            type="text"
                            value={task}
                            onChange={(e) => updateTask(stageIndex, taskIndex, e.target.value)}
                            className="flex-1 bg-transparent border-b border-stone-200 py-1 text-sm focus:outline-none focus:border-amber-500 transition-colors text-stone-900"
                            placeholder="Örn: 10 sayfa kitap oku"
                          />
                          {stage.tasks!.length > 1 && (
                            <button onClick={() => removeTask(stageIndex, taskIndex)} className="text-stone-400 hover:text-red-500">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => addTask(stageIndex)}
                        className="text-sm text-stone-500 hover:text-amber-600 flex items-center gap-1 mt-2 transition-colors font-medium"
                      >
                        <Plus size={14} /> Görev Ekle
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-200">
                <button
                  onClick={addStage}
                  className="flex items-center gap-2 text-stone-500 hover:text-amber-600 transition-colors font-medium w-full sm:w-auto justify-center"
                >
                  <Plus size={18} /> Yeni Aşama Ekle
                </button>
                <button
                  onClick={handleComplete}
                  className="flex items-center justify-center gap-2 bg-amber-500 text-white px-8 py-3 rounded-full font-medium hover:bg-amber-600 transition-colors shadow-sm w-full sm:w-auto"
                >
                  <CheckCircle2 size={18} /> Yolculuğa Başla
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
