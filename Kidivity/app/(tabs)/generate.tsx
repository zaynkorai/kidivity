import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,

} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
    Wand2,
    AlertTriangle,
    Palette,
    Printer,
    XCircle,
    Zap,
} from 'lucide-react-native';
import { useProfileStore } from '@/store/profileStore';
import { useActivityStore } from '@/store/activityStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { PaywallModal } from '@/components/ui/PaywallModal';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { ACTIVITY_CATEGORIES, type ActivityCategory } from '@/constants/categories';
import type {
    ActivityDifficulty,
    ActivityStyle,
} from '@/types/activity';

import { GeneratingOverlay } from '@/components/ui/GeneratingOverlay';
export default function GenerateScreen() {
    const router = useRouter();
    const activeProfile = useProfileStore((s) => s.getActiveProfile());
    const { generateActivity, isGenerating, rateLimitState, clearRateLimit } = useActivityStore();

    const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | null>(null);
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState<ActivityDifficulty>('medium');
    const [style, setStyle] = useState<ActivityStyle>('colorful');
    const [error, setError] = useState<string | null>(null);
    const [showPaywall, setShowPaywall] = useState(false);

    React.useEffect(() => {
        setTopic('');
    }, [selectedCategory]);

    const suggestedTopics = React.useMemo(() => {
        if (!selectedCategory) return [];

        const categoryDefaults: Record<ActivityCategory, string[]> = {
            puzzles: ['Mazes', 'Patterns', 'Find the Difference', 'Matching', 'Sequences', 'Sorting', 'Shadows', 'Odd One Out', 'Sudoku', 'Logic Grids', 'Symmetry'],
            tracing: ['Alphabet', 'Numbers', 'Shapes', 'Lines', 'Cursive', 'Names', 'Animals', 'Vehicles', 'Spelling', 'Sight Words', 'My Family'],
            science: ['Space', 'Animals', 'Dinosaurs', 'Ocean', 'Geography', 'Human Body', 'Weather', 'Plants', 'Insects', 'Volcanoes', 'Recycling', 'Solar System'],
            art: ['Coloring Pages', 'Step-by-step Drawing', 'Origami', 'Crafts', 'Mandala', 'Pixel Art', 'Paper Airplanes', 'Finger Painting', 'Mask Making'],
            math: ['Addition', 'Counting', 'Subtraction', 'Shapes', 'Money', 'Time', 'Fractions', 'Multiplication', 'Measuring', 'Graphs', 'Word Problems'],
            reading: ['Bedtime Stories', 'Sight Words', 'Reading Comprehension', 'Phonics', 'Adventure Tales', 'Fairy Tales', 'Poetry', 'Myths & Legends', 'Rhyming', 'Vocabulary'],
        };

        let topics = [...(activeProfile?.interests || [])];

        // If no profile interests, or not enough, pad with category defaults.
        // We shuffle the defaults so they get different options every time they come to the screen
        const defaults = [...(categoryDefaults[selectedCategory] || [])].sort(() => 0.5 - Math.random());

        if (topics.length < 6) {
            for (const def of defaults) {
                if (!topics.includes(def as any)) {
                    topics.push(def as any);
                }
                if (topics.length >= 6) break;
            }
        }

        return defaults.slice(0, 6);

    }, [activeProfile, selectedCategory]);

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

    const isReady = activeProfile && selectedCategory && topic.trim();

    return (
        <SafeAreaView style={styles.safe}>
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

            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Wand2 size={24} color={Colors.primary} />
                    <Text style={styles.title}>Create Activity</Text>
                </View>

                {activeProfile && (
                    <Text style={styles.subtitle}>
                        Generating for <Text style={styles.kidName}>{activeProfile.name}</Text> ·{' '}
                        {activeProfile.age}yo · {activeProfile.grade_level}
                    </Text>
                )}

                {!activeProfile && (
                    <Card variant="outlined" style={styles.warningCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                            <AlertTriangle size={16} color={Colors.warning} />
                            <Text style={styles.warningText}>
                                Please add a kid profile first from the Home tab.
                            </Text>
                        </View>
                    </Card>
                )}

                {/* Rate limit banner */}
                {rateLimitState.hit && (
                    <TouchableOpacity
                        style={styles.rateBanner}
                        onPress={() => setShowPaywall(true)}
                        activeOpacity={0.85}
                    >
                        <Zap size={16} color={Colors.surface} fill={Colors.surface} />
                        <Text style={styles.rateBannerText}>
                            {rateLimitState.used}/{rateLimitState.limit} daily limit reached — Upgrade
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Step 1: Category */}
                <Text style={styles.sectionTitle}>1. Choose Category</Text>
                <View style={styles.categoryGrid}>
                    {ACTIVITY_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        return (
                            <TouchableOpacity
                                key={cat.id}
                                onPress={() => {
                                    setSelectedCategory(cat.id);
                                    Haptics.selectionAsync();
                                }}
                                activeOpacity={0.8}
                                style={[
                                    styles.categoryCard,
                                    selectedCategory === cat.id && {
                                        borderColor: cat.color,
                                        backgroundColor: cat.color + '10',
                                    },
                                ]}
                            >
                                <Icon size={32} color={selectedCategory === cat.id ? cat.color : Colors.textPrimary} style={{ marginBottom: Spacing.sm }} />
                                <Text
                                    style={[
                                        styles.categoryLabel,
                                        selectedCategory === cat.id && { color: cat.color },
                                    ]}
                                >
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Step 2: Topic */}
                <Text style={styles.sectionTitle}>2. Pick a Topic</Text>
                {selectedCategory ? (
                    <View>
                        <View style={[styles.optionRow, { marginBottom: Spacing.md }]}>
                            {suggestedTopics.map((t) => (
                                <Chip
                                    key={t}
                                    label={t}
                                    selected={topic.toLowerCase() === t.toLowerCase()}
                                    onPress={() => setTopic(t)}
                                />
                            ))}
                        </View>
                        <Input
                            placeholder="Or type your own topic (e.g. Space Pirates)"
                            value={topic}
                            onChangeText={setTopic}
                            maxLength={60}
                        />
                    </View>
                ) : (
                    <Text style={styles.optionLabel}>Please choose a category first.</Text>
                )}

                {/* Step 3: Style & Difficulty */}
                <Text style={styles.sectionTitle}>3. Options</Text>

                <Text style={styles.optionLabel}>Difficulty</Text>
                <View style={styles.optionRow}>
                    {(['easy', 'medium', 'hard'] as const).map((d) => (
                        <Chip
                            key={d}
                            label={d.charAt(0).toUpperCase() + d.slice(1)}
                            selected={difficulty === d}
                            onPress={() => setDifficulty(d)}
                        />
                    ))}
                </View>

                <Text style={styles.optionLabel}>Style</Text>
                <View style={styles.optionRow}>
                    <Chip
                        label="Colorful"
                        icon={Palette}
                        selected={style === 'colorful'}
                        onPress={() => setStyle('colorful')}
                    />
                    <Chip
                        label="Print (B&W)"
                        icon={Printer}
                        selected={style === 'bw'}
                        onPress={() => setStyle('bw')}
                    />
                </View>

                {/* Generate Button */}
                <Button
                    title={isGenerating ? 'Generating...' : 'Generate Activity'}
                    onPress={handleGenerate}
                    disabled={!isReady || isGenerating || rateLimitState.hit}
                    loading={isGenerating}
                    size="lg"
                    style={styles.generateBtn}
                />

                {/* Error */}
                {error && (
                    <Card variant="outlined" style={styles.errorCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
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
    content: { padding: Spacing.xl },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.xs,
    },
    title: {
        fontSize: FontSize['2xl'],
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    subtitle: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.xl,
    },
    kidName: { fontWeight: FontWeight.semibold, color: Colors.primary },
    warningCard: { marginBottom: Spacing.xl, borderColor: Colors.warning },
    warningText: { fontSize: FontSize.sm, color: Colors.textSecondary },
    rateBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.primary,
        borderRadius: Radius.md,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
    },
    rateBannerText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        color: Colors.surface,
    },
    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginTop: Spacing.xl,
        marginBottom: Spacing.md,
    },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    categoryCard: {
        width: '47%',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: Radius.lg,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    categoryLabel: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },
    interestChips: { gap: Spacing.sm, marginTop: Spacing.md },
    optionLabel: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
        marginTop: Spacing.md,
    },
    optionRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
    generateBtn: { marginTop: Spacing['2xl'] },
    errorCard: { marginTop: Spacing.lg, borderColor: Colors.accent },
    errorText: { fontSize: FontSize.sm, color: Colors.accent },
});


