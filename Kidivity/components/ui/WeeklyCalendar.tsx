import React, { useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { Flame, Star, CheckCircle2, Zap } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '@/constants/theme';
import type { Activity } from '@/types/activity';

interface WeeklyCalendarProps {
    activities: Activity[];
    selectedDate: string | null;
    onSelectDate: (date: string | null) => void;
}

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Category accent colors + vibrant day fill colors for "completed" days
const CATEGORY_COLORS: Record<string, string> = {
    puzzles: '#9B72DA',
    tracing: '#E8757A',
    science: '#31A87A',
    art: '#D4920A',
    math: '#0EAAD4',
    reading: '#D46300',
};

// Soft card backgrounds per category when a day has activities from that category
const CATEGORY_SOFT: Record<string, string> = {
    puzzles: '#EDE7FF',
    tracing: '#FFE0E2',
    science: '#D6F5E9',
    art: '#FFF3CD',
    math: '#D9F3FB',
    reading: '#FFE8D0',
};

function toLocalDateStr(date: Date): string {
    return (
        date.getFullYear() +
        '-' +
        String(date.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(date.getDate()).padStart(2, '0')
    );
}

function getWeekDates(): Date[] {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sun
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
    });
}

// Animated day pill sub-component
function DayPill({
    date,
    letter,
    isToday,
    isSelected,
    activityCount,
    dominantColor,
    softColor,
    onPress,
}: {
    date: Date;
    letter: string;
    isToday: boolean;
    isSelected: boolean;
    activityCount: number;
    dominantColor: string | null;
    softColor: string | null;
    onPress: () => void;
}) {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
        Animated.spring(scale, {
            toValue: 0.88,
            useNativeDriver: true,
            tension: 300,
            friction: 10,
        }).start();
    }, [scale]);

    const handlePressOut = useCallback(() => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 200,
            friction: 7,
        }).start();
    }, [scale]);

    const hasActivity = activityCount > 0;

    // Determine background
    let pillBg: string = Colors.pastelPurple;
    if (isSelected) pillBg = Colors.primaryPurple;
    else if (isToday) pillBg = Colors.primary;
    else if (hasActivity && softColor) pillBg = softColor;

    const isActiveState = isToday || isSelected;

    return (
        <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <Animated.View
                style={[
                    styles.dayPill,
                    { backgroundColor: pillBg, transform: [{ scale }] },
                    hasActivity && !isActiveState && styles.dayPillHasActivity,
                    isActiveState && styles.dayPillActive,
                ]}
            >
                {/* Top: day letter */}
                <Text style={[styles.dayLetter, isActiveState && styles.textWhite]}>
                    {letter}
                </Text>

                {/* Middle: date number */}
                <Text style={[styles.dayNum, isActiveState && styles.textWhite]}>
                    {date.getDate()}
                </Text>

                {/* Bottom: indicator zone */}
                {hasActivity ? (
                    isActiveState ? (
                        // On active/today: show white check
                        <CheckCircle2 size={14} color={Colors.white} strokeWidth={2.5} />
                    ) : (
                        // On regular completed day: show colored count badge
                        <View style={[styles.countBadge, { backgroundColor: dominantColor ?? Colors.primary }]}>
                            <Text style={styles.countBadgeText}>{activityCount}</Text>
                        </View>
                    )
                ) : (
                    <View style={styles.emptyDot} />
                )}
            </Animated.View>
        </Pressable>
    );
}

export function WeeklyCalendar({ activities, selectedDate, onSelectDate }: WeeklyCalendarProps) {
    const weekDates = useMemo(() => getWeekDates(), []);
    const todayStr = useMemo(() => toLocalDateStr(new Date()), []);

    // Build per-day stats
    const dayStats = useMemo(() => {
        const map: Record<string, { count: number; categories: string[] }> = {};
        for (const a of activities) {
            const ds = toLocalDateStr(new Date(a.created_at));
            if (!map[ds]) map[ds] = { count: 0, categories: [] };
            map[ds].count++;
            if (!map[ds].categories.includes(a.category)) {
                map[ds].categories.push(a.category);
            }
        }
        return map;
    }, [activities]);

    // Week summary
    const activeDaysThisWeek = useMemo(
        () => weekDates.filter((d) => !!dayStats[toLocalDateStr(d)]).length,
        [weekDates, dayStats]
    );

    // Streak from today backwards
    const streak = useMemo(() => {
        let s = 0;
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            if (dayStats[toLocalDateStr(d)]) s++;
            else if (i > 0) break; // allow today to be empty only if i === 0
        }
        return s;
    }, [dayStats]);

    return (
        <View style={styles.card}>
            {/* Header row */}
            <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>This Week</Text>
                <View style={styles.headerRight}>
                    {streak > 0 && (
                        <View style={styles.streakBadge}>
                            <Flame size={12} color={Colors.primary} />
                            <Text style={styles.streakText}>{streak} streak</Text>
                        </View>
                    )}
                    <View style={styles.xpBadge}>
                        <Zap size={12} color={Colors.primaryPurple} />
                        <Text style={styles.xpText}>{activeDaysThisWeek}/7 days</Text>
                    </View>
                </View>
            </View>

            {/* Day pills */}
            <View style={styles.pillRow}>
                {weekDates.map((date, i) => {
                    const ds = toLocalDateStr(date);
                    const stats = dayStats[ds];
                    const isToday = ds === todayStr;
                    const isSelected = ds === selectedDate;
                    const dominantCat = stats?.categories[0] ?? null;
                    const dominantColor = dominantCat ? CATEGORY_COLORS[dominantCat] : null;
                    const softColor = dominantCat ? CATEGORY_SOFT[dominantCat] : null;

                    return (
                        <DayPill
                            key={ds}
                            date={date}
                            letter={DAY_LETTERS[i]}
                            isToday={isToday}
                            isSelected={isSelected}
                            activityCount={stats?.count ?? 0}
                            dominantColor={dominantColor}
                            softColor={softColor}
                            onPress={() => onSelectDate(isSelected ? null : ds)}
                        />
                    );
                })}
            </View>

            {/* Week progress bar */}
            <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${(activeDaysThisWeek / 7) * 100}%` },
                        ]}
                    />
                </View>
                <View style={styles.starsRow}>
                    {Array.from({ length: 7 }, (_, i) => {
                        const ds = toLocalDateStr(weekDates[i]);
                        const done = !!dayStats[ds];
                        return (
                            <Star
                                key={i}
                                size={10}
                                color={done ? Colors.primary : Colors.border}
                                fill={done ? Colors.primary : 'transparent'}
                            />
                        );
                    })}
                </View>
            </View>

            {activeDaysThisWeek === 7 && (
                <View style={styles.perfectWeekBanner}>
                    <Star size={13} color={Colors.primary} fill={Colors.primary} />
                    <Text style={styles.perfectWeekText}>Perfect Week!</Text>
                    <Star size={13} color={Colors.primary} fill={Colors.primary} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.lg,
        backgroundColor: Colors.white,
        borderRadius: Radius.xl,
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.lg,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.9)',
        ...Shadows.md,
    },

    // Header
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    headerTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        letterSpacing: -0.3,
    },
    headerRight: {
        flexDirection: 'row',
        gap: Spacing.xs,
        alignItems: 'center',
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: Colors.pastelYellow,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: Radius.full,
    },
    streakText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: Colors.primary,
    },
    xpBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: Colors.pastelPurple,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: Radius.full,
    },
    xpText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: Colors.primaryPurple,
    },

    // Pills
    pillRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: Spacing.xs,
    },
    dayPill: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.sm,
        borderRadius: Radius.md,
        backgroundColor: Colors.pastelPurple,
        gap: 3,
        minWidth: 36,
    },
    dayPillHasActivity: {
        borderWidth: 2,
        borderColor: 'transparent',
    },
    dayPillActive: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    dayLetter: {
        fontSize: 10,
        fontWeight: FontWeight.bold,
        color: Colors.textSecondary,
        letterSpacing: 0.3,
    },
    dayNum: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
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
    },
    countBadgeText: {
        fontSize: 10,
        fontWeight: FontWeight.bold,
        color: Colors.white,
    },
    emptyDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: Colors.border,
    },

    // Progress bar
    progressRow: {
        marginTop: Spacing.md,
        gap: Spacing.xs,
    },
    progressTrack: {
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.border,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
        backgroundColor: Colors.primary,
    },
    starsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 2,
        marginTop: 2,
    },

    // Perfect week
    perfectWeekBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.md,
        backgroundColor: Colors.pastelYellow,
        borderRadius: Radius.full,
        paddingVertical: 6,
    },
    perfectWeekText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: Colors.primary,
        letterSpacing: 0.3,
    },
});
