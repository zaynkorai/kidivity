import React from 'react';
import { TouchableOpacity, Text, StyleSheet, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Spacing, FontSize, Fonts } from '@/constants/theme';

interface ChipProps {
    label: string;
    icon?: LucideIcon;
    selected?: boolean;
    onPress?: () => void;
    color?: string;
    style?: ViewStyle;
    size?: 'sm' | 'md';
}

export function Chip({
    label,
    icon: Icon,
    selected = false,
    onPress,
    color,
    style,
    size = 'md',
}: ChipProps) {
    const activeColor = color ?? Colors.primary;

    const isSmall = size === 'sm';

    return (
        <TouchableOpacity
            onPress={() => {
                Haptics.selectionAsync();
                onPress?.();
            }}
            activeOpacity={0.7}
            style={[
                styles.chip,
                isSmall && styles.chipSmall,
                selected && { backgroundColor: activeColor + '22', borderColor: activeColor, borderWidth: 2 },
                style,
            ]}
        >
            {Icon && (
                <Icon
                    size={isSmall ? 14 : 16}
                    color={selected ? activeColor : Colors.textPrimary}
                    style={styles.icon}
                />
            )}
            <Text
                style={[
                    styles.label,
                    isSmall && styles.labelSmall,
                    selected && { color: activeColor, fontFamily: Fonts.bold },
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    chipSmall: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderWidth: 1,
    },
    icon: {
        marginRight: Spacing.xs,
    },
    label: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.medium,
        color: Colors.textPrimary,
    },
    labelSmall: {
        fontSize: FontSize.sm,
    },
    labelSelected: {
        // Will be overwritten inline
    },
});
