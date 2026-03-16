import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useProfileStore } from '@/store/profileStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { Colors, Spacing, FontSize, FontWeight, Fonts } from '@/constants/theme';
import { GRADE_LEVELS } from '@/constants/grades';
import type { GradeLevel } from '@/constants/grades';

const AVATAR_COLORS = Colors.avatar;

interface ProfileFormProps {
    onSuccess?: () => void;
    isCompact?: boolean;
}

export function ProfileForm({ onSuccess, isCompact }: ProfileFormProps) {
    const addProfile = useProfileStore((s) => s.addProfile);

    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [gradeLevel, setGradeLevel] = useState<GradeLevel | null>(null);
    const [avatarColor, setAvatarColor] = useState<string>(AVATAR_COLORS[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = async () => {
        setErrors({});
        const newErrors: Record<string, string> = {};
        if (!name.trim()) {
            newErrors.name = 'Please enter a name';
        }
        const ageNum = parseInt(age, 10);
        if (isNaN(ageNum) || ageNum < 1 || ageNum > 12) {
            newErrors.age = 'Please enter a valid age (1-12)';
        }
        if (!gradeLevel) {
            newErrors.gradeLevel = 'Please select a grade level';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);

        const { error: submitError } = await addProfile({
            name: name.trim(),
            age: ageNum,
            grade_level: gradeLevel as GradeLevel,
            avatar_color: avatarColor,
        });

        setIsSubmitting(false);

        if (submitError) {
            setErrors({ form: submitError });
        } else {
            onSuccess?.();
        }
    };

    const isValid = name.trim() && age && gradeLevel;

    return (
        <View style={styles.container}>
            {/* Avatar Preview */}
            <View style={styles.avatarSection}>
                <View style={[styles.avatar, { backgroundColor: avatarColor }, isCompact && { width: 64, height: 64, borderRadius: 32 }]}>
                    <Text style={[styles.avatarInitial, isCompact && { fontSize: FontSize['3xl'] }]}>
                        {name ? name.charAt(0).toUpperCase() : '?'}
                    </Text>
                </View>
                <View style={styles.labelContainer}>
                    <Text style={styles.fieldLabel}>Pick a color</Text>
                    <Text style={styles.requiredStar}>*</Text>
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
                onChangeText={(text) => {
                    setName(text);
                    if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                }}
                autoCapitalize="words"
                required
                error={errors.name}
            />

            {/* Age */}
            <Input
                label="Age"
                placeholder="How old are they?"
                value={age}
                onChangeText={(text) => {
                    setAge(text);
                    if (errors.age) setErrors(prev => ({ ...prev, age: '' }));
                }}
                keyboardType="number-pad"
                maxLength={2}
                containerStyle={styles.ageInput}
                required
                error={errors.age}
            />

            {/* Grade Level */}
            <View style={styles.labelContainer}>
                <Text style={styles.fieldLabel}>Grade Level</Text>
                <Text style={styles.requiredStar}>*</Text>
            </View>
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
                        onPress={() => {
                            setGradeLevel(grade);
                            if (errors.gradeLevel) setErrors(prev => ({ ...prev, gradeLevel: '' }));
                        }}
                    />
                ))}
            </ScrollView>

            {/* Error */}
            {(errors.form || errors.gradeLevel) && (
                <View style={styles.errorContainer}>
                    <AlertTriangle size={16} color={Colors.accent} />
                    <Text style={[styles.error, styles.errorTextMargin]}>{errors.form || errors.gradeLevel}</Text>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
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
        fontFamily: Fonts.bold,
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
    fieldLabel: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.medium,
        fontWeight: FontWeight.medium,
        color: Colors.textPrimary,
        marginTop: Spacing.xl,
        marginBottom: Spacing.sm,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    requiredStar: {
        color: Colors.accent,
        fontSize: FontSize.sm,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        marginTop: Spacing.xl,
        marginBottom: Spacing.sm,
    },
    gradeList: {
        gap: Spacing.sm,
    },
    error: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.sans,
        color: Colors.accent,
        marginTop: Spacing.lg,
        textAlign: 'center',
    },
    submitBtn: {
        marginTop: Spacing['2xl'],
    },
    ageInput: {
        marginTop: Spacing.lg,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.lg,
    },
    errorTextMargin: {
        marginTop: 0,
        marginLeft: Spacing.xs,
    },
});
