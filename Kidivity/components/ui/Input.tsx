import React, { useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    type TextInputProps,
    type ViewStyle,
} from 'react-native';
import { Colors, Radius, Spacing, FontSize, FontWeight } from '@/constants/theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, style, ...props }: InputProps) {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[
                    styles.input,
                    isFocused && styles.inputFocused,
                    error && styles.inputError,
                    style,
                ]}
                placeholderTextColor={Colors.textTertiary}
                onFocus={(e) => {
                    setIsFocused(true);
                    props.onFocus?.(e);
                }}
                onBlur={(e) => {
                    setIsFocused(false);
                    props.onBlur?.(e);
                }}
                {...props}
            />
            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: Spacing.xs,
    },
    label: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        color: Colors.textSecondary,
        marginLeft: Spacing.xs,
    },
    input: {
        backgroundColor: '#F8F9FE', // Very soft off-white background
        borderWidth: 2,
        borderColor: 'transparent',
        borderRadius: 9999, // Perfect pill
        paddingHorizontal: Spacing['xl'],
        paddingVertical: 18,
        fontSize: FontSize.md,
        color: Colors.textPrimary,
    },
    inputFocused: {
        borderColor: Colors.primary,
        backgroundColor: Colors.white,
    },
    inputError: {
        borderColor: Colors.accent,
    },
    error: {
        fontSize: FontSize.xs,
        color: Colors.accent,
        marginLeft: Spacing.xs,
    },
});
