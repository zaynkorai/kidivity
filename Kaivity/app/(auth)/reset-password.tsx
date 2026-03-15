import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { KeyRound } from 'lucide-react-native';

import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, FontSize, FontWeight, Fonts } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordScreen() {
    const router = useRouter();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleUpdatePassword = async () => {
        setErrors({});
        setSuccessMessage(null);

        const newErrors: Record<string, string> = {};
        if (!password) {
            newErrors.password = 'Password is required';
        }
        if (!confirmPassword) {
            newErrors.confirmPassword = 'Confirmation is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (password.length < 6) {
            setErrors({ password: 'Password must be at least 6 characters.' });
            return;
        }

        if (password !== confirmPassword) {
            setErrors({ confirmPassword: 'Passwords do not match.' });
            return;
        }

        setIsLoading(true);

        try {
            // This relies on the magical deep link session already being set by Supabase Auth
            const { error: updateError } = await supabase.auth.updateUser({
                password: password,
            });

            if (updateError) {
                setErrors({ form: updateError.message });
                setIsLoading(false);
                return;
            }

            setSuccessMessage('Password has been updated successfully!');
            setPassword('');
            setConfirmPassword('');

            // Allow them to read the success message for 1.5 seconds, then go home
            setTimeout(() => {
                router.replace('/(tabs)');
            }, 1500);

        } catch (err: unknown) {
            setErrors({ form: err instanceof Error ? err.message : 'An unexpected error occurred.' });
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <ScreenBackground />

            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.iconContainer}>
                        <View style={styles.iconCircle}>
                            <KeyRound size={32} color={Colors.primary} />
                        </View>
                    </View>

                    <Text style={styles.title}>Set New Password</Text>
                    <Text style={styles.subtitle}>
                        Please enter your new password below.
                    </Text>

                    <View style={styles.formContainer}>
                        <Input
                            label="New Password"
                            placeholder="Must be at least 6 characters"
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                            }}
                            secureTextEntry
                            autoCapitalize="none"
                            required
                            error={errors.password}
                        />

                        <Input
                            label="Confirm New Password"
                            placeholder="Re-enter your new password"
                            value={confirmPassword}
                            onChangeText={(text) => {
                                setConfirmPassword(text);
                                if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                            }}
                            secureTextEntry
                            autoCapitalize="none"
                            onSubmitEditing={handleUpdatePassword}
                            returnKeyType="done"
                            required
                            error={errors.confirmPassword}
                        />

                        {errors.form ? (
                            <Text style={styles.errorText}>{errors.form}</Text>
                        ) : null}

                        {successMessage ? (
                            <Text style={styles.successText}>{successMessage}</Text>
                        ) : null}

                        <Button
                            title={isLoading ? 'Updating...' : 'Update Password'}
                            onPress={handleUpdatePassword}
                            disabled={isLoading || !!successMessage}
                            style={styles.submitButton}
                        />

                        <Button
                            title="Go Home"
                            variant="ghost"
                            onPress={() => router.replace('/(tabs)')}
                            disabled={isLoading}
                        />
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
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing['3xl'],
        paddingTop: Spacing['2xl'],
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: Radius.full,
        backgroundColor: Colors.categories.reading.pastel,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: FontSize['3xl'],
        fontFamily: Fonts.bold,
        color: Colors.primaryDark,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: FontSize.md,
        fontFamily: Fonts.sans,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing['2xl'],
        lineHeight: 24,
    },
    formContainer: {
        gap: Spacing.sm,
    },
    errorText: {
        color: Colors.accent,
        fontFamily: Fonts.sans,
        fontSize: FontSize.sm,
        textAlign: 'center',
        marginTop: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    successText: {
        color: Colors.success,
        fontFamily: Fonts.medium,
        fontSize: FontSize.sm,
        textAlign: 'center',
        marginTop: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    submitButton: {
        marginTop: Spacing.md,
    },
});
