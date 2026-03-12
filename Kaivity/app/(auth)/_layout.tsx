import { Stack } from 'expo-router';

export default function AuthLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="welcome" />
            <Stack.Screen name="onboarding-welcome" />
            <Stack.Screen name="questionnaire" />
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="sign-up" />
        </Stack>
    );
}
