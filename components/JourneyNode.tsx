import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Group } from '@/store/useProgressStore';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '@/components/ui/Card';
import { useTranslation } from '@/lib/i18n';

export function JourneyNode({ group, index, isLast }: { group: Group; index: number; isLast: boolean }) {
  const { t } = useTranslation();
  const totalTasksPossible = group.durationInDays * group.tasks.length;
  let completedTasks = 0;

  Object.values(group.progress || {}).forEach(day => {
    Object.values(day).forEach(done => { if (done) completedTasks++; });
  });

  const pb = totalTasksPossible === 0 ? 0 : completedTasks / totalTasksPossible;
  const perc = Math.round(pb * 100);

  const isLocked = group.status === 'locked';
  const isActive = group.status === 'active';
  const isCompleted = group.status === 'completed';

  const nodeColor = isCompleted ? '#059669' : isActive ? '#0D9488' : '#B2F0E8';
  const barColor = isCompleted ? '#059669' : '#0D9488';

  return (
    <View className="flex-row items-stretch">
      {/* Left Vertical Track */}
      <View className="w-12 items-center mr-3 relative">
        {!isLast && (
          <View
            className="absolute top-8 w-[3px] bottom-[-28px] rounded-full"
            style={{ backgroundColor: isCompleted ? '#059669' : '#B2F0E8' }}
          />
        )}

        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            marginTop: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isCompleted ? '#059669' : '#FFFFFF',
            borderWidth: isCompleted ? 0 : 2,
            borderColor: nodeColor,
            zIndex: 10,
          }}
        >
          {isCompleted ? (
            <Ionicons name="checkmark" size={18} color="#FFF" />
          ) : isActive ? (
            <Text style={{ color: '#0D9488', fontWeight: '800', fontSize: 13 }}>{index + 1}</Text>
          ) : (
            <Ionicons name="lock-closed" size={13} color="#B2F0E8" />
          )}
        </View>
      </View>

      {/* Main Content Card */}
      <TouchableOpacity
        activeOpacity={0.65}
        onPress={() => router.push(`/group/${group.id}`)}
        className={cn(
          'flex-1 px-5 py-4 mb-5 rounded-[28px] border',
          isLocked
            ? 'bg-journeyCard dark:bg-journeyDarkCard border-journeyBorder dark:border-journeyDarkBorder opacity-50'
            : isCompleted
            ? 'bg-journeyCard dark:bg-journeyDarkCard border-journeySuccess/30'
            : 'bg-journeyCard dark:bg-journeyDarkCard border-journeyBorder dark:border-journeyDarkBorder',
          isActive && 'border-journeyAccent/40'
        )}
      >
        {/* Status badge */}
        {!isLocked && (
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 99,
                  backgroundColor: isCompleted ? '#05996918' : '#0D948818',
                  alignSelf: 'flex-start',
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    color: isCompleted ? '#059669' : '#0D9488',
                  }}
                >
                  {isCompleted ? t('statusCompleted') : t('statusActive')}
                </Text>
              </View>
              {!!group.retryCount && group.retryCount > 0 && (
                <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99, backgroundColor: '#F59E0B18' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: '#D97706' }}>
                    {t('retryAttempt')} #{group.retryCount + 1}
                  </Text>
                </View>
              )}
            </View>
            {!isLocked && (
              <Text style={{ fontSize: 11, color: '#5F8B8A', fontWeight: '600' }}>
                {perc}%
              </Text>
            )}
          </View>
        )}

        <Text
          className={cn(
            'text-[17px] tracking-tight mb-1',
            isLocked
              ? 'text-journeyMuted font-normal'
              : 'text-journeyText dark:text-journeyDarkText font-semibold'
          )}
        >
          {group.name}
        </Text>

        <Text className="text-[11px] text-journeyMuted tracking-wide font-medium mb-3">
          {group.durationInDays} {t('days')} · {group.tasks.length} {t('task')}
        </Text>

        {!isLocked && (
          <View style={{ width: '100%', height: 5, backgroundColor: '#B2F0E8', borderRadius: 99, overflow: 'hidden' }}>
            <View style={{ width: `${pb * 100}%`, height: '100%', backgroundColor: barColor, borderRadius: 99 }} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
