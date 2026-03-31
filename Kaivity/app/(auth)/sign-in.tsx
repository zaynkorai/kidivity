import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    useWindowDimensions,
    Keyboard,
    TouchableWithoutFeedback
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Colors, Spacing, Radius, FontSize, FontWeight, Fonts, Shadows } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { useResponsive } from '@/hooks/useResponsive';


const ScreenColors = {
    background: Colors.background,
    formBg: Colors.surface,
    blueHeader: Colors.categories.math.pastel,
    blueText: Colors.textPrimary,
    textMain: Colors.textPrimary,
    textPrimary: Colors.textPrimary,
    textSecondary: Colors.textPrimary,
};

export default function SignInScreen() {
    const insets = useSafeAreaInsets();
    const { height, isCompact, isShort } = useResponsive();
    const router = useRouter();
    const signIn = useAuthStore((s) => s.signIn);
    const isLoading = useAuthStore((s) => s.isLoading);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSignIn = async () => {
        setErrors({});
        const newErrors: Record<string, string> = {};
        if (!email.trim()) {
            newErrors.email = 'Email is required';
        }
        if (!password.trim()) {
            newErrors.password = 'Password is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const result = await signIn(email.trim(), password.trim());
        if (result.error) {
            setErrors({ form: result.error });
        }
    };

    const headerHeight = isShort ? height * 0.18 : height * 0.40;
    const formPadding = isShort ? Spacing.sm : Spacing.xl;
    const overlapOffset = isShort ? -140 : -100;
    const fieldSpacing = isShort ? Spacing.xs : Spacing.md;

    return (
        <View style={styles.safe}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
                                style={[styles.backButton, { top: Math.max(insets.top + Spacing.sm, Spacing.xl) }]}
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
                                <Text style={[styles.subtitle, isShort && { marginBottom: Spacing.md, fontSize: FontSize.xs }]}>
                                    Pick up right where you left off.
                                </Text>

                                <View style={styles.form}>
                                    <Input
                                        label="Email Address"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChangeText={(text) => {
                                            setEmail(text);
                                            if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                                        }}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                        required
                                        error={errors.email}
                                    />

                                    <Input
                                        label="Password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChangeText={(text) => {
                                            setPassword(text);
                                            if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                                        }}
                                        secureTextEntry
                                        autoCapitalize="none"
                                        containerStyle={{ marginTop: fieldSpacing }}
                                        required
                                        error={errors.password}
                                    />

                                    {errors.form ? <Text style={styles.errorText}>{errors.form}</Text> : null}

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
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </View>
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
    headerTitle: {
        fontSize: FontSize['4xl'],
        fontFamily: Fonts.bold,
        color: ScreenColors.blueText,
        textAlign: 'center',
        lineHeight: 44,
        letterSpacing: -1,
    },

    // 2. Overlapping Elevated Form
    formSurface: {
        paddingHorizontal: Spacing['3xl'],
        marginTop: -100, // The overlap effect
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
    },
});
