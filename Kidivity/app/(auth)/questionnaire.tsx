import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowRight, Sparkles, Check } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, FontSize, FontWeight, Fonts, Radius, Shadows } from '@/constants/theme';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { useOnboardingGuard } from '@/hooks/useOnboardingGuard';
import { useOnboardingSessionStore } from '@/store/onboardingSession.store';

// Minimal local state for the questionnaire. 
// Can be moved to Zustand or just used to drive the "Soft Sell" transition.
type Question = {
    id: string;
    title: string;
    options: { id: string; label: string }[];
};

const QUESTIONS: Question[] = [
    {
        id: 'challenge',
        title: 'What is your biggest challenge with screen time?',
        options: [
            { id: 'mindless', label: 'Mindless video consumption' },
            { id: 'educational', label: 'Hard to find educational content' },
            { id: 'tantrums', label: 'Tantrums when turning off devices' },
            { id: 'boredom', label: 'Not challenged enough' },
        ],
    },
    {
        id: 'goal',
        title: 'What are you hoping Kidivity will help achieve?',
        options: [
            { id: 'habits', label: 'Build daily learning habits' },
            { id: 'creativity', label: 'Foster creative thinking' },
            { id: 'prep', label: 'Prepare for the next grade' },
            { id: 'independent', label: 'Independent play' },
        ],
    },
    {
        id: 'time',
        title: 'How much productive screen time are you aiming for per day?',
        options: [
            { id: '15m', label: '15 minutes' },
            { id: '30m', label: '30 minutes' },
            { id: '1hr', label: '1 hour' },
            { id: 'weekends', label: 'Just on weekends' },
        ],
    },
];

export default function QuestionnaireScreen() {
    useOnboardingGuard(2);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [showTransition, setShowTransition] = useState(false);
    const setStep = useOnboardingSessionStore(s => s.setStep);

    const question = QUESTIONS[currentStep];

    const handleSelectOption = (optionId: string) => {
        Haptics.selectionAsync();
        setAnswers(prev => ({ ...prev, [question.id]: optionId }));
    };

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (currentStep < QUESTIONS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            // Show soft sell transition
            setShowTransition(true);
            setStep(3);
            setTimeout(() => {
                router.push('/(auth)/sign-up');
            }, 3500);
        }
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        } else {
            router.back();
        }
    };

    if (showTransition) {
        // Derive dynamic copy based on answers
        const goalLabel = QUESTIONS.find(q => q.id === 'goal')
            ?.options.find(o => o.id === answers['goal'])?.label.toLowerCase() || 'learning habits';

        return (
            <SafeAreaView style={styles.safe}>
                <ScreenBackground variant="vibrant" />
                <View style={[styles.container, styles.centerAll, { paddingTop: Spacing['3xl'] + insets.top }]}>
                    <Text style={styles.transitionTitle}>We've got you covered.</Text>
                    <Text style={styles.transitionSubtitle}>
                        We specialize in turning mindless screen time into productive, <Text style={styles.transitionGoalLabel}>{goalLabel}</Text>.
                    </Text>
                    <Text style={[styles.transitionSubtitle, styles.transitionSubtitleMargin]}>
                        Let's set up your child's profile to get started.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <ScreenBackground variant="vibrant" />
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContainer,
                    { paddingTop: Spacing['2xl'] + insets.top },
                ]}
            >

                {/* Progress Indicators */}
                <View style={styles.progressContainer}>
                    {QUESTIONS.map((_, idx) => (
                        <View
                            key={idx}
                            style={[
                                styles.progressDot,
                                idx <= currentStep && styles.progressDotActive,
                            ]}
                        />
                    ))}
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>{question.title}</Text>
                </View>

                {/* Options List */}
                <View style={styles.optionsList}>
                    {question.options.map((option) => {
                        const isSelected = answers[question.id] === option.id;
                        return (
                            <TouchableOpacity
                                key={option.id}
                                activeOpacity={0.8}
                                onPress={() => handleSelectOption(option.id)}
                                style={[
                                    styles.optionCard,
                                    isSelected && styles.optionCardSelected
                                ]}
                            >
                                <Text style={[
                                    styles.optionText,
                                    isSelected && styles.optionTextSelected
                                ]}>
                                    {option.label}
                                </Text>
                                {isSelected && (
                                    <View style={styles.checkWrap}>
                                        <Check size={16} color={Colors.white} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Footer Navigation */}
                <View style={styles.footer}>
                    <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                        <Text style={styles.backText}>Back</Text>
                    </TouchableOpacity>

                    <Button
                        title={currentStep === QUESTIONS.length - 1 ? 'Finish' : 'Next'}
                        onPress={handleNext}
                        disabled={!answers[question.id]}
                        style={styles.nextBtn}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContainer: {
        flexGrow: 1,
        padding: Spacing['2xl'],
    },
    centerAll: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        padding: Spacing['3xl'],
    },

    // Progress
    progressContainer: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing['3xl'],
        marginTop: Spacing.md,
    },
    progressDot: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.border,
    },
    progressDotActive: {
        backgroundColor: Colors.primary,
    },

    // Header
    header: {
        marginBottom: Spacing['3xl'],
    },
    title: {
        fontSize: FontSize['2xl'],
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        lineHeight: 34,
    },

    // Options
    optionsList: {
        gap: Spacing.md,
        marginBottom: Spacing['4xl'],
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.xl,
        borderRadius: Radius.xl,
        borderWidth: 2,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    optionCardSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '0A',
    },
    optionText: {
        fontSize: FontSize.lg,
        fontFamily: Fonts.medium,
        fontWeight: FontWeight.medium,
        color: Colors.textPrimary,
        flex: 1,
    },
    optionTextSelected: {
        color: Colors.textPrimary,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
    },
    checkWrap: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: Spacing.md,
    },

    // Footer
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 'auto', // Pushes footer to bottom
        paddingTop: Spacing.xl,
    },
    backBtn: {
        padding: Spacing.md,
    },
    backText: {
        fontSize: FontSize.md,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },
    nextBtn: {
        flex: 0.6,
        borderRadius: Radius.lg,
    },

    // Transition Overlay
    transitionIcon: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: Colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing['2xl'],
    },
    transitionTitle: {
        fontSize: FontSize['3xl'],
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
        textAlign: 'center',
    },
    transitionSubtitle: {
        fontSize: FontSize.lg,
        fontFamily: Fonts.sans,
        color: Colors.textPrimary,
        textAlign: 'center',
        lineHeight: 28,
    },
    transitionGoalLabel: {
        color: Colors.textPrimary,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
    },
    transitionSubtitleMargin: {
        marginTop: Spacing.xl,
    },
});
