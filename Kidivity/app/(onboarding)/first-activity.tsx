import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Wand2 } from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, Fonts } from '@/constants/theme';
import { useActivityStore } from '@/store/activityStore';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Button } from '@/components/ui/Button';

export default function FirstActivityScreen() {
    const router = useRouter();
    const { name, profileId } = useLocalSearchParams<{ name: string; profileId: string }>();
    const generateActivity = useActivityStore((s) => s.generateActivity);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const generate = async () => {
            if (!profileId) {
                if (isMounted) setError('Missing profile ID');
                return;
            }

            // We generate the very first math activity.
            const { error: generateError } = await generateActivity({
                kid_profile_id: profileId,
                category: 'math',
                topic: 'Counting',
                difficulty: 'easy',
                style: 'colorful',
            });

            if (generateError) {
                if (isMounted) setError(generateError);
                return;
            }

            // Successfully generated, proceed to main tabs!
            if (isMounted) {
                // Ensure a small delay for the animation effect even if generation was super fast
                setTimeout(() => {
                    router.replace('/(tabs)');
                }, 1500);
            }
        };

        generate();

        return () => {
            isMounted = false;
        };
    }, [generateActivity, profileId, router]);

    return (
        <SafeAreaView style={styles.safe}>
            <ScreenBackground />
            <View style={[StyleSheet.absoluteFill, styles.buildingOverlay]}>
                <View style={styles.buildingContent}>
                    <Wand2 size={64} color={Colors.primary} style={styles.wandIcon} />
                    <Text style={styles.buildingTitle}>Building Engine...</Text>
                    {name ? (
                        <Text style={styles.buildingSubtitle}>Customizing math quests for {name}</Text>
                    ) : (
                        <Text style={styles.buildingSubtitle}>Customizing first quest...</Text>
                    )}
                    {error && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>Oops! We had a small hiccup building the engine: {error}</Text>
                            <Button
                                title="Skip to Dashboard"
                                onPress={() => router.replace('/(tabs)')}
                                variant="secondary"
                                style={styles.skipBtn}
                            />
                        </View>
                    )}
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
    buildingOverlay: {
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    buildingContent: {
        alignItems: 'center',
        padding: Spacing['2xl'],
    },
    buildingTitle: {
        fontFamily: Fonts.bold,
        fontSize: FontSize['3xl'],
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    buildingSubtitle: {
        fontFamily: Fonts.sans,
        fontSize: FontSize.lg,
        color: Colors.textPrimary,
        textAlign: 'center',
    },
    errorContainer: {
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        width: '100%',
    },
    errorText: {
        fontFamily: Fonts.sans,
        marginTop: Spacing.lg,
        fontSize: FontSize.md,
        color: Colors.textPrimary,
        textAlign: 'center',
    },
    wandIcon: {
        marginBottom: Spacing.xl,
    },
    skipBtn: {
        marginTop: Spacing.xl,
    },
});
