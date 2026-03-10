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
    ImageIcon,
    Tag,
} from 'lucide-react-native';
import { useActivityStore } from '@/store/activityStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Colors, Spacing, Radius, FontSize, FontWeight, Fonts, Shadows } from '@/constants/theme';
import { ACTIVITY_CATEGORIES } from '@/constants/categories';
import { GeneratingOverlay } from '@/components/ui/GeneratingOverlay';

const VISUAL_CATEGORIES = new Set(['tracing', 'drawings', 'logic', 'educational', 'math', 'coloring', 'story']);

function normalizeActivityContent(raw: string) {
    let text = raw ?? '';
    const trimmed = text.trim();

    try {
        if (
            (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
            trimmed.startsWith('{') ||
            trimmed.startsWith('[')
        ) {
            const parsed = JSON.parse(trimmed);
            if (typeof parsed === 'string') {
                text = parsed;
            } else if (parsed && typeof parsed === 'object') {
                const obj = parsed as Record<string, unknown>;
                const title = typeof obj.title === 'string' ? obj.title : '';
                const instructions = typeof obj.instructions === 'string' ? obj.instructions : '';
                const content = typeof obj.content === 'string' ? obj.content : '';
                if (title || instructions || content) {
                    text = `${title ? `# ${title}\n\n` : ''}${instructions ? `${instructions}\n\n` : ''}${content}`;
                }
            }
        }
    } catch {
        // ignore
    }

    // Handle double-escaped newlines coming from storage/API (e.g. "\\n" instead of "\n").
    // Keep this narrow to avoid unexpectedly changing other escape sequences.
    if (text.includes('\\n') || text.includes('\\r\\n')) {
        text = text.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
    }

    return text;
}

/** Simple markdown-ish renderer: handles #, ##, ###, **, *, -, numbered lists */
function MarkdownContent({ content }: { content: string }) {
    const elements = useMemo(() => {
        const safeContent = normalizeActivityContent(content);
        const lines = safeContent.split('\n');
        const result: React.ReactElement[] = [];

        lines.forEach((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) {
                result.push(<View key={idx} style={styles.spacer} />);
                return;
            }

            const boldLine = trimmed.match(/^\*\*(.+)\*\*$/)?.[1]?.trim();

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
            // Blockquote
            else if (trimmed.startsWith('>')) {
                const quote = trimmed.replace(/^>\s?/, '').trim();
                result.push(
                    <View key={idx} style={mdStyles.blockquote}>
                        <Text style={mdStyles.blockquoteText}>{renderInline(quote)}</Text>
                    </View>
                );
            }
            // Fully-bold line (common for prompt sections)
            else if (boldLine) {
                const isShort = boldLine.length <= 60;
                const isNumbered = /^\d+\.\s/.test(boldLine);
                result.push(
                    <Text key={idx} style={(isNumbered || isShort) ? mdStyles.h3 : mdStyles.paragraph}>
                        {renderInline(trimmed)}
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
                <Text key={i} style={styles.inlineBold}>
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
    const { recentActivities, savedActivities, toggleSaved, generateActivity, isGenerating } = useActivityStore();

    const activity = useMemo(() => {
        return [...recentActivities, ...savedActivities].find((a) => a.id === id);
    }, [id, recentActivities, savedActivities]);

    const category = useMemo(() => {
        return ACTIVITY_CATEGORIES.find((c) => c.id === activity?.category);
    }, [activity?.category]);

    if (!activity) {
        return (
            <SafeAreaView style={styles.safe}>
                <ScreenBackground />
                <View style={styles.centered}>
                    <Search size={48} color={Colors.textPrimary} style={styles.emptyEmoji} />
                    <Text style={styles.emptyTitle}>Activity not found</Text>
                    <Button
                        title="Go Back"
                        onPress={() => router.back()}
                        variant="primary"
                        size="md"
                        style={styles.goBackBtn}
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
                    onPress: async () => {
                        if (!activity) return;
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

                        const { data, error: err } = await generateActivity({
                            kid_profile_id: activity.kid_profile_id,
                            category: activity.category,
                            topic: activity.topic,
                            difficulty: activity.difficulty || 'medium',
                            style: activity.style || 'colorful',
                        });

                        if (err === 'rate_limit') {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                            Alert.alert('Limit Reached', 'You have hit your daily generation limit.');
                        } else if (err) {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                            Alert.alert('Error', typeof err === 'string' ? err : 'Failed to generate activity');
                        } else if (data) {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            router.push(`/activity/${data.id}`);
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safe}>
            <ScreenBackground />
            <GeneratingOverlay visible={isGenerating} />
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
                            <Bookmark size={22} color={Colors.textPrimary} />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
                        <Share2 size={20} color={Colors.textPrimary} />
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
                                    {Icon && <Icon size={14} color={Colors.textPrimary} />}
                                    <Text style={[styles.badgeText, { color: Colors.textPrimary }]}>
                                        {category?.label}
                                    </Text>
                                </>
                            );
                        })()}
                    </View>
                </View>

                {/* Meta chips */}
                <View style={styles.chipRow}>
                    <View style={styles.metaChip}>
                        <Tag size={14} color={Colors.textPrimary} />
                        <Text style={styles.metaChipText}>
                            {activity.topic}
                        </Text>
                    </View>
                    <View style={styles.metaChip}>
                        <Zap size={14} color={Colors.textPrimary} />
                        <Text style={styles.metaChipText}>
                            {activity.difficulty.charAt(0).toUpperCase() + activity.difficulty.slice(1)}
                        </Text>
                    </View>
                    <View style={styles.metaChip}>
                        <Palette size={14} color={Colors.textPrimary} />
                        <Text style={styles.metaChipText}>
                            {activity.style === 'colorful' ? 'Colorful' : 'B&W'}
                        </Text>
                    </View>
                    <View style={styles.metaChip}>
                        <Clock size={14} color={Colors.textPrimary} />
                        <Text style={styles.metaChipText}>
                            {new Date(activity.created_at).toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                {activity.kid_name && (
                    <Text style={styles.kidLabel}>
                        Created for <Text style={styles.createdForKid}>{activity.kid_name}</Text>
                    </Text>
                )}

                {/* Visual Hero — shown for tracing/screen-free categories */}
                {VISUAL_CATEGORIES.has(activity.category) && (
                    <View style={styles.visualHero}>
                        {activity.image_url ? (
                            <View style={styles.tracingContainer}>
                                <Image
                                    source={{ uri: activity.image_url }}
                                    style={styles.heroImage}
                                    contentFit="contain"
                                    transition={300}
                                />
                            </View>
                        ) : (
                            <View style={styles.heroPlaceholder}>
                                <ImageIcon size={48} color={Colors.textPrimary} />
                                <Text style={[styles.heroPlaceholderText, { color: Colors.textPrimary }]}>
                                    Visual Activity
                                </Text>
                                <Text style={styles.heroPlaceholderSub}>
                                    Image generation may take a moment
                                </Text>
                            </View>
                        )}
                        <View style={[styles.visualBadge, { backgroundColor: (category?.color ?? Colors.primary) + '20' }]}>
                            <ImageIcon size={12} color={Colors.textPrimary} />
                            <Text style={[styles.visualBadgeText, { color: Colors.textPrimary }]}>
                                Visual Activity
                            </Text>
                        </View>
                    </View>
                )}

                {/* Content */}
                <Card variant="elevated" style={styles.contentCard}>
                    {!VISUAL_CATEGORIES.has(activity.category) && activity.image_url && (
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
                        style={styles.flex1}
                    />
                    <Button
                        title="Regenerate"
                        onPress={handleRegenerate}
                        variant="outline"
                        size="md"
                        icon={<RefreshCw size={18} color={Colors.primary} />}
                        style={styles.flex1}
                    />
                </View>

                <View style={styles.bottomSpacer} />
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
        fontFamily: Fonts.medium,
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.sm,
    },
    backBtn: {
        padding: Spacing.sm,
        marginLeft: -Spacing.sm,
    },
    topBarActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginRight: -Spacing.sm,
    },
    iconBtn: {
        padding: Spacing.sm,
    },
    container: {
        flex: 1,
    },
    content: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xl,
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
        fontFamily: Fonts.medium,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
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
        fontFamily: Fonts.sans,
        fontSize: FontSize.xs,
        color: Colors.textPrimary,
    },
    kidLabel: {
        fontFamily: Fonts.sans,
        fontSize: FontSize.sm,
        color: Colors.textPrimary,
        marginBottom: Spacing.lg,
    },
    generatedImage: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: Radius.md,
        marginBottom: Spacing.xl,
        backgroundColor: Colors.background,
        ...Shadows.sm,
    },
    // Visual hero
    visualHero: {
        borderRadius: Radius.lg,
        overflow: 'hidden',
        marginBottom: Spacing.xl,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.sm,
    },
    tracingContainer: {
        position: 'relative',
        width: '100%',
        aspectRatio: 1, // Changed to square to give more room for the overlay
    },
    heroImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    tracingOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        padding: Spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    tracingText: {
        fontFamily: Fonts.bold,
        fontSize: FontSize['3xl'],
        color: Colors.textPrimary,
        letterSpacing: 2,
        opacity: 0.4,
        marginBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        borderStyle: 'dashed',
        width: '90%',
        textAlign: 'center',
    },
    tracingTextWord: {
        fontFamily: Fonts.bold,
        fontSize: FontSize['4xl'],
        color: Colors.textPrimary,
        letterSpacing: 8,
        opacity: 0.4,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        borderStyle: 'dashed',
        width: '90%',
        textAlign: 'center',
        marginTop: Spacing.sm,
    },
    heroPlaceholder: {
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.background,
    },
    heroPlaceholderText: {
        fontFamily: Fonts.medium,
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
    },
    heroPlaceholderSub: {
        fontFamily: Fonts.sans,
        fontSize: FontSize.xs,
        color: Colors.textPrimary,
    },
    visualBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: Spacing.sm,
        paddingHorizontal: Spacing.md,
    },
    visualBadgeText: {
        fontFamily: Fonts.medium,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
    },
    contentCard: {
        marginBottom: Spacing.xl,
    },
    actionRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    goBackBtn: {
        marginTop: Spacing.lg,
    },
    createdForKid: {
        fontFamily: Fonts.medium, 
        color: Colors.textPrimary, 
        fontWeight: FontWeight.semibold,
    },
    flex1: {
        flex: 1,
    },
    bottomSpacer: {
        height: Spacing['5xl'],
    },
    spacer: {
        height: 8,
    },
    inlineBold: {
        fontFamily: Fonts.bold, 
        fontWeight: FontWeight.bold,
    },
});

const mdStyles = StyleSheet.create({
    h1: {
        fontFamily: Fonts.bold,
        fontSize: FontSize['3xl'],
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginTop: Spacing.sm,
        marginBottom: Spacing.md,
    },
    h2: {
        fontFamily: Fonts.bold,
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginTop: Spacing.md,
        marginBottom: Spacing.xs,
    },
    h3: {
        fontFamily: Fonts.medium,
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
        marginTop: Spacing.md,
        marginBottom: Spacing.xs,
    },
    paragraph: {
        fontFamily: Fonts.sans,
        fontSize: FontSize.md,
        color: Colors.textPrimary,
        lineHeight: 24,
        marginBottom: Spacing.xs,
    },
    listItem: {
        flexDirection: 'row',
        paddingLeft: Spacing.sm,
        marginBottom: 4,
    },
    bullet: {
        fontFamily: Fonts.bold,
        fontSize: FontSize.md,
        color: Colors.textPrimary,
        marginRight: Spacing.sm,
        width: 16,
    },
    number: {
        fontFamily: Fonts.medium,
        fontSize: FontSize.md,
        color: Colors.textPrimary,
        fontWeight: FontWeight.semibold,
        marginRight: Spacing.sm,
        width: 20,
    },
    listText: {
        flex: 1,
        fontFamily: Fonts.sans,
        fontSize: FontSize.md,
        color: Colors.textPrimary,
        lineHeight: 24,
    },
    hr: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: Spacing.md,
    },
    blockquote: {
        backgroundColor: Colors.primaryLight + '55',
        borderLeftWidth: 3,
        borderLeftColor: Colors.primaryPurple,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: Radius.sm,
        marginBottom: Spacing.sm,
    },
    blockquoteText: {
        fontFamily: Fonts.sans,
        fontSize: FontSize.md,
        color: Colors.textPrimary,
        lineHeight: 24,
        fontStyle: 'italic',
    },
});
