import React from 'react';
import { View, StyleSheet, useWindowDimensions, Text, Platform } from 'react-native';
import { Triangle, Square, Circle, Cloud, Star, Globe, Atom, Rocket, Ruler, PenTool } from 'lucide-react-native';
import { Colors, Fonts } from '@/constants/theme';

interface ScreenBackgroundProps {
    variant?: 'default' | 'vibrant';
}

export function ScreenBackground({ variant = 'default' }: ScreenBackgroundProps) {
    const { width, height } = useWindowDimensions();

    if (variant === 'vibrant') {
        const OPACITY = 0.8;
        return (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.pastelPeach }]} pointerEvents="none">
                <Globe size={64} color={Colors.blue} opacity={OPACITY} style={[styles.icon, { top: '10%', left: '42%' }]} />
                <Star size={24} color={Colors.yellow} fill={Colors.yellow} opacity={OPACITY} style={[styles.icon, { top: '45%', right: '15%' }]} />
                <Star size={24} color={Colors.rad} fill={Colors.rad} opacity={OPACITY} style={[styles.icon, { top: '12%', right: '18%' }]} />

                <Atom size={50} color={Colors.green} opacity={OPACITY} style={[styles.icon, { top: '65%', left: '26%', transform: [{ rotate: '15deg' }] }]} />
                <Rocket size={56} color={Colors.primary} opacity={OPACITY} style={[styles.icon, { top: '40%', right: '35%', transform: [{ rotate: '45deg' }] }]} />

                <Ruler size={60} color={Colors.primaryPurple} opacity={OPACITY} style={[styles.icon, { top: '30%', left: '12%', transform: [{ rotate: '-30deg' }] }]} />
                <PenTool size={26} color={Colors.primary} opacity={OPACITY} style={[styles.icon, { top: '25%', right: '40%', transform: [{ rotate: '60deg' }] }]} />

                <Text style={[styles.icon, styles.squiggleText, { top: '14%', left: '24%' }]}>~</Text>
                <Text style={[styles.icon, styles.squiggleText, { top: '20%', right: '20%' }]}>~</Text>
                <Text style={[styles.icon, styles.squiggleText, { top: '75%', right: '24%' }]}>~</Text>
            </View>
        );
    }

    // Default faint geometric watermark version
    const OPACITY = 0.20;
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
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
                color={Colors.blue}
                strokeWidth={1.5}
                opacity={OPACITY}
                style={[styles.icon, { top: height * 0.15, right: width * 0.08 }]}
            />
            {/* Middle-Top Section */}
            <Cloud
                size={90}
                color={Colors.purple}
                strokeWidth={1.5}
                opacity={OPACITY}
                style={[styles.icon, { top: height * 0.3, left: width * 0.65, transform: [{ rotate: '-10deg' }] }]}
            />
            <Square
                size={70}
                color={Colors.green}
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
                color={Colors.yellow}
                strokeWidth={1.5}
                opacity={OPACITY}
                style={[styles.icon, { top: height * 0.75, left: width * 0.25 }]}
            />
            {/* Bottom Section */}
            <Triangle
                size={55}
                color={Colors.rad}
                strokeWidth={1.5}
                opacity={OPACITY}
                style={[styles.icon, { bottom: height * 0.08, left: width * 0.15, transform: [{ rotate: '60deg' }] }]}
            />
            <Square
                size={65}
                color={Colors.blue}
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
        color: Colors.rad,
        fontFamily: Fonts.bold,
        fontWeight: 'bold',
        transform: [{ rotate: '45deg' }]
    },
});
