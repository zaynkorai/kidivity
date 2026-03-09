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
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

const FEATURES = [
    'Unlimited activity generation',
    'Workbook & multi-pack exports',
    'Hyper-personalized AI imagery',
    'Ad-free experience',
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
                    <X size={20} color={Colors.textSecondary} />
                </TouchableOpacity>

                {/* Icon */}
                <View style={styles.iconWrap}>
                    <Zap size={32} color={Colors.surface} fill={Colors.surface} />
                </View>

                <Text style={styles.title}>You&apos;ve hit your limit</Text>
                <Text style={styles.subtitle}>
                    {used}/{limit} free activities used today. Upgrade for unlimited access.
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
                <TouchableOpacity style={styles.cta} activeOpacity={0.85}>
                    <Zap size={18} color={Colors.surface} fill={Colors.surface} />
                    <Text style={styles.ctaText}>Upgrade to Premium</Text>
                </TouchableOpacity>

                <Text style={styles.resetNote}>Free limit resets at midnight</Text>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: Radius.xl,
        borderTopRightRadius: Radius.xl,
        padding: Spacing['2xl'],
        paddingBottom: Spacing['4xl'],
        alignItems: 'center',
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
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
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
        fontWeight: FontWeight.bold,
        color: Colors.surface,
    },
    resetNote: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
    },
});
