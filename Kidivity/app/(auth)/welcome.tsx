import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, Mail, ArrowRight } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

export default function WelcomeScreen() {
    const router = useRouter();
    const { signIn, isLoading } = useAuthStore();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [showSignIn, setShowSignIn] = React.useState(false);

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
        // Auth state change will trigger redirect via root layout
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
                >
                    {/* Hero Section */}
                    <View style={styles.hero}>
                        {/* Decorative Circles */}
                        <View style={styles.decorCircle1} />
                        <View style={styles.decorCircle2} />
                        <View style={styles.decorCircle3} />

                        {/* Logo */}
                        <View style={styles.logoContainer}>
                            <View style={styles.logoIcon}>
                                <Sparkles size={32} color={Colors.white} />
                            </View>
                            <Text style={styles.logoText}>Kidivity</Text>
                        </View>

                        {/* Tagline */}
                        <Text style={styles.tagline}>
                            AI-Powered Activities{'\n'}Your Kids Will Love
                        </Text>
                        <Text style={styles.subtitle}>
                            Create personalized, educational activities{'\n'}
                            tailored to each child{"'"}s interests and level.
                        </Text>

                        {/* Feature Highlights */}
                        <View style={styles.features}>
                            {[
                                { emoji: '🧩', label: 'Logic Puzzles' },
                                { emoji: '✏️', label: 'Tracing Sheets' },
                                { emoji: '📚', label: 'Educational' },
                                { emoji: '🌿', label: 'Screen-Free' },
                            ].map((f) => (
                                <View key={f.label} style={styles.featurePill}>
                                    <Text style={styles.featureEmoji}>{f.emoji}</Text>
                                    <Text style={styles.featureLabel}>{f.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Sign In Form or CTA Buttons */}
                    <View style={styles.bottom}>
                        {showSignIn ? (
                            <View style={styles.signInForm}>
                                <Text style={styles.signInTitle}>Welcome Back</Text>

                                <Input
                                    label="Email"
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
                                    containerStyle={{ marginTop: Spacing.md }}
                                />

                                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                                <Button
                                    title="Sign In"
                                    onPress={handleSignIn}
                                    loading={isLoading}
                                    size="lg"
                                    style={styles.signInButton}
                                    icon={<ArrowRight size={20} color={Colors.white} />}
                                />

                                <TouchableOpacity
                                    onPress={() => {
                                        setShowSignIn(false);
                                        setError('');
                                    }}
                                    style={styles.switchLink}
                                >
                                    <Text style={styles.switchLinkText}>
                                        Don{"'"}t have an account?{' '}
                                        <Text style={styles.switchLinkBold}>Sign Up</Text>
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.ctaContainer}>
                                <Button
                                    title="Get Started"
                                    onPress={() => router.push('/(auth)/sign-up')}
                                    size="lg"
                                    style={styles.ctaPrimary}
                                    icon={<Sparkles size={20} color={Colors.white} />}
                                />

                                <TouchableOpacity
                                    onPress={() => setShowSignIn(true)}
                                    style={styles.secondaryCta}
                                >
                                    <Mail size={18} color={Colors.primary} />
                                    <Text style={styles.secondaryCtaText}>
                                        I already have an account
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    flex: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },

    // Hero
    hero: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing['2xl'],
        paddingTop: Spacing['5xl'],
        paddingBottom: Spacing['3xl'],
        overflow: 'hidden',
    },
    decorCircle1: {
        position: 'absolute',
        top: -60,
        right: -40,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: Colors.primary + '12',
    },
    decorCircle2: {
        position: 'absolute',
        top: 120,
        left: -80,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: Colors.accent + '10',
    },
    decorCircle3: {
        position: 'absolute',
        bottom: 40,
        right: -20,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.success + '10',
    },

    // Logo
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing['3xl'],
    },
    logoIcon: {
        width: 56,
        height: 56,
        borderRadius: Radius.lg,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.lg,
    },
    logoText: {
        fontSize: FontSize['4xl'],
        fontWeight: FontWeight.extrabold,
        color: Colors.textPrimary,
        letterSpacing: -1,
    },

    // Tagline
    tagline: {
        fontSize: FontSize['3xl'],
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        textAlign: 'center',
        lineHeight: 38,
        marginBottom: Spacing.md,
    },
    subtitle: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: Spacing['2xl'],
    },

    // Features
    features: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    featurePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.surface,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    featureEmoji: {
        fontSize: 16,
    },
    featureLabel: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        color: Colors.textSecondary,
    },

    // Bottom CTA
    bottom: {
        paddingHorizontal: Spacing['2xl'],
        paddingBottom: Spacing['3xl'],
    },
    ctaContainer: {
        gap: Spacing.lg,
    },
    ctaPrimary: {
        width: '100%',
        borderRadius: Radius.xl,
        paddingVertical: 18,
    },
    secondaryCta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
    },
    secondaryCtaText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
        color: Colors.primary,
    },

    // Sign In Form
    signInForm: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.xl,
        padding: Spacing['2xl'],
        ...Shadows.md,
    },
    signInTitle: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.xl,
        textAlign: 'center',
    },
    errorText: {
        fontSize: FontSize.sm,
        color: Colors.accent,
        textAlign: 'center',
        marginTop: Spacing.md,
    },
    signInButton: {
        width: '100%',
        marginTop: Spacing.xl,
        borderRadius: Radius.lg,
        paddingVertical: 16,
    },
    switchLink: {
        alignItems: 'center',
        marginTop: Spacing.lg,
    },
    switchLinkText: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },
    switchLinkBold: {
        color: Colors.primary,
        fontWeight: FontWeight.semibold,
    },
});
