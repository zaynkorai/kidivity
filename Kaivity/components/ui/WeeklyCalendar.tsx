import React, { useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, useWindowDimensions } from 'react-native';
import { Flame, Star, CheckCircle2, Zap, FileText } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Fonts, Shadows } from '@/constants/theme';
import type { Activity } from '@/types/activity';

interface WeeklyCalendarProps {
    activities: Activity[];
    selectedDate: string | null;
    onSelectDate: (date: string | null) => void;
}

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const CATEGORY_COLORS: Record<string, string> = {
    puzzles: '#9B72DA',
    tracing: '#E8757A',
    science: '#31A87A',
    art: '#D4920A',
    math: '#0EAAD4',
    reading: '#D46300',
};

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
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
    });
}

// ─── DayPill ─────────────────────────────────────────────────────────────────
function DayPill({
    date,
    letter,
    isToday,
    isSelected,
    activityCount,
    dominantColor,
    softColor,
    pillSize,
    onPress,
}: {
    date: Date;
    letter: string;
    isToday: boolean;
    isSelected: boolean;
    activityCount: number;
    dominantColor: string | null;
    softColor: string | null;
    pillSize: number;  // computed width
    onPress: () => void;
}) {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
        Animated.spring(scale, { toValue: 0.87, useNativeDriver: true, tension: 300, friction: 10 }).start();
    }, [scale]);

    const handlePressOut = useCallback(() => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 7 }).start();
    }, [scale]);

    const hasActivity = activityCount > 0;

    let pillBg: string = Colors.pastelPurple;
    if (isSelected) pillBg = Colors.primaryPurple;
    else if (isToday) pillBg = Colors.primary;
    else if (hasActivity && softColor) pillBg = softColor;

    const isActiveState = isToday || isSelected;

    // Proportional font + badge sizes
    const letterFontSize = Math.max(8, pillSize * 0.22);
    const numFontSize    = Math.max(10, pillSize * 0.28);
    const badgeFontSize  = Math.max(8,  pillSize * 0.20);
    const badgeSize      = Math.max(14, pillSize * 0.38);
    const iconSize       = Math.max(11, pillSize * 0.30);

    return (
        <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <Animated.View
                style={[
                    styles.dayPill,
                    {
                        backgroundColor: pillBg,
                        width: pillSize,
                        transform: [{ scale }],
                        ...(isActiveState && {
                            shadowColor: Colors.primary,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.4,
                            shadowRadius: 8,
                            elevation: 6,
                        }),
                    },
                ]}
            >
                <Text style={[styles.dayLetter, { fontSize: letterFontSize }, isActiveState && styles.textWhite]}>
                    {letter}
                </Text>
                <Text style={[styles.dayNum, { fontSize: numFontSize }, isActiveState && styles.textWhite]}>
                    {date.getDate()}
                </Text>

                {hasActivity ? (
                    isActiveState ? (
                        <CheckCircle2 size={iconSize} color={Colors.white} strokeWidth={2.5} />
                    ) : (
                        <View style={[styles.countBadge, {
                            backgroundColor: dominantColor ?? Colors.primary,
                            minWidth: badgeSize,
                            height: badgeSize,
                            borderRadius: badgeSize / 2,
                        }]}>
                            <Text style={[styles.countBadgeText, { fontSize: badgeFontSize }]}>
                                {activityCount}
                            </Text>
                        </View>
                    )
                ) : (
                    <View style={styles.emptyDot} />
                )}
            </Animated.View>
        </Pressable>
    );
}

// ─── WeeklyCalendar ───────────────────────────────────────────────────────────
export function WeeklyCalendar({ activities, selectedDate, onSelectDate }: WeeklyCalendarProps) {
    const { width: screenWidth } = useWindowDimensions();

    // Card metrics (mirrors activities.tsx paddingHorizontal: Spacing.xl = 20 each side)
    // Card outer margin: Spacing.xl * 2 = 40, card padding: Spacing.md * 2 = 24
    const cardInnerWidth = screenWidth - Spacing.xl * 2 - Spacing.md * 2;
    const NUM_DAYS = 7;
    const GAP = Math.max(3, Math.floor(cardInnerWidth * 0.012)); // ~1.2% of inner width
    const pillSize = Math.floor((cardInnerWidth - GAP * (NUM_DAYS - 1)) / NUM_DAYS);

    const weekDates = useMemo(() => getWeekDates(), []);
    const todayStr  = useMemo(() => toLocalDateStr(new Date()), []);

    const dayStats = useMemo(() => {
        const map: Record<string, { count: number; categories: string[] }> = {};
        for (const a of activities) {
            const ds = toLocalDateStr(new Date(a.created_at));
            if (!map[ds]) map[ds] = { count: 0, categories: [] };
            map[ds].count++;
            if (!map[ds].categories.includes(a.category)) map[ds].categories.push(a.category);
        }
        return map;
    }, [activities]);

    const activeDaysThisWeek = useMemo(
        () => weekDates.filter((d) => !!dayStats[toLocalDateStr(d)]).length,
        [weekDates, dayStats]
    );

    const streak = useMemo(() => {
        let s = 0;
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            if (dayStats[toLocalDateStr(d)]) s++;
            else if (i > 0) break;
        }
        return s;
    }, [dayStats]);

    // Compact mode for narrow screens (< 360px)
    const compact = screenWidth < 360;

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.headerRow}>
                <Text style={[styles.headerTitle, compact && styles.headerTitleSm]}>This Week</Text>
                <View style={styles.headerRight}>
                    {streak > 0 && (
                        <View style={styles.streakBadge}>
                            <Flame size={compact ? 10 : 12} color={Colors.primary} />
                            <Text style={[styles.badgeText, { color: Colors.primary }]}>
                                {streak}{compact ? '' : ' streak'}
                            </Text>
                        </View>
                    )}
                    <View style={styles.xpBadge}>
                        <Zap size={compact ? 10 : 12} color={Colors.primaryPurple} />
                        <Text style={[styles.badgeText, { color: Colors.primaryPurple }]}>
                            {activeDaysThisWeek}/7{compact ? '' : ' days'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Day pills — fixed computed widths, no flex */}
            <View style={[styles.pillRow, { gap: GAP }]}>
                {weekDates.map((date, i) => {
                    const ds = toLocalDateStr(date);
                    const stats = dayStats[ds];
                    const dominantCat = stats?.categories[0] ?? null;
                    return (
                        <DayPill
                            key={ds}
                            date={date}
                            letter={DAY_LETTERS[i]}
                            isToday={ds === todayStr}
                            isSelected={ds === selectedDate}
                            activityCount={stats?.count ?? 0}
                            dominantColor={dominantCat ? CATEGORY_COLORS[dominantCat] : null}
                            softColor={dominantCat ? CATEGORY_SOFT[dominantCat] : null}
                            pillSize={pillSize}
                            onPress={() => onSelectDate(ds === selectedDate ? null : ds)}
                        />
                    );
                })}
            </View>

            {/* Progress bar */}
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
                            <Star key={i} size={9} color={done ? Colors.primary : Colors.border} fill={done ? Colors.primary : 'transparent'} />
                        );
                    })}
                </View>
            </View>

            {activeDaysThisWeek === 7 && (
                <View style={styles.perfectWeekBanner}>
                    <Star size={11} color={Colors.primary} fill={Colors.primary} />
                    <Text style={styles.perfectWeekText}>Perfect Week!</Text>
                    <Star size={11} color={Colors.primary} fill={Colors.primary} />
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
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.9)',
        ...Shadows.md,
    },

    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    headerTitle: {
        fontSize: FontSize.md,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        letterSpacing: -0.3,
    },
    headerTitleSm: {
        fontSize: FontSize.sm,
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
    xpBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: Colors.pastelPurple,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: Radius.full,
    },
    badgeText: {
        fontSize: FontSize.xs,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
    },

    pillRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    dayPill: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.sm,
        borderRadius: Radius.md,
        backgroundColor: Colors.pastelPurple,
        gap: 2,
    },
    dayLetter: {
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.textSecondary,
        letterSpacing: 0.3,
    },
    dayNum: {
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    textWhite: {
        color: Colors.white,
    },
    countBadge: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    countBadgeText: {
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.white,
    },
    emptyDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: Colors.border,
    },

    progressRow: {
        marginTop: Spacing.sm,
        gap: 3,
    },
    progressTrack: {
        height: 5,
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
        paddingHorizontal: 1,
        marginTop: 2,
    },

    perfectWeekBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.sm,
        backgroundColor: Colors.pastelYellow,
        borderRadius: Radius.full,
        paddingVertical: 5,
    },
    perfectWeekText: {
        fontSize: FontSize.xs,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.primary,
        letterSpacing: 0.3,
    },
});
