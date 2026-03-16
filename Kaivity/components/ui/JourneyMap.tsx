import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Calendar, Plus, Flame, Star } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Fonts, Shadows } from '@/constants/theme';
import { toLocalDateString } from '@/lib/dates';
import { useJourneyStore } from '@/store/journeyStore';
import type { Activity } from '@/types/activity';
import { WeekPillRow } from './JourneyMap/WeekPillRow';
import { PlannedActivitiesList } from './JourneyMap/PlannedActivitiesList';
import { ActivityPickerModal } from './JourneyMap/ActivityPickerModal';

interface JourneyMapProps {
    kidProfileId: string | null;
    activities: Activity[];
    activityStreak?: number | null;
}

export function JourneyMap({ kidProfileId, activities, activityStreak }: JourneyMapProps) {
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState<string | null>(toLocalDateString(new Date()));
    const [pickerOpen, setPickerOpen] = useState(false);

    const fetchWeek = useJourneyStore((state) => state.fetchWeek);
    const journeyItems = useJourneyStore((state) => state.journeyItems);
    const completions = useJourneyStore((state) => state.completions);
    const isFetching = useJourneyStore((state) => state.isFetching);
    const isSaving = useJourneyStore((state) => state.isSaving);
    const scheduleActivity = useJourneyStore((state) => state.scheduleActivity);
    const toggleCompletionForJourneyItem = useJourneyStore((state) => state.toggleCompletionForJourneyItem);

    const weekDates = useMemo(() => {
        const base = selectedDate ? new Date(selectedDate) : new Date();
        const dayOfWeek = base.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(base);
        monday.setDate(base.getDate() + mondayOffset);
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d;
        });
    }, [selectedDate]);

    const weekStart = useMemo(() => toLocalDateString(weekDates[0]), [weekDates]);
    const weekEnd = useMemo(() => toLocalDateString(weekDates[6]), [weekDates]);

    useEffect(() => {
        if (!kidProfileId) return;
        fetchWeek(kidProfileId, weekStart, weekEnd);
    }, [kidProfileId, weekStart, weekEnd, fetchWeek]);

    const itemsByDate = useMemo(() => {
        const map: Record<string, any[]> = {};
        for (const item of journeyItems) {
            if (item && item.scheduled_date) {
                if (!map[item.scheduled_date]) map[item.scheduled_date] = [];
                map[item.scheduled_date].push(item);
            }
        }
        return map;
    }, [journeyItems]);

    const completionsByDate = useMemo(() => {
        const map: Record<string, number> = {};
        for (const c of completions) {
            if (c && c.completed_date) {
                map[c.completed_date] = (map[c.completed_date] ?? 0) + 1;
            }
        }
        return map;
    }, [completions]);

    const completedDaysThisWeek = useMemo(
        () => weekDates.filter((d) => !!completionsByDate[toLocalDateString(d)]).length,
        [weekDates, completionsByDate]
    );
    const progressPct = useMemo(() => Math.round((completedDaysThisWeek / 7) * 100), [completedDaysThisWeek]);

    const streakValue = activityStreak ?? 0;
    const selectedItems = selectedDate ? (itemsByDate[selectedDate] ?? []) : [];

    const filteredActivities = useMemo(() => {
        if (!kidProfileId) return [];
        return activities.filter((a) => a.kid_profile_id === kidProfileId);
    }, [activities, kidProfileId]);

    const handleSchedule = async (activity: Activity) => {
        if (!kidProfileId) return;
        const targetDate = selectedDate ?? toLocalDateString(new Date());
        await scheduleActivity({
            kid_profile_id: kidProfileId,
            activity_id: activity.id,
            title: activity.topic,
            category: activity.category,
            scheduled_date: targetDate,
        });
        setPickerOpen(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    if (!kidProfileId) {
        return (
            <View style={styles.card}>
                <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                        <Calendar size={18} color={Colors.primary} />
                        <Text style={styles.headerTitle}>Journey Map</Text>
                    </View>
                </View>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>Select a kid to start planning</Text>
                    <Text style={styles.emptySub}>Your weekly activity map will appear here.</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                    <Calendar size={18} color={Colors.primary} />
                    <Text style={styles.headerTitle}>Journey Map</Text>
                </View>
                <View style={styles.headerRight}>
                    {streakValue > 0 && (
                        <View style={styles.streakBadge}>
                            <Flame size={12} color={Colors.primary} />
                            <Text style={styles.badgeText}>{streakValue} day streak</Text>
                        </View>
                    )}
                    <View style={styles.weekBadge}>
                        <Star size={12} color={Colors.secondary} />
                        <Text style={[styles.badgeText, { color: Colors.secondary }]}>
                            {completedDaysThisWeek}/7 days
                        </Text>
                    </View>
                </View>
                <Pressable
                    onPress={() => setPickerOpen(true)}
                    style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
                    disabled={isSaving}
                >
                    <Plus size={14} color={Colors.white} />
                </Pressable>
            </View>

            <WeekPillRow
                weekDates={weekDates}
                selectedDate={selectedDate}
                itemsByDate={itemsByDate}
                completionsByDate={completionsByDate}
                onSelectDate={setSelectedDate}
                progressPct={progressPct}
            />

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                    Planned for {selectedDate ? new Date(selectedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Today'}
                </Text>
                {isFetching && <Text style={styles.loadingText}>Syncing</Text>}
            </View>

            <PlannedActivitiesList
                selectedItems={selectedItems}
                completions={completions}
                onToggleCompletion={toggleCompletionForJourneyItem}
                onOpenActivity={(id: string) => router.push(`/activity/${id}` as any)}
                onScheduleNew={() => setPickerOpen(true)}
            />

            <ActivityPickerModal
                visible={pickerOpen}
                onClose={() => setPickerOpen(false)}
                selectedDate={selectedDate}
                filteredActivities={filteredActivities}
                onSchedule={handleSchedule}
                router={router}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: Spacing.xl,
        backgroundColor: Colors.white,
        borderRadius: Radius['2xl'],
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        ...Shadows.md,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        flex: 1,
    },
    headerTitle: {
        fontSize: FontSize.md,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        letterSpacing: 0.3,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginRight: Spacing.sm,
    },
    addBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        ...Shadows.sm,
    },
    addBtnPressed: {
        backgroundColor: Colors.primaryDark,
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: Colors.categories.art.pastel,
        paddingHorizontal: Spacing.md,
        paddingVertical: 3,
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    weekBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: Spacing.md,
        paddingVertical: 3,
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: Colors.secondary,
    },
    badgeText: {
        fontSize: FontSize.xs,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.primary,
        letterSpacing: 0.2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: Spacing.xs,
        marginBottom: Spacing.xs,
    },
    sectionTitle: {
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        fontSize: FontSize.sm,
    },
    loadingText: {
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        fontSize: FontSize.xs,
    },
    emptyState: {
        paddingVertical: Spacing.lg,
        alignItems: 'center',
        gap: Spacing.xs,
    },
    emptyTitle: {
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        fontSize: FontSize.sm,
    },
    emptySub: {
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        fontSize: FontSize.xs,
    },
});
