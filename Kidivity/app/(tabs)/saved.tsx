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
import { Bookmark, BookmarkCheck, Trash2, Filter, X, Search } from 'lucide-react-native';
import { useActivityStore } from '@/store/activityStore';
import { useProfileStore } from '@/store/profileStore';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { ACTIVITY_CATEGORIES, type ActivityCategory } from '@/constants/categories';
import type { Activity } from '@/types/activity';

type SortOption = 'newest' | 'oldest';

export default function SavedScreen() {
    const router = useRouter();
    const { savedActivities, fetchSaved, toggleSaved, deleteActivity } = useActivityStore();
    const { profiles } = useProfileStore();

    const [showFilters, setShowFilters] = useState(false);
    const [filterCategory, setFilterCategory] = useState<ActivityCategory | null>(null);
    const [filterKidId, setFilterKidId] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchSaved();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchSaved();
        setRefreshing(false);
    }, []);

    const filteredActivities = savedActivities
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
        return (
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push(`/activity/${item.id}` as any)}
            >
                <Card variant="elevated" style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View
                            style={[
                                styles.badge,
                                {
                                    backgroundColor: (category?.color ?? Colors.primary) + '20',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 4,
                                },
                            ]}
                        >
                            {(() => {
                                const Icon = category?.icon;
                                return (
                                    <>
                                        {Icon && <Icon size={14} color={category?.color} />}
                                        <Text style={styles.badgeText}>{category?.label}</Text>
                                    </>
                                );
                            })()}
                        </View>

                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => handleToggleSaved(item.id)}>
                                <BookmarkCheck size={20} color={Colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(item.id)}>
                                <Trash2 size={18} color={Colors.accent} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.cardContent}>
                        <View style={styles.textContent}>
                            <Text style={styles.topic}>{item.topic}</Text>
                            {item.kid_name && (
                                <Text style={styles.kidName}>For {item.kid_name}</Text>
                            )}
                            <Text style={styles.preview} numberOfLines={3}>
                                {item.content}
                            </Text>
                        </View>
                        {item.image_url && (
                            <Image
                                source={{ uri: item.image_url }}
                                style={styles.thumbnail}
                                contentFit="cover"
                                transition={200}
                            />
                        )}
                    </View>
                    <Text style={styles.date}>
                        {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </Card>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Bookmark size={24} color={Colors.primary} />
                    <Text style={styles.title}>Saved Activities</Text>
                </View>
                <TouchableOpacity
                    onPress={() => setShowFilters(!showFilters)}
                    style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
                >
                    <Filter size={18} color={hasActiveFilters ? Colors.white : Colors.textSecondary} />
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
                    <Search size={48} color={Colors.textSecondary} style={{ marginBottom: Spacing.md }} />
                    <Text style={styles.emptyTitle}>
                        {hasActiveFilters ? 'No matches' : 'No saved activities'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {hasActiveFilters
                            ? 'Try adjusting your filters.'
                            : 'Bookmark activities you love to find them here later.'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredActivities}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={renderItem}
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
        padding: Spacing.xl,
        paddingBottom: Spacing.md,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    title: {
        fontSize: FontSize['2xl'],
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
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
        color: Colors.textSecondary,
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
        color: Colors.textTertiary,
    },
    list: {
        padding: Spacing.xl,
        paddingTop: Spacing.sm,
        gap: Spacing.md,
    },

    card: {
        marginBottom: Spacing.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    badge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: Radius.sm,
    },
    badgeText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
        color: Colors.textSecondary,
    },
    actions: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    cardContent: {
        flexDirection: 'row',
        gap: Spacing.md,
        alignItems: 'flex-start',
    },
    textContent: {
        flex: 1,
    },
    topic: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },
    kidName: {
        fontSize: FontSize.xs,
        color: Colors.primary,
        marginTop: 2,
    },
    thumbnail: {
        width: 60,
        height: 60,
        borderRadius: Radius.sm,
        backgroundColor: Colors.surface,
    },
    preview: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginTop: Spacing.sm,
        lineHeight: 20,
    },
    date: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        marginTop: Spacing.sm,
    },

    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing['4xl'],
    },
    emptyTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },
    emptySubtitle: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: Spacing.xs,
    },
});
