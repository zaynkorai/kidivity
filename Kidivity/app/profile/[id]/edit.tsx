import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Check, Trash2, Search, AlertTriangle } from 'lucide-react-native';
import { useProfileStore } from '@/store/profileStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { ParentGate } from '@/components/ui/ParentGate';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Colors, Spacing, FontSize, FontWeight, Shadows } from '@/constants/theme';
import { GRADE_LEVELS } from '@/constants/grades';
import type { GradeLevel } from '@/constants/grades';

const AVATAR_COLORS = [
    '#FF8A00', '#FECAC3', '#A2DDC2', '#FFE3C1', '#8AE3FF', '#E7E1FF',
    '#FD79A8', '#00CEC9', '#E17055', '#0984E3', '#55A3E8',
];

export default function EditProfileScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { profiles, updateProfile, deleteProfile } = useProfileStore();
    const { user } = useAuthStore();

    const profile = profiles.find((p) => p.id === id);

    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [gradeLevel, setGradeLevel] = useState<GradeLevel | null>(null);
    const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [gateVisible, setGateVisible] = useState(false);

    // Pre-fill form with existing profile data
    useEffect(() => {
        if (profile) {
            setName(profile.name);
            setAge(String(profile.age));
            setGradeLevel(profile.grade_level);
            setAvatarColor(profile.avatar_color);
        }
    }, [profile?.id]);

    const handleSubmit = async () => {
        if (!id || !profile) return;

        if (!name.trim()) {
            setError('Please enter a name');
            return;
        }
        const ageNum = parseInt(age, 10);
        if (isNaN(ageNum) || ageNum < 1 || ageNum > 12) {
            setError('Please enter a valid age (1-12)');
            return;
        }
        if (!gradeLevel) {
            setError('Please select a grade level');
            return;
        }
        setError(null);
        setIsSubmitting(true);

        const { error: submitError } = await updateProfile(id, {
            name: name.trim(),
            age: ageNum,
            grade_level: gradeLevel,
            avatar_color: avatarColor,
        });

        setIsSubmitting(false);

        if (submitError) {
            setError(submitError);
        } else {
            router.back();
        }
    };

    const handleDelete = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setGateVisible(true);
    };

    const handleGateSuccess = () => {
        setGateVisible(false);
        if (!id || !profile) return;

        setTimeout(() => {
            Alert.alert(
                'Delete Profile',
                `Are you sure you want to delete ${profile.name}'s profile?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                            await deleteProfile(id);
                            router.back();
                        },
                    },
                ]
            );
        }, 300);
    };

    if (!profile) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.notFound}>
                    <Search size={48} color={Colors.textPrimary} style={styles.notFoundEmoji} />
                    <Text style={styles.notFoundText}>Profile not found</Text>
                    <Button title="Go Back" onPress={() => router.back()} variant="outline" />
                </View>
            </SafeAreaView>
        );
    }

    const isValid = name.trim() && age && gradeLevel;

    return (
        <SafeAreaView style={styles.safe}>
            <ScreenBackground />
            <ParentGate
                visible={gateVisible}
                onClose={() => setGateVisible(false)}
                onSuccess={handleGateSuccess}
                title="Password Required"
                description="Enter your password to delete the profile."
                userEmail={user?.email}
            />
            <KeyboardAvoidingView
                style={styles.flex}
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
                                >
                                    {avatarColor === color && (
                                        <Check size={12} color={Colors.white} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Name */}
                    <Input
                        label="Name"
                        placeholder="Child's name"
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
                        containerStyle={styles.ageInput}
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

                    {/* Error */}
                    {error && (
                        <View style={styles.errorContainer}>
                            <AlertTriangle size={16} color={Colors.accent} />
                            <Text style={[styles.error, styles.errorTextMargin]}>{error}</Text>
                        </View>
                    )}

                    {/* Submit */}
                    <Button
                        title={isSubmitting ? 'Saving...' : 'Save Changes'}
                        onPress={handleSubmit}
                        loading={isSubmitting}
                        disabled={!isValid}
                        size="lg"
                        style={styles.submitBtn}
                        icon={<Check size={20} color={Colors.white} />}
                    />

                    {/* Delete */}
                    <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                        <Trash2 size={16} color={Colors.accent} />
                        <Text style={styles.deleteBtnText}>Delete Profile</Text>
                    </TouchableOpacity>

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
        ...Shadows.md,
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
        fontWeight: FontWeight.medium,
        color: Colors.textPrimary,
        marginTop: Spacing.xl,
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xs,
    },

    gradeList: {
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

    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.xl,
        paddingVertical: Spacing.md,
    },
    deleteBtnText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        color: Colors.accent,
    },

    // Not found
    notFound: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
    },
    notFoundEmoji: {
        marginBottom: Spacing.md,
    },
    notFoundText: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
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
    bottomSpacer: {
        height: Spacing['4xl'],
    },
});
