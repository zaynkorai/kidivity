import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { 
    FadeInDown, 
    FadeInUp, 
    withRepeat, 
    withTiming, 
    withSequence,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';
import { Rocket, Mail, Star } from 'lucide-react-native';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, FontSize, Fonts } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
    const insets = useSafeAreaInsets();
    const { height, isCompact } = useResponsive();
    const router = useRouter();

    // Floating animation for the mascot
    const translateY = useSharedValue(0);

    React.useEffect(() => {
        translateY.value = withRepeat(
            withSequence(
                withTiming(-15, { duration: 2000 }),
                withTiming(0, { duration: 2000 })
            ),
            -1,
            true
        );
    }, []);

    const floatingStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const handleEmailAuth = () => {
        router.push('/(auth)/sign-in');
    };



    return (
        <View style={styles.safe}>
            <ScreenBackground variant="vibrant" />
            
            <View style={styles.container}>
                {/* Hero Section */}
                <View style={[styles.heroSection, { paddingTop: insets.top + Spacing.xl }]}>
                    <Animated.View style={[styles.mascotContainer, floatingStyle]} entering={FadeInUp.delay(200).duration(1000)}>
                        <View style={styles.iconCircle}>
                            <Rocket size={80} color={Colors.white} />
                        </View>
                        <Animated.View 
                            entering={FadeInDown.delay(600).springify()}
                            style={styles.starDecoration}
                        >
                            <Star size={24} color={Colors.secondary} fill={Colors.secondary} />
                        </Animated.View>
                    </Animated.View>
                </View>

                {/* Content Section */}
                <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, Spacing.xl) }]}>
                    <Animated.View entering={FadeInDown.delay(400).duration(800)}>
                        <Text style={styles.title}>Kidivity</Text>
                        <Text style={styles.subtitle}>
                            Printable, screen-free activities{'\n'}tailored to your child's curiosity.
                        </Text>
                    </Animated.View>

                    <Animated.View 
                        entering={FadeInDown.delay(800).duration(800)}
                        style={styles.buttonGroup}
                    >
                        <Button 
                            title="Continue with Email"
                            variant="primary"
                            size="lg"
                            onPress={handleEmailAuth}
                            icon={<Mail size={20} color={Colors.white} />}
                            style={styles.mainButton}
                        />



                        <TouchableOpacity 
                            style={styles.signUpLink} 
                            onPress={() => router.push('/(onboarding)/welcome')}
                        >
                            <Text style={styles.signUpText}>
                                New here? <Text style={styles.signUpBold}>Create an account</Text>
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    container: {
        flex: 1,
        justifyContent: 'space-between',
    },
    heroSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mascotContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    starDecoration: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: Colors.white,
        padding: Spacing.xs,
        borderRadius: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    bottomSection: {
        paddingHorizontal: Spacing['3xl'],
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingTop: Spacing['2xl'],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 20,
    },
    title: {
        fontSize: FontSize['4xl'],
        fontFamily: Fonts.bold,
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: FontSize.md,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing['3xl'],
        lineHeight: 24,
    },
    buttonGroup: {
        gap: Spacing.md,
        width: '100%',
    },
    mainButton: {
        width: '100%',
    },

    signUpLink: {
        marginTop: Spacing.md,
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    signUpText: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.sans,
        color: Colors.textSecondary,
    },
    signUpBold: {
        color: Colors.primary,
        fontFamily: Fonts.bold,
    }
});

