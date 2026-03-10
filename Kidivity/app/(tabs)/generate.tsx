import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
} from 'lucide-react-native';
import { useProfileStore } from '@/store/profileStore';
import { useActivityStore } from '@/store/activityStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { PaywallModal } from '@/components/ui/PaywallModal';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Colors, Spacing, Radius, FontSize, Fonts, Shadows } from '@/constants/theme';
import { ACTIVITY_CATEGORIES, type ActivityCategory } from '@/constants/categories';
import type {
    ActivityDifficulty,
    ActivityStyle,
} from '@/types/activity';

import { GeneratingOverlay } from '@/components/ui/GeneratingOverlay';
export default function GenerateScreen() {
    const router = useRouter();
    const { category } = useLocalSearchParams<{ category?: ActivityCategory }>();
    const activeProfile = useProfileStore((s) => s.getActiveProfile());
    const { generateActivity, isGenerating, rateLimitState, clearRateLimit } = useActivityStore();

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
    const accentColor = selectedCategoryData?.color ?? Colors.primaryPurple;

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
            tracing: ['Alphabet', 'Numbers', 'Shapes', 'Lines', 'Cursive', 'Names', 'Animals', 'Vehicles', 'Spelling', 'Sight Words', 'My Family'],
            science: ['Space', 'Animals', 'Dinosaurs', 'Ocean', 'Geography', 'Human Body', 'Weather', 'Plants', 'Insects', 'Volcanoes', 'Recycling', 'Solar System'],
            art: ['Coloring Pages', 'Step-by-step Drawing', 'Origami', 'Crafts', 'Mandala', 'Pixel Art', 'Paper Airplanes', 'Finger Painting', 'Mask Making'],
            math: ['Addition', 'Counting', 'Subtraction', 'Shapes', 'Money', 'Time', 'Fractions', 'Multiplication', 'Measuring', 'Graphs', 'Word Problems'],
            reading: ['Bedtime Stories', 'Sight Words', 'Reading Comprehension', 'Phonics', 'Adventure Tales', 'Fairy Tales', 'Poetry', 'Myths & Legends', 'Rhyming', 'Vocabulary'],
        };

        const topics = (activeProfile?.interests ?? []).map((t) => String(t));

        // If no profile interests, or not enough, pad with category defaults.
        // We shuffle the defaults so they get different options every time they come to the screen
        const defaults = [...(categoryDefaults[selectedCategory] || [])].sort(() => 0.5 - Math.random());

        if (topics.length < 6) {
            for (const def of defaults) {
                if (!topics.some((t) => t.toLowerCase() === def.toLowerCase())) topics.push(def);
                if (topics.length >= 6) break;
            }
        }

        return topics.slice(0, 6);

    }, [activeProfile?.interests, selectedCategory]);

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
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerIconWrap}>
                        <Wand2 size={22} color={Colors.surface} />
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.title}>Generate an activity</Text>
                        <Text style={styles.subtitle}>
                            Pick a category and topic. We’ll create a ready-to-print worksheet.
                        </Text>
                    </View>
                </View>

                {activeProfile ? (
                    <Card variant="outlined" padding="md" style={styles.kidCard}>
                        <View style={styles.kidRow}>
                            <View style={[styles.kidAvatar, { backgroundColor: activeProfile.avatar_color }]}>
                                <Text style={styles.kidInitial}>
                                    {activeProfile.name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.kidTitle}>{activeProfile.name}</Text>
                                <Text style={styles.kidMeta}>
                                    {activeProfile.age}yo · {activeProfile.grade_level}
                                </Text>
                            </View>
                            <Text style={styles.kidHint}>Change in Home</Text>
                        </View>
                    </Card>
                ) : (
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
                            style={{ marginTop: Spacing.md }}
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
                        <View style={{ flex: 1 }}>
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
                                        isSelected && {
                                            borderColor: cat.color,
                                            backgroundColor: cat.color + '10',
                                        },
                                    ]}
                                >
                                    <View style={styles.categoryTopRow}>
                                        <View style={[styles.categoryIconWrap, { backgroundColor: cat.color + '14' }]}>
                                            <Icon size={22} color={isSelected ? cat.color : Colors.textPrimary} />
                                        </View>
                                        {isSelected && (
                                            <View style={[styles.selectedPip, { backgroundColor: cat.color }]}>
                                                <Check size={14} color={Colors.surface} />
                                            </View>
                                        )}
                                    </View>
                                    <Text style={[styles.categoryLabel, isSelected && { color: cat.color }]}>
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
                            <Text style={[styles.stepBadgeText, { color: accentColor }]}>2</Text>
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
                                containerStyle={{ marginTop: Spacing.lg }}
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
                            <Text style={[styles.stepBadgeText, { color: Colors.categoryScience }]}>3</Text>
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
                                selected={difficulty === d}
                                onPress={() => setDifficulty(d)}
                            />
                        ))}
                    </View>

                    <Text style={[styles.optionLabel, { marginTop: Spacing.lg }]}>Output</Text>
                    <View style={styles.optionRow}>
                        <Chip
                            label="Colorful"
                            icon={Palette}
                            color={accentColor}
                            selected={style === 'colorful'}
                            onPress={() => setStyle('colorful')}
                        />
                        <Chip
                            label="Print (B&W)"
                            icon={Printer}
                            color={accentColor}
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

                <View style={{ height: Spacing['5xl'] }} />
            </ScrollView>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.background },
    container: { flex: 1 },
    content: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing['3xl'],
        paddingBottom: Spacing.xl,
        gap: Spacing.lg,
    },

    inlineRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.xs,
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
        color: Colors.textSecondary,
        lineHeight: 20,
    },

    kidCard: { borderColor: Colors.border },
    kidRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    kidAvatar: {
        width: 44,
        height: 44,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    kidInitial: {
        fontSize: FontSize.lg,
        fontFamily: Fonts.bold,
        color: Colors.textPrimary,
    },
    kidTitle: { fontSize: FontSize.md, fontFamily: Fonts.bold, color: Colors.textPrimary },
    kidMeta: { fontSize: FontSize.sm, fontFamily: Fonts.sans, color: Colors.textSecondary },
    kidHint: { fontSize: FontSize.xs, fontFamily: Fonts.medium, color: Colors.textTertiary },

    warningCard: { borderColor: Colors.warning },
    warningText: { flex: 1, fontSize: FontSize.sm, fontFamily: Fonts.sans, color: Colors.textSecondary },

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
    stepBadgeText: { fontSize: FontSize.sm, fontFamily: Fonts.bold, color: Colors.primaryPurple },
    stepTitle: { fontSize: FontSize.lg, fontFamily: Fonts.bold, color: Colors.textPrimary },
    helperText: { fontSize: FontSize.sm, fontFamily: Fonts.sans, color: Colors.textSecondary, marginBottom: Spacing.md },
    emptyHint: { fontSize: FontSize.sm, fontFamily: Fonts.medium, color: Colors.textTertiary },

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
        marginTop: Spacing.md,
        fontSize: FontSize.md,
        fontFamily: Fonts.bold,
        color: Colors.textPrimary,
    },

    topicChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },

    optionLabel: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
    },
    optionHelper: {
        fontSize: FontSize.xs,
        fontFamily: Fonts.medium,
        color: Colors.textTertiary,
        marginTop: Spacing.sm,
        marginLeft: Spacing.xs,
    },
    optionRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },

    generateBtn: { marginTop: Spacing.sm },
    ctaHint: {
        fontSize: FontSize.xs,
        fontFamily: Fonts.medium,
        color: Colors.textTertiary,
        marginTop: -Spacing.sm,
        marginLeft: Spacing.xs,
    },

    errorCard: { borderColor: Colors.accent },
    errorText: { flex: 1, fontSize: FontSize.sm, fontFamily: Fonts.medium, color: Colors.accent },
});
