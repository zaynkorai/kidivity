import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Modal,
    TouchableWithoutFeedback,
    useWindowDimensions,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    const { isCompact: compact, isSmallMobile: sm, isShort, isTablet } = useResponsive();
    const tabBarHeight = useBottomTabBarHeight();
    const tabBarOffset = Platform.OS === 'ios' ? Spacing['2xl'] : Spacing.lg;
    const bottomPad = Math.max(tabBarHeight + tabBarOffset - Spacing.md, Spacing['3xl']);

    const { category } = useLocalSearchParams<{ category?: ActivityCategory }>();
    const profiles = useProfileStore((state) => state.profiles);
    const activeProfileId = useProfileStore((state) => state.activeProfileId);
    const setActiveProfile = useProfileStore((state) => state.setActiveProfile);
    const activeProfile = profiles.find((p) => p.id === activeProfileId);

    const { generateActivity, isGenerating, rateLimitState, clearRateLimit } = useActivityStore();

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
    const accentColor = selectedCategoryData?.accent ?? Colors.primaryPurple;

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
        <SafeAreaView style={styles.safe}>
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
                    compact && { paddingHorizontal: Spacing.md },
                    isShort && { paddingTop: Spacing.xl, paddingBottom: Spacing.md, gap: Spacing.sm }
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

                    <TouchableOpacity
                        onPress={() => setDropdownVisible(true)}
                        style={[
                            styles.profileDropdownBtn,
                            compact && { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
                        ]}
                        activeOpacity={0.85}
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
                        <ChevronDown size={16} color={Colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                {/* Dropdown Menu Modal */}
                <Modal visible={dropdownVisible} transparent animationType="fade">
                    <TouchableWithoutFeedback onPress={() => setDropdownVisible(false)}>
                        <View style={styles.dropdownOverlay}>
                            <TouchableWithoutFeedback>
                                <View style={styles.dropdownMenu}>
                                    <ScrollView style={{ maxHeight: 300 }} bounces={false} showsVerticalScrollIndicator={false}>
                                        {profiles.map(p => (
                                            <TouchableOpacity
                                                key={p.id}
                                                style={[styles.dropdownItem, p.id === activeProfileId && styles.dropdownItemActive]}
                                                onPress={() => {
                                                    setActiveProfile(p.id);
                                                    setDropdownVisible(false);
                                                    Haptics.selectionAsync();
                                                }}
                                            >
                                                <View style={[styles.profileAvatar, { backgroundColor: p.avatar_color }]}>
                                                    <Text style={styles.profileInitial}>{p.name.charAt(0).toUpperCase()}</Text>
                                                </View>
                                                <View style={styles.profileTextContainerDropdown}>
                                                    <Text style={[styles.profileNameDrop, p.id === activeProfileId && styles.dropdownItemTextActive]} numberOfLines={1}>
                                                        {p.name}
                                                    </Text>
                                                    <Text style={styles.profileMetaDrop} numberOfLines={1}>
                                                        {p.age}yo · {p.grade_level}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                    <TouchableOpacity
                                        style={styles.dropdownAddBtn}
                                        onPress={() => {
                                            setDropdownVisible(false);
                                            router.push('/profile/create');
                                        }}
                                    >
                                        <View style={styles.dropdownAddIcon}>
                                            <Plus size={16} color={Colors.textPrimary} />
                                        </View>
                                        <Text style={styles.profileNameDrop}>Add Kid</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>

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

                {/* Rate limit banner */}
                {rateLimitState.hit && (
                    <TouchableOpacity
                        style={styles.rateBanner}
                        onPress={() => setShowPaywall(true)}
                        activeOpacity={0.85}
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
                    </TouchableOpacity>
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
                        {ACTIVITY_CATEGORIES.map((cat) => {
                            const Icon = cat.icon;
                            const isSelected = selectedCategory === cat.id;

                            // Aggressive responsive scaling for all mobile devices
                            const isMobile = !isTablet; 
                            const cardPadV = isMobile ? Spacing.sm : Spacing.lg;
                            const cardPadH = isMobile ? Spacing.md : Spacing.lg;
                            const iconSz  = isMobile ? 26 : 40; 
                            const iconBr  = isMobile ? 10 : 16;
                            const labelSz = isMobile ? FontSize.sm : FontSize.md;

                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    onPress={() => {
                                        setSelectedCategory(cat.id);
                                        Haptics.selectionAsync();
                                    }}
                                    activeOpacity={0.85}
                                    style={[
                                        styles.categoryCard,
                                        { backgroundColor: cat.color + '40', borderColor: cat.color, paddingVertical: cardPadV, paddingHorizontal: cardPadH },
                                        isSelected && {
                                            borderColor: cat.accent,
                                            borderWidth: 2.5,
                                            backgroundColor: cat.accent + '18',
                                            shadowColor: cat.accent,
                                            shadowOpacity: 0.3,
                                            shadowRadius: 10,
                                            shadowOffset: { width: 0, height: 4 },
                                            elevation: 6,
                                        },
                                    ]}
                                >
                                    <View style={styles.categoryTopRow}>
                                        <View style={[styles.categoryIconWrap, {
                                            backgroundColor: isSelected ? cat.accent : cat.color,
                                            width: iconSz, height: iconSz, borderRadius: iconBr,
                                        }]}>
                                            <Icon size={isMobile ? 16 : 22} color={isSelected ? Colors.white : Colors.textPrimary} />
                                        </View>
                                        {isSelected && (
                                            <View style={[styles.selectedPip, { backgroundColor: cat.accent }]}>
                                                <Check size={13} color={Colors.white} strokeWidth={3} />
                                            </View>
                                        )}
                                    </View>
                                    <Text style={[styles.categoryLabel, { fontSize: labelSz }, isSelected && { color: cat.accent }]}>
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
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
                            <Text style={styles.helperText}>Choose a suggestion or type your own.</Text>
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
                            />
                        </>
                    ) : (
                        <Text style={styles.emptyHint}>Choose a category to unlock topic suggestions.</Text>
                    )}
                </Card>

                {/* Step 3: Options */}
                <Card variant="elevated" style={styles.stepCard}>
                    <View style={styles.stepHeader}>
                        <View style={[styles.stepBadge, { backgroundColor: Colors.categoryScience + '16' }]}>
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
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.background },
    container: { flex: 1 },
    content: {
        paddingHorizontal: Spacing.lg,
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
        borderRadius: 16,
        backgroundColor: Colors.primaryPurple,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.sm,
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
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.8)',
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
        borderRadius: 17,
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
    profileNameDrop: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    profileMetaDrop: {
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
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    dropdownMenu: {
        position: 'absolute',
        top: 80,
        right: Spacing.xl,
        width: 220,
        backgroundColor: Colors.white,
        borderRadius: Radius.xl,
        padding: Spacing.xs,
        ...Shadows.md,
        borderWidth: 1,
        borderColor: Colors.pastelPurple,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.sm,
        borderRadius: Radius.lg,
    },
    dropdownItemActive: {
        backgroundColor: Colors.primary + '0A',
    },
    dropdownItemTextActive: {
        color: Colors.primaryDark,
    },
    dropdownAddBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.sm,
        marginTop: Spacing.xs,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    dropdownAddIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.background,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderStyle: 'dashed',
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
        backgroundColor: 'rgba(255,255,255,0.18)',
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
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    stepHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
    stepBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    stepBadgeText: { fontSize: FontSize.sm, fontFamily: Fonts.bold, color: Colors.textPrimary },
    stepTitle: { fontSize: FontSize.lg, fontFamily: Fonts.bold, color: Colors.textPrimary },
    helperText: { fontSize: FontSize.sm, fontFamily: Fonts.sans, color: Colors.textPrimary, marginBottom: Spacing.md },
    emptyHint: { fontSize: FontSize.sm, fontFamily: Fonts.medium, color: Colors.textPrimary },

    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    categoryCard: {
        width: '48%',
        borderRadius: Radius.lg,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
        padding: Spacing.lg,
        ...Shadows.sm,
    },
    categoryTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    categoryIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedPip: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryLabel: {
        marginTop: Spacing.sm,
        fontSize: FontSize.md,
        fontFamily: Fonts.bold,
        color: Colors.textPrimary,
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
