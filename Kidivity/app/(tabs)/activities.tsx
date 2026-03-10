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
import { Filter, X, Search, History } from 'lucide-react-native';
import { useActivityStore } from '@/store/activityStore';
import { useProfileStore } from '@/store/profileStore';

import { Chip } from '@/components/ui/Chip';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
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
            return true;
        })
        .sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
        });

    const hasActiveFilters = filterCategory !== null || filterKidId !== null;

    const clearFilters = () => {
        setFilterCategory(null);
        setFilterKidId(null);
    };

    const handleToggleSaved = async (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await toggleSaved(id);
    };

    const handleDelete = async (id: string) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        await deleteActivity(id);
    };

    const renderItem = ({ item }: { item: Activity }) => {
        const category = ACTIVITY_CATEGORIES.find((c) => c.id === item.category);
        const cardColor = category?.color ?? Colors.primary;
        const bgColor = cardColor + '15'; // very light background

        return (
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push(`/activity/${item.id}` as any)}
                style={styles.gridItemWrapper}
            >
                <View style={[styles.gridCard, { backgroundColor: bgColor }]}>
                    {/* Inner highlight for completely rounded sticker/book effect */}
                    <View style={styles.gridCardInnerHighlight} />

                    <View style={styles.gridCardContent}>
                        <View style={styles.gridTextContainer}>
                            <Text style={[styles.gridTopic, { color: Colors.textPrimary }]} numberOfLines={2}>
                                {item.topic}
                            </Text>
                            {item.kid_name && (
                                <Text style={[styles.gridKidName, { color: Colors.textPrimary }]} numberOfLines={1}>
                                    For {item.kid_name}
                                </Text>
                            )}
                        </View>

                        <View style={styles.gridImageContainer}>
                            {item.image_url ? (
                                <Image
                                    source={{ uri: item.image_url }}
                                    style={styles.gridImage}
                                    contentFit="cover"
                                    transition={300}
                                />
                            ) : (
                                <View style={[styles.gridImage, styles.gridImagePlaceholder, { backgroundColor: cardColor + '10' }]}>
                                    {category?.icon ? React.createElement(category.icon, { size: 40, color: cardColor }) : <Search size={40} color={Colors.textPrimary} />}
                                </View>
                            )}
                        </View>
                    </View>
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
        maxWidth: '48%', // Ensure 2 columns fit perfectly with gap
    },
    gridCard: {
        aspectRatio: 0.75, // 3:4 aspect ratio for book cover feel
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
        ...Shadows.sm,
    },
    gridCardInnerHighlight: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 4,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 24,
        zIndex: 1,
        pointerEvents: 'none',
    },
    gridCardContent: {
        flex: 1,
        padding: Spacing.md,
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 2,
    },
    gridTopic: {
        fontSize: FontSize.md,
        fontWeight: '800', // Extra bold
        textAlign: 'center',
        marginTop: Spacing.xs,
        marginBottom: 2,
        lineHeight: 20,
    },
    gridTextContainer: {
        width: '100%',
        alignItems: 'center',
    },
    gridKidName: {
        fontSize: FontSize.xs,
        fontWeight: '600',
        textAlign: 'center',
        opacity: 0.8,
        marginBottom: Spacing.xs,
    },
    gridImageContainer: {
        width: '100%',
        flex: 1, // Take up remaining space below text
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    gridImage: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
    },
    gridImagePlaceholder: {
        justifyContent: 'center',
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
