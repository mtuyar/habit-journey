import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useProgressStore } from '@/store/useProgressStore';
import { cn } from '@/components/ui/Card';
import { differenceInDays, addDays, format, isToday, startOfMonth, startOfWeek, endOfMonth, endOfWeek, eachDayOfInterval, isSameMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const goals = useProgressStore(state => state.goals);
  const toggleTask = useProgressStore(state => state.toggleTaskCompletion);

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [isCalendarView, setIsCalendarView] = useState(false);

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

  useEffect(() => {
    if (currentGroup && currentGroup.startDate) {
      const start = new Date(currentGroup.startDate);
      const diff = Math.max(0, differenceInDays(new Date(), start));
      if (diff < currentGroup.durationInDays) {
        setSelectedDayIndex(diff);
      } else {
        setSelectedDayIndex(currentGroup.durationInDays - 1);
      }
    }
  }, []);

  if (!currentGroup || !currentGoal) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-journeyBg">
        <Text className="text-journeyMuted font-light">Grup bulunamadı.</Text>
      </SafeAreaView>
    );
  }

  const isLocked = currentGroup.status === 'locked';
  const startDate = currentGroup.startDate ? new Date(currentGroup.startDate) : new Date();
  const endDate = addDays(startDate, currentGroup.durationInDays - 1);

  // Parse Days for horizontal strip and data array
  const days = Array.from({ length: currentGroup.durationInDays }).map((_, i) => {
    const date = addDays(startDate, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const displayDay = format(date, 'd', { locale: tr });
    const displayWeekday = format(date, 'EE', { locale: tr });
    const isCurrentDay = isToday(date);
    
    const dayProgress = currentGroup.progress[dateStr] || {};
    let completedCount = 0;
    currentGroup.tasks.forEach(t => {
      if (dayProgress[t.id]) completedCount++;
    });

    const isAllCompleted = completedCount === currentGroup.tasks.length && currentGroup.tasks.length > 0;
    const progressPerc = currentGroup.tasks.length === 0 ? 0 : completedCount / currentGroup.tasks.length;
    
    return {
      index: i,
      dateStr,
      displayDay,
      displayWeekday,
      isCurrentDay,
      isAllCompleted,
      progressPerc,
      progressNum: completedCount,
      total: currentGroup.tasks.length
    };
  });

  const selectedDayData = days[selectedDayIndex];

  // Logic for the full month Grid calendar view
  let calendarStart = startOfWeek(startOfMonth(startDate), { weekStartsOn: 1 });
  let calendarEnd = endOfWeek(endOfMonth(endDate), { weekStartsOn: 1 });
  
  const gridDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const isMultiMonth = format(startDate, 'M') !== format(endDate, 'M');
  const monthLabel = isMultiMonth 
    ? `${format(startDate, 'MMMM')} - ${format(endDate, 'MMMM yyyy', { locale: tr })}`
    : format(startDate, 'MMMM yyyy', { locale: tr });

  return (
    <SafeAreaView className="flex-1 bg-journeyBg">
      {/* Soft Header */}
      <View className="px-6 pt-2 pb-2 flex-row items-center justify-between">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 items-center justify-center -ml-2"
        >
          <Ionicons name="chevron-back" size={24} color="#94A3B8" />
        </TouchableOpacity>
        
        <Text className="text-sm font-medium text-journeyText tracking-wide" numberOfLines={1}>
          {currentGroup.name}
        </Text>
        
        <TouchableOpacity 
          onPress={() => setIsCalendarView(!isCalendarView)} 
          className="w-10 h-10 items-center justify-center bg-white border border-journeyBorder/40 rounded-full"
        >
          <Ionicons name={isCalendarView ? "list-outline" : "calendar-outline"} size={18} color="#14B8A6" />
        </TouchableOpacity>
      </View>

      <View className="px-6 mb-2 mt-4">
         <View className="bg-journeyAccent/5 border border-journeyAccent/20 py-3.5 px-5 rounded-[20px] flex-row justify-between items-center">
            <Text className="text-journeyText font-medium text-[13px]">Toplam Aşama İlerlemesi</Text>
            <Text className="text-journeyAccent font-bold text-[14px]">%{groupPercentage}</Text>
         </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        
        {/* Subtle Intro */}
        <View className="px-8 mt-6 mb-8 items-center">
          <Text className="text-[11px] text-journeyMuted uppercase tracking-[3px] font-medium mb-1">
            Günlük Akış
          </Text>
          <Text className="text-[26px] font-light text-journeyText text-center leading-[32px]">
            {currentGroup.durationInDays} gün. Zinciri{`\n`}<Text className="font-semibold text-journeyAccent">Kırma.</Text>
          </Text>
        </View>

        {/* Dynamic Day Views */}
        <View className="mb-10 w-full">
          {isCalendarView ? (
            <View className="px-6 w-full">
              <View className="bg-white rounded-[32px] border border-journeyBorder/40 w-full p-4 pb-6">
                
                {/* Month Title */}
                <Text className="text-center font-bold text-journeyText text-lg mb-4 capitalize">
                   {monthLabel}
                </Text>

                {/* Days of week header */}
                <View className="flex-row justify-between mb-3 w-full px-2">
                   {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(w => (
                     <Text key={w} className="w-[12%] text-center text-[10px] font-bold text-journeyMuted uppercase">
                       {w}
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
                             dayData.isAllCompleted ? "bg-journeyAccent/10 border-journeyAccent/30" : "bg-[#F8FAFC]/50 border-journeyBorder/30",
                             isSelected && !dayData.isAllCompleted && "border-journeyAccent/60 bg-white"
                           )}
                         >
                           <View className="flex-1 w-full items-center justify-center">
                             <Text className={cn("text-[13px] leading-tight", dayData.isAllCompleted ? "text-journeyAccent font-bold" : isSelected ? "text-journeyText font-bold" : "text-journeyText font-medium")}>
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
                           <Text className={cn("text-[13px]", isCurrentMonth ? "text-journeyMuted/40 font-light" : "text-transparent")}>
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
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ paddingHorizontal: 32, gap: 12 }}
              snapToInterval={56} // width(44) + gap(12)
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
                      day.isAllCompleted ? "bg-journeyAccent/10 border-journeyAccent/20" : "bg-white border-journeyBorder/40",
                      isSelected && !day.isAllCompleted && "border-journeyAccent/30 bg-[#F0FDF4]/50"
                    )}
                  >
                    <Text className={cn(
                      "text-[10px] uppercase font-medium",
                      day.isAllCompleted ? "text-journeyAccent" : isSelected ? "text-journeyAccent" : "text-journeyMuted"
                    )}>
                      {day.displayWeekday}
                    </Text>

                    <View className="items-center justify-center">
                      <Text className={cn(
                        "text-[18px] font-light",
                        day.isAllCompleted ? "text-journeyAccent" : "text-journeyText"
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
          <Text className="text-journeyText text-xl font-medium tracking-tight">Günün Görevleri</Text>
          <Text className="text-xs text-journeyMuted font-light">
            {selectedDayData.progressNum} / {selectedDayData.total} {isLocked ? 'görev' : 'tamamlandı'}
          </Text>
        </View>

        {isLocked && (
           <View className="px-6 mb-4">
             <View className="bg-journeyBorder/40 px-4 py-3.5 rounded-[16px] flex-row items-center border border-journeyBorder">
               <Ionicons name="lock-closed-outline" size={16} color="#64748B" />
               <Text className="text-[#64748B] text-[13px] ml-2.5 font-normal flex-1 leading-snug">
                 Bu aşama henüz kilitlidir. Görevleri sadece önizleme olarak görüntüleyebilirsiniz, işaretleme yapılamaz.
               </Text>
             </View>
           </View>
        )}

        {/* Delicate Task List */}
        <View className="px-6 space-y-3">
          {currentGroup.tasks.length === 0 && (
             <Text className="text-center text-journeyMuted text-[13px] font-light mt-4">Görev tanımlanmamış.</Text>
          )}
          {currentGroup.tasks.map(task => {
            const isTaskDone = currentGroup.progress[selectedDayData.dateStr]?.[task.id] || false;
            
            return (
              <TouchableOpacity 
                key={task.id}
                activeOpacity={isLocked ? 1 : 0.7}
                onPress={() => {
                  if (!isLocked) {
                    toggleTask(currentGoal.id, currentGroup.id, selectedDayData.dateStr, task.id);
                  }
                }}
                className={cn(
                  "flex-row items-center p-4 rounded-[28px]",
                  isLocked ? "bg-white/40 border border-transparent" : "bg-white border border-journeyBorder/40 mb-3"
                )}
              >
                <View className={cn(
                  "w-6 h-6 rounded-full border mr-4 items-center justify-center",
                  isTaskDone ? "bg-journeyAccent border-journeyAccent" : isLocked ? "border-journeyMuted/30" : "border-journeyMuted/40 bg-transparent"
                )}>
                  {isTaskDone && <Ionicons name="checkmark" size={14} color="#FFF" />}
                  {isLocked && !isTaskDone && <Ionicons name="lock-closed" size={10} color="#CBD5E1" />}
                </View>
                <Text className={cn(
                  "text-[15px] flex-1",
                  isTaskDone ? "text-journeyMuted font-light line-through decoration-journeyBorder" : "text-journeyText font-normal"
                )}>
                  {task.name}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
