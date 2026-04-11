import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useProgressStore } from '@/store/useProgressStore';
import { cn } from '@/components/ui/Card';
import { differenceInDays, addDays, format, isToday, startOfMonth, startOfWeek, endOfMonth, endOfWeek, eachDayOfInterval, isSameMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/lib/i18n';
import * as Haptics from 'expo-haptics';


export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  
  const goals = useProgressStore(state => state.goals);
  const toggleTask = useProgressStore(state => state.toggleTaskCompletion);

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [isCalendarView, setIsCalendarView] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const celebratedDays = useRef<Set<string>>(new Set());
  const dayStripRef = useRef<ScrollView>(null);

  let currentGoal = null;
  let currentGroup = null;

  for (const g of goals) {
    const gr = g.groups.find(x => x.id === id);
    if (gr) {
      currentGoal = g;
      currentGroup = gr;
      break;
    }
  }

  let groupCompletedTasks = 0;
  let groupTotalTasks = 0;

  if (currentGroup) {
     groupTotalTasks = currentGroup.durationInDays * currentGroup.tasks.length;
     Object.values(currentGroup.progress).forEach(dayRecord => {
        Object.values(dayRecord).forEach(done => { if (done) groupCompletedTasks++; });
     });
  }
  const groupPercentage = groupTotalTasks === 0 ? 0 : Math.round((groupCompletedTasks / groupTotalTasks) * 100);

  // Compute days & selectedDayData before any early return so hooks below are always called
  const startDate = currentGroup?.startDate ? new Date(currentGroup.startDate) : new Date();
  const days = currentGroup
    ? Array.from({ length: currentGroup.durationInDays }).map((_, i) => {
        const date = addDays(startDate, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayProgress = currentGroup.progress[dateStr] || {};
        let completedCount = 0;
        currentGroup.tasks.forEach(task => { if (dayProgress[task.id]) completedCount++; });
        return {
          index: i,
          dateStr,
          displayDay: format(date, 'd', { locale: tr }),
          displayWeekday: format(date, 'EE', { locale: tr }),
          isCurrentDay: isToday(date),
          isAllCompleted: completedCount === currentGroup.tasks.length && currentGroup.tasks.length > 0,
          progressPerc: currentGroup.tasks.length === 0 ? 0 : completedCount / currentGroup.tasks.length,
          progressNum: completedCount,
          total: currentGroup.tasks.length,
        };
      })
    : [];
  const selectedDayData = days[selectedDayIndex] ?? null;

  useEffect(() => {
    if (currentGroup && currentGroup.startDate) {
      const start = new Date(currentGroup.startDate);
      const diff = Math.max(0, differenceInDays(new Date(), start));
      const idx = diff < currentGroup.durationInDays ? diff : currentGroup.durationInDays - 1;
      setSelectedDayIndex(idx);
      // Scroll the day strip so today is visible (item width 46 + gap 12 = 58px)
      if (idx > 2) {
        setTimeout(() => {
          dayStripRef.current?.scrollTo({ x: Math.max(0, idx * 58 - 64), animated: false });
        }, 80);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Completion celebration effect — must be before early return to obey hooks rules
  useEffect(() => {
    if (!currentGroup || currentGroup.status === 'locked' || !selectedDayData) return;
    const allDone = selectedDayData.total > 0 && selectedDayData.progressNum === selectedDayData.total;
    if (allDone && !celebratedDays.current.has(selectedDayData.dateStr)) {
      celebratedDays.current.add(selectedDayData.dateStr);
      setShowCelebration(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const timer = setTimeout(() => setShowCelebration(false), 2400);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDayData?.progressNum]);

  if (!currentGroup || !currentGoal) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-journeyBg dark:bg-journeyDarkBg">
        <Text className="text-journeyMuted dark:text-journeyMuted font-light">{t('groupNotFound')}</Text>
      </SafeAreaView>
    );
  }

  const isLastGroup = currentGoal.groups.indexOf(currentGroup) === currentGoal.groups.length - 1;
  const isLocked = currentGroup.status === 'locked';
  const endDate = addDays(startDate, currentGroup.durationInDays - 1);
  // selectedDayData is always defined here: days.length == durationInDays >= 1
  // and selectedDayIndex is clamped inside the useEffect above
  const sd = selectedDayData ?? days[0]!;

  // Logic for the full month Grid calendar view
  let calendarStart = startOfWeek(startOfMonth(startDate), { weekStartsOn: 1 });
  let calendarEnd = endOfWeek(endOfMonth(endDate), { weekStartsOn: 1 });
  
  const gridDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const isMultiMonth = format(startDate, 'M') !== format(endDate, 'M');
  const monthLabel = isMultiMonth 
    ? `${format(startDate, 'MMMM')} - ${format(endDate, 'MMMM yyyy', { locale: tr })}`
    : format(startDate, 'MMMM yyyy', { locale: tr });

  return (
    <SafeAreaView className="flex-1 bg-journeyBg dark:bg-journeyDarkBg">
      {/* Soft Header */}
      <View className="px-6 pt-4 pb-4">
        <View className="h-12 flex-row items-center justify-between relative z-10">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="w-12 h-12 items-center justify-center -ml-2 z-20"
          >
            <Ionicons name="chevron-back" size={24} color="#94A3B8" />
          </TouchableOpacity>
          
          <View className="absolute inset-x-0 h-full items-center justify-center pointer-events-none z-10">
            <Text 
              className="text-[15px] font-semibold text-journeyText dark:text-journeyDarkText tracking-wide text-center px-10" 
              numberOfLines={1}
            >
              {currentGroup.name}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => setIsCalendarView(!isCalendarView)}
            className="w-12 h-12 items-center justify-center -mr-2 bg-journeyCard dark:bg-journeyDarkCard border border-journeyBorder/40 dark:border-journeyDarkBorder/40 rounded-full shadow-sm z-20"
          >
            <Ionicons name={isCalendarView ? "list-outline" : "calendar-outline"} size={22} color="#14B8A6" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-6 mb-2 mt-4">
         <View className="bg-journeyAccent/8 dark:bg-journeyAccent/15 border border-journeyAccent/20 dark:border-journeyAccent/30 py-3.5 px-5 rounded-[20px] flex-row justify-between items-center">
            <View>
              <Text className="text-journeyText dark:text-journeyDarkText font-medium text-[13px]">{t('totalStageProgress')}</Text>
              <Text className="text-journeyMuted text-[11px] mt-0.5">
                {format(startDate, 'd MMM', { locale: tr })} — {format(endDate, 'd MMM yyyy', { locale: tr })}
              </Text>
            </View>
            <Text className="text-journeyAccent font-bold text-[14px]">%{groupPercentage}</Text>
         </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        
        {/* Subtle Intro */}
        <View className="px-8 mt-6 mb-8 items-center">
          <Text className="text-[11px] text-journeyMuted dark:text-journeyMuted uppercase tracking-[3px] font-medium mb-1">
            {t('dailyFlow')}
          </Text>
          <Text className="text-[26px] font-light text-journeyText dark:text-journeyDarkText text-center leading-[32px]">
            {currentGroup.durationInDays} {t('dayChain')}{`\n`}<Text className="font-semibold text-journeyAccent">{t('break')}</Text>
          </Text>
        </View>

        {/* Dynamic Day Views */}
        <View className="mb-10 w-full">
          {isCalendarView ? (
            <View className="px-6 w-full">
              <View className="bg-journeyCard dark:bg-journeyDarkCard rounded-[32px] border border-journeyBorder/40 dark:border-journeyDarkBorder/40 w-full p-4 pb-6">
                
                {/* Month Title */}
                <Text className="text-center font-bold text-journeyText dark:text-journeyDarkText text-lg mb-4 capitalize">
                   {monthLabel}
                </Text>

                {/* Days of week header */}
                <View className="flex-row justify-between mb-3 w-full px-2">
                   {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(w => (
                     <Text key={w} className="w-[12%] text-center text-[10px] font-bold text-journeyMuted dark:text-journeyMuted uppercase">
                       {t(w as any)}
                     </Text>
                   ))}
                </View>

                {/* Grid */}
                 <View className="flex-row flex-wrap justify-between gap-y-3 px-2">
                  {gridDays.map((d, i) => {
                     const dateStrFormat = format(d, 'yyyy-MM-dd');
                     const dayData = days.find(x => x.dateStr === dateStrFormat);
                     const isCurrentMonth = isSameMonth(d, startDate) || isSameMonth(d, endDate); 

                     if (dayData) {
                       const isSelected = selectedDayIndex === dayData.index;
                       return (
                         <TouchableOpacity 
                           key={i}
                           onPress={() => setSelectedDayIndex(dayData.index)}
                           activeOpacity={0.8}
                           className={cn(
                             "w-[12%] aspect-square items-center justify-center rounded-[18px] border",
                             dayData.isAllCompleted ? "bg-journeyAccent/10 border-journeyAccent/30" : "bg-[#F8FAFC]/50 dark:bg-black/20 border-journeyBorder/30 dark:border-journeyDarkBorder/30",
                             isSelected && !dayData.isAllCompleted && "border-journeyAccent/60 bg-journeyCard dark:bg-journeyDarkCard"
                           )}
                         >
                           <View className="flex-1 w-full items-center justify-center">
                             <Text className={cn("text-[13px] leading-tight", dayData.isAllCompleted ? "text-journeyAccent font-bold" : isSelected ? "text-journeyText dark:text-journeyDarkText font-bold" : "text-journeyText dark:text-journeyDarkText font-medium")}>
                               {format(d, 'd')}
                             </Text>
                             {(!dayData.isAllCompleted && dayData.progressPerc > 0) && (
                                <View className="mt-1 w-1 h-1 rounded-full bg-journeyAccent" />
                             )}
                             {(dayData.isAllCompleted) && (
                                <View className="mt-1 w-1 h-1 rounded-full bg-journeyAccent shadow-[0_0_2px_rgba(20,184,166,0.8)]" />
                             )}
                           </View>
                         </TouchableOpacity>
                       )
                     } else {
                       // Passive empty day from the month padding or outside interval
                       return (
                         <View key={i} className="w-[12%] aspect-square items-center justify-center rounded-xl bg-transparent">
                           <Text className={cn("text-[13px]", isCurrentMonth ? "text-journeyMuted dark:text-journeyMuted/40 font-light" : "text-transparent")}>
                              {format(d, 'd')}
                           </Text>
                         </View>
                       )
                     }
                  })}
                </View>
              </View>
            </View>
          ) : (
            <ScrollView
              ref={dayStripRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 32, gap: 12 }}
              snapToInterval={58}
              decelerationRate="fast"
            >
              {days.map((day, i) => {
                const isSelected = selectedDayIndex === i;
                
                return (
                  <TouchableOpacity 
                    key={i}
                    onPress={() => setSelectedDayIndex(i)}
                    activeOpacity={0.8}
                    className={cn(
                      "w-[46px] h-[76px] rounded-[24px] items-center py-3.5 justify-between border",
                      day.isAllCompleted ? "bg-journeyAccent/10 border-journeyAccent/20" : "bg-journeyCard dark:bg-journeyDarkCard border-journeyBorder/40 dark:border-journeyDarkBorder/40",
                      isSelected && !day.isAllCompleted && "border-journeyAccent/30 bg-[#F0FDF4]/50"
                    )}
                  >
                    <Text className={cn(
                      "text-[10px] uppercase font-medium",
                      day.isAllCompleted ? "text-journeyAccent" : isSelected ? "text-journeyAccent" : "text-journeyMuted dark:text-journeyMuted"
                    )}>
                      {day.displayWeekday}
                    </Text>

                    <View className="items-center justify-center">
                      <Text className={cn(
                        "text-[18px] font-light",
                        day.isAllCompleted ? "text-journeyAccent" : "text-journeyText dark:text-journeyDarkText"
                      )}>
                        {day.displayDay}
                      </Text>
                    </View>

                    <View className="w-[18px] h-[3px] rounded-full bg-journeyBorder overflow-hidden">
                      <View className="h-full bg-journeyAccent rounded-full" style={{ width: `${day.progressPerc * 100}%` }} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        <View className="px-8 mb-6 flex-row items-baseline justify-between mt-2">
          <Text className="text-journeyText dark:text-journeyDarkText text-xl font-medium tracking-tight">{t('todaysTasks')}</Text>
          <Text className="text-xs text-journeyMuted dark:text-journeyMuted font-light">
            {sd.progressNum} / {sd.total} {isLocked ? t('task') : t('completed')}
          </Text>
        </View>

        {currentGroup.status === 'completed' && (
           <View className="px-6 mb-4">
             <View className="bg-journeyAccent/10 px-5 py-4 rounded-[20px] border border-journeyAccent/20">
               <Text className="text-journeyAccent font-bold text-[15px] mb-1">
                 {isLastGroup ? t('goalCompletedTitle') : t('newStageUnlockedTitle')}
               </Text>
               <Text className="text-journeyText dark:text-journeyDarkText/80 text-[13px] leading-snug font-medium">
                 {isLastGroup ? t('goalCompletedDesc') : t('newStageUnlockedDesc')}
               </Text>
             </View>
           </View>
        )}

        {isLocked && (
           <View className="px-6 mb-4">
             <View className="bg-journeyBorder/20 dark:bg-journeyDarkCard px-4 py-3.5 rounded-[16px] flex-row items-center border border-journeyBorder/50 dark:border-journeyDarkBorder/50">
               <Ionicons name="lock-closed-outline" size={16} color="#64748B" />
               <Text className="text-[#64748B] text-[13px] ml-2.5 font-normal flex-1 leading-snug">
                 {t('stageLocked')}
               </Text>
             </View>
           </View>
        )}

        {/* Delicate Task List */}
        <View className="px-6 space-y-3">
           {currentGroup.tasks.length === 0 && (
             <Text className="text-center text-journeyMuted dark:text-journeyMuted text-[13px] font-light mt-4">{t('noTasksDefined')}</Text>
           )}
           {currentGroup.tasks.map((task, index) => {
             const isTaskDone = currentGroup.progress[sd.dateStr]?.[task.id] || false;
             
             return (
               <TouchableOpacity
                 key={task.id}
                activeOpacity={isLocked ? 1 : 0.7}
                onPress={() => {
                  if (!isLocked) {
                    const willComplete = !isTaskDone;
                    toggleTask(currentGoal.id, currentGroup.id, sd.dateStr, task.id);
                    if (willComplete) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }
                }}
                className={cn(
                  "flex-row items-center p-4 rounded-[28px]",
                  isLocked ? "bg-journeyCard dark:bg-journeyDarkCard/40 border border-transparent" : 
                  isTaskDone ? "bg-journeyBg dark:bg-journeyDarkBg border border-journeyBorder/20 dark:border-journeyDarkBorder/20 mb-3" : "bg-journeyCard dark:bg-journeyDarkCard border border-journeyBorder/40 dark:border-journeyDarkBorder/40 mb-3"
                )}
              >
                <View className={cn(
                  "w-6 h-6 rounded-full border mr-4 items-center justify-center",
                  isTaskDone ? "bg-journeyAccent border-journeyAccent" : isLocked ? "border-journeyMuted/30" : "border-journeyMuted/40 bg-transparent"
                )}>
                  {isTaskDone && <Ionicons name="checkmark" size={14} color="#FFF" />}
                  {isLocked && !isTaskDone && <Ionicons name="lock-closed" size={10} color="#CBD5E1" />}
                </View>
                <View className="flex-1">
                  <Text className={cn(
                    "text-[15px]",
                    isTaskDone ? "text-journeyMuted dark:text-journeyMuted/60 font-normal" : "text-journeyText dark:text-journeyDarkText font-normal"
                  )}>
                    {task.name}
                  </Text>
                  {!!task.description && (
                    <Text className="text-[11px] text-journeyMuted dark:text-journeyMuted mt-0.5 leading-snug">
                      {task.description}
                    </Text>
                  )}
                </View>
               </TouchableOpacity>
             )
           })}
        </View>

      </ScrollView>

      {/* Completion Celebration Overlay */}
      {showCelebration && (
        <View
          className="absolute inset-0 items-center justify-center"
          style={{ backgroundColor: 'rgba(7,33,31,0.55)' }}
        >
          <TouchableOpacity
            activeOpacity={1}
            className="absolute inset-0"
            onPress={() => setShowCelebration(false)}
          />
          <View
            className="bg-white dark:bg-journeyDarkCard rounded-[36px] items-center mx-7 relative overflow-hidden"
            style={{ shadowColor: '#0D9488', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 32, elevation: 16, paddingHorizontal: 36, paddingTop: 36, paddingBottom: 32 }}
          >
            {/* Teal accent strip at top */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, backgroundColor: '#0D9488' }} />

            {/* Close button */}
            <TouchableOpacity
              onPress={() => setShowCelebration(false)}
              className="absolute top-4 right-4 w-8 h-8 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
            >
              <Ionicons name="close" size={15} color="#94A3B8" />
            </TouchableOpacity>

            {/* Crescent + hands motif */}
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#F0FDFA', borderWidth: 2, borderColor: '#B2F0E8', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <Text style={{ fontSize: 36 }}>🤲</Text>
            </View>

            {/* Arabic subtitle */}
            <Text style={{ fontSize: 22, color: '#0D9488', fontWeight: '300', letterSpacing: 3, marginBottom: 10, textAlign: 'center' }}>
              {t('celebrationSub')}
            </Text>

            {/* Main title */}
            <Text className="text-journeyText dark:text-journeyDarkText text-[24px] font-bold text-center mb-3 tracking-tight">
              {t('celebrationTitle')}
            </Text>

            {/* Description */}
            <Text className="text-journeyMuted text-[13px] text-center leading-relaxed" style={{ maxWidth: 230 }}>
              {t('celebrationDesc')}
            </Text>

            {/* Gold divider dots */}
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 20, marginBottom: 4 }}>
              {[0,1,2].map(i => (
                <View key={i} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: i === 1 ? '#F59E0B' : '#B2F0E8' }} />
              ))}
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
