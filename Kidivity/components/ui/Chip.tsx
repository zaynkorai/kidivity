import React from 'react';
import { TouchableOpacity, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, FontSize, FontWeight } from '@/constants/theme';

interface ChipProps {
    label: string;
    selected?: boolean;
    onPress?: () => void;
    color?: string;
    style?: ViewStyle;
}

export function Chip({
    label,
    selected = false,
    onPress,
    color,
    style,
}: ChipProps) {
    const activeColor = color ?? Colors.primary;

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={[
                styles.chip,
                selected && { backgroundColor: activeColor, borderColor: activeColor },
                style,
            ]}
        >
            <Text
                style={[
                    styles.label,
                    selected && styles.labelSelected,
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    chip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.full,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    label: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        color: Colors.textSecondary,
    },
    labelSelected: {
        color: Colors.white,
    },
});
