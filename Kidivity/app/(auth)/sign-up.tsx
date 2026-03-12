import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, CheckCircle, BookOpen, Star } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Colors, Spacing, Radius, FontSize, FontWeight, Fonts, Shadows } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { useResponsive } from '@/hooks/useResponsive';
const ScreenColors = {
    background: Colors.background,
    formBg: Colors.surface,
    purpleHeader: Colors.pastelPurple,
    purpleText: Colors.textPrimary,
    textMain: Colors.textPrimary,
    textPrimary: Colors.textPrimary,
    textSecondary: Colors.textPrimary,
};

export default function SignUpScreen() {
    const { height, isCompact, isShort } = useResponsive();
    const router = useRouter();
    const { signUp, isLoading } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState(false);

    const passwordChecks = {
        length: password.length >= 6,
        match: password.length > 0 && password === confirmPassword,
    };

    const handleSignUp = async () => {
        setErrors({});

        const newErrors: Record<string, string> = {};
        if (!email.trim()) {
            newErrors.email = 'Email is required';
        }
        if (!password) {
            newErrors.password = 'Password is required';
        }
        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (!passwordChecks.length) {
            setErrors({ password: 'Password must be at least 6 characters.' });
            return;
        }
        if (!passwordChecks.match) {
            setErrors({ confirmPassword: 'Passwords do not match.' });
            return;
        }

        const result = await signUp(email.trim(), password);
        if (result.error) {
            setErrors({ form: result.error });
        } else {
            if (!useAuthStore.getState().session) {
                setSuccess(true);
            }
        }
    };

    if (success) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.successContainer}>
                    <View style={styles.successIcon}>
                        <CheckCircle size={isShort ? 48 : 64} color={Colors.success} />
                    </View>
                    <Text style={styles.successTitle}>Account Created!</Text>
                    <Text style={styles.successSubtitle}>
                        Check your email to verify your account, then sign in to get started.
                    </Text>
                    <Button
                        title="Back to Sign In"
                        onPress={() => router.back()}
                        size="lg"
                        style={styles.successButton}
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        isShort && { paddingBottom: Spacing['3xl'] },
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <View style={styles.themedContainer}>
                        <ScreenBackground variant="vibrant" />

                        {/* 1. Header Banner */}
                        <View
                            style={[
                                styles.headerBlock,
                                { height: isShort ? height * 0.20 : height * 0.40 },
                            ]}
                        >
                            <TouchableOpacity
                                onPress={() => router.back()}
                                style={styles.backButton}
                            >
                                <ArrowLeft size={24} color={ScreenColors.purpleText} />
                            </TouchableOpacity>

                            <Text style={[styles.headerTitle, isShort && { fontSize: FontSize['3xl'], lineHeight: 36 }]}>Unlock Your{'\n'}Child&apos;s Potential</Text>
                        </View>

                        {/* 2. Elevated Form Surface - Overlapping Header */}
                        <View
                            style={[
                                styles.formSurface,
                                isCompact && { paddingHorizontal: Spacing.lg },
                                isShort && { marginTop: -120, paddingBottom: Spacing.sm },
                            ]}
                        >
                            <View
                                style={[
                                    styles.formCard,
                                    isCompact && { padding: Spacing.md },
                                    isShort && { padding: Spacing.md },
                                ]}
                            >
                                <Text style={[styles.title, isShort && { fontSize: FontSize.xl, marginBottom: 0 }]}>Create Account</Text>
                                <Text style={[styles.subtitle, isShort && { marginBottom: Spacing.md, fontSize: 13 }]}>
                                    Sign up to save activities and sync across devices.
                                </Text>

                                <View style={styles.form}>
                                    <Input
                                        label="Email Address"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChangeText={(text) => {
                                            setEmail(text);
                                            if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                                        }}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                        required
                                        error={errors.email}
                                    />

                                    <Input
                                        label="Password"
                                        placeholder="Choose a strong password"
                                        value={password}
                                        onChangeText={(text) => {
                                            setPassword(text);
                                            if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                                        }}
                                        secureTextEntry
                                        autoCapitalize="none"
                                        containerStyle={{ marginTop: Spacing.md }}
                                        required
                                        error={errors.password}
                                    />

                                    <Input
                                        label="Confirm Password"
                                        placeholder="Re-enter your password"
                                        value={confirmPassword}
                                        onChangeText={(text) => {
                                            setConfirmPassword(text);
                                            if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                                        }}
                                        secureTextEntry
                                        autoCapitalize="none"
                                        containerStyle={{ marginTop: Spacing.sm }}
                                        required
                                        error={errors.confirmPassword}
                                    />

                                    {/* Upgraded Password Strength Indicators */}
                                    <View style={[styles.checks, isShort && { marginTop: Spacing.md }]}>
                                        <View style={styles.checkRow}>
                                            <View
                                                style={[
                                                    styles.checkPill,
                                                    passwordChecks.length && styles.checkPillActive,
                                                ]}
                                            />
                                            <Text
                                                style={[
                                                    styles.checkText,
                                                    passwordChecks.length && styles.checkTextActive,
                                                ]}
                                            >
                                                At least 6 characters
                                            </Text>
                                        </View>
                                        <View style={styles.checkRow}>
                                            <View
                                                style={[
                                                    styles.checkPill,
                                                    passwordChecks.match && styles.checkPillActive,
                                                ]}
                                            />
                                            <Text
                                                style={[
                                                    styles.checkText,
                                                    passwordChecks.match && styles.checkTextActive,
                                                ]}
                                            >
                                                Passwords match
                                            </Text>
                                        </View>
                                    </View>

                                    {errors.form ? <Text style={styles.errorText}>{errors.form}</Text> : null}

                                    <Button
                                        title="Create Account"
                                        onPress={handleSignUp}
                                        loading={isLoading}
                                        disabled={!passwordChecks.length || !passwordChecks.match}
                                        size="lg"
                                        style={[
                                            styles.submitButton,
                                            isShort && { marginTop: Spacing.md, paddingVertical: 12 }
                                        ]}
                                        icon={<ArrowRight size={20} color={Colors.white} />}
                                    />

                                    <TouchableOpacity
                                        onPress={() => router.back()}
                                        style={[styles.switchLink, isShort && { marginTop: Spacing.md }]}
                                    >
                                        <Text style={styles.switchLinkText}>
                                            Already have an account?{' '}
                                            <Text style={styles.switchLinkBold}>Sign In</Text>
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    flex: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    themedContainer: {
        backgroundColor: 'transparent',
    },

    // 1. Header Block (Purple)
    headerBlock: {
        width: '100%',
        backgroundColor: 'transparent',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? Spacing['xl'] : Spacing['3xl'],
        left: Spacing['2xl'],
        zIndex: 20,
        width: 44,
        height: 44,
        borderRadius: Radius.full,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.md,
    },
    illustrationGroup: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    floatingIcon: {
        position: 'absolute',
    },
    headerTitle: {
        fontSize: FontSize['4xl'],
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: ScreenColors.purpleText,
        textAlign: 'center',
        lineHeight: 44,
        letterSpacing: -1,
    },

    // 2. Overlapping Elevated Form
    formSurface: {
        paddingHorizontal: Spacing.lg,
        marginTop: -100, // The overlap effect
        paddingBottom: Spacing.xs,
    },
    formCard: {
        backgroundColor: ScreenColors.formBg,
        borderRadius: Radius.xl,
        padding: Spacing.lg,
        ...Shadows.lg,
    },
    title: {
        fontSize: FontSize['2xl'],
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: ScreenColors.textMain,
        marginBottom: Spacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.sans,
        color: ScreenColors.textPrimary,
        textAlign: 'center',
        marginBottom: Spacing['xl'],
    },
    form: {
        width: '100%',
    },

    // Password checks
    checks: {
        marginTop: Spacing.md,
        gap: Spacing.xs,
    },
    checkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    checkPill: {
        width: 16,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.disabled + '80', // Soft disabled color
    },
    checkPillActive: {
        backgroundColor: Colors.success,
    },
    checkText: {
        fontSize: FontSize.sm,
        color: Colors.textPrimary,
        fontFamily: Fonts.medium,
        fontWeight: FontWeight.medium,
    },
    checkTextActive: {
        color: Colors.success,
    },

    // Error
    errorText: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.sans,
        color: Colors.accent,
        textAlign: 'center',
        marginTop: Spacing.md,
    },

    // Submit
    submitButton: {
        width: '100%',
        marginTop: Spacing['2xl'],
        borderRadius: Radius.full,
        paddingVertical: 18,
    },

    // Switch link
    switchLink: {
        alignItems: 'center',
        marginTop: Spacing.xl,
    },
    switchLinkText: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.sans,
        color: ScreenColors.textPrimary,
    },
    switchLinkBold: {
        color: ScreenColors.textMain,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.extrabold,
    },

    // Success
    successContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing['3xl'],
    },
    successIcon: {
        marginBottom: Spacing['2xl'],
    },
    successTitle: {
        fontSize: FontSize['2xl'],
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: ScreenColors.textMain,
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    successSubtitle: {
        fontSize: FontSize.md,
        fontFamily: Fonts.sans,
        color: ScreenColors.textPrimary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: Spacing['3xl'],
    },
    successButton: {
        width: '100%',
        borderRadius: Radius.lg,
        paddingVertical: 16,
    },
});
