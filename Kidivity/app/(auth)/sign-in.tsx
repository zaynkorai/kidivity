import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    useWindowDimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Wand2, Star, Rocket } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';


const ScreenColors = {
    background: Colors.background,
    formBg: Colors.surface,
    blueHeader: Colors.pastelBlue,
    blueText: Colors.textPrimary,
    textMain: Colors.textPrimary,
    textSecondary: Colors.textSecondary,
};

export default function SignInScreen() {
    const { height } = useWindowDimensions();
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

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <View style={styles.themedContainer}>
                        <ScreenBackground />

                        {/* 1. Header Banner - 45% height block */}
                        <View style={[styles.headerBlock, { height: height * 0.45 }]}>
                            <TouchableOpacity
                                onPress={() => router.back()}
                                style={styles.backButton}
                            >
                                <ArrowLeft size={24} color={ScreenColors.blueText} />
                            </TouchableOpacity>

                            {/* Grouped harmonious illustration */}
                            <View style={styles.illustrationGroup}>
                                <Star size={24} color="#FDCB6E" fill="#FDCB6E" style={[styles.floatingIcon, { top: 10, left: -40 }]} />
                                <Star size={16} color="#FFADAD" fill="#FFADAD" style={[styles.floatingIcon, { bottom: 20, right: -50 }]} />
                                <Rocket size={80} color={ScreenColors.blueText} style={{ transform: [{ rotate: '45deg' }] }} />
                            </View>

                            <Text style={styles.headerTitle}>Welcome{'\n'}Back!</Text>
                        </View>

                        {/* 2. Elevated Form Surface - Overlapping the Header */}
                        <View style={styles.formSurface}>
                            <View style={styles.formCard}>
                                <Text style={styles.title}>Sign In</Text>
                                <Text style={styles.subtitle}>
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
                                        containerStyle={{ marginTop: Spacing.xl }}
                                    />

                                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                                    <Button
                                        title="Sign In"
                                        onPress={handleSignIn}
                                        loading={isLoading}
                                        size="lg"
                                        style={styles.submitButton}
                                        icon={<ArrowRight size={20} color={Colors.white} />}
                                    />

                                    <TouchableOpacity
                                        onPress={() => router.replace('/(auth)/sign-up')}
                                        style={styles.switchLink}
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
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: ScreenColors.background,
    },
    flex: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    themedContainer: {
        backgroundColor: ScreenColors.background,
    },

    // 1. Header Block (Blue)
    headerBlock: {
        width: '100%',
        backgroundColor: ScreenColors.blueHeader,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomLeftRadius: Radius.xl * 2,
        borderBottomRightRadius: Radius.xl * 2,
    },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? Spacing['xl'] : Spacing['3xl'],
        left: Spacing['2xl'],
        zIndex: 20,
        width: 44,
        height: 44,
        borderRadius: Radius.full,
        backgroundColor: Colors.white + '90',
        alignItems: 'center',
        justifyContent: 'center',
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
        fontWeight: FontWeight.extrabold,
        color: ScreenColors.blueText,
        textAlign: 'center',
        lineHeight: 44,
        letterSpacing: -1,
    },

    // 2. Overlapping Elevated Form
    formSurface: {
        paddingHorizontal: Spacing['2xl'],
        marginTop: -60, // The overlap effect
        paddingBottom: Spacing['5xl'],
    },
    formCard: {
        backgroundColor: ScreenColors.formBg,
        borderRadius: Radius.xl * 1.5,
        padding: Spacing['3xl'],
        ...Shadows.lg,
    },
    title: {
        fontSize: FontSize['2xl'],
        fontWeight: FontWeight.bold,
        color: ScreenColors.textMain,
        marginBottom: Spacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: FontSize.sm,
        color: ScreenColors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing['3xl'],
    },
    form: {
        width: '100%',
    },

    // Error
    errorText: {
        fontSize: FontSize.sm,
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
        color: ScreenColors.textSecondary,
    },
    switchLinkBold: {
        color: ScreenColors.textMain,
        fontWeight: FontWeight.extrabold,
    },
});
