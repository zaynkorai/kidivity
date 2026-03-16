import React from 'react';
import {
    ScrollView,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Colors, Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';
import { ProfileForm } from '@/components/features/ProfileForm';

export default function CreateProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const bottomPad = Math.max(insets.bottom + Spacing.lg, Spacing['4xl']);
    const { isCompact } = useResponsive();

    return (
        <SafeAreaView style={styles.safe}>
            <ScreenBackground />
            <KeyboardAvoidingView
                style={styles.flex1}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={[styles.content, isCompact && { padding: Spacing.lg }]}
                    keyboardShouldPersistTaps="handled"
                >
                    <ProfileForm 
                        onSuccess={() => router.back()} 
                        isCompact={isCompact} 
                    />
                    <View style={[styles.bottomSpacer, { height: bottomPad }]} />
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
    container: {
        flex: 1,
    },
    content: {
        padding: Spacing.xl,
    },
    flex1: {
        flex: 1,
    },
    bottomSpacer: {
        height: Spacing['4xl'],
    },
});
