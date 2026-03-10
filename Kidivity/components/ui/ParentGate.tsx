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
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '@/constants/theme';

interface ParentGateProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    title?: string;
    description?: string;
}

export function ParentGate({
    visible,
    onClose,
    onSuccess,
    title = 'Parent Gate',
    description = 'Ask a parent to solve this to continue.',
}: ParentGateProps) {
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [answer, setAnswer] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (visible) {
            // Generate a random multiplication problem suitable for adults (e.g. 6x7 to 12x12)
            setNum1(Math.floor(Math.random() * 7) + 6);
            setNum2(Math.floor(Math.random() * 7) + 6);
            setAnswer('');
            setError('');
        }
    }, [visible]);

    const handleSubmit = () => {
        const parsed = parseInt(answer.trim(), 10);
        if (parsed === num1 * num2) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onSuccess();
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setError('Incorrect. Please try again.');
            setAnswer('');
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
                                <X size={20} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Content */}
                        <Text style={styles.description}>{description}</Text>

                        <View style={styles.challengeContainer}>
                            <Text style={styles.challengeText}>
                                {num1} × {num2} = ?
                            </Text>
                        </View>

                        <Input
                            label="Answer"
                            placeholder="Enter the product"
                            value={answer}
                            onChangeText={(text) => {
                                setAnswer(text);
                                setError('');
                            }}
                            keyboardType="number-pad"
                            autoFocus
                            onSubmitEditing={handleSubmit}
                        />

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Button
                                title="Cancel"
                                onPress={onClose}
                                variant="outline"
                                style={styles.actionBtn}
                            />
                            <Button
                                title="Submit"
                                onPress={handleSubmit}
                                disabled={!answer.trim()}
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
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    closeBtn: {
        padding: Spacing.xs,
        marginRight: -Spacing.xs,
    },
    description: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.xl,
        lineHeight: 20,
    },
    challengeContainer: {
        backgroundColor: Colors.background,
        padding: Spacing.xl,
        borderRadius: Radius.lg,
        alignItems: 'center',
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    challengeText: {
        fontSize: FontSize['3xl'],
        fontWeight: FontWeight.bold,
        color: Colors.primaryDark,
        letterSpacing: 2,
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
        fontSize: FontSize.sm,
        marginTop: Spacing.sm,
        textAlign: 'center',
    },
});
