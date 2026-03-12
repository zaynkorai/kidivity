import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    type ViewStyle,
    type TextStyle,
    type StyleProp,
} from 'react-native';
import { Colors, Radius, Spacing, FontSize, FontWeight, Fonts, Shadows } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'purple';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
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
    const { isShort } = useResponsive();
    const isDisabled = disabled || loading;

    // On short devices, step the size down visually to avoid taking up too much vertical space
    const effectiveSize = isShort && size === 'lg' ? 'md' : isShort && size === 'md' ? 'sm' : size;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.8}
            style={[
                styles.base,
                styles[variant],
                styles[`size_${effectiveSize}`],
                isDisabled && styles.disabled,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={variant === 'primary' ? Colors.white : Colors.primaryPurple}
                />
            ) : (
                <>
                    {icon}
                    <Text
                        style={[
                            styles.text,
                            styles[`text_${variant}`],
                            styles[`textSize_${effectiveSize}`],
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
        gap: Spacing.sm,
        borderRadius: Radius.full,
    },

    // Variants
    primary: {
        backgroundColor: Colors.primaryOrange,
        ...Shadows.md,
    },
    purple: {
        backgroundColor: Colors.primaryPurple,
        ...Shadows.md,
    },
    secondary: {
        backgroundColor: Colors.primaryLight,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: Colors.primaryPurple,
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
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
    },
    text_primary: {
        color: Colors.white,
    },
    text_purple: {
        color: Colors.white,
    },
    text_secondary: {
        color: Colors.primaryDark,
    },
    text_outline: {
        color: Colors.primaryPurple,
    },
    text_ghost: {
        color: Colors.primaryPurple,
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
