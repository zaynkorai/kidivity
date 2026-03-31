import React from 'react';
import { View, StyleSheet, useWindowDimensions, Text } from 'react-native';
import { Triangle, Square, Circle, Cloud, Star, Globe, Atom, Rocket, Ruler, PenTool } from 'lucide-react-native';
import { Colors, Fonts } from '@/constants/theme';

interface ScreenBackgroundProps {
    variant?: 'default' | 'vibrant';
    backgroundColor?: string;
}


export function ScreenBackground({ variant = 'default', backgroundColor }: ScreenBackgroundProps) {
    const { width, height } = useWindowDimensions();

    if (variant === 'vibrant') {
        const OPACITY = 0.55;
        return (
            <View
                style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: backgroundColor || Colors.categories.reading.pastel }
                ]}
                pointerEvents="none"
            >
                {/* Orderly Synchronized Layout - Alternating sides and centering */}
                
                {/* Row 1 */}
                <View style={[styles.icon, { top: '8%', left: '15%' }]}>
                    <Ruler size={50} color={Colors.secondary} opacity={OPACITY} style={{ transform: [{ rotate: '-30deg' }] }} />
                </View>
                <View style={[styles.icon, { top: '10%', right: '15%' }]}>
                    <Star size={30} color={Colors.categories.reading.accent} fill={Colors.categories.reading.accent} opacity={OPACITY} />
                </View>

                {/* Row 2 - Center */}
                <View style={[styles.icon, { top: '22%', left: '42%' }]}>
                    <Globe size={64} color={Colors.categories.math.accent} opacity={OPACITY} />
                </View>

                {/* Row 3 */}
                <View style={[styles.icon, { top: '38%', left: '10%' }]}>
                    <Atom size={54} color={Colors.categories.science.accent} opacity={OPACITY} style={{ transform: [{ rotate: '15deg' }] }} />
                </View>
                <View style={[styles.icon, { top: '35%', right: '12%' }]}>
                    <PenTool size={32} color={Colors.primary} opacity={OPACITY} style={{ transform: [{ rotate: '45deg' }] }} />
                </View>

                {/* Row 4 - Large Centerpiece */}
                <View style={[styles.icon, { top: '50%', left: '40%' }]}>
                    <Rocket size={70} color={Colors.primary} opacity={OPACITY} style={{ transform: [{ rotate: '30deg' }] }} />
                </View>

                {/* Row 5 */}
                <View style={[styles.icon, { top: '65%', left: '18%' }]}>
                    <Globe size={50} color={Colors.categories.math.accent} opacity={OPACITY} />
                </View>
                <View style={[styles.icon, { top: '68%', right: '18%' }]}>
                    <Star size={28} color={Colors.categories.art.accent} fill={Colors.categories.art.accent} opacity={OPACITY} />
                </View>

                {/* Row 6 - Bottom Accent */}
                <View style={[styles.icon, { bottom: '20%', left: '45%' }]}>
                    <Atom size={40} color={Colors.categories.science.accent} opacity={OPACITY} style={{ transform: [{ rotate: '-15deg' }] }} />
                </View>

                {/* Symmetrically aligned squiggles */}
                <Text style={[styles.icon, styles.squiggleText, { top: '15%', left: '30%' }]}>~</Text>
                <Text style={[styles.icon, styles.squiggleText, { top: '15%', right: '30%' }]}>~</Text>
                <Text style={[styles.icon, styles.squiggleText, { bottom: '35%', left: '15%' }]}>~</Text>
                <Text style={[styles.icon, styles.squiggleText, { bottom: '35%', right: '15%' }]}>~</Text>

                {/* Bottom Bush / Cloud Decoration */}
                <View style={styles.bottomDecoration}>
                    <Cloud size={140} color={Colors.primary} fill={Colors.primary} style={styles.bushIcon} />
                    <Cloud size={120} color={Colors.primary} fill={Colors.primary} style={[styles.bushIcon, { marginLeft: -60, marginTop: 20 }]} />
                </View>
            </View>
        );
    }

    // Default faint geometric watermark version
    const OPACITY = 0.12; // Lowered from 0.20 for a more "not suiting at many places" fix
    return (
        <View style={[StyleSheet.absoluteFill, backgroundColor && { backgroundColor }]} pointerEvents="none">
            {/* Top Section */}
            <Triangle
                size={80}
                color={Colors.primary}
                strokeWidth={1.5}
                opacity={OPACITY}
                style={[styles.icon, { top: height * 0.05, left: width * 0.05, transform: [{ rotate: '15deg' }] }]}
            />
            <Circle
                size={60}
                color={Colors.categories.math.accent}
                strokeWidth={1.5}
                opacity={OPACITY}
                style={[styles.icon, { top: height * 0.15, right: width * 0.08 }]}
            />
            {/* Middle-Top Section */}
            <Cloud
                size={90}
                color={Colors.primaryLight}
                strokeWidth={1.5}
                opacity={OPACITY}
                style={[styles.icon, { top: height * 0.3, left: width * 0.65, transform: [{ rotate: '-10deg' }] }]}
            />
            <Square
                size={70}
                color={Colors.categories.science.accent}
                strokeWidth={1.5}
                opacity={OPACITY}
                style={[styles.icon, { top: height * 0.45, left: width * 0.1, transform: [{ rotate: '-20deg' }] }]}
            />
            {/* Middle-Bottom Section */}
            <Star
                size={90}
                color={Colors.primary}
                strokeWidth={1.5}
                opacity={OPACITY}
                style={[styles.icon, { top: height * 0.65, right: width * 0.15, transform: [{ rotate: '45deg' }] }]}
            />
            <Circle
                size={45}
                color={Colors.categories.art.accent}
                strokeWidth={1.5}
                opacity={OPACITY}
                style={[styles.icon, { top: height * 0.75, left: width * 0.25 }]}
            />
            {/* Bottom Section */}
            <Triangle
                size={55}
                color={Colors.categories.tracing.accent}
                strokeWidth={1.5}
                opacity={OPACITY}
                style={[styles.icon, { bottom: height * 0.08, left: width * 0.15, transform: [{ rotate: '60deg' }] }]}
            />
            <Square
                size={65}
                color={Colors.categories.math.accent}
                strokeWidth={1.5}
                opacity={OPACITY}
                style={[styles.icon, { bottom: height * 0.05, right: width * 0.1, transform: [{ rotate: '-15deg' }] }]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    icon: {
        position: 'absolute',
    },
    squiggleText: {
        fontSize: 32,
        color: Colors.categories.tracing.accent,
        fontFamily: Fonts.bold,
        transform: [{ rotate: '45deg' }]
    },
    bottomDecoration: {
        position: 'absolute',
        bottom: -40,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        width: '100%',
        opacity: 0.9,
    },
    bushIcon: {
        // Overlaying clouds to look like a bush
    },
});
