import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Globe, Atom, Rocket, Ruler, PenTool, Star, Cloud } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Fonts, Shadows } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';
// Screen colors aligned to the core theme
const ScreenColors = {
    background: Colors.background,
    authBg: Colors.pastelPeach,
    textMain: Colors.textPrimary,
    textPrimary: Colors.textPrimary,
    textSecondary: Colors.textSecondary,
};

export default function WelcomeScreen() {
    const { height, isCompact } = useResponsive();
    const router = useRouter();

    const handleGoogleAuth = () => {
        // TODO(auth): Implement Google OAuth before launch.
        // Implement real OAuth later
    };

    const handleAppleAuth = () => {
        // TODO(auth): Implement Apple OAuth before launch.
        // Implement real OAuth later
    };

    const handleEmailAuth = () => {
        router.push('/(auth)/sign-in');
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={[styles.slideContainer, { backgroundColor: ScreenColors.authBg }]}>
                {/* Top Floating Space Elements Container */}
                <View style={[styles.floatingContainer, { height: height * 0.45 }]}>
                    {/* Decorative Icons positioned absolutely to match the Sign In screenshot */}
                    <Globe size={64} color={Colors.blue} style={[styles.floatingIcon, { top: '10%', left: '42%' }]} />
                    <Star size={24} color={Colors.yellow} fill={Colors.yellow} style={[styles.floatingIcon, { top: '45%', right: '15%' }]} />
                    <Star size={24} color={Colors.rad} fill={Colors.rad} style={[styles.floatingIcon, { top: '12%', right: '18%' }]} />

                    <Atom size={50} color={Colors.green} style={[styles.floatingIcon, { top: '65%', left: '26%', transform: [{ rotate: '15deg' }] }]} />
                    <Rocket size={56} color={Colors.primary} style={[styles.floatingIcon, { top: '40%', right: '35%', transform: [{ rotate: '45deg' }] }]} />

                    <Ruler size={60} color={Colors.primaryPurple} style={[styles.floatingIcon, { top: '30%', left: '12%', transform: [{ rotate: '-30deg' }] }]} />
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

                    <TouchableOpacity style={styles.oauthButton} onPress={handleEmailAuth}>
                        <View style={styles.oauthIconContainer}>
                            <Text style={styles.oauthTypeletter}>G</Text>
                        </View>
                        <Text style={styles.oauthButtonLabel}>Continue with Google</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.oauthButton} onPress={handleAppleAuth}>
                        <View style={styles.oauthIconContainer}>
                            <Text style={[styles.oauthTypeletter, { color: '#000' }]}></Text>
                        </View>
                        <Text style={styles.oauthButtonLabel}>Continue with Apple</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.emailButton} onPress={handleEmailAuth}>
                        <Text style={styles.emailButtonLabel}>Continue with Email</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.signUpLink} onPress={() => router.push('/(onboarding)/welcome')}>
                        <Text style={styles.signUpText}>Don&apos;t have an account? <Text style={styles.signUpBold}>Sign Up</Text></Text>
                    </TouchableOpacity>
                </View>

                {/* Bottom Bush / Cloud Decoration */}
                <View style={styles.bottomDecoration}>
                    <Cloud size={140} color={Colors.primary} fill={Colors.primary} style={styles.bushIcon} />
                    <Cloud size={120} color={Colors.orange} fill={Colors.orange} style={[styles.bushIcon, { marginLeft: -60, marginTop: 20 }]} />
                </View>
            </View>
        </SafeAreaView>
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
        marginTop: Platform.OS === 'ios' ? Spacing['3xl'] : Spacing['5xl'],
    },
    floatingIcon: {
        position: 'absolute',
    },
    squiggleText: {
        fontSize: 32,
        color: Colors.rad,
        fontFamily: Fonts.bold,
        fontWeight: 'bold',
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
        fontSize: 36,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.extrabold,
        color: ScreenColors.textMain,
        marginBottom: Spacing.sm,
    },
    authSubtitle: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        fontWeight: FontWeight.medium,
        color: ScreenColors.textPrimary,
        textAlign: 'center',
        marginBottom: Spacing['3xl'],
        lineHeight: 22,
    },
    oauthButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.white,
        paddingVertical: 18,
        paddingHorizontal: Spacing['2xl'],
        borderRadius: Radius.full,
        width: '100%',
        marginBottom: Spacing.lg,
        ...Shadows.md,
        shadowOpacity: 0.04, // Very soft shadow
    },
    oauthIconContainer: {
        marginRight: Spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    oauthTypeletter: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.extrabold,
        color: '#4285F4',
    },
    oauthButtonLabel: {
        fontSize: FontSize.md,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: ScreenColors.textMain,
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
        fontWeight: FontWeight.bold,
        color: ScreenColors.textPrimary,
    },
    signUpLink: {
        position: 'absolute',
        bottom: 40,
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
        fontWeight: FontWeight.extrabold,
    }
});
