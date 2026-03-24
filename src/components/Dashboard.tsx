import React from 'react';
import { motion } from 'framer-motion';
import { Goal, Stage } from '../types';
import { CheckCircle2, Lock, XCircle, RotateCcw, Target, Trophy, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppStore } from '../store';

interface DashboardProps {
  goal: Goal;
  stages: Stage[];
  onSelectStage: (stageId: string) => void;
}

export function Dashboard({ goal, stages, onSelectStage }: DashboardProps) {
  const { resetApp } = useAppStore();
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);
  const activeStage = stages.find((s) => s.status === 'active');
  const overallProgress = stages.filter((s) => s.status === 'completed').length / stages.length;

  return (
    <div className="min-h-screen bg-[#F9F8F4] text-stone-900 p-4 md:p-8 lg:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Top Bar */}
        <div className="flex justify-between items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-stone-200 text-xs font-bold tracking-widest uppercase text-stone-500 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Yolculuk Aktif
          </div>
          <div className="flex items-center gap-2">
            {showResetConfirm && (
              <button
                onClick={() => resetApp()}
                className="text-xs bg-red-50 text-red-600 px-4 py-2 rounded-full hover:bg-red-600 hover:text-white transition-colors font-bold border border-red-200"
              >
                Sıfırlamayı Onayla
              </button>
            )}
            <button 
              onClick={() => setShowResetConfirm(!showResetConfirm)}
              className={cn(
                "p-2.5 transition-colors rounded-full border",
                showResetConfirm ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-400 border-stone-200 hover:text-red-500 hover:border-red-200"
              )}
              title="Yolculuğu Sıfırla"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        {/* Bento Grid Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Goal & Progress Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-5 xl:col-span-4 bg-stone-900 text-white rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden shadow-xl"
          >
             <div className="relative z-10">
               <h2 className="text-stone-400 font-bold tracking-widest uppercase text-xs mb-3">Ana Hedef</h2>
               <h1 className="text-4xl md:text-5xl font-bold tracking-tighter leading-tight">{goal.title}</h1>
             </div>
             
             <div className="mt-16 relative z-10">
               <div className="text-7xl font-light tracking-tighter mb-4">%{Math.round(overallProgress * 100)}</div>
               <div className="h-2 w-full bg-stone-800 rounded-full overflow-hidden">
                 <motion.div 
                   className="h-full bg-amber-400" 
                   initial={{ width: 0 }} 
                   animate={{ width: `${overallProgress * 100}%` }} 
                   transition={{ duration: 1, delay: 0.2 }}
                 />
               </div>
             </div>

             {/* Decorative background element */}
             <div className="absolute -right-16 -bottom-16 text-stone-800 opacity-40 pointer-events-none">
               <Target size={280} strokeWidth={1} />
             </div>
          </motion.div>

          {/* Active Stage Card */}
          {activeStage ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => onSelectStage(activeStage.id)}
              className="lg:col-span-7 xl:col-span-8 bg-amber-400 rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform duration-300 shadow-xl shadow-amber-500/20 relative overflow-hidden group"
            >
              <div className="flex justify-between items-start relative z-10">
                <div className="bg-stone-900 text-white px-5 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase shadow-sm">
                  Şu Anki Aşama
                </div>
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform shadow-sm">
                  <ArrowRight size={28} />
                </div>
              </div>

              <div className="mt-16 relative z-10">
                <h3 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-stone-900 leading-none mb-4">
                  {activeStage.title}
                </h3>
                <p className="text-amber-900 font-semibold text-lg md:text-xl">
                  {activeStage.durationDays} Günlük Meydan Okuma
                </p>
              </div>
              
              {/* Decorative Number */}
              <div className="absolute -right-8 -bottom-12 font-serif font-bold text-[14rem] md:text-[18rem] leading-none text-amber-500 opacity-40 pointer-events-none select-none">
                {(stages.findIndex(s => s.id === activeStage.id) + 1).toString().padStart(2, '0')}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-7 xl:col-span-8 bg-emerald-500 rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-center items-center text-center shadow-xl shadow-emerald-500/20"
            >
               <Trophy size={80} className="text-white mb-6" />
               <h3 className="text-5xl font-bold text-white tracking-tighter mb-4">Tebrikler!</h3>
               <p className="text-emerald-100 text-xl font-medium">Tüm aşamaları başarıyla tamamladın.</p>
            </motion.div>
          )}

        </div>

        {/* Other Stages Grid */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="pt-8"
        >
          <h3 className="text-3xl font-bold tracking-tight text-stone-900 mb-8">Tüm Aşamalar</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {stages.map((stage, index) => {
              const isLocked = stage.status === 'locked';
              const isActive = stage.status === 'active';
              const isCompleted = stage.status === 'completed';
              const isFailed = stage.status === 'failed';

              if (isActive) return null; // Already shown in hero

              return (
                <div
                  key={stage.id}
                  onClick={() => onSelectStage(stage.id)}
                  className={cn(
                    "p-6 md:p-8 rounded-3xl border-2 transition-all duration-300 cursor-pointer relative overflow-hidden group flex flex-col justify-between min-h-[200px]",
                    isCompleted ? "bg-white border-stone-200 hover:border-emerald-400 hover:shadow-lg" :
                    isFailed ? "bg-white border-stone-200 hover:border-rose-400 hover:shadow-lg" :
                    "bg-stone-100/50 border-transparent hover:bg-stone-100"
                  )}
                >
                  <div className="flex justify-between items-start mb-8">
                    <span className={cn(
                      "text-5xl font-serif font-bold tracking-tighter transition-colors",
                      isCompleted ? "text-stone-900 group-hover:text-emerald-600" : 
                      isFailed ? "text-stone-900 group-hover:text-rose-600" :
                      "text-stone-400"
                    )}>
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                      isCompleted ? "bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white" :
                      isFailed ? "bg-rose-100 text-rose-600 group-hover:bg-rose-500 group-hover:text-white" :
                      "bg-stone-200 text-stone-400"
                    )}>
                      {isCompleted && <CheckCircle2 size={20} />}
                      {isFailed && <XCircle size={20} />}
                      {isLocked && <Lock size={18} />}
                    </div>
                  </div>

                  <div>
                    <h4 className={cn(
                      "text-2xl font-bold tracking-tight mb-2",
                      isLocked ? "text-stone-500" : "text-stone-900"
                    )}>
                      {stage.title}
                    </h4>
                    <p className="text-sm font-semibold tracking-widest uppercase text-stone-500">
                      {stage.durationDays} Gün
                    </p>
                  </div>

                  {/* Progress bar for completed/failed */}
                  {stage.successRate !== undefined && (
                    <div className="absolute bottom-0 left-0 right-0 h-2 bg-stone-100">
                      <div 
                        className={cn("h-full transition-all duration-1000", isCompleted ? "bg-emerald-500" : "bg-rose-500")}
                        style={{ width: `${stage.successRate}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
