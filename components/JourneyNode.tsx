import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Group } from '@/store/useProgressStore';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '@/components/ui/Card';

export function JourneyNode({ group, index, isLast }: { group: Group, index: number, isLast: boolean }) {
  const totalTasksPossible = group.durationInDays * group.tasks.length;
  let completedTasks = 0;
  
  Object.values(group.progress || {}).forEach(day => {
    Object.values(day).forEach(done => {
      if (done) completedTasks++;
    });
  });
  
  const pb = totalTasksPossible === 0 ? 0 : completedTasks / totalTasksPossible;

  const isLocked = group.status === 'locked';
  const isActive = group.status === 'active';
  const isCompleted = group.status === 'completed';

  return (
    <View className="flex-row items-stretch">
      {/* Left Vertical Track */}
      <View className="w-12 items-center mr-3 relative">
        {/* The Connection Line */}
        {!isLast && (
           <View className={cn(
             "absolute top-8 w-1 bottom-[-32px] rounded-full",
             isCompleted ? "bg-journeyAccent" : "bg-journeyBorder"
           )} />
        )}
        
        {/* The Node Icon */}
        <View className={cn(
          "w-10 h-10 rounded-full mt-3 items-center justify-center border-4 border-journeyBg z-10",
          isCompleted ? "bg-journeyAccent" : isActive ? "bg-white border border-journeyAccent shadow-sm" : "bg-white border border-journeyBorder"
        )}>
          {isCompleted ? (
            <Ionicons name="checkmark" size={16} color="#FFF" />
          ) : isActive ? (
             <Text className="text-journeyAccent text-xs font-bold">{index + 1}</Text>
          ) : (
             <Text className="text-journeyMuted text-xs font-light">{index + 1}</Text>
          )}
        </View>
      </View>

      {/* Main Content Card */}
      <TouchableOpacity
        activeOpacity={0.6}
        onPress={() => router.push(`/group/${group.id}`)}
        className={cn(
          "flex-1 px-6 py-5 mb-5 rounded-[32px] relative overflow-hidden",
          isLocked ? "bg-white/40 border border-transparent opacity-60" : "bg-white border-journeyBorder/40 border",
          isActive && "border-journeyAccent/30 bg-[#F0FDF4]/30"
        )}
      >
        <View className="flex-row items-center justify-between mb-1">
          <Text className={cn("text-[17px] tracking-tight", isLocked ? "text-journeyMuted font-normal" : "text-journeyText font-semibold")}>
            {group.name}
          </Text>
          {isLocked && <Ionicons name="lock-closed" size={14} color="#CBD5E1" />}
        </View>
        <Text className="text-[11px] text-journeyMuted tracking-widest uppercase font-medium mb-3">
          {group.durationInDays} Gün / {group.tasks.length} Görev
        </Text>

        {!isLocked && (
          <View className="mt-1">
            <View className="flex-row justify-between items-center mb-1.5">
               <Text className="text-[10px] text-journeyText font-medium">İlerleme</Text>
               <Text className={cn("text-[10px] font-bold", isCompleted ? "text-journeyAccent" : "text-journeyText")}>
                 {Math.round(pb * 100)}%
               </Text>
            </View>
            <View className="w-full h-1.5 bg-journeyBorder rounded-full overflow-hidden">
              <View className="h-full bg-journeyAccent rounded-full" style={{ width: `${pb * 100}%` }} />
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
