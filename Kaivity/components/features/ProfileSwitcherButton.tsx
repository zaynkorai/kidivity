import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ChevronDown } from 'lucide-react-native';
import { useProfileStore } from '@/store/profileStore';
import { Colors, Spacing, Radius, FontSize, Fonts, Shadows, FontWeight } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

interface ProfileSwitcherButtonProps {
    onPress: () => void;
    variant?: 'onPrimary' | 'onSurface';
}

export function ProfileSwitcherButton({ onPress, variant = 'onSurface' }: ProfileSwitcherButtonProps) {
    const { isCompact: compact } = useResponsive();
    const profiles = useProfileStore((state) => state.profiles);
    const activeProfileId = useProfileStore((state) => state.activeProfileId);
    const activeProfile = profiles.find((p) => p.id === activeProfileId);

    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const isPrimary = variant === 'onPrimary';

    return (
        <Animated.View style={animatedStyle}>
            <Pressable
                onPress={onPress}
                onPressIn={() => (scale.value = withSpring(0.96))}
                onPressOut={() => (scale.value = withSpring(1))}
                style={[
                    styles.button,
                    isPrimary ? styles.buttonPrimary : styles.buttonSurface,
                    compact && { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
                ]}
            >
                {activeProfile ? (
                    <View style={styles.content}>
                        <View style={[
                            styles.avatar,
                            { backgroundColor: activeProfile.avatar_color },
                            isPrimary && { borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.4)' }
                        ]}>
                            <Text style={styles.initial}>
                                {activeProfile.name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        {!compact && (
                            <View style={styles.textContainer}>
                                <Text
                                    style={[styles.name, { color: isPrimary ? Colors.white : Colors.textPrimary }]}
                                    numberOfLines={1}
                                >
                                    {activeProfile.name}
                                </Text>
                                <Text
                                    style={[styles.meta, { color: isPrimary ? 'rgba(255, 255, 255, 0.8)' : Colors.textSecondary }]}
                                    numberOfLines={1}
                                >
                                    {activeProfile.age}yo
                                </Text>
                            </View>
                        )}
                    </View>
                ) : (
                    <Text
                        style={[styles.placeholder, { color: isPrimary ? Colors.white : Colors.textPrimary }]}
                        numberOfLines={1}
                    >
                        {compact ? 'Kid' : 'Select Kid'}
                    </Text>
                )}
                <ChevronDown size={14} color={isPrimary ? Colors.white : Colors.textPrimary} />
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: Radius.full,
        ...Shadows.sm,
    },
    buttonPrimary: {
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    buttonSurface: {
        backgroundColor: Colors.white,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    avatar: {
        width: 34,
        height: 34,
        borderRadius: Radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    initial: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.white,
    },
    textContainer: {
        flexShrink: 1,
        maxWidth: 90,
    },
    name: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
    },
    meta: {
        fontSize: FontSize.xs,
        fontFamily: Fonts.sans,
        marginTop: 1,
    },
    placeholder: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.semibold,
    },
});
