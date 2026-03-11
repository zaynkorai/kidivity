import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Filter, X, Search, History, Star } from 'lucide-react-native';
import { useActivityStore } from '@/store/activityStore';
import { useProfileStore } from '@/store/profileStore';

import { Chip } from '@/components/ui/Chip';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { WeeklyCalendar } from '@/components/ui/WeeklyCalendar';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '@/constants/theme';
import { ACTIVITY_CATEGORIES, type ActivityCategory } from '@/constants/categories';
import type { Activity } from '@/types/activity';

type SortOption = 'newest' | 'oldest';

export default function ActivitiesScreen() {
    const router = useRouter();
    
    // Stable action selectors
    const fetchRecent = useActivityStore((state) => state.fetchRecent);
    const toggleSaved = useActivityStore((state) => state.toggleSaved);
    const deleteActivity = useActivityStore((state) => state.deleteActivity);
    
    // State selectors
    const recentActivities = useActivityStore((state) => state.recentActivities);
    const profiles = useProfileStore((state) => state.profiles);

    const [showFilters, setShowFilters] = useState(false);
    const [filterCategory, setFilterCategory] = useState<ActivityCategory | null>(null);
    const [filterKidId, setFilterKidId] = useState<string | null>(null);
    const [filterDate, setFilterDate] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchRecent();
    }, [fetchRecent]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchRecent();
        setRefreshing(false);
    }, [fetchRecent]);

    const filteredActivities = recentActivities
        .filter((a) => {
            if (filterCategory && a.category !== filterCategory) return false;
            if (filterKidId && a.kid_profile_id !== filterKidId) return false;
            if (filterDate) {
                const d = new Date(a.created_at);
                const ds =
                    d.getFullYear() +
                    '-' +
                    String(d.getMonth() + 1).padStart(2, '0') +
                    '-' +
                    String(d.getDate()).padStart(2, '0');
                if (ds !== filterDate) return false;
            }
            return true;
        })
        .sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
        });

    const hasActiveFilters = filterCategory !== null || filterKidId !== null || filterDate !== null;

    const clearFilters = () => {
        setFilterCategory(null);
        setFilterKidId(null);
        setFilterDate(null);
    };

    const handleToggleSaved = async (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await toggleSaved(id);
    };

    const handleDelete = async (id: string) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        await deleteActivity(id);
    };

    const ACCENT_COLORS: Record<string, string> = {
        puzzles: '#9B72DA',
        tracing: '#E8757A',
        science: '#31A87A',
        art: '#D4920A',
        math: '#0EAAD4',
        reading: '#D46300',
    };

    const BG_COLORS: Record<string, string> = {
        puzzles: Colors.pastelPurple,
        tracing: Colors.pastelPink,
        science: Colors.pastelMint,
        art: Colors.pastelYellow,
        math: Colors.pastelBlue,
        reading: Colors.pastelPeach,
    };

    const DIFFICULTY_COLORS: Record<string, string> = {
        easy: '#31A87A',
        medium: '#D4920A',
        hard: '#E8757A',
    };

    function relativeDate(iso: string): string {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        if (days < 7) return `${days}d ago`;
        return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    const renderItem = ({ item }: { item: Activity }) => {
        const category = ACTIVITY_CATEGORIES.find((c) => c.id === item.category);
        const accent = ACCENT_COLORS[item.category] ?? Colors.primary;
        const bgColor = BG_COLORS[item.category] ?? Colors.pastelYellow;
        const diffColor = DIFFICULTY_COLORS[item.difficulty] ?? Colors.primary;

        return (
            <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => router.push(`/activity/${item.id}` as any)}
                style={styles.gridItemWrapper}
            >
                <View style={[styles.gridCard, { backgroundColor: bgColor }]}>
                    {/* Inner border glow */}
                    <View style={[styles.gridCardBorder, { borderColor: accent + '40' }]} />

                    {/* TOP ROW: category chip + save star */}
                    <View style={styles.gridTopRow}>
                        <View style={[styles.catChip, { backgroundColor: accent + '20' }]}>
                            {category?.icon && React.createElement(category.icon, { size: 10, color: accent, strokeWidth: 2.5 })}
                            <Text style={[styles.catChipText, { color: accent }]}>
                                {category?.label.split(' ')[0]}
                            </Text>
                        </View>
                        <TouchableOpacity
                            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                            onPress={(e) => { e.stopPropagation(); handleToggleSaved(item.id); }}
                        >
                            <Star
                                size={16}
                                color={item.is_saved ? Colors.primary : Colors.textTertiary}
                                fill={item.is_saved ? Colors.primary : 'transparent'}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* TITLE */}
                    <Text style={styles.gridTopic} numberOfLines={3}>
                        {item.topic}
                    </Text>

                    {/* IMAGE / ICON ZONE */}
                    <View style={[styles.gridImageContainer, { backgroundColor: accent + '15' }]}>
                        {item.image_url ? (
                            <Image
                                source={{ uri: item.image_url }}
                                style={styles.gridImage}
                                contentFit="cover"
                                transition={250}
                            />
                        ) : (
                            <View style={styles.gridIconFallback}>
                                {category?.icon
                                    ? React.createElement(category.icon, { size: 36, color: accent, strokeWidth: 1.5 })
                                    : <Search size={36} color={accent} />}
                            </View>
                        )}
                    </View>

                    {/* BOTTOM ROW: difficulty dot + date */}
                    <View style={styles.gridBottomRow}>
                        <View style={styles.diffRow}>
                            <View style={[styles.diffDot, { backgroundColor: diffColor }]} />
                            <Text style={[styles.diffLabel, { color: diffColor }]}>
                                {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
                            </Text>
                        </View>
                        <Text style={styles.dateLabel}>{relativeDate(item.created_at)}</Text>
                    </View>

                    {/* Kid name badge if present */}
                    {item.kid_name && (
                        <View style={styles.kidBadge}>
                            <View style={styles.kidDot} />
                            <Text style={styles.kidBadgeText} numberOfLines={1}>
                                {item.kid_name}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safe}>
            <ScreenBackground />
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <History size={24} color={Colors.primary} />
                    <Text style={styles.title}>Activities</Text>
                </View>
                <TouchableOpacity
                    onPress={() => setShowFilters(!showFilters)}
                    style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
                >
                    <Filter size={18} color={hasActiveFilters ? Colors.white : Colors.textPrimary} />
                </TouchableOpacity>
            </View>

            {/* Weekly Calendar */}
            <WeeklyCalendar
                activities={recentActivities}
                selectedDate={filterDate}
                onSelectDate={setFilterDate}
            />

            {/* Filter bar */}
            {showFilters && (
                <View style={styles.filterBar}>
                    {/* Category filter */}
                    <Text style={styles.filterLabel}>Category</Text>
                    <View style={styles.filterRow}>
                        <Chip
                            label="All"
                            selected={filterCategory === null}
                            onPress={() => setFilterCategory(null)}
                        />
                        {ACTIVITY_CATEGORIES.map((cat) => (
                            <Chip
                                key={cat.id}
                                label={cat.label}
                                icon={cat.icon}
                                selected={filterCategory === cat.id}
                                onPress={() =>
                                    setFilterCategory(filterCategory === cat.id ? null : cat.id)
                                }
                            />
                        ))}
                    </View>

                    {/* Kid filter */}
                    {profiles.length > 1 && (
                        <>
                            <Text style={styles.filterLabel}>Kid</Text>
                            <View style={styles.filterRow}>
                                <Chip
                                    label="All Kids"
                                    selected={filterKidId === null}
                                    onPress={() => setFilterKidId(null)}
                                />
                                {profiles.map((p) => (
                                    <Chip
                                        key={p.id}
                                        label={p.name}
                                        selected={filterKidId === p.id}
                                        onPress={() =>
                                            setFilterKidId(filterKidId === p.id ? null : p.id)
                                        }
                                    />
                                ))}
                            </View>
                        </>
                    )}

                    {/* Sort */}
                    <Text style={styles.filterLabel}>Sort</Text>
                    <View style={styles.filterRow}>
                        <Chip label="Newest" selected={sortBy === 'newest'} onPress={() => setSortBy('newest')} />
                        <Chip label="Oldest" selected={sortBy === 'oldest'} onPress={() => setSortBy('oldest')} />
                    </View>

                    {hasActiveFilters && (
                        <TouchableOpacity onPress={clearFilters} style={styles.clearBtn}>
                            <X size={14} color={Colors.accent} />
                            <Text style={styles.clearText}>Clear Filters</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Result count */}
            {hasActiveFilters && (
                <View style={styles.resultCount}>
                    <Text style={styles.resultCountText}>
                        {filteredActivities.length} activit{filteredActivities.length === 1 ? 'y' : 'ies'} found
                    </Text>
                </View>
            )}

            {filteredActivities.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconWrapper}>
                        <History size={32} color={Colors.primary} />
                    </View>
                    <Text style={styles.emptyTitle}>
                        {hasActiveFilters ? 'No matches found' : 'No activities yet'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {hasActiveFilters
                            ? 'Try adjusting your filters to see more results.'
                            : 'Generate your first activity and it will appear here.'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredActivities}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={Colors.primary}
                            colors={[Colors.primary]}
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing['3xl'],
        paddingBottom: Spacing.md,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    title: {
        fontSize: FontSize['3xl'],
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        letterSpacing: -0.5,
    },
    filterBtn: {
        padding: Spacing.sm,
        borderRadius: Radius.sm,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterBtnActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterBar: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    filterLabel: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: Spacing.xs,
        marginTop: Spacing.sm,
    },
    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
    },
    clearBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: Spacing.md,
        alignSelf: 'center',
    },
    clearText: {
        fontSize: FontSize.sm,
        color: Colors.accent,
        fontWeight: FontWeight.medium,
    },
    resultCount: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.sm,
    },
    resultCountText: {
        fontSize: FontSize.xs,
        color: Colors.textPrimary,
    },
    list: {
        padding: Spacing.xl,
        paddingTop: Spacing.sm,
        paddingBottom: 120, // Account for floating tab bar
    },
    columnWrapper: {
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    gridItemWrapper: {
        flex: 1,
        maxWidth: '48%',
    },
    gridCard: {
        borderRadius: 24,
        overflow: 'hidden',
        padding: Spacing.md,
        paddingBottom: Spacing.sm,
        gap: Spacing.xs,
        ...Shadows.md,
    },
    // Absolute inner border glow
    gridCardBorder: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 2,
        borderRadius: 24,
        zIndex: 1,
        pointerEvents: 'none',
    },

    // Top row: category chip + star
    gridTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    catChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: Radius.full,
    },
    catChipText: {
        fontSize: 9,
        fontWeight: FontWeight.bold,
        letterSpacing: 0.2,
    },

    // Title
    gridTopic: {
        fontSize: FontSize.sm,
        fontWeight: '800',
        color: Colors.textPrimary,
        lineHeight: 18,
        letterSpacing: -0.2,
    },

    // Image / icon area
    gridImageContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: Spacing.xs,
    },
    gridImage: {
        width: '100%',
        height: '100%',
    },
    gridIconFallback: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Bottom row: difficulty + date
    gridBottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 2,
    },
    diffRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    diffDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    diffLabel: {
        fontSize: 9,
        fontWeight: FontWeight.bold,
        letterSpacing: 0.2,
    },
    dateLabel: {
        fontSize: 9,
        fontWeight: FontWeight.medium,
        color: Colors.textTertiary,
    },

    // Kid badge at bottom
    kidBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    kidDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: Colors.textTertiary,
    },
    kidBadgeText: {
        fontSize: 9,
        fontWeight: FontWeight.semibold,
        color: Colors.textSecondary,
    },

    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing['4xl'],
    },
    emptyIconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    emptyTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    emptySubtitle: {
        fontSize: FontSize.sm,
        color: Colors.textPrimary,
        textAlign: 'center',
        maxWidth: '80%',
        lineHeight: 20,
    },
});
