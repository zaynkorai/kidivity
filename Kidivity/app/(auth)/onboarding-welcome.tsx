import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Wand2, ShieldCheck, TrendingUp, ArrowRight } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, FontSize, FontWeight, Fonts, Radius } from '@/constants/theme';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { useOnboardingGuard } from '@/hooks/useOnboardingGuard';
import { useOnboardingSessionStore } from '@/store/onboardingSession.store';


export default function WelcomeScreen() {
    useOnboardingGuard(1);
    const router = useRouter();
    const setStep = useOnboardingSessionStore(s => s.setStep);

    const handleStart = () => {
        setStep(2);
        router.push('/(onboarding)/questionnaire');
    };

    return (
        <SafeAreaView style={styles.safe}>
            <ScreenBackground variant="vibrant" />
            <View style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.title}>Smart Learning,{'\n'}Screen-Free</Text>
                    <Text style={styles.subtitle}>
                        Personalized, printable activities tailored to your child&apos;s age and grade level.
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Button
                        title="Get Started"
                        onPress={handleStart}
                        size="lg"
                        style={styles.button}
                        icon={<ArrowRight size={20} color={Colors.white} />}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    container: {
        flex: 1,
        justifyContent: 'space-between',
        padding: Spacing['2xl'],
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing['3xl'],
    },
    title: {
        fontSize: FontSize['4xl'],
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: Spacing.md,
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: FontSize.lg,
        fontFamily: Fonts.sans,
        color: Colors.textPrimary,
        textAlign: 'center',
        lineHeight: 28,
        paddingHorizontal: Spacing.xl,
    },
    footer: {
        width: '100%',
        paddingBottom: Spacing.xl,
    },
    button: {
        width: '100%',
        borderRadius: Radius.full,
    },
});
