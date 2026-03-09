import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, Shadows } from '@/constants/theme';

interface CardProps {
    children: React.ReactNode;
    variant?: 'elevated' | 'outlined' | 'filled';
    padding?: keyof typeof Spacing;
    style?: ViewStyle;
}

export function Card({
    children,
    variant = 'elevated',
    padding = 'lg',
    style,
}: CardProps) {
    return (
        <View
            style={[
                styles.base,
                styles[variant],
                { padding: Spacing[padding] },
                style,
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    base: {
        borderRadius: Radius.lg,
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
