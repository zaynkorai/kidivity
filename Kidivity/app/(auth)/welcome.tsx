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
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '@/constants/theme';

import { useWindowDimensions } from 'react-native';
// Refined colors based on standard design philosophy from the screenshots
const ScreenColors = {
    background: '#FDFBF7', // Very pale cream background matching screenshot
    authBg: '#FFF9E6',     // Pale beige for the sign in screen
    textMain: '#1A1A1A',
    textSecondary: '#7A7A7A',
};

export default function WelcomeScreen() {
    const { height } = useWindowDimensions();
    const router = useRouter();

    const handleGoogleAuth = () => {
        // Implement real OAuth later
    };

    const handleAppleAuth = () => {
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
                    <Globe size={64} color="#FDCB6E" style={[styles.floatingIcon, { top: '10%', left: '42%' }]} />
                    <Star size={24} color="#FDCB6E" fill="#FDCB6E" style={[styles.floatingIcon, { top: '45%', right: '15%' }]} />
                    <Star size={24} color="#FFADAD" fill="#FFADAD" style={[styles.floatingIcon, { top: '12%', right: '18%' }]} />

                    <Atom size={50} color="#F7AFAF" style={[styles.floatingIcon, { top: '65%', left: '26%', transform: [{ rotate: '15deg' }] }]} />
                    <Rocket size={56} color="#FF8A00" style={[styles.floatingIcon, { top: '40%', right: '35%', transform: [{ rotate: '45deg' }] }]} />

                    <Ruler size={60} color="#E17A5D" style={[styles.floatingIcon, { top: '30%', left: '12%', transform: [{ rotate: '-30deg' }] }]} />
                    <PenTool size={26} color="#E17A5D" style={[styles.floatingIcon, { top: '25%', right: '40%', transform: [{ rotate: '60deg' }] }]} />

                    {/* Tiny decorative elements (squiggles simulated with tiny text) */}
                    <Text style={[styles.floatingIcon, styles.squiggleText, { top: '14%', left: '24%' }]}>~</Text>
                    <Text style={[styles.floatingIcon, styles.squiggleText, { top: '20%', right: '20%' }]}>~</Text>
                    <Text style={[styles.floatingIcon, styles.squiggleText, { top: '75%', right: '24%' }]}>~</Text>
                </View>

                {/* Bottom Auth Section */}
                <View style={styles.authBottomContainer}>
                    <Text style={styles.authTitle}>Welcome</Text>
                    <Text style={styles.authSubtitle}>
                        You&apos;re just one click away from{'\n'}finding the expertise and knowledge
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

                    <TouchableOpacity style={styles.signUpLink} onPress={() => router.push('/(auth)/onboarding-welcome')}>
                        <Text style={styles.signUpText}>Don&apos;t have an account? <Text style={styles.signUpBold}>Sign Up</Text></Text>
                    </TouchableOpacity>
                </View>

                {/* Bottom Bush / Cloud Decoration */}
                <View style={styles.bottomDecoration}>
                    <Cloud size={140} color="#F39C12" fill="#F39C12" style={styles.bushIcon} />
                    <Cloud size={120} color="#E67E22" fill="#E67E22" style={[styles.bushIcon, { marginLeft: -60, marginTop: 20 }]} />
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
        color: '#FFADAD',
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
        fontWeight: FontWeight.extrabold,
        color: ScreenColors.textMain,
        marginBottom: Spacing.sm,
    },
    authSubtitle: {
        fontSize: 14,
        fontWeight: FontWeight.medium,
        color: ScreenColors.textSecondary,
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
        fontWeight: FontWeight.extrabold,
        color: '#4285F4', // Google blue mockup
    },
    oauthButtonLabel: {
        fontSize: FontSize.md,
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
        fontWeight: FontWeight.bold,
        color: ScreenColors.textSecondary,
    },
    signUpLink: {
        position: 'absolute',
        bottom: 40,
        zIndex: 20,
    },
    signUpText: {
        fontSize: FontSize.sm,
        color: ScreenColors.textSecondary,
    },
    signUpBold: {
        color: ScreenColors.textMain,
        fontWeight: FontWeight.extrabold,
    }
});
