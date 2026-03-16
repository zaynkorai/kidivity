import React, { useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, ScrollView, StyleSheet, Platform, Pressable } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
    Wand2,
    AlertTriangle,
    Palette,
    Printer,
    XCircle,
    Zap,
    ChevronDown,
} from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useProfileStore } from '@/store/profileStore';
import { useActivityStore } from '@/store/activityStore';
import { Button, Card, Chip, Input, PaywallModal, QuotaMeter, ScreenBackground, GeneratingOverlay } from '@/components/ui';
import { ProfileSelectorModal, CategorySelector, ProfileSwitcherButton } from '@/components/features';
import { getRandomSuggestions } from '@/constants/topics';
import { Colors, Spacing, Radius, FontSize, Fonts, Shadows, FontWeight } from '@/constants/theme';
import { ACTIVITY_CATEGORIES, type ActivityCategory } from '@/constants/categories';
import { useResponsive } from '@/hooks/useResponsive';
import type {
    ActivityDifficulty,
    ActivityStyle,
} from '@/types/activity';

export default function GenerateScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isCompact: compact, isSmallMobile: sm, isShort } = useResponsive();
    const tabBarHeight = useBottomTabBarHeight();
    const bottomPad = Math.max(tabBarHeight + insets.bottom + Spacing.lg, Spacing['3xl']);

    const { category } = useLocalSearchParams<{ category?: ActivityCategory }>();
    const profiles = useProfileStore((state) => state.profiles);
    const activeProfileId = useProfileStore((state) => state.activeProfileId);
    const activeProfile = profiles.find((p) => p.id === activeProfileId);

    const generateActivity = useActivityStore((s) => s.generateActivity);
    const isGenerating = useActivityStore((s) => s.isGenerating);
    const rateLimitState = useActivityStore((s) => s.rateLimitState);
    const fetchRecent = useActivityStore((s) => s.fetchRecent);
    const fetchQuota = useActivityStore((s) => s.fetchQuota);

    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | null>(null);
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState<ActivityDifficulty>('medium');
    const [style, setStyle] = useState<ActivityStyle>('colorful');
    const [error, setError] = useState<string | null>(null);
    const [showPaywall, setShowPaywall] = useState(false);

    const selectedCategoryData = useMemo(
        () => ACTIVITY_CATEGORIES.find((c) => c.id === selectedCategory) ?? null,
        [selectedCategory]
    );
    const accentColor = selectedCategoryData?.accent ?? Colors.secondary;

    useEffect(() => {
        fetchRecent();
        fetchQuota();
    }, []);

    useEffect(() => {
        setTopic('');
    }, [selectedCategory]);

    useEffect(() => {
        if (!category) return;
        if (!ACTIVITY_CATEGORIES.some((c) => c.id === category)) return;
        setSelectedCategory(category);
    }, [category]);

    const suggestedTopics = useMemo(() => {
        if (!selectedCategory) return [];
        return getRandomSuggestions(selectedCategory);
    }, [selectedCategory]);


    const handleGenerate = async () => {
        if (!activeProfile || !selectedCategory || !topic.trim()) return;

        // Guard: Prevent generation if limit reached
        if (rateLimitState.used >= rateLimitState.limit) {
            setShowPaywall(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            return;
        }

        setError(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const { data, error: err } = await generateActivity({
            kid_profile_id: activeProfile.id,
            category: selectedCategory,
            topic: topic.trim(),
            difficulty,
            style,
        });

        if (err === 'rate_limit') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setShowPaywall(true);
        } else if (err) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setError(err);
        } else if (data) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.push(`/activity/${data.id}`);
        }
    };

    const isReady = !!activeProfile && !!selectedCategory && !!topic.trim();

    return (
        <View style={styles.safe}>
            <ScreenBackground />
            <GeneratingOverlay visible={isGenerating} />
            <PaywallModal
                visible={showPaywall}
                used={rateLimitState.used}
                limit={rateLimitState.limit}
                onClose={() => {
                    setShowPaywall(false);
                }}
            />

            <ProfileSelectorModal
                visible={dropdownVisible}
                onClose={() => setDropdownVisible(false)}
            />

            <ScrollView
                style={styles.container}
                contentContainerStyle={[
                    styles.containerContent,
                    { paddingBottom: Spacing.xl },
                    compact && { paddingHorizontal: Spacing.md },
                    isShort && { paddingBottom: Spacing.md, gap: Spacing.sm }
                ]}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header Section (Scrollable) */}
                <View style={[
                    styles.primaryHeader,
                    { paddingTop: Math.max(insets.top + Spacing.md, Spacing.xl) }
                ]}>
                    <View style={styles.topRow}>
                        <View style={styles.header}>
                            <View style={styles.headerText}>
                                <Text style={[
                                    styles.title,
                                    { fontSize: compact ? FontSize.xl : sm ? FontSize['2xl'] - 2 : FontSize['2xl'] },
                                    { color: Colors.white }
                                ]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                                    Generate an activity
                                </Text>
                                {!compact && (
                                    <Text style={[styles.subtitle, { color: Colors.white, opacity: 0.9 }]} numberOfLines={1}>
                                        Pick a category and topic.
                                    </Text>
                                )}
                            </View>
                        </View>

                        <ProfileSwitcherButton
                            variant="onPrimary"
                            onPress={() => setDropdownVisible(true)}
                        />
                    </View>

                    {/* Quota Meter Inside Header */}
                    <QuotaMeter
                        used={rateLimitState.used}
                        limit={rateLimitState.limit}
                        variant="onPrimary"
                        onPress={() => setShowPaywall(true)}
                    />
                </View>

                <View style={styles.mainContent}>
                    {!activeProfile && (
                        <Card variant="outlined" style={styles.warningCard}>
                            <View style={styles.inlineRow}>
                                <AlertTriangle size={16} color={Colors.warning} />
                                <Text style={styles.warningText}>Create a kid profile to start generating.</Text>
                            </View>
                            <Button
                                title="Add Kid Profile"
                                onPress={() => router.push('/profile/create')}
                                variant="outline"
                                size="md"
                                style={styles.addKidBtn}
                            />
                        </Card>
                    )}

                    {/* Step 1: Category */}
                    <Card variant="elevated" style={styles.stepCard}>
                        <View style={styles.stepHeader}>
                            <View style={[styles.stepBadge, { backgroundColor: Colors.primaryLight }]}>
                                <Text style={styles.stepBadgeText}>1</Text>
                            </View>
                            <Text style={styles.stepTitle}>Choose a category</Text>
                        </View>
                        <CategorySelector
                            selectedCategory={selectedCategory}
                            onSelect={setSelectedCategory}
                        />
                    </Card>

                    {/* Step 2: Topic */}
                    <Card variant="elevated" style={styles.stepCard}>
                        <View style={styles.stepHeader}>
                            <View style={[styles.stepBadge, { backgroundColor: accentColor + '16' }]}>
                                <Text style={[styles.stepBadgeText, { color: Colors.textPrimary }]}>2</Text>
                            </View>
                            <Text style={styles.stepTitle}>Pick a topic</Text>
                        </View>
                        {selectedCategory ? (
                            <>
                                <Text style={styles.helperText}>Choose a suggestion below.</Text>
                                <View style={styles.topicChips}>
                                    {suggestedTopics.map((t) => (
                                        <Chip
                                            key={t}
                                            label={t}
                                            color={accentColor}
                                            style={topic.trim().toLowerCase() !== t.toLowerCase() ? { backgroundColor: accentColor + '08' } : undefined}
                                            selected={topic.trim().toLowerCase() === t.toLowerCase()}
                                            onPress={() => setTopic(t)}
                                        />
                                    ))}
                                </View>
                                <Input
                                    label="Topic"
                                    placeholder="Space pirates, dinosaurs, ocean animals…"
                                    value={topic}
                                    onChangeText={setTopic}
                                    maxLength={60}
                                    containerStyle={styles.topicInput}
                                    required
                                    editable={false}
                                />
                            </>
                        ) : (
                            <Text style={styles.emptyHint}>Choose a category to unlock topic suggestions.</Text>
                        )}
                    </Card>

                    {/* Step 3: Options */}
                    <Card variant="elevated" style={styles.stepCard}>
                        <View style={styles.stepHeader}>
                            <View style={[styles.stepBadge, { backgroundColor: Colors.categories.science.accent + '16' }]}>
                                <Text style={[styles.stepBadgeText, { color: Colors.textPrimary }]}>3</Text>
                            </View>
                            <Text style={styles.stepTitle}>Choose options</Text>
                        </View>

                        <Text style={styles.optionLabel}>Difficulty</Text>
                        <View style={styles.optionRow}>
                            {(['easy', 'medium', 'hard'] as const).map((d) => (
                                <Chip
                                    key={d}
                                    label={d.charAt(0).toUpperCase() + d.slice(1)}
                                    color={accentColor}
                                    style={difficulty !== d ? { backgroundColor: accentColor + '08' } : undefined}
                                    selected={difficulty === d}
                                    onPress={() => setDifficulty(d)}
                                />
                            ))}
                        </View>

                        <Text style={[styles.optionLabel, styles.marginTopLg]}>Output</Text>
                        <View style={styles.optionRow}>
                            <Chip
                                label="Colorful"
                                icon={Palette}
                                color={accentColor}
                                style={style !== 'colorful' ? { backgroundColor: accentColor + '08' } : undefined}
                                selected={style === 'colorful'}
                                onPress={() => setStyle('colorful')}
                            />
                            <Chip
                                label="Print (B&W)"
                                icon={Printer}
                                color={accentColor}
                                style={style !== 'bw' ? { backgroundColor: accentColor + '08' } : undefined}
                                selected={style === 'bw'}
                                onPress={() => setStyle('bw')}
                            />
                        </View>
                        <Text style={styles.optionHelper}>
                            {style === 'colorful'
                                ? 'Best for screens and tablets.'
                                : 'High-contrast black & white optimized for printing.'}
                        </Text>
                    </Card>

                    {/* CTA */}
                    {rateLimitState.hit ? (
                        <Button
                            title="Generate Activity"
                            onPress={() => setShowPaywall(true)}
                            variant="primary"
                            size="lg"
                            icon={<Zap size={18} color={Colors.surface} fill={Colors.surface} />}
                            style={styles.generateBtn}
                        />
                    ) : (
                        <Button
                            title={isGenerating ? 'Generating...' : 'Generate Activity'}
                            onPress={handleGenerate}
                            disabled={!isReady || isGenerating || rateLimitState.used >= rateLimitState.limit}
                            loading={isGenerating}
                            size="lg"
                            style={styles.generateBtn}
                        />
                    )}

                    {!rateLimitState.hit && !isReady && (
                        <Text style={styles.ctaHint}>Select a category and topic to enable generation.</Text>
                    )}

                    {/* Error */}
                    {error && (
                        <Card variant="outlined" style={styles.errorCard}>
                            <View style={styles.inlineRow}>
                                <XCircle size={16} color={Colors.accent} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        </Card>
                    )}
                </View>
                <View style={[styles.bottomSpacer, { height: bottomPad }]} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.background },
    container: { flex: 1 },
    containerContent: {
        paddingHorizontal: Spacing.md,
    },
    mainContent: {
        paddingBottom: Spacing.xl,
        gap: Spacing.md,
    },
    primaryHeader: {
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xl,
        borderBottomLeftRadius: Radius['2xl'],
        borderBottomRightRadius: Radius['2xl'],
        marginHorizontal: -Spacing.md,
        marginBottom: Spacing.md,
        ...Shadows.lg,
    },
    inlineRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    header: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingRight: Spacing.sm,
    },
    headerIconWrap: {
        width: 44,
        height: 44,
        borderRadius: Radius.lg,
        backgroundColor: Colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.md,
    },
    headerText: { flex: 1, gap: 4 },
    title: {
        fontSize: FontSize['2xl'],
        fontFamily: Fonts.bold,
        color: Colors.textPrimary,
        letterSpacing: -0.2,
    },
    subtitle: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.sans,
        color: Colors.textPrimary,
        lineHeight: 20,
    },
    warningCard: { borderColor: Colors.warning },
    warningText: { flex: 1, fontSize: FontSize.sm, fontFamily: Fonts.sans, color: Colors.textPrimary },
    stepCard: {
        borderRadius: Radius.xl,
        backgroundColor: Colors.surface,
    },
    stepHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
    stepBadge: {
        width: 24,
        height: 24,
        borderRadius: Radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepBadgeText: { fontSize: FontSize.sm, fontFamily: Fonts.bold, color: Colors.textPrimary },
    stepTitle: { fontSize: FontSize.lg, fontFamily: Fonts.bold, color: Colors.textPrimary },
    helperText: { fontSize: FontSize.sm, fontFamily: Fonts.sans, color: Colors.textPrimary, marginBottom: Spacing.md },
    emptyHint: { fontSize: FontSize.sm, fontFamily: Fonts.medium, color: Colors.textPrimary },
    topicChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    optionLabel: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.medium,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    optionHelper: {
        fontSize: FontSize.xs,
        fontFamily: Fonts.medium,
        color: Colors.textPrimary,
        marginTop: Spacing.sm,
        marginLeft: Spacing.xs,
    },
    optionRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
    generateBtn: { marginTop: Spacing.sm },
    ctaHint: {
        fontSize: FontSize.xs,
        fontFamily: Fonts.medium,
        color: Colors.textPrimary,
        marginTop: -Spacing.sm,
        marginLeft: Spacing.xs,
    },
    errorCard: { borderColor: Colors.accent },
    errorText: { flex: 1, fontSize: FontSize.sm, fontFamily: Fonts.medium, color: Colors.accent },
    addKidBtn: { marginTop: Spacing.md },
    topicInput: { marginTop: Spacing.lg },
    marginTopLg: { marginTop: Spacing.lg },
    bottomSpacer: { height: Spacing['5xl'] },
});
