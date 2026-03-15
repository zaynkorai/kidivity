import React, { useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Share,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
    ArrowLeft,
    Bookmark,
    BookmarkCheck,
    Printer,
    RefreshCw,
    Share2,
    CheckCircle2,
    Clock,
    Zap,
    Palette,
    Search,
    ImageIcon,
    Tag,
    Heart,
} from 'lucide-react-native';
import { useActivityStore } from '@/store/activityStore';
import { useJourneyStore } from '@/store/journeyStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Colors, Spacing, Radius, FontSize, Fonts, Shadows } from '@/constants/theme';
import { ACTIVITY_CATEGORIES } from '@/constants/categories';
import { GeneratingOverlay } from '@/components/ui/GeneratingOverlay';
import { useResponsive } from '@/hooks/useResponsive';
import { MarkdownContent } from '@/components/ui/MarkdownContent';
import { PromptModal } from '@/components/ui/PromptModal';
import { toLocalDateString, getWeekDates } from '@/lib/dates';


const VISUAL_CATEGORIES = new Set(['puzzles', 'tracing', 'science', 'art', 'math', 'reading']);

export default function ActivityDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const {
        recentActivities,
        savedActivities,
        toggleSaved,
        generateActivity,
        submitFeedback,
        isGenerating,
        fetchActivityDetail
    } = useActivityStore();
    const completeActivityAdhoc = useJourneyStore((state) => state.completeActivityAdhoc);
    const { isCompact, isSmallMobile, isTablet } = useResponsive();
    const insets = useSafeAreaInsets();
    const bottomPad = Math.max(insets.bottom + Spacing.lg, Spacing['5xl']);



    const activity = useMemo(() => {
        return [...recentActivities, ...savedActivities].find((a) => a.id === id);
    }, [id, recentActivities, savedActivities]);

    const [loadingDetail, setLoadingDetail] = React.useState(false);
    const [isPromptVisible, setIsPromptVisible] = React.useState(false);

    // Journey integration for completion status
    const { completions, fetchWeek } = useJourneyStore();
    const todayStr = useMemo(() => toLocalDateString(new Date()), []);

    const isCompletedToday = useMemo(() => {
        if (!activity) return false;
        return completions.some(c =>
            c.activity_id === activity.id &&
            c.completed_date === todayStr
        );
    }, [activity?.id, completions, todayStr]);

    const category = useMemo(() => {
        return ACTIVITY_CATEGORIES.find((c) => c.id === activity?.category);
    }, [activity?.category]);

    React.useEffect(() => {
        if (id && (!activity || !activity.content)) {
            setLoadingDetail(true);
            fetchActivityDetail(id).finally(() => setLoadingDetail(false));
        }
    }, [id, activity?.id, activity?.content, fetchActivityDetail]);

    // Fetch completions on mount to ensure status is accurate
    React.useEffect(() => {
        if (activity?.kid_profile_id) {
            const week = getWeekDates(new Date());
            const start = toLocalDateString(week[0]);
            const end = toLocalDateString(week[6]);
            fetchWeek(activity.kid_profile_id, start, end);
        }
    }, [activity?.kid_profile_id, fetchWeek]);

    if (!activity || loadingDetail) {
        return (
            <SafeAreaView style={styles.safe}>
                <ScreenBackground />
                <View style={styles.centered}>
                    {loadingDetail ? (
                        <RefreshCw size={32} color={Colors.primary} style={styles.rotate} />
                    ) : (
                        <Search size={48} color={Colors.textPrimary} style={styles.emptyEmoji} />
                    )}
                    <Text style={styles.emptyTitle}>{loadingDetail ? 'Loading details...' : 'Activity not found'}</Text>
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

    const handleLoveIt = async () => {
        if (!activity) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await submitFeedback(activity.id, 1);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleRedo = () => {
        if (!activity) return;
        setIsPromptVisible(true);
    };

    const handlePromptSubmit = async (feedback?: string) => {
        setIsPromptVisible(false);
        if (!activity) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Submit negative feedback first
        await submitFeedback(activity.id, -1, feedback);

        // Then regenerate
        const { data, error: err } = await generateActivity({
            kid_profile_id: activity.kid_profile_id,
            category: activity.category,
            topic: activity.topic,
            difficulty: activity.difficulty || 'medium',
            style: activity.style || 'colorful',
        });

        if (err) {
            Alert.alert('Error', typeof err === 'string' ? err : 'Failed to generate');
        } else if (data) {
            router.replace({
                pathname: '/activity/[id]',
                params: { id: data.id },
            });
        }
    };



    const handleMarkCompleted = async () => {
        if (!activity || isCompletedToday) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const res = await completeActivityAdhoc(activity.kid_profile_id, activity.id);
        if (!res.completed) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', 'Could not mark as completed. Try again.');
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Refresh week to show immediate feedback if needed, 
            // though the store update in completeActivityAdhoc should handle it.
            const week = getWeekDates(new Date());
            fetchWeek(activity.kid_profile_id, toLocalDateString(week[0]), toLocalDateString(week[6]));
        }
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
                        backgroundColor: (Colors.categories as any)[activity?.category ?? '']?.pastel || (Colors as any).primaryLight,
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
                            {activity.created_at ? new Date(activity.created_at).toLocaleDateString() : 'Recent'}
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
                            {activity.difficulty ? (activity.difficulty.charAt(0).toUpperCase() + activity.difficulty.slice(1)) : 'Medium'}
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
                        <View style={[styles.visualBadge, { backgroundColor: Colors.primary + '20' }, isSmallMobile && { padding: Spacing.xs }]}>
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

                {/* Rating / Feedback Loop */}
                <View style={[styles.feedbackSection, isSmallMobile && { marginBottom: Spacing.lg }]}>
                    <Text style={[styles.feedbackTitle, isSmallMobile && { fontSize: FontSize.sm }]}>
                        How was this activity?
                    </Text>
                    <View style={styles.feedbackRow}>
                        <TouchableOpacity
                            onPress={handleLoveIt}
                            style={[styles.feedbackBtn, activity.rating === 1 && styles.feedbackBtnActive]}
                        >
                            <Heart
                                size={isSmallMobile ? 20 : 24}
                                color={activity.rating === 1 ? Colors.white : Colors.primary}
                                fill={activity.rating === 1 ? Colors.white : 'transparent'}
                            />
                            <Text style={[styles.feedbackBtnText, activity.rating === 1 && styles.feedbackBtnTextActive]}>Love it</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleRedo}
                            style={[styles.feedbackBtn, activity.rating === -1 && styles.feedbackBtnActive]}
                        >
                            <RefreshCw
                                size={isSmallMobile ? 18 : 22}
                                color={activity.rating === -1 ? Colors.white : Colors.textPrimary}
                            />
                            <Text style={[styles.feedbackBtnText, activity.rating === -1 && styles.feedbackBtnTextActive, { color: activity.rating === -1 ? Colors.white : Colors.textPrimary }]}>Redo</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.actionRow, isSmallMobile && styles.actionRowMobile]}>
                    <Button
                        title={isCompletedToday ? "Completed Today" : "Mark Completed"}
                        onPress={handleMarkCompleted}
                        variant={isCompletedToday ? "outline" : "primary"}
                        size={isSmallMobile ? "sm" : "lg"}
                        icon={isCompletedToday ? <CheckCircle2 size={isSmallMobile ? 16 : 18} color={Colors.primary} /> : <CheckCircle2 size={isSmallMobile ? 16 : 18} color={Colors.white} />}
                        style={isSmallMobile ? { width: '100%' } : styles.flex1}
                        disabled={isCompletedToday}
                    />
                </View>

                <View style={[styles.bottomSpacer, { height: bottomPad }]} />
            </ScrollView>

            <PromptModal
                visible={isPromptVisible}
                title="Improve this activity"
                message="What would you like to change? (e.g., 'Too many numbers', 'Change theme to space')"
                placeholder="Enter your changes..."
                onCancel={() => setIsPromptVisible(false)}
                onSubmit={handlePromptSubmit}
                submitText="Redo Now"
            />
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
        paddingHorizontal: Spacing.md,
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
    },
    contentCard: {
        marginBottom: Spacing.xl,
    },
    actionRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    actionRowMobile: {
        flexDirection: 'column',
    },
    goBackBtn: {
        marginTop: Spacing.lg,
    },
    createdForKid: {
        fontFamily: Fonts.medium,
        color: Colors.textPrimary,
    },
    flex1: {
        flex: 1,
    },
    bottomSpacer: {
        height: Spacing['5xl'],
    },
    feedbackSection: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    feedbackTitle: {
        fontFamily: Fonts.medium,
        fontSize: FontSize.md,
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    feedbackRow: {
        flexDirection: 'row',
        gap: Spacing.md,
        width: '100%',
    },
    feedbackBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: Radius.md,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    feedbackBtnActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    feedbackBtnText: {
        fontFamily: Fonts.medium,
        fontSize: FontSize.sm,
        color: Colors.primary,
    },
    feedbackBtnTextActive: {
        color: Colors.white,
    },
    rotate: {
        marginBottom: Spacing.md,
    },
});
