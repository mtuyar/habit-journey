import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Stage, DailyLog } from '../types';
import { ArrowLeft, Check, Circle, Lock, Play, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { format, addDays, differenceInDays, isSameDay, startOfDay, isBefore } from 'date-fns';
import { tr } from 'date-fns/locale';

interface StageViewProps {
  stage: Stage;
  logs: Record<string, DailyLog>;
  onBack: () => void;
  onToggleTask: (date: string, taskIndex: number) => void;
  onCompleteStage: (successRate: number, passed: boolean) => void;
  onStartStage: (startDate: string) => void;
}

export function StageView({ stage, logs, onBack, onToggleTask, onCompleteStage, onStartStage }: StageViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const startDate = stage.startDate ? new Date(stage.startDate) : null;
  const today = startOfDay(new Date());
  
  // Calculate days passed
  const daysPassed = startDate ? differenceInDays(today, startOfDay(startDate)) : 0;
  const isFinished = daysPassed >= stage.durationDays;
  
  // Calculate success rate
  let totalTasks = stage.durationDays * stage.tasks.length;
  let completedTasksCount = 0;
  
  const days = Array.from({ length: stage.durationDays }).map((_, i) => {
    const date = startDate ? addDays(startOfDay(startDate), i) : null;
    const dateStr = date ? format(date, 'yyyy-MM-dd') : null;
    const logKey = dateStr ? `${stage.id}_${dateStr}` : null;
    const log = logKey ? logs[logKey] : null;
    
    const completed = log ? log.completedTasks.length : 0;
    completedTasksCount += completed;
    
    const isPast = date ? isBefore(date, today) : false;
    const isToday = date ? isSameDay(date, today) : false;
    
    return {
      dayIndex: i + 1,
      date,
      dateStr,
      completed,
      total: stage.tasks.length,
      isPast,
      isToday,
      isFuture: !isPast && !isToday,
      success: completed === stage.tasks.length,
      partial: completed > 0 && completed < stage.tasks.length,
      failed: isPast && completed < stage.tasks.length,
    };
  });

  const currentSuccessRate = totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 0;
  const passed = currentSuccessRate >= 90;

  const handleComplete = () => {
    onCompleteStage(currentSuccessRate, passed);
  };

  const handleStart = () => {
    onStartStage(new Date().toISOString());
  };

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedLogKey = `${stage.id}_${selectedDateStr}`;
  const selectedLog = logs[selectedLogKey];
  const selectedDayInfo = days.find(d => d.dateStr === selectedDateStr);

  const canEditSelectedDate = stage.status === 'active' && selectedDayInfo && !selectedDayInfo.isFuture;

  return (
    <div className="min-h-screen bg-[#F9F8F4] text-stone-900 p-6 md:p-12 font-sans overflow-x-hidden">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors font-medium"
          >
            <ArrowLeft size={20} /> Yolculuğa Dön
          </button>
          <div className="text-xs font-mono tracking-widest uppercase text-stone-400 font-semibold bg-white px-3 py-1 rounded-full border border-stone-200 shadow-sm">
            {stage.durationDays} Günlük Meydan Okuma
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-stone-900">{stage.title}</h1>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-light text-stone-800">%{currentSuccessRate.toFixed(1)}</span>
              <span className="text-sm text-stone-500 uppercase tracking-wider font-semibold">Başarı Oranı</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-light text-stone-800">{Math.min(daysPassed, stage.durationDays)}/{stage.durationDays}</span>
              <span className="text-sm text-stone-500 uppercase tracking-wider font-semibold">Gün</span>
            </div>
          </div>
        </div>

        {/* Action Banner */}
        {stage.status === 'locked' && (
          <div className="bg-stone-100 border border-stone-200 rounded-3xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Lock className="text-stone-400" />
              <div>
                <h3 className="font-semibold text-stone-800">Aşama Kilitli</h3>
                <p className="text-sm text-stone-500">Bu aşamanın kilidini açmak için öncekileri tamamla.</p>
              </div>
            </div>
          </div>
        )}

        {stage.status === 'active' && !startDate && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Play className="text-amber-500" />
              <div>
                <h3 className="font-semibold text-amber-900">Başlamaya hazır mısın?</h3>
                <p className="text-sm text-amber-700">Günlük görevlerini takip etmek için bu aşamayı başlat.</p>
              </div>
            </div>
            <button 
              onClick={handleStart}
              className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-full font-medium transition-colors w-full sm:w-auto shadow-sm"
            >
              Hemen Başla
            </button>
          </div>
        )}

        {stage.status === 'active' && isFinished && (
          <div className={cn(
            "border rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6",
            passed ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
          )}>
            <div className="flex items-center gap-4">
              {passed ? <Check className="text-emerald-500" /> : <AlertTriangle className="text-rose-500" />}
              <div>
                <h3 className={cn("font-semibold text-lg", passed ? "text-emerald-900" : "text-rose-900")}>
                  {passed ? "Aşama Başarıyla Tamamlandı!" : "Aşama Başarısız"}
                </h3>
                <p className={cn("text-sm", passed ? "text-emerald-700" : "text-rose-700")}>
                  {passed 
                    ? `%${currentSuccessRate.toFixed(1)} başarı oranına ulaştın. Sonraki aşamaya hazır mısın?` 
                    : `%${currentSuccessRate.toFixed(1)} başarı oranında kaldın, hedef olan %90'ın altında.`}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button 
                onClick={handleComplete}
                className={cn(
                  "px-8 py-3 rounded-full font-medium transition-colors text-white w-full sm:w-auto shadow-sm",
                  passed ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"
                )}
              >
                {passed ? "Sonraki Aşamaya Geç" : "Anladım"}
              </button>
              {!passed && (
                <button 
                  onClick={() => onStartStage(new Date().toISOString())}
                  className="px-8 py-3 rounded-full font-medium transition-colors text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 w-full sm:w-auto"
                >
                  Aşamayı Tekrarla
                </button>
              )}
            </div>
          </div>
        )}

        {/* The Chain (Grid View) */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold tracking-tight text-stone-900">Zincir</h3>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 md:gap-4">
            {days.map((day, i) => {
              const isSelected = day.dateStr === selectedDateStr;
              
              return (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => day.date && setSelectedDate(day.date)}
                  disabled={!day.date || day.isFuture}
                  className={cn(
                    "aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 border-2 transition-all duration-200 relative overflow-hidden",
                    !day.date ? "bg-stone-100 border-transparent cursor-not-allowed opacity-50" :
                    day.isFuture ? "bg-white border-stone-200 cursor-not-allowed text-stone-400" :
                    day.success ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:border-emerald-400" :
                    day.partial ? "bg-amber-50 border-amber-200 text-amber-600 hover:border-amber-400" :
                    day.failed ? "bg-rose-50 border-rose-200 text-rose-600 hover:border-rose-400" :
                    "bg-white border-stone-200 text-stone-600 hover:border-stone-300 shadow-sm",
                    isSelected && "ring-4 ring-amber-500/20 border-amber-500 shadow-md"
                  )}
                >
                  <span className="text-xl md:text-2xl font-bold">{day.dayIndex}</span>
                  {day.date && (
                    <span className="text-[10px] md:text-xs font-mono opacity-70 font-medium">
                      {format(day.date, 'd MMM', { locale: tr })}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Daily Tasks */}
        <div className="space-y-6 bg-white rounded-3xl p-6 md:p-8 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <h3 className="text-2xl font-bold tracking-tight text-stone-900">
              {selectedDayInfo?.isToday ? "Bugünün Görevleri" : 
               selectedDayInfo?.date ? format(selectedDayInfo.date, 'd MMMM yyyy', { locale: tr }) : 
               "Görevler"}
            </h3>
            {selectedDayInfo?.date && (
              <span className="text-sm font-mono text-stone-500 font-medium bg-stone-100 px-3 py-1 rounded-full">
                {selectedDayInfo.dayIndex}. Gün
              </span>
            )}
          </div>

          <div className="space-y-3">
            {stage.tasks.map((task, index) => {
              const isCompleted = selectedLog?.completedTasks.includes(index);
              
              return (
                <div 
                  key={index}
                  onClick={() => canEditSelectedDate && onToggleTask(selectedDateStr, index)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200",
                    canEditSelectedDate ? "cursor-pointer hover:shadow-md" : "opacity-70",
                    isCompleted ? "bg-emerald-50 border-emerald-200" : "bg-white border-stone-200"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors",
                    isCompleted ? "bg-emerald-500 text-white" : "border-2 border-stone-300 text-transparent"
                  )}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className={cn(
                    "text-lg transition-all font-medium",
                    isCompleted ? "text-stone-400 line-through" : "text-stone-700"
                  )}>
                    {task}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

// Need to add isBefore to date-fns imports
