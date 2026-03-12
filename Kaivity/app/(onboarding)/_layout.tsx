import { Stack } from 'expo-router';

export default function OnboardingLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="welcome" />
            <Stack.Screen name="questionnaire" />
            <Stack.Screen name="create-profile" />
            <Stack.Screen name="first-activity" />
            <Stack.Screen name="upload" />
        </Stack>
    );
}
