import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    interpolateColor
} from 'react-native-reanimated';
import { Colors, Spacing, Radius, FontSize, Fonts, Shadows } from '@/constants/theme';

interface QuotaMeterProps {
    used: number;
    limit: number;
    onPress?: () => void;
    variant?: 'default' | 'onPrimary';
}

export function QuotaMeter({ used, limit, onPress, variant = 'default' }: QuotaMeterProps) {
    const isHit = used >= limit;
    const progress = Math.min(used / limit, 1);

    // Animation values
    const progressWidth = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        progressWidth.value = withSpring(progress, { damping: 15, stiffness: 100 });
    }, [progress]);

    const progressStyle = useAnimatedStyle(() => {
        return {
            width: `${progressWidth.value * 100}%`,
            backgroundColor: interpolateColor(
                progressWidth.value,
                [0, 0.7, 1],
                variant === 'onPrimary'
                    ? [Colors.white + '60', Colors.white + '90', Colors.white]
                    : [Colors.primary, Colors.secondary, Colors.accent]
            ),
        };
    });

    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const onPressIn = () => {
        scale.value = withSpring(0.98);
    };

    const onPressOut = () => {
        scale.value = withSpring(1);
    };

    return (
        <Animated.View style={containerStyle}>
            <Pressable
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={styles.container}
            >
                <View style={styles.header}>
                    <View style={styles.headerLeft}>

                        <Text style={[styles.title, variant === 'onPrimary' && styles.textOnPrimary]}>
                            {isHit ? 'Daily limit hit' : 'Free Daily Quota'}
                        </Text>
                    </View>
                    <Text style={[styles.usageText, variant === 'onPrimary' && styles.textOnPrimary]}>
                        <Text style={[styles.usedCount, variant === 'onPrimary' && styles.textOnPrimary]}>{used}</Text>/{limit} used
                    </Text>
                </View>

                <View style={[styles.track, variant === 'onPrimary' && styles.trackOnPrimary]}>
                    <Animated.View style={[styles.fill, progressStyle]} />
                </View>

                <Text style={[styles.footerText, variant === 'onPrimary' && styles.textOnPrimary]}>
                    {isHit
                        ? 'Limit Resets at midnight'
                        : `${limit - used} free ${limit - used === 1 ? 'generation' : 'generations'} left for today`}
                </Text>

            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: Spacing.sm,
        backgroundColor: 'transparent',
    },
    containerNormal: {
    },
    containerHit: {
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.bold,
        color: Colors.textPrimary,
    },
    usageText: {
        fontSize: FontSize.xs,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
    },
    usedCount: {
        color: Colors.textPrimary,
        fontFamily: Fonts.bold,
    },
    track: {
        height: 6,
        backgroundColor: Colors.border + '30',
        borderRadius: Radius.full,
        overflow: 'hidden',
        marginBottom: Spacing.xs,
    },
    fill: {
        height: '100%',
        borderRadius: Radius.full,
    },
    footerText: {
        fontSize: FontSize.xs - 2,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        opacity: 0.7,
    },
    textOnPrimary: {
        color: Colors.white,
    },
    trackOnPrimary: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    }
});

export default QuotaMeter;
