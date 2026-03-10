import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Triangle, Square, Circle, Cloud, Star } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

// Opacity for the faint watermark geometric shapes
const OPACITY = 0.20; // Increased significantly to add dynamic texture

export function ScreenBackground() {
    const { width, height } = useWindowDimensions();

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
});
