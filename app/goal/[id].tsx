import React, { useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text } from '@/components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProgressStore } from '@/store/useProgressStore';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { JourneyNode } from '@/components/JourneyNode';
import { useTranslation } from '@/lib/i18n';

export default function GoalMapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();

  const goals = useProgressStore(state => state.goals);
  const deleteGoal = useProgressStore(state => state.deleteGoal);
  const archiveGoal = useProgressStore(state => state.archiveGoal);
  const retryExpiredGroups = useProgressStore(state => state.retryExpiredGroups);

  const activeGoal = goals.find(g => g.id === id);

  useEffect(() => {
    if (activeGoal) retryExpiredGroups(activeGoal.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGoal?.id]);

  if (!activeGoal) {
    return (
      <View className="flex-1 items-center justify-center bg-journeyBg dark:bg-journeyDarkBg px-8">
        <Ionicons name="alert-circle-outline" size={48} color="#5F8B8A" />
        <Text className="text-journeyMuted text-sm text-center mt-4 mb-8">{t('journeyNotFound')}</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.back()}
          className="bg-journeyAccent px-8 py-4 rounded-[24px]"
        >
          <Text className="text-white font-semibold">{t('goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleDelete = () => {
    router.replace('/');
    setTimeout(() => deleteGoal(activeGoal.id), 100);
  };

  const confirmDelete = () => {
    Alert.alert(
      t('deleteJourneyTitle'),
      t('deleteJourneyDesc'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: handleDelete },
      ]
    );
  };

  const handleEdit = () => {
    router.push(`/create?editGoalId=${activeGoal.id}`);
  };

  const completedGroups = activeGoal.groups.filter(g => g.status === 'completed').length;
  const totalGroups = activeGoal.groups.length;
  const isFullyCompleted = completedGroups === totalGroups && totalGroups > 0;
  const isArchived = !!activeGoal.archived;

  const handleArchive = () => {
    Alert.alert(
      isArchived ? t('unarchiveGoal') : t('archiveGoalTitle'),
      isArchived ? '' : t('archiveGoalConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: isArchived ? t('unarchiveGoal') : t('archiveGoal'),
          onPress: () => {
            archiveGoal(activeGoal.id, !isArchived);
            if (!isArchived) router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-journeyBg dark:bg-journeyDarkBg">
      {/* Header */}
      <View className="px-6 pt-4 pb-2 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center -ml-2 mr-2"
        >
          <Ionicons name="chevron-back" size={24} color="#5F8B8A" />
        </TouchableOpacity>

        <View className="flex-1 flex-row items-center justify-between pr-1">
          <View className="flex-1 mr-3">
            <Text
              className="text-[22px] text-journeyText dark:text-journeyDarkText font-bold tracking-tight leading-[28px]"
              numberOfLines={2}
            >
              {activeGoal.name}
            </Text>
            <View className="flex-row items-center gap-2 mt-0.5">
              <Text className="text-journeyMuted text-[11px] font-medium uppercase tracking-[1.5px]">
                {t('goalMap')} · {completedGroups}/{totalGroups} {t('stage')}
              </Text>
              {isArchived && (
                <View style={{ backgroundColor: '#F59E0B20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#D97706', letterSpacing: 1 }}>{t('archivedBadge')}</Text>
                </View>
              )}
            </View>
          </View>

          <View className="flex-row gap-1">
            {(isFullyCompleted || isArchived) && (
              <TouchableOpacity
                onPress={handleArchive}
                className="w-9 h-9 items-center justify-center rounded-full bg-journeyCard dark:bg-journeyDarkCard border border-journeyBorder dark:border-journeyDarkBorder"
                activeOpacity={0.7}
              >
                <Ionicons name={isArchived ? "archive-outline" : "archive-outline"} size={16} color={isArchived ? "#F59E0B" : "#0D9488"} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleEdit}
              className="w-9 h-9 items-center justify-center rounded-full bg-journeyCard dark:bg-journeyDarkCard border border-journeyBorder dark:border-journeyDarkBorder"
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={17} color="#5F8B8A" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={confirmDelete}
              className="w-9 h-9 items-center justify-center rounded-full bg-[#FEF2F2] dark:bg-[#450a0a] border border-[#FECACA] dark:border-[#7f1d1d]"
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Journey Map */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 100 }}
      >
        {activeGoal.groups.map((group, index) => (
          <JourneyNode
            key={group.id}
            group={group}
            index={index}
            isLast={index === activeGoal.groups.length - 1}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
