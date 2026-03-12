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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { useResponsive } from '@/hooks/useResponsive';
import { MarkdownContent } from '@/components/ui/MarkdownContent';

const VISUAL_CATEGORIES = new Set(['tracing', 'drawings', 'logic', 'educational', 'math', 'coloring', 'story']);

export default function ActivityDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { recentActivities, savedActivities, toggleSaved, generateActivity, isGenerating } = useActivityStore();
    const { isCompact, isSmallMobile, isTablet, width } = useResponsive();
    const insets = useSafeAreaInsets();
    const bottomPad = Math.max(insets.bottom + Spacing.lg, Spacing['5xl']);

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
                            router.push({
                                pathname: '/activity/[id]',
                                params: { id: data.id },
                            });
                        }
                    },
                },
            ]
        );
    };

    // Responsive values
    const horizontalPad = isCompact ? Spacing.md : isSmallMobile ? Spacing.lg : Spacing.xl;

    return (
        <SafeAreaView style={styles.safe}>
            <ScreenBackground />
            <GeneratingOverlay visible={isGenerating} />
            {/* Top bar */}
            <View style={[styles.topBar, isSmallMobile && { paddingHorizontal: horizontalPad }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={isSmallMobile ? 20 : 22} color={Colors.textPrimary} />
                </TouchableOpacity>
                <View style={styles.topBarActions}>
                    <TouchableOpacity onPress={handleToggleSave} style={styles.iconBtn}>
                        {activity.is_saved ? (
                            <BookmarkCheck size={isSmallMobile ? 20 : 22} color={Colors.primary} />
                        ) : (
                            <Bookmark size={isSmallMobile ? 20 : 22} color={Colors.textPrimary} />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
                        <Share2 size={isSmallMobile ? 18 : 20} color={Colors.textPrimary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView 
                style={styles.container} 
                contentContainerStyle={[
                    styles.content,
                    isSmallMobile && { paddingHorizontal: horizontalPad, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
                    isTablet && { maxWidth: 600, alignSelf: 'center', width: '100%' }
                ]}
            >
                {/* Category badge + date */}
                <View style={[styles.metaRow, isSmallMobile && { marginBottom: Spacing.sm }]}>
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
                                    {Icon && <Icon size={isSmallMobile ? 12 : 14} color={Colors.textPrimary} />}
                                    <Text style={[styles.badgeText, { color: Colors.textPrimary }, isSmallMobile && { fontSize: FontSize.xs }]}>
                                        {category?.label}
                                    </Text>
                                </>
                            );
                        })()}
                    </View>

                    <View style={styles.dateWrapper}>
                        <Clock size={isSmallMobile ? 12 : 14} color={Colors.textPrimary} />
                        <Text style={[styles.dateText, isSmallMobile && { fontSize: FontSize.xs }]}>
                            {new Date(activity.created_at).toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                {/* Meta chips */}
                <View style={[styles.chipRow, isSmallMobile && { gap: Spacing.xs, marginBottom: Spacing.sm }]}>
                    <View style={[styles.metaChip, isSmallMobile && { paddingHorizontal: Spacing.xs, paddingVertical: 3 }]}>
                        <Tag size={isSmallMobile ? 12 : 14} color={Colors.textPrimary} />
                        <Text style={[styles.metaChipText, isSmallMobile && { fontSize: 11 }]}>
                            {activity.topic}
                        </Text>
                    </View>
                    <View style={[styles.metaChip, isSmallMobile && { paddingHorizontal: Spacing.xs, paddingVertical: 3 }]}>
                        <Zap size={isSmallMobile ? 12 : 14} color={Colors.textPrimary} />
                        <Text style={[styles.metaChipText, isSmallMobile && { fontSize: 11 }]}>
                            {activity.difficulty.charAt(0).toUpperCase() + activity.difficulty.slice(1)}
                        </Text>
                    </View>
                    <View style={[styles.metaChip, isSmallMobile && { paddingHorizontal: Spacing.xs, paddingVertical: 3 }]}>
                        <Palette size={isSmallMobile ? 12 : 14} color={Colors.textPrimary} />
                        <Text style={[styles.metaChipText, isSmallMobile && { fontSize: 11 }]}>
                            {activity.style === 'colorful' ? 'Colorful' : 'B&W'}
                        </Text>
                    </View>
                </View>

                {/* Visual Hero — shown for tracing/screen-free categories */}
                {VISUAL_CATEGORIES.has(activity.category) && (
                    <View style={[styles.visualHero, isSmallMobile && { marginBottom: Spacing.lg }]}>
                        {activity.image_url ? (
                            <View style={[styles.tracingContainer, isSmallMobile && { aspectRatio: 4 / 3 }]}>
                                <Image
                                    source={{ uri: activity.image_url }}
                                    style={styles.heroImage}
                                    contentFit="contain"
                                    transition={300}
                                />
                            </View>
                        ) : (
                            <View style={[styles.heroPlaceholder, isSmallMobile && { height: 140 }]}>
                                <ImageIcon size={isSmallMobile ? 36 : 48} color={Colors.textPrimary} />
                                <Text style={[styles.heroPlaceholderText, { color: Colors.textPrimary }, isSmallMobile && { fontSize: FontSize.md }]}>
                                    Visual Activity
                                </Text>
                                <Text style={styles.heroPlaceholderSub}>
                                    Image generation may take a moment
                                </Text>
                            </View>
                        )}
                        <View style={[styles.visualBadge, { backgroundColor: (category?.color ?? Colors.primary) + '20' }, isSmallMobile && { padding: Spacing.xs }]}>
                            <ImageIcon size={isSmallMobile ? 10 : 12} color={Colors.textPrimary} />
                            <Text style={[styles.visualBadgeText, { color: Colors.textPrimary }, isSmallMobile && { fontSize: 11 }]}>
                                Visual Activity
                            </Text>
                        </View>
                    </View>
                )}

                {/* Content */}
                <Card variant="elevated" style={[styles.contentCard, isSmallMobile && { marginBottom: Spacing.lg }]} padding={isSmallMobile ? 'md' : 'xl'}>
                    {!VISUAL_CATEGORIES.has(activity.category) && activity.image_url && (
                        <Image
                            source={{ uri: activity.image_url }}
                            style={[styles.generatedImage, isSmallMobile && { marginBottom: Spacing.lg }]}
                            contentFit="contain"
                            transition={250}
                        />
                    )}
                    <View style={[styles.contentHeaderRow, isSmallMobile && { marginBottom: Spacing.md }]}>
                        {activity.kid_name ? (
                            <Text style={[styles.kidLabel, isSmallMobile && { fontSize: FontSize.xs }]}>
                                Created for <Text style={styles.createdForKid}>{activity.kid_name}</Text>
                            </Text>
                        ) : <View style={{ flex: 1 }} />}

                        <Button
                            title={isSmallMobile ? "Print" : "Print Activity"}
                            onPress={handlePrint}
                            variant="primary"
                            size="sm"
                            icon={<Printer size={isSmallMobile ? 14 : 16} color={Colors.white} />}
                        />
                    </View>
                    <MarkdownContent content={activity.content} compact={isSmallMobile} />
                </Card>

                {/* Action buttons */}
                <View style={styles.actionRow}>
                    <Button
                        title="Regenerate"
                        onPress={handleRegenerate}
                        variant="outline"
                        size={isSmallMobile ? "md" : "lg"}
                        disabled={isGenerating}
                        loading={isGenerating}
                        icon={<RefreshCw size={isSmallMobile ? 16 : 18} color={Colors.primary} />}
                        style={styles.flex1}
                    />
                </View>

                <View style={[styles.bottomSpacer, { height: bottomPad }]} />
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
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xs,
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
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    dateWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dateText: {
        fontFamily: Fonts.sans,
        fontSize: FontSize.sm,
        color: Colors.textPrimary,
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
    contentHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.lg,
    },
    kidLabel: {
        flex: 1,
        fontFamily: Fonts.sans,
        fontSize: FontSize.sm,
        color: Colors.textPrimary,
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
});
