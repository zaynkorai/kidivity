import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Wand2, ArrowRight, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useProfileStore } from '@/store/profileStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Radius, FontSize, FontWeight, Fonts, Shadows } from '@/constants/theme';
import { useOnboardingGuard } from '@/hooks/useOnboardingGuard';
import { useOnboardingSessionStore } from '@/store/onboardingSession.store';
import { GRADE_LEVELS } from '@/constants/grades';
import type { GradeLevel } from '@/constants/grades';

const AVATAR_COLORS = [
    '#FF8A00', '#FECAC3', '#A2DDC2', '#FFE3C1', '#8AE3FF', '#E7E1FF',
    '#FD79A8', '#00CEC9', '#E17055', '#0984E3', '#55A3E8',
];

// Steps: 0 = Name & Avatar, 1 = Age & Grade
const STEP_COUNT = 2;

export default function OnboardingCreateProfileScreen() {
    useOnboardingGuard(3);
    const router = useRouter();
    const addProfile = useProfileStore((s) => s.addProfile);
    const setGlobalStep = useOnboardingSessionStore(s => s.setStep);

    const [step, setStep] = useState(0);
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [gradeLevel, setGradeLevel] = useState<GradeLevel | null>(null);
    const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canAdvance = () => {
        switch (step) {
            case 0:
                return name.trim().length > 0;
            case 1: {
                const ageNum = parseInt(age, 10);
                return !isNaN(ageNum) && ageNum >= 1 && ageNum <= 12 && gradeLevel !== null;
            }
            default:
                return false;
        }
    };

    const handleNext = () => {
        setError(null);
        if (step < STEP_COUNT - 1) {
            setStep(step + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(step - 1);
            setError(null);
        }
    };

    const handleSubmit = async () => {
        const ageNum = parseInt(age, 10);
        if (!name.trim() || isNaN(ageNum) || !gradeLevel) {
            setError('Please complete all fields.');
            return;
        }

        setError(null);
        setIsSubmitting(true);

        const { error: submitError, data: newProfile } = await addProfile({
            name: name.trim(),
            age: ageNum,
            grade_level: gradeLevel,
            avatar_color: avatarColor,
        });

        setIsSubmitting(false);

        if (submitError) {
            setError(submitError);
        } else if (newProfile) {
            setGlobalStep(4);
            // Transition to the upload screen (Step 4)
            router.push('/(onboarding)/upload');
        }
    };

    const stepTitles = [
        { title: 'Who is this for?', subtitle: 'Let\'s personalize their learning journey' },
        { title: 'Calibrating Engine...', subtitle: 'We use age and grade to dial in math complexity and vocabulary' },
    ];

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                        {Array.from({ length: STEP_COUNT }).map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.progressDot,
                                    i <= step && styles.progressDotActive,
                                ]}
                            />
                        ))}
                    </View>

                    {/* Step Header */}
                    <View style={styles.stepHeader}>
                        <View style={styles.stepBadge}>
                            <Wand2 size={20} color={Colors.white} />
                        </View>
                        <Text style={styles.stepTitle}>{stepTitles[step].title}</Text>
                        <Text style={styles.stepSubtitle}>{stepTitles[step].subtitle}</Text>
                    </View>

                    {/* Step 0: Name & Avatar */}
                    {step === 0 && (
                        <View style={styles.stepContent}>
                            {/* Avatar Preview */}
                            <View style={styles.avatarSection}>
                                <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                                    <Text style={styles.avatarInitial}>
                                        {name ? name.charAt(0).toUpperCase() : '?'}
                                    </Text>
                                </View>
                            </View>

                            <Input
                                label="Child's Name"
                                placeholder="e.g. Aisha, Noah, Luna..."
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                                autoFocus
                            />

                            {/* Color Picker */}
                            <Text style={styles.fieldLabel}>Pick a color</Text>
                            <View style={styles.colorPicker}>
                                {AVATAR_COLORS.map((color) => (
                                    <TouchableOpacity
                                        key={color}
                                        onPress={() => setAvatarColor(color)}
                                        style={[
                                            styles.colorDot,
                                            { backgroundColor: color },
                                            avatarColor === color && styles.colorDotSelected,
                                        ]}
                                    >
                                        {avatarColor === color && (
                                            <Check size={14} color={Colors.white} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Step 1: Age & Grade */}
                    {step === 1 && (
                        <View style={styles.stepContent}>
                            <Input
                                label="Age"
                                placeholder="How old are they?"
                                value={age}
                                onChangeText={setAge}
                                keyboardType="number-pad"
                                returnKeyType="done"
                                maxLength={2}
                                autoFocus
                            />

                            <Text style={styles.fieldLabel}>Grade Level</Text>
                            <View style={styles.gradeGrid}>
                                {GRADE_LEVELS.map((grade) => (
                                    <Chip
                                        key={grade}
                                        label={grade}
                                        selected={gradeLevel === grade}
                                        onPress={() => setGradeLevel(grade)}
                                    />
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Error */}
                    {error && <Text style={styles.error}>{error}</Text>}

                    {/* Navigation Buttons */}
                    <View style={styles.navButtons}>
                        {step > 0 && (
                            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                                <Text style={styles.backBtnText}>Back</Text>
                            </TouchableOpacity>
                        )}

                        <Button
                            title={step === STEP_COUNT - 1 ? 'Create Profile' : 'Continue'}
                            onPress={handleNext}
                            disabled={!canAdvance()}
                            loading={isSubmitting}
                            size="lg"
                            style={step === 0 ? styles.nextBtnFull : styles.nextBtn}
                            icon={
                                step === STEP_COUNT - 1 ? (
                                    <Wand2 size={20} color={Colors.white} />
                                ) : (
                                    <ArrowRight size={20} color={Colors.white} />
                                )
                            }
                        />
                    </View>

                    {/* Preview Card (last step) */}
                    {step === STEP_COUNT - 1 && name.trim() && (
                        <Card variant="outlined" style={styles.previewCard}>
                            <View style={styles.previewRow}>
                                <View style={[styles.previewAvatar, { backgroundColor: avatarColor }]}>
                                    <Text style={styles.previewInitial}>
                                        {name.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View>
                                    <Text style={styles.previewName}>{name}</Text>
                                    <Text style={styles.previewMeta}>
                                        {age ? `${age}yo` : ''}{gradeLevel ? ` · ${gradeLevel}` : ''}
                                    </Text>
                                </View>
                            </View>
                        </Card>
                    )}

                    <View style={styles.bottomSpacer} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    flex: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: Spacing['2xl'],
    },

    // Progress
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing['3xl'],
        marginTop: Spacing.lg,
    },
    progressDot: {
        width: 40,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.border,
    },
    progressDotActive: {
        backgroundColor: Colors.primary,
    },

    // Step Header
    stepHeader: {
        alignItems: 'center',
        marginBottom: Spacing['2xl'],
    },
    stepBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
        ...Shadows.md,
    },
    stepTitle: {
        fontSize: FontSize['2xl'],
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: Spacing.xs,
    },
    stepSubtitle: {
        fontSize: FontSize.md,
        fontFamily: Fonts.sans,
        color: Colors.textPrimary,
        textAlign: 'center',
    },

    // Step Content
    stepContent: {
        marginBottom: Spacing.xl,
    },

    // Avatar
    avatarSection: {
        alignItems: 'center',
        marginBottom: Spacing['2xl'],
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.lg,
    },
    avatarInitial: {
        fontSize: 40,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.white,
    },

    // Color picker
    colorPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
        justifyContent: 'center',
    },
    colorDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    colorDotSelected: {
        borderWidth: 3,
        borderColor: Colors.textPrimary,
    },

    // Fields
    fieldLabel: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.medium,
        fontWeight: FontWeight.medium,
        color: Colors.textPrimary,
        marginTop: Spacing.xl,
        marginBottom: Spacing.md,
        marginLeft: Spacing.xs,
    },

    // Grades
    gradeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },


    // Error
    error: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.sans,
        color: Colors.accent,
        textAlign: 'center',
        marginBottom: Spacing.md,
    },

    // Navigation
    navButtons: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.lg,
    },
    backBtn: {
        flex: 0.4,
        paddingVertical: 16,
        borderRadius: Radius.lg,
        borderWidth: 1.5,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backBtnText: {
        fontSize: FontSize.md,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },
    nextBtn: {
        flex: 0.6,
        borderRadius: Radius.lg,
        paddingVertical: 16,
    },
    nextBtnFull: {
        flex: 1,
        borderRadius: Radius.lg,
        paddingVertical: 16,
    },

    // Preview Card
    previewCard: {
        marginTop: Spacing.xl,
    },
    previewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.sm,
    },
    previewAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewInitial: {
        fontSize: FontSize.lg,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.white,
    },
    previewName: {
        fontSize: FontSize.md,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },
    previewMeta: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.sans,
        color: Colors.textPrimary,
        marginTop: 2,
    },
    // Building Overlay
    buildingOverlay: {
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        elevation: 10,
    },
    buildingContent: {
        alignItems: 'center',
        padding: Spacing['2xl'],
    },
    buildingTitle: {
        fontSize: FontSize['2xl'],
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    buildingSubtitle: {
        fontSize: FontSize.md,
        fontFamily: Fonts.sans,
        color: Colors.textPrimary,
        textAlign: 'center',
    },
    bottomSpacer: {
        height: Spacing['4xl'],
    },
});
