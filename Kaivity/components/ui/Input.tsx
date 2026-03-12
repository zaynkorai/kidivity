import React, { useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    type TextInputProps,
    type ViewStyle,
} from 'react-native';
import { Colors, Radius, Spacing, FontSize, FontWeight, Fonts } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    required?: boolean;
    containerStyle?: ViewStyle;
}

export function Input({ label, error, required, containerStyle, style, ...props }: InputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const { isShort } = useResponsive();

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>{label}</Text>
                    {required && <Text style={styles.requiredStar}>*</Text>}
                </View>
            )}
            <TextInput
                style={[
                    styles.input,
                    isShort && styles.inputShort,
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
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    label: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.medium,
        fontWeight: FontWeight.medium,
        color: Colors.textPrimary,
        marginLeft: Spacing.xs,
    },
    requiredStar: {
        color: Colors.accent,
        fontSize: FontSize.sm,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
    },
    input: {
        backgroundColor: '#F8F9FE',
        borderWidth: 2,
        borderColor: 'transparent',
        borderRadius: 9999,
        paddingHorizontal: Spacing['xl'],
        paddingVertical: 14,
        fontSize: FontSize.md,
        fontFamily: Fonts.sans,
        color: Colors.textPrimary,
    },
    size_lg: {
        paddingVertical: 14,
        paddingHorizontal: 32,
    },
    inputShort: {
        paddingVertical: 12,
        fontSize: FontSize.sm,
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
        fontFamily: Fonts.sans,
        color: Colors.accent,
        marginLeft: Spacing.xs,
    },
});
