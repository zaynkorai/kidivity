import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        if (visible) {
            setPassword('');
            setError('');
            setIsLoading(false);
        }
    }, [visible]);

    const handleSubmit = async () => {
        if (!password.trim()) return;
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
            setError('Incorrect password. Please try again.');
            setPassword('');
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
                                disabled={!password.trim() || isLoading}
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
