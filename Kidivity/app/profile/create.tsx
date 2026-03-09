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
import { useRouter } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';
import { useProfileStore } from '@/store/profileStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { Colors, Spacing, FontSize, FontWeight } from '@/constants/theme';
import { GRADE_LEVELS } from '@/constants/grades';
import { INTEREST_OPTIONS } from '@/constants/interests';
import type { GradeLevel } from '@/constants/grades';
import type { Interest } from '@/constants/interests';

const AVATAR_COLORS = [
    '#6C63FF', '#FF6B6B', '#00B894', '#FDCB6E', '#A29BFE',
    '#FD79A8', '#00CEC9', '#E17055', '#0984E3', '#55A3E8',
];

export default function CreateProfileScreen() {
    const router = useRouter();
    const addProfile = useProfileStore((s) => s.addProfile);

    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [gradeLevel, setGradeLevel] = useState<GradeLevel | null>(null);
    const [interests, setInterests] = useState<Interest[]>([]);
    const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggleInterest = (interest: Interest) => {
        setInterests((prev) =>
            prev.includes(interest)
                ? prev.filter((i) => i !== interest)
                : [...prev, interest]
        );
    };

    const handleSubmit = async () => {
        // Validation
        if (!name.trim()) {
            setError('Please enter a name');
            return;
        }
        const ageNum = parseInt(age, 10);
        if (isNaN(ageNum) || ageNum < 1 || ageNum > 18) {
            setError('Please enter a valid age (1-18)');
            return;
        }
        if (!gradeLevel) {
            setError('Please select a grade level');
            return;
        }
        if (interests.length === 0) {
            setError('Please select at least one interest');
            return;
        }

        setError(null);
        setIsSubmitting(true);

        const { error: submitError } = await addProfile({
            name: name.trim(),
            age: ageNum,
            grade_level: gradeLevel,
            interests,
            avatar_color: avatarColor,
        });

        setIsSubmitting(false);

        if (submitError) {
            setError(submitError);
        } else {
            router.back();
        }
    };

    const isValid = name.trim() && age && gradeLevel && interests.length > 0;

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Avatar Preview */}
                    <View style={styles.avatarSection}>
                        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                            <Text style={styles.avatarInitial}>
                                {name ? name.charAt(0).toUpperCase() : '?'}
                            </Text>
                        </View>
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
                                />
                            ))}
                        </View>
                    </View>

                    {/* Name */}
                    <Input
                        label="Name"
                        placeholder="What's your kid's name?"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />

                    {/* Age */}
                    <Input
                        label="Age"
                        placeholder="How old are they?"
                        value={age}
                        onChangeText={setAge}
                        keyboardType="number-pad"
                        maxLength={2}
                        containerStyle={{ marginTop: Spacing.lg }}
                    />

                    {/* Grade Level */}
                    <Text style={styles.fieldLabel}>Grade Level</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.gradeList}
                    >
                        {GRADE_LEVELS.map((grade) => (
                            <Chip
                                key={grade}
                                label={grade}
                                selected={gradeLevel === grade}
                                onPress={() => setGradeLevel(grade)}
                            />
                        ))}
                    </ScrollView>

                    {/* Interests */}
                    <Text style={styles.fieldLabel}>
                        Interests{' '}
                        <Text style={styles.fieldHint}>
                            ({interests.length} selected)
                        </Text>
                    </Text>
                    <View style={styles.interestGrid}>
                        {INTEREST_OPTIONS.map((option) => (
                            <Chip
                                key={option.value}
                                label={option.label}
                                selected={interests.includes(option.value)}
                                onPress={() => toggleInterest(option.value)}
                            />
                        ))}
                    </View>

                    {/* Error */}
                    {error && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Spacing.lg }}>
                            <AlertTriangle size={16} color={Colors.accent} />
                            <Text style={[styles.error, { marginTop: 0, marginLeft: Spacing.xs }]}>{error}</Text>
                        </View>
                    )}

                    {/* Submit */}
                    <Button
                        title={isSubmitting ? 'Creating...' : 'Create Profile'}
                        onPress={handleSubmit}
                        loading={isSubmitting}
                        disabled={!isValid}
                        size="lg"
                        style={styles.submitBtn}
                    />

                    <View style={{ height: Spacing['4xl'] }} />
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
    container: {
        flex: 1,
    },
    content: {
        padding: Spacing.xl,
    },

    // Avatar
    avatarSection: {
        alignItems: 'center',
        marginBottom: Spacing['2xl'],
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    avatarInitial: {
        fontSize: FontSize['4xl'],
        fontWeight: FontWeight.bold,
        color: Colors.white,
    },
    colorPicker: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    colorDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    colorDotSelected: {
        borderWidth: 3,
        borderColor: Colors.textPrimary,
    },

    // Fields
    fieldLabel: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        color: Colors.textSecondary,
        marginTop: Spacing.xl,
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xs,
    },
    fieldHint: {
        color: Colors.textTertiary,
        fontWeight: FontWeight.regular,
    },

    gradeList: {
        gap: Spacing.sm,
    },
    interestGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },

    error: {
        fontSize: FontSize.sm,
        color: Colors.accent,
        marginTop: Spacing.lg,
        textAlign: 'center',
    },

    submitBtn: {
        marginTop: Spacing['2xl'],
    },
});
