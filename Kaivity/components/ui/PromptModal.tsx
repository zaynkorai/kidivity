import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Colors, Spacing, Radius, FontSize, Fonts } from '@/constants/theme';
import { Input } from './Input';
import { Button } from './Button';

interface PromptModalProps {
    visible: boolean;
    title: string;
    message: string;
    placeholder?: string;
    initialValue?: string;
    onCancel: () => void;
    onSubmit: (value: string) => void;
    submitText?: string;
    cancelText?: string;
}

export function PromptModal({
    visible,
    title,
    message,
    placeholder,
    initialValue = '',
    onCancel,
    onSubmit,
    submitText = 'Submit',
    cancelText = 'Cancel',
}: PromptModalProps) {
    const [value, setValue] = useState(initialValue);

    const handleSubmit = () => {
        onSubmit(value);
        setValue('');
    };

    const handleCancel = () => {
        onCancel();
        setValue('');
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={handleCancel}
        >
            <View style={styles.backdrop}>
                <Pressable style={StyleSheet.absoluteFill} onPress={handleCancel} />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.container}
                >
                    <View style={styles.content}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>
                        
                        <Input
                            placeholder={placeholder}
                            value={value}
                            onChangeText={setValue}
                            autoFocus
                            containerStyle={styles.inputContainer}
                        />

                        <View style={styles.buttonRow}>
                            <Button
                                title={cancelText}
                                onPress={handleCancel}
                                variant="ghost"
                                style={styles.button}
                            />
                            <Button
                                title={submitText}
                                onPress={handleSubmit}
                                variant="primary"
                                style={styles.button}
                            />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: Colors.overlayBackground,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    container: {
        width: '100%',
        maxWidth: 400,
    },
    content: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: Spacing.xl,
        gap: Spacing.md,
    },
    title: {
        fontFamily: Fonts.bold,
        fontSize: FontSize.lg,
        color: Colors.textPrimary,
        textAlign: 'center',
    },
    message: {
        fontFamily: Fonts.sans,
        fontSize: FontSize.sm,
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: Spacing.xs,
    },
    inputContainer: {
        marginBottom: Spacing.sm,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    button: {
        flex: 1,
    },
});
