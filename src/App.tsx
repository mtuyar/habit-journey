import React, { useState } from 'react';
import { useAppStore } from './store';
import { SetupWizard } from './components/SetupWizard';
import { Dashboard } from './components/Dashboard';
import { StageView } from './components/StageView';
import { AnimatePresence, motion } from 'framer-motion';

export default function App() {
  const { state, setGoal, toggleTask, startStage, completeStage } = useAppStore();
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  const handleCompleteSetup = (goal: any, stages: any) => {
    setGoal(goal, stages);
  };

  const handleSelectStage = (stageId: string) => {
    setSelectedStageId(stageId);
  };

  const handleBackToDashboard = () => {
    setSelectedStageId(null);
  };

  const selectedStage = state.stages.find((s) => s.id === selectedStageId);

  return (
    <div className="bg-[#F9F8F4] min-h-screen text-stone-900 selection:bg-amber-200">
      <AnimatePresence mode="wait">
        {!state.goal && (
          <motion.div
            key="setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SetupWizard onComplete={handleCompleteSetup} />
          </motion.div>
        )}

        {state.goal && !selectedStageId && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <Dashboard 
              goal={state.goal} 
              stages={state.stages} 
              onSelectStage={handleSelectStage} 
            />
          </motion.div>
        )}

        {state.goal && selectedStage && (
          <motion.div
            key="stage"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <StageView
              stage={selectedStage}
              logs={state.logs}
              onBack={handleBackToDashboard}
              onToggleTask={(date, taskIndex) => toggleTask(selectedStage.id, date, taskIndex)}
              onCompleteStage={(rate, passed) => {
                completeStage(selectedStage.id, rate, passed);
                setSelectedStageId(null);
              }}
              onStartStage={(date) => startStage(selectedStage.id, date)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

