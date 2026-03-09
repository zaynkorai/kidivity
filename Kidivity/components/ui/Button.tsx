import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    type ViewStyle,
    type TextStyle,
} from 'react-native';
import { Colors, Radius, FontSize, FontWeight, Shadows } from '@/constants/theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon,
    style,
    textStyle,
}: ButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.8}
            style={[
                styles.base,
                styles[variant],
                styles[`size_${size}`],
                isDisabled && styles.disabled,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={variant === 'primary' ? Colors.white : Colors.primary}
                />
            ) : (
                <>
                    {icon}
                    <Text
                        style={[
                            styles.text,
                            styles[`text_${variant}`],
                            styles[`textSize_${size}`],
                            isDisabled && styles.textDisabled,
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: Radius.md,
    },

    // Variants
    primary: {
        backgroundColor: Colors.primary,
        ...Shadows.md,
    },
    secondary: {
        backgroundColor: Colors.primaryLight,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: Colors.primary,
    },
    ghost: {
        backgroundColor: 'transparent',
    },

    // Sizes
    size_sm: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    size_md: {
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    size_lg: {
        paddingVertical: 16,
        paddingHorizontal: 32,
    },

    // Disabled
    disabled: {
        opacity: 0.5,
    },

    // Text
    text: {
        fontWeight: FontWeight.semibold,
    },
    text_primary: {
        color: Colors.white,
    },
    text_secondary: {
        color: Colors.primaryDark,
    },
    text_outline: {
        color: Colors.primary,
    },
    text_ghost: {
        color: Colors.primary,
    },

    textSize_sm: {
        fontSize: FontSize.sm,
    },
    textSize_md: {
        fontSize: FontSize.md,
    },
    textSize_lg: {
        fontSize: FontSize.lg,
    },

    textDisabled: {
        opacity: 0.7,
    },
});
