import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableWithoutFeedback, Pressable, TouchableOpacity } from 'react-native';
import Animated, { FadeInRight, Layout } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Calendar, Plus, CheckCircle2, Circle, Flame, Star } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Fonts, Shadows } from '@/constants/theme';
import { ACTIVITY_CATEGORIES } from '@/constants/categories';
import { getWeekDates, toLocalDateString } from '@/lib/dates';
import { useJourneyStore } from '@/store/journeyStore';
import type { Activity } from '@/types/activity';
import type { JourneyItem } from '@/types/journey';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

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
        return getWeekDates(base);
    }, [selectedDate]);

    const weekStart = useMemo(() => toLocalDateString(weekDates[0]), [weekDates]);
    const weekEnd = useMemo(() => toLocalDateString(weekDates[6]), [weekDates]);

    useEffect(() => {
        if (!kidProfileId) return;
        fetchWeek(kidProfileId, weekStart, weekEnd);
    }, [kidProfileId, weekStart, weekEnd, fetchWeek]);

    const itemsByDate = useMemo(() => {
        const map: Record<string, JourneyItem[]> = {};
        for (const item of journeyItems) {
            if (!map[item.scheduled_date]) map[item.scheduled_date] = [];
            map[item.scheduled_date].push(item);
        }
        return map;
    }, [journeyItems]);

    const completionsByDate = useMemo(() => {
        const map: Record<string, number> = {};
        for (const c of completions) {
            map[c.completed_date] = (map[c.completed_date] ?? 0) + 1;
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

    const isDoneForItem = (item: JourneyItem) =>
        completions.some((c) => c.journey_item_id === item.id);

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

            <View style={styles.pillWrap}>
                <View style={styles.progressTrack} />
                {progressPct > 0 && (
                    <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
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
                                    setSelectedDate(ds);
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

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                    Planned for {selectedDate ? new Date(selectedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Today'}
                </Text>
                {isFetching && <Text style={styles.loadingText}>Syncing</Text>}
            </View>

            {selectedItems.length === 0 ? (
                <View style={styles.emptyRow}>
                    <Text style={styles.emptyRowText}>No activities planned for this day.</Text>
                    <Pressable
                        style={({ pressed }) => [styles.inlineAdd, pressed && styles.inlineAddPressed]}
                        onPress={() => setPickerOpen(true)}
                    >
                        <Plus size={12} color={Colors.textPrimary} />
                        <Text style={styles.inlineAddText}>Schedule one</Text>
                    </Pressable>
                </View>
            ) : (
                <View style={styles.list}>
                    {selectedItems.map((item) => {
                        const done = isDoneForItem(item);
                        const category = ACTIVITY_CATEGORIES.find((c) => c.id === item.category);
                        const Icon = category?.icon;
                        const index = selectedItems.indexOf(item);
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
                                        router.push(`/activity/${item.activity_id}` as any);
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
                                            toggleCompletionForJourneyItem(item);
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
            )}

            <Modal visible={pickerOpen} transparent animationType="fade">
                <TouchableWithoutFeedback onPress={() => setPickerOpen(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalCard}>
                                <Text style={styles.modalTitle}>Schedule Activity</Text>
                                <Text style={styles.modalSub}>
                                    {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Today'}
                                </Text>
                                <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                                    {filteredActivities.length === 0 ? (
                                        <View style={styles.modalEmpty}>
                                            <Text style={styles.modalEmptyText}>No recent activities yet.</Text>
                                        </View>
                                    ) : (
                                        filteredActivities.slice(0, 20).map((a) => {
                                            const category = ACTIVITY_CATEGORIES.find((c) => c.id === a.category);
                                            const Icon = category?.icon;
                                            return (
                                                <Pressable
                                                    key={a.id}
                                                    style={({ pressed }) => [styles.modalItem, pressed && styles.modalItemPressed]}
                                                    onPress={() => handleSchedule(a)}
                                                    android_ripple={{ color: Colors.border }}
                                                >
                                                    <View style={[styles.modalIcon, { backgroundColor: (category?.accent ?? Colors.primary) + '20' }]}>
                                                        {Icon && <Icon size={12} color={Colors.textPrimary} />}
                                                    </View>
                                                    <View style={styles.modalTextWrap}>
                                                        <Text style={styles.modalItemTitle} numberOfLines={1}>{a.topic}</Text>
                                                        <Text style={styles.modalItemMeta}>{category?.label}</Text>
                                                    </View>
                                                </Pressable>
                                            );
                                        })
                                    )}
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
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
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.textSecondary,
        fontSize: 10,
    },
    dayNum: {
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
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
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.white,
        fontSize: 9,
    },
    emptyDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: Colors.border,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: Colors.overlayBackground,
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    modalCard: {
        backgroundColor: Colors.white,
        borderRadius: Radius.xl,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.lg,
    },
    modalTitle: {
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        fontSize: FontSize.md,
        marginBottom: Spacing.xs,
    },
    modalSub: {
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        fontSize: FontSize.xs,
        marginBottom: Spacing.sm,
    },
    modalList: {
        maxHeight: 280,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    modalItemPressed: {
        backgroundColor: Colors.background,
    },
    addBtnPressed: {
        backgroundColor: Colors.primaryDark,
    },
    modalIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTextWrap: {
        flex: 1,
    },
    modalItemTitle: {
        fontFamily: Fonts.medium,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
        fontSize: FontSize.sm,
    },
    modalItemMeta: {
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        fontSize: FontSize.xs,
        marginTop: 2,
    },
    modalEmpty: {
        paddingVertical: Spacing.lg,
        alignItems: 'center',
    },
    modalEmptyText: {
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        fontSize: FontSize.xs,
    },
});
