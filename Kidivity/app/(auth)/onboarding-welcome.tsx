import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Wand2, ShieldCheck, TrendingUp, ArrowRight } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, FontSize, FontWeight, Fonts, Radius } from '@/constants/theme';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { useOnboardingGuard } from '@/hooks/useOnboardingGuard';
import { useOnboardingSessionStore } from '@/store/onboardingSession.store';


const SLIDES = [
    {
        id: '1',
        title: 'Personalized Learning',
        subtitle: 'Printable activities tailored to your child&apos;s age and grade level.',
        Icon: Wand2,
        color: Colors.categoryMath,
    },
    {
        id: '2',
        title: 'Screen-Free Time You Feel Good About',
        subtitle: 'Printable, educational activities you can trust.',
        Icon: ShieldCheck,
        color: Colors.categoryScience,
    },
    {
        id: '3',
        title: 'Track Their Growth',
        subtitle: 'See progress across Math, Reading, and more with every activity.',
        Icon: TrendingUp,
        color: Colors.categoryReading,
    },
];

export default function WelcomeScreen() {
    useOnboardingGuard(1);
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const setStep = useOnboardingSessionStore(s => s.setStep);

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setStep(2);
            router.push('/(onboarding)/questionnaire');
        }
    };

    const currentSlide = SLIDES[currentIndex];
    const Icon = currentSlide.Icon;

    return (
        <SafeAreaView style={styles.safe}>
            <ScreenBackground />
            <View style={styles.container}>
                <View style={styles.content}>
                    <View style={[styles.iconContainer, { backgroundColor: currentSlide.color + '20' }]}>
                        <Icon size={80} color={currentSlide.color} />
                    </View>
                    <Text style={styles.title}>{currentSlide.title}</Text>
                    <Text style={styles.subtitle}>{currentSlide.subtitle}</Text>
                </View>

                <View style={styles.footer}>
                    <View style={styles.pagination}>
                        {SLIDES.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    currentIndex === index && styles.dotActive,
                                    currentIndex === index && { backgroundColor: currentSlide.color }
                                ]}
                            />
                        ))}
                    </View>

                    <Button
                        title={currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                        onPress={handleNext}
                        size="lg"
                        style={styles.button}
                        icon={currentIndex === SLIDES.length - 1 ? undefined : <ArrowRight size={20} color={Colors.white} />}
                    />
                </View>
            </View>
        </SafeAreaView>
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
        fontSize: FontSize['3xl'],
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: Spacing.md,
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
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing['2xl'],
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.border,
    },
    dotActive: {
        width: 24,
    },
    button: {
        width: '100%',
        borderRadius: Radius.full,
    },
});
