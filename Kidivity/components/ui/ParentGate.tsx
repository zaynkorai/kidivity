import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from 'react-native';
import { X, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Button } from './Button';
import { Input } from './Input';
import { Colors, Spacing, Radius, FontSize, FontWeight, Fonts, Shadows } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

interface ParentGateProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userEmail: string | undefined;
    title?: string;
    description?: string;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

export function ParentGate({
    visible,
    onClose,
    onSuccess,
    userEmail,
    title = 'Parent Gate',
    description = 'Enter your password to continue.',
}: ParentGateProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState(0);
    const lockoutTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    const isLockedOut = lockoutSecondsLeft > 0;

    // Reset all state when gate opens; clean up timer on unmount/close
    useEffect(() => {
        if (visible) {
            setPassword('');
            setError('');
            setIsLoading(false);
            setAttempts(0);
            setLockoutSecondsLeft(0);
            if (lockoutTimer.current) {
                clearInterval(lockoutTimer.current);
                lockoutTimer.current = null;
            }
        }
        return () => {
            if (lockoutTimer.current) clearInterval(lockoutTimer.current);
        };
    }, [visible]);

    const startLockout = () => {
        setLockoutSecondsLeft(LOCKOUT_SECONDS);
        lockoutTimer.current = setInterval(() => {
            setLockoutSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(lockoutTimer.current!);
                    lockoutTimer.current = null;
                    setAttempts(0);
                    setError('');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSubmit = async () => {
        if (!password.trim() || isLockedOut) return;
        setError('');

        if (!userEmail) {
            setError('No email found to verify.');
            return;
        }

        setIsLoading(true);
        const { error: authError } = await supabase.auth.signInWithPassword({
            email: userEmail,
            password: password,
        });
        setIsLoading(false);

        if (authError) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setPassword('');

            const newAttempts = attempts + 1;
            setAttempts(newAttempts);

            if (newAttempts >= MAX_ATTEMPTS) {
                setError(`Too many attempts. Please wait ${LOCKOUT_SECONDS} seconds.`);
                startLockout();
            } else {
                const remaining = MAX_ATTEMPTS - newAttempts;
                setError(`Incorrect password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
            }
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onSuccess();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    style={styles.overlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={styles.container}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.headerTitleWrap}>
                                <Lock size={20} color={Colors.primary} />
                                <Text style={styles.title}>{title}</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <X size={20} color={Colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        {/* Content */}
                        <Text style={styles.description}>{description}</Text>

                        {isLockedOut ? (
                            <View style={styles.lockoutContainer}>
                                <Text style={styles.lockoutText}>
                                    Too many failed attempts. Try again in{' '}
                                    <Text style={styles.lockoutCount}>{lockoutSecondsLeft}s</Text>.
                                </Text>
                            </View>
                        ) : (
                            <Input
                                label="Password"
                                placeholder="Enter your password"
                                value={password}
                                onChangeText={(text) => {
                                    setPassword(text);
                                    setError('');
                                }}
                                secureTextEntry={true}
                                autoFocus
                                onSubmitEditing={handleSubmit}
                                editable={!isLoading}
                                autoCapitalize="none"
                            />
                        )}

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Button
                                title="Cancel"
                                onPress={onClose}
                                variant="outline"
                                disabled={isLoading}
                                style={styles.actionBtn}
                            />
                            <Button
                                title={isLoading ? 'Verifying...' : 'Submit'}
                                onPress={handleSubmit}
                                disabled={!password.trim() || isLoading || isLockedOut}
                                style={styles.actionBtn}
                            />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: Colors.surface,
        borderRadius: Radius.xl,
        padding: Spacing.xl,
        ...Shadows.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    headerTitleWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    title: {
        fontSize: FontSize.lg,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    closeBtn: {
        padding: Spacing.xs,
        marginRight: -Spacing.xs,
    },
    description: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.sans,
        color: Colors.textPrimary,
        marginBottom: Spacing.xl,
        lineHeight: 20,
    },
    lockoutContainer: {
        backgroundColor: Colors.accent + '12',
        borderRadius: Radius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
    },
    lockoutText: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.medium,
        color: Colors.accent,
        textAlign: 'center',
        lineHeight: 20,
    },
    lockoutCount: {
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
    },
    footer: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.xl,
    },
    actionBtn: {
        flex: 1,
    },
    errorText: {
        color: Colors.accent,
        fontFamily: Fonts.sans,
        fontSize: FontSize.sm,
        marginTop: Spacing.sm,
        textAlign: 'center',
    },
});
