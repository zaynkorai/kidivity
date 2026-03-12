import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    useWindowDimensions
} from 'react-native';
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
    const { height, isCompact } = useResponsive();
    const router = useRouter();
    const { signUp, isLoading } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const passwordChecks = {
        length: password.length >= 6,
        match: password.length > 0 && password === confirmPassword,
    };

    const handleSignUp = async () => {
        setError('');

        if (!email.trim()) {
            setError('Please enter your email address.');
            return;
        }
        if (!passwordChecks.length) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (!passwordChecks.match) {
            setError('Passwords do not match.');
            return;
        }

        const result = await signUp(email.trim(), password);
        if (result.error) {
            setError(result.error);
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
                        <CheckCircle size={64} color={Colors.success} />
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
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <View style={styles.themedContainer}>
                        <ScreenBackground />

                        {/* 1. Header Banner */}
                        <View style={[styles.headerBlock, { height: height * 0.45 }]}>
                            <TouchableOpacity
                                onPress={() => router.back()}
                                style={styles.backButton}
                            >
                                <ArrowLeft size={24} color={ScreenColors.purpleText} />
                            </TouchableOpacity>

                            {/* Grouped harmonious illustration */}
                            <View style={styles.illustrationGroup}>
                                <Star size={16} color="#FFADAD" fill="#FFADAD" style={[styles.floatingIcon, { top: -10, left: -40 }]} />
                                <Star size={20} color="#FDCB6E" fill="#FDCB6E" style={[styles.floatingIcon, { bottom: 10, right: -40 }]} />
                                <BookOpen size={75} color={ScreenColors.purpleText} style={{ transform: [{ rotate: '-10deg' }] }} />
                            </View>

                            <Text style={styles.headerTitle}>Unlock Your{'\n'}Child&apos;s Potential</Text>
                        </View>

                        {/* 2. Elevated Form Surface - Overlapping Header */}
                        <View style={[styles.formSurface, isCompact && { paddingHorizontal: Spacing.lg }]}>
                            <View style={[styles.formCard, isCompact && { padding: Spacing.xl }]}>
                                <Text style={styles.title}>Create Account</Text>
                                <Text style={styles.subtitle}>
                                    Sign up to save activities and sync across devices.
                                </Text>

                                <View style={styles.form}>
                                    <Input
                                        label="Email Address"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                    />

                                    <Input
                                        label="Password"
                                        placeholder="At least 6 characters"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                        autoCapitalize="none"
                                        containerStyle={{ marginTop: Spacing.xl }}
                                    />

                                    <Input
                                        label="Confirm Password"
                                        placeholder="Re-enter your password"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry
                                        autoCapitalize="none"
                                        containerStyle={{ marginTop: Spacing.lg }}
                                    />

                                    {/* Upgraded Password Strength Indicators */}
                                    <View style={styles.checks}>
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

                                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                                    <Button
                                        title="Create Account"
                                        onPress={handleSignUp}
                                        loading={isLoading}
                                        disabled={!passwordChecks.length || !passwordChecks.match}
                                        size="lg"
                                        style={styles.submitButton}
                                        icon={<ArrowRight size={20} color={Colors.white} />}
                                    />

                                    <TouchableOpacity
                                        onPress={() => router.back()}
                                        style={styles.switchLink}
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
        backgroundColor: ScreenColors.background,
    },
    flex: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    themedContainer: {
        backgroundColor: ScreenColors.background,
    },

    // 1. Header Block (Purple)
    headerBlock: {
        width: '100%',
        backgroundColor: ScreenColors.purpleHeader,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomLeftRadius: Radius.xl * 2,
        borderBottomRightRadius: Radius.xl * 2,
    },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? Spacing['xl'] : Spacing['3xl'],
        left: Spacing['2xl'],
        zIndex: 20,
        width: 44,
        height: 44,
        borderRadius: Radius.full,
        backgroundColor: Colors.white + '90',
        alignItems: 'center',
        justifyContent: 'center',
    },
    illustrationGroup: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
    },
    floatingIcon: {
        position: 'absolute',
    },
    headerTitle: {
        fontSize: FontSize['4xl'],
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.extrabold,
        color: ScreenColors.purpleText,
        textAlign: 'center',
        lineHeight: 44,
        letterSpacing: -1,
    },

    // 2. Overlapping Elevated Form
    formSurface: {
        paddingHorizontal: Spacing['2xl'],
        marginTop: -60, // The overlap effect
        paddingBottom: Spacing['5xl'],
    },
    formCard: {
        backgroundColor: ScreenColors.formBg,
        borderRadius: Radius.xl * 1.5,
        padding: Spacing['3xl'],
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
        marginBottom: Spacing['3xl'],
    },
    form: {
        width: '100%',
    },

    // Password checks
    checks: {
        marginTop: Spacing.xl,
        gap: Spacing.sm,
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
