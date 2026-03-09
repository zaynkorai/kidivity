import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Animated,
    Easing,
    Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Wand2, AlertTriangle, Palette, Printer, XCircle } from 'lucide-react-native';
import { useProfileStore } from '@/store/profileStore';
import { useActivityStore } from '@/store/activityStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { ACTIVITY_CATEGORIES, type ActivityCategory } from '@/constants/categories';
import type { ActivityDifficulty, ActivityStyle } from '@/types/activity';

const FUN_MESSAGES = [
    '🎨 Mixing creative juices...',
    '🧠 Thinking really hard...',
    '✨ Sprinkling magic dust...',
    '🚀 Launching imagination...',
    '🌟 Crafting something special...',
    '🎯 Tailoring it just right...',
    '🎪 Setting up the fun...',
    '📚 Gathering cool ideas...',
];

function GeneratingOverlay({ visible }: { visible: boolean }) {
    const bounce = useRef(new Animated.Value(0)).current;
    const pulse = useRef(new Animated.Value(1)).current;
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        if (!visible) return;

        // Bounce animation
        const bounceAnim = Animated.loop(
            Animated.sequence([
                Animated.timing(bounce, { toValue: -20, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                Animated.timing(bounce, { toValue: 0, duration: 400, easing: Easing.in(Easing.quad), useNativeDriver: true }),
            ])
        );

        // Pulse animation
        const pulseAnim = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.15, duration: 800, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        );

        bounceAnim.start();
        pulseAnim.start();

        // Rotate fun messages
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % FUN_MESSAGES.length);
        }, 2500);

        return () => {
            bounceAnim.stop();
            pulseAnim.stop();
            clearInterval(interval);
        };
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal transparent animationType="fade" visible={visible}>
            <View style={loadingStyles.overlay}>
                <View style={loadingStyles.card}>
                    <Animated.View
                        style={[
                            loadingStyles.emoji,
                            { transform: [{ translateY: bounce }, { scale: pulse }] },
                        ]}
                    >
                        <Wand2 size={64} color={Colors.primary} />
                    </Animated.View>
                    <Text style={loadingStyles.title}>Creating Activity</Text>
                    <Text style={loadingStyles.message}>{FUN_MESSAGES[messageIndex]}</Text>
                    <View style={loadingStyles.dots}>
                        {[0, 1, 2].map((i) => (
                            <Animated.View
                                key={i}
                                style={[
                                    loadingStyles.dot,
                                    {
                                        opacity: pulse.interpolate({
                                            inputRange: [1, 1.15],
                                            outputRange: [i === 1 ? 1 : 0.3, i === 1 ? 0.3 : 1],
                                        }),
                                    },
                                ]}
                            />
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export default function GenerateScreen() {
    const router = useRouter();
    const activeProfile = useProfileStore((s) => s.getActiveProfile());
    const { generateActivity, isGenerating } = useActivityStore();

    const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | null>(null);
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState<ActivityDifficulty>('medium');
    const [style, setStyle] = useState<ActivityStyle>('colorful');
    const [error, setError] = useState<string | null>(null);

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

        if (err) {
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
                <Text style={styles.sectionTitle}>2. What topic?</Text>
                <Input
                    placeholder="e.g. Dinosaurs, Solar System, Counting..."
                    value={topic}
                    onChangeText={setTopic}
                />

                {/* Quick topic chips from kid's interests */}
                {activeProfile && activeProfile.interests.length > 0 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.interestChips}
                    >
                        {activeProfile.interests.map((interest) => (
                            <Chip
                                key={interest}
                                label={interest}
                                selected={topic === interest}
                                onPress={() => setTopic(interest)}
                            />
                        ))}
                    </ScrollView>
                )}

                {/* Step 3: Options */}
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
                    disabled={!isReady || isGenerating}
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    container: {
        flex: 1,
    },
    content: {
        padding: Spacing.xl,
    },
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
    kidName: {
        fontWeight: FontWeight.semibold,
        color: Colors.primary,
    },

    warningCard: {
        marginBottom: Spacing.xl,
        borderColor: Colors.warning,
    },
    warningText: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },

    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginTop: Spacing.xl,
        marginBottom: Spacing.md,
    },

    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
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

    interestChips: {
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },

    optionLabel: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
        marginTop: Spacing.md,
    },
    optionRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },

    generateBtn: {
        marginTop: Spacing['2xl'],
    },

    errorCard: {
        marginTop: Spacing.lg,
        borderColor: Colors.accent,
    },
    errorText: {
        fontSize: FontSize.sm,
        color: Colors.accent,
    },
});

const loadingStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.xl,
        padding: Spacing['4xl'],
        alignItems: 'center',
        width: '80%',
        maxWidth: 300,
    },
    emoji: {
        fontSize: 64,
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    message: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        minHeight: 20,
    },
    dots: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.primary,
    },
});
