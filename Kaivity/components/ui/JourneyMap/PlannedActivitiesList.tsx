import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import Animated, { FadeInRight, Layout } from 'react-native-reanimated';
import { Plus, CheckCircle2, Circle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radius, FontSize, FontWeight, Fonts } from '@/constants/theme';
import { ACTIVITY_CATEGORIES } from '@/constants/categories';
import type { JourneyItem, ActivityCompletion } from '@/types/journey';

interface PlannedActivitiesListProps {
  selectedItems: JourneyItem[];
  completions: ActivityCompletion[];
  onToggleCompletion: (item: JourneyItem) => void;
  onOpenActivity: (activityId: string) => void;
  onScheduleNew: () => void;
}

export function PlannedActivitiesList({
  selectedItems,
  completions,
  onToggleCompletion,
  onOpenActivity,
  onScheduleNew,
}: PlannedActivitiesListProps) {
  const isDoneForItem = (item: any) =>
    item && item.id && Array.isArray(completions) && completions.some((c: any) => c && c.journey_item_id === item.id);

  if (selectedItems.length === 0) {
    return (
      <View style={styles.emptyRow}>
        <Text style={styles.emptyRowText}>No activities planned for this day.</Text>
        <Pressable
          style={({ pressed }) => [styles.inlineAdd, pressed && styles.inlineAddPressed]}
          onPress={onScheduleNew}
        >
          <Plus size={12} color={Colors.textPrimary} />
          <Text style={styles.inlineAddText}>Schedule one</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {selectedItems.map((item: any, index: number) => {
        const done = isDoneForItem(item);
        const category = ACTIVITY_CATEGORIES.find((cIdx: any) => cIdx.id === item.category);
        const Icon = category?.icon;
        
        return (
          <Animated.View
            entering={FadeInRight.delay(index * 40).duration(300)}
            layout={Layout.springify()}
            key={item.id}
          >
            <TouchableOpacity
              style={styles.listItem}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onOpenActivity(item.activity_id);
              }}
            >
              <View style={[styles.categoryPill, { backgroundColor: (category?.accent ?? Colors.primary) + '20' }]}>
                {Icon && <Icon size={12} color={Colors.textPrimary} />}
                <Text style={styles.categoryText}>{category?.label.split(' ')[0]}</Text>
              </View>
              <Text style={[styles.itemTitle, done && styles.itemTitleDone]} numberOfLines={1}>
                {item.title}
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  onToggleCompletion(item);
                }}
                style={({ pressed }) => [styles.doneBtn, pressed && styles.doneBtnPressed]}
              >
                {done ? (
                  <CheckCircle2 size={18} color={Colors.primary} />
                ) : (
                  <Circle size={18} color={Colors.textTertiary} />
                )}
              </Pressable>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyRow: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  emptyRowText: {
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  inlineAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  inlineAddPressed: {
    backgroundColor: Colors.primaryLight,
  },
  inlineAddText: {
    fontFamily: Fonts.bold,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    fontSize: FontSize.xs,
  },
  list: {
    gap: Spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.shadowColor,
  },
  categoryText: {
    fontFamily: Fonts.bold,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    fontSize: FontSize.xs,
    letterSpacing: 0.2,
  },
  itemTitle: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
  },
  itemTitleDone: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  doneBtn: {
    padding: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  doneBtnPressed: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.secondary,
  },
});
