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
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

export default function SignUpScreen() {
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
            setSuccess(true);
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
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <ArrowLeft size={24} color={Colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    {/* Title */}
                    <View style={styles.titleBlock}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>
                            Sign up to save activities and sync across devices.
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <Input
                            label="Email Address"
                            placeholder="you@example.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoFocus
                        />

                        <Input
                            label="Password"
                            placeholder="At least 6 characters"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            containerStyle={{ marginTop: Spacing.lg }}
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

                        {/* Password Strength Indicators */}
                        <View style={styles.checks}>
                            <View style={styles.checkRow}>
                                <View
                                    style={[
                                        styles.checkDot,
                                        passwordChecks.length && styles.checkDotActive,
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
                                        styles.checkDot,
                                        passwordChecks.match && styles.checkDotActive,
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
        paddingHorizontal: Spacing['2xl'],
    },

    // Header
    header: {
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: Radius.md,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Title
    titleBlock: {
        marginBottom: Spacing['2xl'],
    },
    title: {
        fontSize: FontSize['3xl'],
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        lineHeight: 22,
    },

    // Form
    form: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.xl,
        padding: Spacing['2xl'],
        ...Shadows.sm,
    },

    // Password checks
    checks: {
        marginTop: Spacing.lg,
        gap: Spacing.sm,
    },
    checkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    checkDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.disabled,
    },
    checkDotActive: {
        backgroundColor: Colors.success,
    },
    checkText: {
        fontSize: FontSize.sm,
        color: Colors.textTertiary,
    },
    checkTextActive: {
        color: Colors.success,
    },

    // Error
    errorText: {
        fontSize: FontSize.sm,
        color: Colors.accent,
        textAlign: 'center',
        marginTop: Spacing.md,
    },

    // Submit
    submitButton: {
        width: '100%',
        marginTop: Spacing.xl,
        borderRadius: Radius.lg,
        paddingVertical: 16,
    },

    // Switch link
    switchLink: {
        alignItems: 'center',
        marginTop: Spacing.lg,
    },
    switchLinkText: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },
    switchLinkBold: {
        color: Colors.primary,
        fontWeight: FontWeight.semibold,
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
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    successSubtitle: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
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
