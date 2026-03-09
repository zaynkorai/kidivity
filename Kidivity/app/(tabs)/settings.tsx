import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Settings as SettingsIcon, LogOut, Plus, Trash2, Edit3, ChevronRight } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, FontSize, FontWeight } from '@/constants/theme';

export default function SettingsScreen() {
    const router = useRouter();
    const { user, signOut } = useAuthStore();
    const { profiles, deleteProfile } = useProfileStore();

    const handleDeleteProfile = (id: string, name: string) => {
        Alert.alert(
            'Delete Profile',
            `Are you sure you want to delete ${name}'s profile? This will also delete all their activities.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteProfile(id),
                },
            ]
        );
    };

    const handleSignOut = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: signOut },
        ]);
    };

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <SettingsIcon size={24} color={Colors.primary} />
                    <Text style={styles.title}>Settings</Text>
                </View>

                {/* Kid Profiles Section */}
                <Text style={styles.sectionTitle}>Kid Profiles</Text>
                <Card variant="elevated">
                    {profiles.map((profile, index) => (
                        <View key={profile.id}>
                            <View style={styles.profileRow}>
                                <View style={styles.profileInfo}>
                                    <View
                                        style={[
                                            styles.avatar,
                                            { backgroundColor: profile.avatar_color },
                                        ]}
                                    >
                                        <Text style={styles.avatarText}>
                                            {profile.name.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={styles.profileName}>{profile.name}</Text>
                                        <Text style={styles.profileMeta}>
                                            {profile.age}yo · {profile.grade_level} · {profile.interests.length} interests
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.profileActions}>
                                    <TouchableOpacity
                                        onPress={() => router.push(`/profile/${profile.id}/edit`)}
                                    >
                                        <Edit3 size={18} color={Colors.textSecondary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleDeleteProfile(profile.id, profile.name)}
                                    >
                                        <Trash2 size={18} color={Colors.accent} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            {index < profiles.length - 1 && <View style={styles.divider} />}
                        </View>
                    ))}

                    <TouchableOpacity
                        style={styles.addProfileBtn}
                        onPress={() => router.push('/profile/create')}
                    >
                        <Plus size={18} color={Colors.primary} />
                        <Text style={styles.addProfileText}>Add Kid Profile</Text>
                    </TouchableOpacity>
                </Card>

                {/* Account Section */}
                <Text style={styles.sectionTitle}>Account</Text>
                <Card variant="elevated">
                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>Email</Text>
                        <Text style={styles.settingValue}>{user?.email ?? 'Not signed in'}</Text>
                    </View>
                </Card>

                {/* About Section */}
                <Text style={styles.sectionTitle}>About</Text>
                <Card variant="elevated">
                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>Version</Text>
                        <Text style={styles.settingValue}>1.0.0</Text>
                    </View>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.settingRow}>
                        <Text style={styles.settingLabel}>Send Feedback</Text>
                        <ChevronRight size={18} color={Colors.textTertiary} />
                    </TouchableOpacity>
                </Card>

                {/* Sign Out */}
                <Button
                    title="Sign Out"
                    onPress={handleSignOut}
                    variant="outline"
                    size="lg"
                    icon={<LogOut size={18} color={Colors.primary} />}
                    style={styles.signOutBtn}
                />

                <View style={{ height: Spacing['3xl'] }} />
            </ScrollView>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    title: {
        fontSize: FontSize['2xl'],
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },

    sectionTitle: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: Spacing.xl,
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xs,
    },

    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.white,
    },
    profileName: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },
    profileMeta: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    profileActions: {
        flexDirection: 'row',
        gap: Spacing.lg,
    },

    addProfileBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        marginTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    addProfileText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        color: Colors.primary,
    },

    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
    },
    settingLabel: {
        fontSize: FontSize.md,
        color: Colors.textPrimary,
    },
    settingValue: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },

    divider: {
        height: 1,
        backgroundColor: Colors.border,
    },

    signOutBtn: {
        marginTop: Spacing['2xl'],
    },
});
