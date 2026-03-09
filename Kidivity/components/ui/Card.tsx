import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, Shadows } from '@/constants/theme';

interface CardProps {
    children: React.ReactNode;
    variant?: 'elevated' | 'outlined' | 'filled';
    padding?: keyof typeof Spacing;
    color?: string;
    style?: ViewStyle;
}

export function Card({
    children,
    variant = 'elevated',
    padding = 'lg',
    color,
    style,
}: CardProps) {
    const customBackground = color ? { backgroundColor: color } : {};
    return (
        <View
            style={[
                styles.base,
                styles[variant],
                { padding: Spacing[padding] },
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
