import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Globe, Atom, Rocket, Ruler, PenTool, Star, Cloud } from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, Fonts } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';
// Screen colors aligned to the core theme
const ScreenColors = {
    background: Colors.background,
    authBg: Colors.categories.reading.pastel,
    textMain: Colors.textPrimary,
    textPrimary: Colors.textPrimary,
    textSecondary: Colors.textSecondary,
};

export default function WelcomeScreen() {
    const insets = useSafeAreaInsets();
    const { height, isCompact } = useResponsive();
    const router = useRouter();

    const handleEmailAuth = () => {
        router.push('/(auth)/sign-in');
    };

    return (
        <View style={styles.safe}>
            <View style={[styles.slideContainer, { backgroundColor: ScreenColors.authBg }]}>
                {/* Top Floating Space Elements Container */}
                <View style={[styles.floatingContainer, { height: height * 0.45, paddingTop: Math.max(insets.top, Spacing.xl) }]}>
                    {/* Decorative Icons positioned absolutely to match the Sign In screenshot */}
                    <Globe size={64} color={Colors.categories.math.accent} style={[styles.floatingIcon, { top: '10%', left: '42%' }]} />
                    <Star size={24} color={Colors.categories.art.accent} fill={Colors.categories.art.accent} style={[styles.floatingIcon, { top: '45%', right: '15%' }]} />
                    <Star size={24} color={Colors.categories.reading.accent} fill={Colors.categories.reading.accent} style={[styles.floatingIcon, { top: '12%', right: '18%' }]} />

                    <Atom size={50} color={Colors.categories.science.accent} style={[styles.floatingIcon, { top: '65%', left: '26%', transform: [{ rotate: '15deg' }] }]} />
                    <Rocket size={56} color={Colors.primary} style={[styles.floatingIcon, { top: '40%', right: '35%', transform: [{ rotate: '45deg' }] }]} />

                    <Ruler size={60} color={Colors.secondary} style={[styles.floatingIcon, { top: '30%', left: '12%', transform: [{ rotate: '-30deg' }] }]} />
                    <PenTool size={26} color={Colors.primary} style={[styles.floatingIcon, { top: '25%', right: '40%', transform: [{ rotate: '60deg' }] }]} />

                    {/* Tiny decorative elements (squiggles simulated with tiny text) */}
                    <Text style={[styles.floatingIcon, styles.squiggleText, { top: '14%', left: '24%' }]}>~</Text>
                    <Text style={[styles.floatingIcon, styles.squiggleText, { top: '20%', right: '20%' }]}>~</Text>
                    <Text style={[styles.floatingIcon, styles.squiggleText, { top: '75%', right: '24%' }]}>~</Text>
                </View>

                {/* Bottom Auth Section */}
                <View style={[styles.authBottomContainer, isCompact && { paddingHorizontal: Spacing.xl }]}>
                    <Text style={styles.authTitle}>Welcome</Text>
                    <Text style={styles.authSubtitle}>
                        You&apos;re one step away from{'\n'}printable, screen-free activities tailored to your child
                    </Text>

                    <TouchableOpacity style={styles.emailButton} onPress={handleEmailAuth}>
                        <Text style={styles.emailButtonLabel}>Continue with Email</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.signUpLink, { bottom: Math.max(insets.bottom + Spacing.lg, 40) }]} 
                        onPress={() => router.push('/(onboarding)/welcome')}
                    >
                        <Text style={styles.signUpText}>Don&apos;t have an account? <Text style={styles.signUpBold}>Sign Up</Text></Text>
                    </TouchableOpacity>
                </View>

                {/* Bottom Bush / Cloud Decoration */}
                <View style={styles.bottomDecoration}>
                    <Cloud size={140} color={Colors.primary} fill={Colors.primary} style={styles.bushIcon} />
                    <Cloud size={120} color={Colors.primary} fill={Colors.primary} style={[styles.bushIcon, { marginLeft: -60, marginTop: 20 }]} />
                </View>
            </View>
            </View>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: ScreenColors.background,
    },
    slideContainer: {
        flex: 1,
        alignItems: 'center',
    },

    /* ─── Sign In Slide Specifics ─── */
    floatingContainer: {
        width: '100%',
        position: 'relative',
    },
    floatingIcon: {
        position: 'absolute',
    },
    squiggleText: {
        fontSize: FontSize['3xl'],
        color: Colors.categories.tracing.accent,
        fontFamily: Fonts.bold,
        transform: [{ rotate: '45deg' }]
    },

    authBottomContainer: {
        width: '100%',
        paddingHorizontal: Spacing['3xl'],
        alignItems: 'center',
        marginTop: Spacing.xl,
        zIndex: 10,
    },
    authTitle: {
        fontSize: FontSize['4xl'],
        fontFamily: Fonts.bold,
        color: ScreenColors.textMain,
        marginBottom: Spacing.sm,
    },
    authSubtitle: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.medium,
        color: ScreenColors.textPrimary,
        textAlign: 'center',
        marginBottom: Spacing['3xl'],
        lineHeight: 22,
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

    emailButton: {
        paddingVertical: Spacing.md,
        marginTop: Spacing.sm,
    },
    emailButtonLabel: {
        fontSize: FontSize.md,
        fontFamily: Fonts.bold,
        color: ScreenColors.textPrimary,
    },
    signUpLink: {
        position: 'absolute',
        zIndex: 20,
    },
    signUpText: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.sans,
        color: ScreenColors.textPrimary,
    },
    signUpBold: {
        color: ScreenColors.textMain,
        fontFamily: Fonts.bold,
    }
});
