import React, { useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback, Platform, Pressable } from 'react-native';
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
    Check,
    ChevronDown,
    Plus,
} from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeInDown } from 'react-native-reanimated';
import { useProfileStore } from '@/store/profileStore';
import { useActivityStore } from '@/store/activityStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { PaywallModal } from '@/components/ui/PaywallModal';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Colors, Spacing, Radius, FontSize, Fonts, Shadows, FontWeight } from '@/constants/theme';
import { ACTIVITY_CATEGORIES, type ActivityCategory } from '@/constants/categories';
import { useResponsive } from '@/hooks/useResponsive';
import type {
    ActivityDifficulty,
    ActivityStyle,
} from '@/types/activity';

import { GeneratingOverlay } from '@/components/ui/GeneratingOverlay';
export default function GenerateScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isCompact: compact, isSmallMobile: sm, isShort, isTablet } = useResponsive();
    const tabBarHeight = useBottomTabBarHeight();
    const bottomPad = Math.max(tabBarHeight + insets.bottom + Spacing.lg, Spacing['3xl']);

    const { category } = useLocalSearchParams<{ category?: ActivityCategory }>();
    const profiles = useProfileStore((state) => state.profiles);
    const activeProfileId = useProfileStore((state) => state.activeProfileId);
    const setActiveProfile = useProfileStore((state) => state.setActiveProfile);
    const activeProfile = profiles.find((p) => p.id === activeProfileId);

    const generateActivity = useActivityStore((s) => s.generateActivity);
    const isGenerating = useActivityStore((s) => s.isGenerating);
    const rateLimitState = useActivityStore((s) => s.rateLimitState);
    const clearRateLimit = useActivityStore((s) => s.clearRateLimit);

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
        setTopic('');
    }, [selectedCategory]);

    useEffect(() => {
        if (!category) return;
        if (!ACTIVITY_CATEGORIES.some((c) => c.id === category)) return;
        setSelectedCategory(category);
    }, [category]);

    const suggestedTopics = useMemo(() => {
        if (!selectedCategory) return [];

        const categoryDefaults: Record<ActivityCategory, string[]> = {
            puzzles: ['Mazes', 'Patterns', 'Find the Difference', 'Matching', 'Sequences', 'Sorting', 'Shadows', 'Odd One Out', 'Sudoku', 'Logic Grids', 'Symmetry'],
            tracing: ['Alphabet', 'Numbers', 'Shapes', 'Lines', 'Animal', 'Vehicles', 'Sight Words'],
            science: ['Space', 'Animal', 'Dinosaurs', 'Ocean', 'Geography', 'Human Body', 'Weather', 'Plants', 'Insects', 'Volcanoes', 'Recycling', 'Solar System'],
            art: ['Coloring Pages', 'Step-by-step Drawing', 'Origami', 'Crafts', 'Mandala', 'Pixel Art', 'Paper Airplanes', 'Finger Painting', 'Mask Making'],
            math: ['Addition', 'Counting', 'Subtraction', 'Shapes', 'Money', 'Time', 'Fractions', 'Multiplication', 'Measuring', 'Finance', 'Word Problems'],
            reading: ['Bedtime Stories', 'Sight Words', 'Reading Comprehension', 'Phonics', 'Adventure Tales', 'Fairy Tales', 'Poetry', 'Myths & Legends', 'Rhyming', 'Vocabulary'],
        };

        const defaults = [...(categoryDefaults[selectedCategory] || [])].sort(() => 0.5 - Math.random());
        return defaults.slice(0, 6);
    }, [selectedCategory]);

    // Animation Shared Values
    const profileScale = useSharedValue(1);
    const rateBannerScale = useSharedValue(1);

    const profileAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: profileScale.value }],
    }));

    const rateBannerAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: rateBannerScale.value }],
    }));

    const onPressInProfile = () => {
        profileScale.value = withSpring(0.96);
    };
    const onPressOutProfile = () => {
        profileScale.value = withSpring(1);
    };

    const onPressInRate = () => {
        rateBannerScale.value = withSpring(0.98);
    };
    const onPressOutRate = () => {
        rateBannerScale.value = withSpring(1);
    };

    const handleGenerate = async () => {
        if (!activeProfile || !selectedCategory || !topic.trim()) return;

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
        <View style={[styles.safe, selectedCategoryData && { backgroundColor: selectedCategoryData.color + '20' }]}>
            <ScreenBackground />
            <GeneratingOverlay visible={isGenerating} />
            <PaywallModal
                visible={showPaywall}
                used={rateLimitState.used}
                limit={rateLimitState.limit}
                onClose={() => {
                    setShowPaywall(false);
                    clearRateLimit();
                }}
            />

            <ScrollView
                style={styles.container}
                contentContainerStyle={[
                    styles.content,
                    { paddingTop: Math.max(insets.top + Spacing.md, Spacing['2xl']) },
                    compact && { paddingHorizontal: Spacing.md },
                    isShort && { paddingTop: insets.top + Spacing.md, paddingBottom: Spacing.md, gap: Spacing.sm }
                ]}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header & Top Row */}
                <View style={styles.topRow}>
                    <View style={styles.header}>
                        <View style={[
                            styles.headerIconWrap,
                            compact && { width: 36, height: 36, borderRadius: 12 },
                        ]}>
                            <Wand2 size={compact ? 18 : 22} color={Colors.surface} />
                        </View>
                        <View style={styles.headerText}>
                            <Text style={[
                                styles.title,
                                { fontSize: compact ? FontSize.xl : sm ? FontSize['2xl'] - 2 : FontSize['2xl'] },
                            ]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                                Generate an activity
                            </Text>
                            {!compact && (
                                <Text style={styles.subtitle} numberOfLines={1}>
                                    Pick a category and topic.
                                </Text>
                            )}
                        </View>
                    </View>

                    <Animated.View style={profileAnimatedStyle}>
                        <Pressable
                            onPress={() => setDropdownVisible(true)}
                            onPressIn={onPressInProfile}
                            onPressOut={onPressOutProfile}
                            style={[
                                styles.profileDropdownBtn,
                                compact && { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
                            ]}
                        >
                            {activeProfile ? (
                                <View style={styles.dropdownBtnContent}>
                                    <View style={[styles.profileAvatar, { backgroundColor: activeProfile.avatar_color }]}>
                                        <Text style={styles.profileInitial}>{activeProfile.name.charAt(0).toUpperCase()}</Text>
                                    </View>
                                    {!compact && (
                                        <View style={styles.profileTextContainer}>
                                            <Text style={styles.profileName} numberOfLines={1}>
                                                {activeProfile.name}
                                            </Text>
                                            <Text style={styles.profileMeta} numberOfLines={1}>
                                                {activeProfile.age}yo · {activeProfile.grade_level}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            ) : (
                                <Text style={styles.dropdownBtnText} numberOfLines={1}>
                                    {compact ? 'Kid' : 'Select Kid'}
                                </Text>
                            )}
                            <ChevronDown size={14} color={Colors.textPrimary} />
                        </Pressable>
                    </Animated.View>
                </View>


                {!activeProfile && (
                    <Card variant="outlined" style={styles.warningCard}>
                        <View style={styles.inlineRow}>
                            <AlertTriangle size={16} color={Colors.warning} />
                            <Text style={styles.warningText}>Create a kid profile to start generating.</Text>
                        </View>
                        <Button
                            title="Add Kid Profile"
                            onPress={() => router.push('/(onboarding)/create-profile')}
                            variant="outline"
                            size="md"
                            style={styles.addKidBtn}
                        />
                    </Card>
                )}

                {/* Rate limit banner */}
                {rateLimitState.hit && (
                    <Animated.View style={rateBannerAnimatedStyle}>
                        <Pressable
                            style={styles.rateBanner}
                            onPress={() => setShowPaywall(true)}
                            onPressIn={onPressInRate}
                            onPressOut={onPressOutRate}
                        >
                            <View style={styles.rateIconWrap}>
                                <Zap size={16} color={Colors.surface} fill={Colors.surface} />
                            </View>
                            <View style={styles.flex1}>
                                <Text style={styles.rateBannerTitle}>Daily limit reached</Text>
                                <Text style={styles.rateBannerText}>
                                    {rateLimitState.used}/{rateLimitState.limit} free activities used today. Tap to upgrade.
                                </Text>
                            </View>
                        </Pressable>
                    </Animated.View>
                )}

                {/* Step 1: Category */}
                <Card variant="elevated" style={styles.stepCard}>
                    <View style={styles.stepHeader}>
                        <View style={[styles.stepBadge, { backgroundColor: Colors.primaryLight }]}>
                            <Text style={styles.stepBadgeText}>1</Text>
                        </View>
                        <Text style={styles.stepTitle}>Choose a category</Text>
                    </View>
                    <View style={styles.categoryGrid}>
                        {ACTIVITY_CATEGORIES.map((cat) => (
                            <CategoryCard
                                key={cat.id}
                                cat={cat}
                                isSelected={selectedCategory === cat.id}
                                onPress={() => {
                                    setSelectedCategory(cat.id);
                                    Haptics.selectionAsync();
                                }}
                            />
                        ))}
                    </View>
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
                        title="Upgrade to Generate More"
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
                        disabled={!isReady || isGenerating}
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

                <View style={[styles.bottomSpacer, { height: bottomPad }]} />
            </ScrollView>

            {/* Kid Selection Modal */}
            <Modal
                visible={dropdownVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setDropdownVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setDropdownVisible(false)}>
                    <View style={styles.dropdownOverlay}>
                        <View style={[styles.dropdownMenu, { top: insets.top + (isShort ? 12 : 18) }]}>
                            {/* Arrow Indicator */}
                            <View style={styles.dropdownTriangle} />
                            
                            <Text style={styles.dropdownHeader}>Switch Profile</Text>

                            {profiles.map((p) => (
                                <TouchableOpacity
                                    key={p.id}
                                    style={[
                                        styles.dropdownItem,
                                        activeProfileId === p.id && styles.dropdownItemActive
                                    ]}
                                    onPress={() => {
                                        setActiveProfile(p.id);
                                        setDropdownVisible(false);
                                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                    }}
                                >
                                    <View style={[styles.profileAvatar, { backgroundColor: p.avatar_color, width: 34, height: 34 }]}>
                                        <Text style={[styles.profileInitial, { fontSize: 13 }]}>{p.name.charAt(0).toUpperCase()}</Text>
                                    </View>
                                    <View style={styles.profileTextContainerDropdown}>
                                        <Text style={[styles.profileNameDrop, activeProfileId === p.id && styles.dropdownItemTextActive]} numberOfLines={1}>
                                            {p.name}
                                        </Text>
                                        <Text style={styles.profileMetaDrop}>{p.age}yo · {p.grade_level}</Text>
                                    </View>
                                    {activeProfileId === p.id && (
                                        <View style={styles.checkBadge}>
                                            <Check size={12} color={Colors.white} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}

                            <View style={styles.dropdownDivider} />

                            <TouchableOpacity
                                style={styles.dropdownAddBtnPolished}
                                onPress={() => {
                                    setDropdownVisible(false);
                                    router.push('/(onboarding)/create-profile');
                                }}
                            >
                                <View style={styles.dropdownAddIconPolished}>
                                    <Plus size={16} color={Colors.primary} />
                                </View>
                                <Text style={styles.dropdownAddText}>Add another kid</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}

function CategoryCard({ cat, isSelected, onPress }: { cat: typeof ACTIVITY_CATEGORIES[number], isSelected: boolean, onPress: () => void }) {
    const scale = useSharedValue(1);
    const { isTablet } = useResponsive();
    
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={[styles.categoryCardWrapper, animatedStyle]}>
            <Pressable
                onPress={onPress}
                onPressIn={() => (scale.value = withSpring(0.95))}
                onPressOut={() => (scale.value = withSpring(1))}
                style={[
                    styles.categoryCard,
                    { backgroundColor: cat.color },
                    isSelected && {
                        borderColor: cat.accent,
                        borderWidth: 3,
                    },
                ]}
            >
                {isSelected && (
                    <View style={[styles.selectedPip, { backgroundColor: cat.accent }]}>
                        <Check size={14} color={Colors.white} strokeWidth={4} />
                    </View>
                )}
                
                <Text
                    style={[
                        styles.categoryLabel,
                        isSelected && { color: cat.accent },
                    ]}
                    numberOfLines={2}
                >
                    {cat.label}
                </Text>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.background },
    container: { flex: 1 },
    content: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing['2xl'],
        paddingBottom: Spacing.xl,
        gap: Spacing.md,
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

    profileDropdownBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        backgroundColor: Colors.white,
        borderRadius: Radius.full,
        ...Shadows.sm,
    },
    dropdownBtnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    profileAvatar: {
        width: 34,
        height: 34,
        borderRadius: Radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInitial: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.white,
    },
    profileTextContainer: {
        flexShrink: 1,
        maxWidth: 90,
    },
    profileTextContainerDropdown: {
        flexShrink: 1,
    },
    profileName: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    profileMeta: {
        fontSize: FontSize.xs,
        fontFamily: Fonts.sans,
        color: Colors.textPrimary,
        marginTop: 1,
    },
    dropdownBtnText: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },
    dropdownOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    dropdownMenu: {
        position: 'absolute',
        right: Spacing.xl,
        width: 240,
        backgroundColor: Colors.white,
        borderRadius: Radius['2xl'],
        padding: Spacing.sm,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.2,
                shadowRadius: 16,
            },
            android: {
                elevation: 12,
            },
        }),
    },
    dropdownTriangle: {
        position: 'absolute',
        top: -12,
        right: 28,
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 12,
        borderRightWidth: 12,
        borderBottomWidth: 12,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: Colors.white,
    },
    dropdownHeader: {
        fontSize: FontSize.xs,
        fontFamily: Fonts.bold,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.xs,
        paddingBottom: Spacing.sm,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        borderRadius: Radius.xl,
        marginBottom: 4,
    },
    dropdownItemActive: {
        backgroundColor: Colors.primary + '10',
    },
    dropdownItemTextActive: {
        color: Colors.primaryDark,
    },
    dropdownDivider: {
        height: 1,
        backgroundColor: Colors.border + '40',
        marginVertical: Spacing.sm,
        marginHorizontal: Spacing.sm,
    },
    dropdownAddBtnPolished: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        borderRadius: Radius.xl,
    },
    dropdownAddIconPolished: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary + '08',
        borderWidth: 1,
        borderColor: Colors.primary + '20',
        borderStyle: 'dashed',
    },
    dropdownAddText: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
    profileMetaDrop: {
        fontSize: FontSize.xs,
        fontFamily: Fonts.sans,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    checkBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 'auto',
    },
    profileNameDrop: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    warningCard: { borderColor: Colors.warning },
    warningText: { flex: 1, fontSize: FontSize.sm, fontFamily: Fonts.sans, color: Colors.textPrimary },

    rateBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        backgroundColor: Colors.primary,
        borderRadius: Radius.xl,
        padding: Spacing.md,
        ...Shadows.sm,
    },
    rateIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 14,
        backgroundColor: Colors.vibrantWash,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rateBannerTitle: { fontSize: FontSize.sm, fontFamily: Fonts.bold, color: Colors.surface },
    rateBannerText: {
        fontSize: FontSize.xs,
        fontFamily: Fonts.medium,
        color: Colors.surface,
        opacity: 0.9,
        marginTop: 2,
        lineHeight: 16,
    },

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

    categoryGrid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        gap: Spacing.md, 
        justifyContent: 'center' 
    },
    categoryCardWrapper: {
        width: '31%',
    },
    categoryCard: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: Radius['2xl'],
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.md,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    categoryLabel: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.bold,
        color: Colors.textPrimary,
        textAlign: 'center',
        paddingHorizontal: Spacing.xs,
        lineHeight: 20,
    },
    selectedPip: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        ...Shadows.sm,
        borderWidth: 2,
        borderColor: Colors.white,
    },

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

    flex1: { flex: 1 },
    addKidBtn: { marginTop: Spacing.md },
    topicInput: { marginTop: Spacing.lg },
    marginTopLg: { marginTop: Spacing.lg },
    bottomSpacer: { height: Spacing['5xl'] },
});
