import React, { useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert,
    Share,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
    ArrowLeft,
    Bookmark,
    BookmarkCheck,
    Printer,
    RefreshCw,
    Share2,
    Clock,
    Zap,
    Palette,
    Search,
} from 'lucide-react-native';
import { useActivityStore } from '@/store/activityStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { ACTIVITY_CATEGORIES } from '@/constants/categories';

/** Simple markdown-ish renderer: handles #, ##, ###, **, *, -, numbered lists */
function MarkdownContent({ content }: { content: string }) {
    const elements = useMemo(() => {
        const lines = content.split('\n');
        const result: React.ReactElement[] = [];

        lines.forEach((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) {
                result.push(<View key={idx} style={{ height: 8 }} />);
                return;
            }

            // Headings
            if (trimmed.startsWith('### ')) {
                result.push(
                    <Text key={idx} style={mdStyles.h3}>
                        {trimmed.slice(4)}
                    </Text>
                );
            } else if (trimmed.startsWith('## ')) {
                result.push(
                    <Text key={idx} style={mdStyles.h2}>
                        {trimmed.slice(3)}
                    </Text>
                );
            } else if (trimmed.startsWith('# ')) {
                result.push(
                    <Text key={idx} style={mdStyles.h1}>
                        {trimmed.slice(2)}
                    </Text>
                );
            }
            // Bullet list
            else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                result.push(
                    <View key={idx} style={mdStyles.listItem}>
                        <Text style={mdStyles.bullet}>•</Text>
                        <Text style={mdStyles.listText}>
                            {renderInline(trimmed.slice(2))}
                        </Text>
                    </View>
                );
            }
            // Numbered list
            else if (/^\d+\.\s/.test(trimmed)) {
                const match = trimmed.match(/^(\d+)\.\s(.*)$/);
                if (match) {
                    result.push(
                        <View key={idx} style={mdStyles.listItem}>
                            <Text style={mdStyles.number}>{match[1]}.</Text>
                            <Text style={mdStyles.listText}>
                                {renderInline(match[2])}
                            </Text>
                        </View>
                    );
                }
            }
            // Horizontal rule
            else if (trimmed === '---' || trimmed === '***') {
                result.push(<View key={idx} style={mdStyles.hr} />);
            }
            // Normal paragraph
            else {
                result.push(
                    <Text key={idx} style={mdStyles.paragraph}>
                        {renderInline(trimmed)}
                    </Text>
                );
            }
        });

        return result;
    }, [content]);

    return <View>{elements}</View>;
}

/** Render bold and italic inline */
function renderInline(text: string): React.ReactNode {
    // Split by **bold** markers
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return (
                <Text key={i} style={{ fontWeight: FontWeight.bold }}>
                    {part.slice(2, -2)}
                </Text>
            );
        }
        return part;
    });
}

export default function ActivityDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { recentActivities, savedActivities, toggleSaved } = useActivityStore();

    const activity = useMemo(() => {
        return [...recentActivities, ...savedActivities].find((a) => a.id === id);
    }, [id, recentActivities, savedActivities]);

    const category = useMemo(() => {
        return ACTIVITY_CATEGORIES.find((c) => c.id === activity?.category);
    }, [activity?.category]);

    if (!activity) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.centered}>
                    <Search size={48} color={Colors.textSecondary} style={styles.emptyEmoji} />
                    <Text style={styles.emptyTitle}>Activity not found</Text>
                    <Button
                        title="Go Back"
                        onPress={() => router.back()}
                        variant="primary"
                        size="md"
                        style={{ marginTop: Spacing.lg }}
                    />
                </View>
            </SafeAreaView>
        );
    }

    const handleToggleSave = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await toggleSaved(activity.id);
    };

    const handlePrint = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/print-preview?id=${activity.id}` as any);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                title: `${activity.topic} Activity`,
                message: `Check out this ${activity.category} activity about "${activity.topic}"!\n\n${activity.content.slice(0, 200)}...`,
            });
        } catch {
            // user cancelled
        }
    };

    const handleRegenerate = () => {
        Alert.alert(
            'Regenerate Activity',
            'This will create a new activity with the same settings. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Regenerate',
                    onPress: () => {
                        router.back();
                        // The generate screen still has the same settings, user can just tap generate again
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safe}>
            {/* Top bar */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={22} color={Colors.textPrimary} />
                </TouchableOpacity>
                <View style={styles.topBarActions}>
                    <TouchableOpacity onPress={handleToggleSave} style={styles.iconBtn}>
                        {activity.is_saved ? (
                            <BookmarkCheck size={22} color={Colors.primary} />
                        ) : (
                            <Bookmark size={22} color={Colors.textSecondary} />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
                        <Share2 size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {/* Category badge + meta */}
                <View style={styles.metaRow}>
                    <View style={[styles.badge, {
                        backgroundColor: (category?.color ?? Colors.primary) + '15',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                    }]}>
                        {(() => {
                            const Icon = category?.icon;
                            return (
                                <>
                                    {Icon && <Icon size={14} color={category?.color ?? Colors.primary} />}
                                    <Text style={[styles.badgeText, { color: category?.color ?? Colors.primary }]}>
                                        {category?.label}
                                    </Text>
                                </>
                            );
                        })()}
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>{activity.topic}</Text>

                {/* Meta chips */}
                <View style={styles.chipRow}>
                    <View style={styles.metaChip}>
                        <Zap size={14} color={Colors.textSecondary} />
                        <Text style={styles.metaChipText}>
                            {activity.difficulty.charAt(0).toUpperCase() + activity.difficulty.slice(1)}
                        </Text>
                    </View>
                    <View style={styles.metaChip}>
                        <Palette size={14} color={Colors.textSecondary} />
                        <Text style={styles.metaChipText}>
                            {activity.style === 'colorful' ? 'Colorful' : 'B&W'}
                        </Text>
                    </View>
                    <View style={styles.metaChip}>
                        <Clock size={14} color={Colors.textSecondary} />
                        <Text style={styles.metaChipText}>
                            {new Date(activity.created_at).toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                {activity.kid_name && (
                    <Text style={styles.kidLabel}>
                        Created for <Text style={{ color: Colors.primary, fontWeight: FontWeight.semibold }}>{activity.kid_name}</Text>
                    </Text>
                )}

                {/* Content */}
                <Card variant="elevated" style={styles.contentCard}>
                    {activity.image_url && (
                        <Image
                            source={{ uri: activity.image_url }}
                            style={styles.generatedImage}
                            contentFit="contain"
                            transition={250}
                        />
                    )}
                    <MarkdownContent content={activity.content} />
                </Card>

                {/* Action buttons */}
                <View style={styles.actionRow}>
                    <Button
                        title="Print / PDF"
                        onPress={handlePrint}
                        variant="primary"
                        size="md"
                        icon={<Printer size={18} color={Colors.white} />}
                        style={{ flex: 1 }}
                    />
                    <Button
                        title="Regenerate"
                        onPress={handleRegenerate}
                        variant="outline"
                        size="md"
                        icon={<RefreshCw size={18} color={Colors.primary} />}
                        style={{ flex: 1 }}
                    />
                </View>

                <View style={{ height: Spacing['5xl'] }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing['4xl'],
    },
    emptyEmoji: {
        marginBottom: Spacing.md,
    },
    emptyTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backBtn: {
        padding: Spacing.sm,
    },
    topBarActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    iconBtn: {
        padding: Spacing.sm,
    },
    container: {
        flex: 1,
    },
    content: {
        padding: Spacing.xl,
    },
    metaRow: {
        flexDirection: 'row',
        marginBottom: Spacing.md,
    },
    badge: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: Radius.sm,
    },
    badgeText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
    },
    title: {
        fontSize: FontSize['3xl'],
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    metaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radius.sm,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    metaChipText: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
    },
    kidLabel: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.lg,
    },
    generatedImage: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: Radius.sm,
        marginBottom: Spacing.xl,
        backgroundColor: Colors.surface,
    },
    contentCard: {
        marginBottom: Spacing.xl,
    },
    actionRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
});

const mdStyles = StyleSheet.create({
    h1: {
        fontSize: FontSize['2xl'],
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    h2: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginTop: Spacing.md,
        marginBottom: Spacing.xs,
    },
    h3: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
        marginTop: Spacing.md,
        marginBottom: Spacing.xs,
    },
    paragraph: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        lineHeight: 24,
        marginBottom: Spacing.xs,
    },
    listItem: {
        flexDirection: 'row',
        paddingLeft: Spacing.sm,
        marginBottom: 4,
    },
    bullet: {
        fontSize: FontSize.md,
        color: Colors.primary,
        marginRight: Spacing.sm,
        width: 16,
    },
    number: {
        fontSize: FontSize.md,
        color: Colors.primary,
        fontWeight: FontWeight.semibold,
        marginRight: Spacing.sm,
        width: 20,
    },
    listText: {
        flex: 1,
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        lineHeight: 24,
    },
    hr: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: Spacing.md,
    },
});
