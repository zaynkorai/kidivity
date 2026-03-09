import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
} from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useProfileStore } from '@/store/profileStore';
import { useActivityStore } from '@/store/activityStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { ACTIVITY_CATEGORIES, type ActivityCategory } from '@/constants/categories';
import type { ActivityDifficulty, ActivityStyle } from '@/types/activity';

export default function GenerateScreen() {
    const activeProfile = useProfileStore((s) => s.getActiveProfile());
    const { generateActivity, isGenerating } = useActivityStore();

    const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | null>(null);
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState<ActivityDifficulty>('medium');
    const [style, setStyle] = useState<ActivityStyle>('colorful');
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!activeProfile || !selectedCategory || !topic.trim()) return;

        setError(null);
        setResult(null);

        const { data, error: err } = await generateActivity({
            kid_profile_id: activeProfile.id,
            category: selectedCategory,
            topic: topic.trim(),
            difficulty,
            style,
        });

        if (err) {
            setError(err);
        } else if (data) {
            setResult(data.content);
        }
    };

    const isReady = activeProfile && selectedCategory && topic.trim();

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Sparkles size={24} color={Colors.primary} />
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
                        <Text style={styles.warningText}>
                            ⚠️ Please add a kid profile first from the Home tab.
                        </Text>
                    </Card>
                )}

                {/* Step 1: Category */}
                <Text style={styles.sectionTitle}>1. Choose Category</Text>
                <View style={styles.categoryGrid}>
                    {ACTIVITY_CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            onPress={() => setSelectedCategory(cat.id)}
                            activeOpacity={0.8}
                            style={[
                                styles.categoryCard,
                                selectedCategory === cat.id && {
                                    borderColor: cat.color,
                                    backgroundColor: cat.color + '10',
                                },
                            ]}
                        >
                            <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                            <Text
                                style={[
                                    styles.categoryLabel,
                                    selectedCategory === cat.id && { color: cat.color },
                                ]}
                            >
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
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
                        label="🎨 Colorful"
                        selected={style === 'colorful'}
                        onPress={() => setStyle('colorful')}
                    />
                    <Chip
                        label="🖨️ Print (B&W)"
                        selected={style === 'bw'}
                        onPress={() => setStyle('bw')}
                    />
                </View>

                {/* Generate Button */}
                <Button
                    title={isGenerating ? 'Generating...' : 'Generate Activity ✨'}
                    onPress={handleGenerate}
                    disabled={!isReady}
                    loading={isGenerating}
                    size="lg"
                    style={styles.generateBtn}
                />

                {/* Error */}
                {error && (
                    <Card variant="outlined" style={styles.errorCard}>
                        <Text style={styles.errorText}>❌ {error}</Text>
                    </Card>
                )}

                {/* Result */}
                {result && (
                    <Card variant="elevated" style={styles.resultCard}>
                        <Text style={styles.resultTitle}>Generated Activity</Text>
                        <Text style={styles.resultContent}>{result}</Text>
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
    categoryEmoji: {
        fontSize: 32,
        marginBottom: Spacing.sm,
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

    resultCard: {
        marginTop: Spacing.lg,
    },
    resultTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    resultContent: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        lineHeight: 24,
    },
});
