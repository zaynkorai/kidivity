import React, { useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
} from 'react-native';
import { Bookmark, BookmarkCheck, Trash2 } from 'lucide-react-native';
import { useActivityStore } from '@/store/activityStore';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { ACTIVITY_CATEGORIES } from '@/constants/categories';

export default function SavedScreen() {
    const { savedActivities, fetchSaved, toggleSaved, deleteActivity } = useActivityStore();

    useEffect(() => {
        fetchSaved();
    }, []);

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <Bookmark size={24} color={Colors.primary} />
                <Text style={styles.title}>Saved Activities</Text>
            </View>

            {savedActivities.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyEmoji}>📚</Text>
                    <Text style={styles.emptyTitle}>No saved activities</Text>
                    <Text style={styles.emptySubtitle}>
                        Bookmark activities you love to find them here later.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={savedActivities}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => {
                        const category = ACTIVITY_CATEGORIES.find((c) => c.id === item.category);
                        return (
                            <Card variant="elevated" style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <View
                                        style={[
                                            styles.badge,
                                            { backgroundColor: (category?.color ?? Colors.primary) + '20' },
                                        ]}
                                    >
                                        <Text style={styles.badgeText}>
                                            {category?.emoji} {category?.label}
                                        </Text>
                                    </View>

                                    <View style={styles.actions}>
                                        <TouchableOpacity onPress={() => toggleSaved(item.id)}>
                                            <BookmarkCheck size={20} color={Colors.primary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => deleteActivity(item.id)}>
                                            <Trash2 size={18} color={Colors.accent} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <Text style={styles.topic}>{item.topic}</Text>
                                {item.kid_name && (
                                    <Text style={styles.kidName}>For {item.kid_name}</Text>
                                )}
                                <Text style={styles.preview} numberOfLines={3}>
                                    {item.content}
                                </Text>
                                <Text style={styles.date}>
                                    {new Date(item.created_at).toLocaleDateString()}
                                </Text>
                            </Card>
                        );
                    }}
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
        gap: Spacing.sm,
        padding: Spacing.xl,
        paddingBottom: Spacing.md,
    },
    title: {
        fontSize: FontSize['2xl'],
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    list: {
        padding: Spacing.xl,
        paddingTop: 0,
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
    emptyEmoji: {
        fontSize: 48,
        marginBottom: Spacing.md,
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
