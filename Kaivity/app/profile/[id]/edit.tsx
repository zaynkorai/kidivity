import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp, Layout, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Pressable } from 'react-native-gesture-handler';
import { Check, Trash2, Search, AlertTriangle } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileStore } from '@/store/profileStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { ParentGate } from '@/components/ui/ParentGate';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Colors, Spacing, Radius, FontSize, Fonts, Shadows } from '@/constants/theme';
import { GRADE_LEVELS } from '@/constants/grades';
import { useResponsive } from '@/hooks/useResponsive';
import type { GradeLevel } from '@/constants/grades';

const AVATAR_COLORS = Colors.avatar;

export default function EditProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const bottomPad = Math.max(insets.bottom + Spacing.lg, Spacing['4xl']);
    const { id } = useLocalSearchParams<{ id: string }>();
    const { profiles, updateProfile, deleteProfile } = useProfileStore();
    const { user } = useAuthStore();
    const { isCompact } = useResponsive();

    const profile = profiles.find((p) => p.id === id);

    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [gradeLevel, setGradeLevel] = useState<GradeLevel | null>(null);
    const [avatarColor, setAvatarColor] = useState<string>(AVATAR_COLORS[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [gateVisible, setGateVisible] = useState(false);

    // Animation Shared Values
    const deleteScale = useSharedValue(1);
    const deleteAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: deleteScale.value }],
    }));

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

        const { error: submitError } = await updateProfile(id, {
            name: name.trim(),
            age: ageNum,
            grade_level: gradeLevel as GradeLevel,
            avatar_color: avatarColor,
        });

        setIsSubmitting(false);

        if (submitError) {
            setErrors({ form: submitError });
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
                    contentContainerStyle={[styles.content, isCompact && { padding: Spacing.lg }]}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Avatar Preview */}
                    <Animated.View entering={FadeInDown.delay(100)} style={styles.avatarSection}>
                        <View style={[styles.avatar, { backgroundColor: avatarColor }, isCompact && styles.avatarCompact]}>
                            <Text style={[styles.avatarInitial, isCompact && styles.avatarInitialCompact]}>
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
                                >
                                    {avatarColor === color && (
                                        <Check size={12} color={Colors.white} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(200)}>
                        <Input
                            label="Name"
                            placeholder="Child's name"
                            value={name}
                            onChangeText={(text) => {
                                setName(text);
                                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                            }}
                            autoCapitalize="words"
                            required
                            error={errors.name}
                        />
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(300)}>
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
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(400)}>
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
                    </Animated.View>

                    {/* Error */}
                    {(errors.form || errors.gradeLevel) && (
                        <View style={styles.errorContainer}>
                            <AlertTriangle size={16} color={Colors.accent} />
                            <Text style={[styles.error, styles.errorTextMargin]}>{errors.form || errors.gradeLevel}</Text>
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
                    <Animated.View style={deleteAnimatedStyle}>
                        <Pressable
                            onPress={handleDelete}
                            onPressIn={() => (deleteScale.value = withSpring(0.96))}
                            onPressOut={() => (deleteScale.value = withSpring(1))}
                            style={styles.deleteBtn}
                        >
                            <Trash2 size={16} color={Colors.accent} />
                            <Text style={styles.deleteBtnText}>Delete Profile</Text>
                        </Pressable>
                    </Animated.View>

                    <View style={[styles.bottomSpacer, { height: bottomPad }]} />
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
        borderRadius: Radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
        ...Shadows.md,
    },
    avatarInitial: {
        fontSize: FontSize['4xl'],
        fontFamily: Fonts.bold,
        color: Colors.white,
    },
    avatarCompact: {
        width: 64,
        height: 64,
        borderRadius: Radius.full,
    },
    avatarInitialCompact: {
        fontSize: FontSize['3xl'],
    },
    colorPicker: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    colorDot: {
        width: 24,
        height: 24,
        borderRadius: Radius.full,
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
        color: Colors.textPrimary,
        marginTop: Spacing.xl,
        marginBottom: Spacing.sm,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs / 2,
    },
    requiredStar: {
        color: Colors.accent,
        fontSize: FontSize.sm,
        fontFamily: Fonts.bold,
        marginTop: Spacing.xl,
        marginBottom: Spacing.sm,
        marginLeft: 2,
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
        fontFamily: Fonts.medium,
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
        fontFamily: Fonts.bold,
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
