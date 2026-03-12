import React from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { Colors, Radius, Spacing, Shadows } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

interface CardProps {
    children: React.ReactNode;
    variant?: 'elevated' | 'outlined' | 'filled';
    padding?: keyof typeof Spacing;
    color?: string;
    style?: StyleProp<ViewStyle>;
}

export function Card({
    children,
    variant = 'elevated',
    padding = 'lg',
    color,
    style,
}: CardProps) {
    const { isShort } = useResponsive();
    const customBackground = color ? { backgroundColor: color } : {};

    // Auto-step down padding on short devices
    const effectivePadding = isShort && padding === 'xl' ? 'lg' : isShort && padding === 'lg' ? 'md' : isShort && padding === 'md' ? 'sm' : padding;

    return (
        <View
            style={[
                styles.base,
                styles[variant],
                { padding: Spacing[effectivePadding] },
                customBackground,
                style,
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    base: {
        borderRadius: Radius.xl,
        overflow: 'hidden',
    },
    elevated: {
        backgroundColor: Colors.surface,
        ...Shadows.md,
    },
    outlined: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filled: {
        backgroundColor: Colors.background,
    },
});
