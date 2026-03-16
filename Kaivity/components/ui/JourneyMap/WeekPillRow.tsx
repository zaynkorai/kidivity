import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';
import { ACTIVITY_CATEGORIES } from '@/constants/categories';
import { toLocalDateString } from '@/lib/dates';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface WeekPillRowProps {
  weekDates: Date[];
  selectedDate: string | null;
  itemsByDate: Record<string, any[]>;
  completionsByDate: Record<string, number>;
  onSelectDate: (ds: string) => void;
  progressPct: number;
}

export function WeekPillRow({
  weekDates,
  selectedDate,
  itemsByDate,
  completionsByDate,
  onSelectDate,
  progressPct,
}: WeekPillRowProps) {
  return (
    <View style={styles.pillWrap}>
      <View style={styles.progressTrack} />
      {progressPct > 0 && (
        <View style={[styles.progressFill, { width: `${progressPct}%` } ]} />
      )}
      <View style={styles.pillRow}>
        {weekDates.map((date, i) => {
          const ds = toLocalDateString(date);
          const isSelected = ds === selectedDate;
          const scheduledCount = itemsByDate[ds]?.length ?? 0;
          const doneCount = completionsByDate[ds] ?? 0;
          const isDoneDay = doneCount > 0 && doneCount >= scheduledCount && scheduledCount > 0;
          const category = itemsByDate[ds]?.[0]?.category;
          const accent = ACTIVITY_CATEGORIES.find((c) => c.id === category)?.accent ?? Colors.primary;

          return (
            <Pressable
              key={ds}
              onPress={() => {
                Haptics.selectionAsync();
                onSelectDate(ds);
              }}
              style={({ pressed }) => [
                styles.dayPill,
                isSelected && styles.dayPillSelected,
                pressed && styles.dayPillPressed,
                isSelected && pressed && styles.dayPillSelectedPressed,
              ]}
            >
              <Text style={[styles.dayLetter, isSelected && styles.textWhite]}>{DAY_LETTERS[i]}</Text>
              <Text style={[styles.dayNum, isSelected && styles.textWhite]}>{date.getDate()}</Text>
              {scheduledCount > 0 ? (
                isDoneDay ? (
                  <CheckCircle2 size={12} color={isSelected ? Colors.white : Colors.primary} />
                ) : (
                  <View style={[styles.countBadge, { backgroundColor: accent }]}>
                    <Text style={styles.countBadgeText}>{scheduledCount}</Text>
                  </View>
                )
              ) : (
                <View style={styles.emptyDot} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pillWrap: {
    position: 'relative',
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 26,
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.categories.math.pastel,
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 26,
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  pillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
    width: 40,
    gap: 2,
  },
  dayPillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
    ...Shadows.sm,
  },
  dayPillPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  dayPillSelectedPressed: {
    backgroundColor: Colors.primaryDark,
  },
  dayLetter: {
    fontWeight: 'bold',
    color: Colors.textSecondary,
    fontSize: 10,
  },
  dayNum: {
    fontWeight: 'bold',
    color: Colors.textPrimary,
    fontSize: 12,
  },
  textWhite: {
    color: Colors.white,
  },
  countBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.surfaceWash,
  },
  countBadgeText: {
    fontWeight: 'bold',
    color: Colors.white,
    fontSize: 9,
  },
  emptyDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
});
