import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Wand2, Star, Rocket } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Colors, Spacing, Radius, FontSize, FontWeight, Fonts, Shadows } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { useResponsive } from '@/hooks/useResponsive';


const ScreenColors = {
    background: Colors.background,
    formBg: Colors.surface,
    blueHeader: Colors.pastelBlue,
    blueText: Colors.textPrimary,
    textMain: Colors.textPrimary,
    textPrimary: Colors.textPrimary,
    textSecondary: Colors.textPrimary,
};

export default function SignInScreen() {
    const { height, isCompact, isShort } = useResponsive();
    const router = useRouter();
    const { signIn, isLoading } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSignIn = async () => {
        setError('');
        if (!email.trim() || !password.trim()) {
            setError('Please enter both email and password.');
            return;
        }
        const result = await signIn(email.trim(), password.trim());
        if (result.error) {
            setError(result.error);
        }
    };

    const headerHeight = isShort ? height * 0.18 : height * 0.40;
    const formPadding = isShort ? Spacing.md : Spacing['3xl'];
    const overlapOffset = isShort ? -120 : -60;
    const fieldSpacing = isShort ? Spacing.sm : Spacing.xl;

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.themedContainer}>
                        <ScreenBackground variant="vibrant" />

                        {/* 1. Header Banner - 45% height block */}
                        <View
                            style={[
                                styles.headerBlock,
                                { height: headerHeight },
                            ]}
                        >
                            <TouchableOpacity
                                onPress={() => router.back()}
                                style={styles.backButton}
                            >
                                <ArrowLeft size={24} color={ScreenColors.blueText} />
                            </TouchableOpacity>

                            <Text style={[styles.headerTitle, isShort && { fontSize: FontSize['3xl'], lineHeight: 36 }]}>Welcome{'\n'}Back!</Text>
                        </View>

                        {/* 2. Elevated Form Surface - Overlapping the Header */}
                        <View
                            style={[
                                styles.formSurface,
                                isCompact && { paddingHorizontal: Spacing.lg },
                                { marginTop: overlapOffset },
                            ]}
                        >
                            <View
                                style={[
                                    styles.formCard,
                                    { padding: formPadding },
                                ]}
                            >
                                <Text style={[styles.title, isShort && { fontSize: FontSize.xl, marginBottom: 0 }]}>Sign In</Text>
                                <Text style={[styles.subtitle, isShort && { marginBottom: Spacing.md, fontSize: 13 }]}>
                                    Pick up right where you left off.
                                </Text>

                                <View style={styles.form}>
                                    <Input
                                        label="Email Address"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                    />

                                    <Input
                                        label="Password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                        autoCapitalize="none"
                                        containerStyle={{ marginTop: fieldSpacing }}
                                    />

                                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                                    <Button
                                        title="Sign In"
                                        onPress={handleSignIn}
                                        loading={isLoading}
                                        size="lg"
                                        style={[styles.submitButton, isShort && { marginTop: Spacing.md, paddingVertical: 12 }]}
                                        icon={<ArrowRight size={20} color={Colors.white} />}
                                    />

                                    <TouchableOpacity
                                        onPress={() => router.replace('/(auth)/sign-up')}
                                        style={[styles.switchLink, isShort && { marginTop: Spacing.md }]}
                                    >
                                        <Text style={styles.switchLinkText}>
                                            Don&apos;t have an account?{' '}
                                            <Text style={styles.switchLinkBold}>Sign Up</Text>
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    flex: {
        flex: 1,
    },
    themedContainer: {
        flex: 1,
        backgroundColor: 'transparent',
    },

    // 1. Header Block (Blue)
    headerBlock: {
        width: '100%',
        backgroundColor: 'transparent',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? Spacing['xl'] : Spacing['3xl'],
        left: Spacing['2xl'],
        zIndex: 20,
        width: 44,
        height: 44,
        borderRadius: Radius.full,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.md,
    },
    illustrationGroup: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
    },
    floatingIcon: {
        position: 'absolute',
    },
    headerTitle: {
        fontSize: FontSize['4xl'],
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: ScreenColors.blueText,
        textAlign: 'center',
        lineHeight: 44,
        letterSpacing: -1,
    },

    // 2. Overlapping Elevated Form
    formSurface: {
        paddingHorizontal: Spacing.lg,
        marginTop: -100, // The overlap effect
        paddingBottom: Spacing.xs,
    },
    formCard: {
        backgroundColor: ScreenColors.formBg,
        borderRadius: Radius.xl,
        padding: Spacing.lg,
        ...Shadows.lg,
    },
    title: {
        fontSize: FontSize['2xl'],
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: ScreenColors.textMain,
        marginBottom: Spacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.sans,
        color: ScreenColors.textPrimary,
        textAlign: 'center',
        marginBottom: Spacing['3xl'],
    },
    form: {
        width: '100%',
    },

    // Error
    errorText: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.sans,
        color: Colors.accent,
        textAlign: 'center',
        marginTop: Spacing.md,
    },

    // Submit
    submitButton: {
        width: '100%',
        marginTop: Spacing['2xl'],
        borderRadius: Radius.full,
        paddingVertical: 18,
    },

    // Switch link
    switchLink: {
        alignItems: 'center',
        marginTop: Spacing.xl,
    },
    switchLinkText: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.sans,
        color: ScreenColors.textPrimary,
    },
    switchLinkBold: {
        color: ScreenColors.textMain,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
    },
});
