import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Pressable,
} from 'react-native';
import { Zap, Check, X } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Fonts, Shadows } from '@/constants/theme';

const FEATURES = [
    'Personalized AI activities',
    'Creative tools for kids',
    'Interactive learning guides',
    'Family friendly content',
];

interface Props {
    visible: boolean;
    used: number;
    limit: number;
    onClose: () => void;
}

export function PaywallModal({ visible, used, limit, onClose }: Props) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            statusBarTranslucent
        >
            <Pressable style={styles.backdrop} onPress={onClose} />
            <View style={styles.sheet}>
                {/* Close */}
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                    <X size={20} color={Colors.textPrimary} />
                </TouchableOpacity>

                {/* Icon */}
                <View style={styles.iconWrap}>
                    <Zap size={32} color={Colors.surface} fill={Colors.surface} />
                </View>

                <Text style={styles.title}>Daily limit hit</Text>
                <Text style={styles.subtitle}>
                    You&apos;ve hit your daily limit. It resets at midnight.
                </Text>

                {/* Features */}
                <View style={styles.features}>
                    {FEATURES.map((f) => (
                        <View key={f} style={styles.featureRow}>
                            <Check size={16} color={Colors.success} strokeWidth={2.5} />
                            <Text style={styles.featureText}>{f}</Text>
                        </View>
                    ))}
                </View>

                {/* CTA */}
                <TouchableOpacity style={styles.cta} activeOpacity={0.85} onPress={onClose}>
                    <Check size={18} color={Colors.surface} />
                    <Text style={styles.ctaText}>Understood</Text>
                </TouchableOpacity>

                <Text style={styles.resetNote}>Resets at midnight</Text>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: Colors.overlayBackground,
        justifyContent: 'center', // Center the floating card
        padding: Spacing.xl,      // Give some room around the card
    },
    sheet: {
        backgroundColor: Colors.surface,
        borderRadius: Radius['2xl'], // Full border radius for premium look
        padding: Spacing['2xl'],
        paddingBottom: Spacing['3xl'],
        alignItems: 'center',
        ...Shadows.lg,               // Depth (lg is highest in theme)
    },
    closeBtn: {
        position: 'absolute',
        top: Spacing.lg,
        right: Spacing.lg,
        padding: Spacing.xs,
    },
    iconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: FontSize['2xl'],
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.sans,
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        lineHeight: 20,
    },
    features: {
        width: '100%',
        gap: Spacing.md,
        marginBottom: Spacing['2xl'],
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    featureText: {
        fontSize: FontSize.md,
        fontFamily: Fonts.sans,
        color: Colors.textPrimary,
    },
    cta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.primary,
        borderRadius: Radius.lg,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing['2xl'],
        width: '100%',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    ctaText: {
        fontSize: FontSize.lg,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.surface,
    },
    resetNote: {
        fontSize: FontSize.xs,
        fontFamily: Fonts.sans,
        color: Colors.textPrimary,
    },
});
