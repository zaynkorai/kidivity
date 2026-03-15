import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, Modal, StyleSheet } from 'react-native';
import { Wand2 } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Fonts } from '@/constants/theme';

const FUN_MESSAGES = [
    'Mixing creative juices...',
    'Thinking really hard...',
    'Sprinkling magic dust...',
    'Launching imagination...',
    'Crafting something special...',
    'Tailoring it just right...',
    'Setting up the fun...',
    'Gathering cool ideas...',
];

export function GeneratingOverlay({ visible }: { visible: boolean }) {
    const bounce = useRef(new Animated.Value(0)).current;
    const pulse = useRef(new Animated.Value(1)).current;
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        if (!visible) return;

        const bounceAnim = Animated.loop(
            Animated.sequence([
                Animated.timing(bounce, { toValue: -20, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                Animated.timing(bounce, { toValue: 0, duration: 400, easing: Easing.in(Easing.quad), useNativeDriver: true }),
            ])
        );

        const pulseAnim = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.15, duration: 800, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        );

        bounceAnim.start();
        pulseAnim.start();

        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % FUN_MESSAGES.length);
        }, 2500);

        return () => {
            bounceAnim.stop();
            pulseAnim.stop();
            clearInterval(interval);
        };
    }, [visible, bounce, pulse]);

    if (!visible) return null;

    return (
        <Modal transparent animationType="fade" visible={visible}>
            <View style={loadingStyles.overlay}>
                <View style={loadingStyles.card}>
                    <Animated.View
                        style={[
                            loadingStyles.iconWrap,
                            { transform: [{ translateY: bounce }, { scale: pulse }] },
                        ]}
                    >
                        <Wand2 size={48} color={Colors.primary} />
                    </Animated.View>
                    <Text style={loadingStyles.title}>Creating Activity</Text>
                    <Text style={loadingStyles.message}>{FUN_MESSAGES[messageIndex]}</Text>
                    <View style={loadingStyles.dots}>
                        {[0, 1, 2].map((i) => (
                            <Animated.View
                                key={i}
                                style={[
                                    loadingStyles.dot,
                                    {
                                        opacity: pulse.interpolate({
                                            inputRange: [1, 1.15],
                                            outputRange: [i === 1 ? 1 : 0.3, i === 1 ? 0.3 : 1],
                                        }),
                                    },
                                ]}
                            />
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const loadingStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.xl,
        padding: Spacing['4xl'],
        alignItems: 'center',
        width: '80%',
        maxWidth: 300,
    },
    iconWrap: { marginBottom: Spacing.lg },
    title: {
        fontSize: FontSize.xl,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    message: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.sans,
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        minHeight: 20,
    },
    dots: { flexDirection: 'row', gap: Spacing.sm },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.primary,
    },
});
