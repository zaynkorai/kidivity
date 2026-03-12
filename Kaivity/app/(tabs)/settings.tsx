import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Alert,
    Share,
    Linking,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity as GHTouchableOpacity } from 'react-native-gesture-handler';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import * as LinkingApi from 'expo-linking';
import * as Haptics from 'expo-haptics';
import {
    Settings as SettingsIcon,
    LogOut,
    Plus,
    Trash2,
    Edit3,
    ChevronRight,
    Share as ShareIcon,
    HelpCircle,
    Star,
    Shield,
    KeyRound,
    Mail,
    UserX,
    Info,
} from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { ParentGate } from '@/components/ui/ParentGate';
import { Colors, Spacing, FontSize, FontWeight, Fonts } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useResponsive } from '@/hooks/useResponsive';

type GateAction = 'delete' | 'add' | 'edit' | 'delete_account' | null;

export default function SettingsScreen() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const signOut = useAuthStore((s) => s.signOut);
    const profiles = useProfileStore((s) => s.profiles);
    const deleteProfile = useProfileStore((s) => s.deleteProfile);
    const { isTablet, isCompact } = useResponsive();
    const isMobile = !isTablet;
    const tabBarHeight = useBottomTabBarHeight();
    const tabBarOffset = Platform.OS === 'ios' ? Spacing['2xl'] : Spacing.lg;
    const bottomPad = Math.max(tabBarHeight + tabBarOffset - Spacing.md, Spacing['3xl']);

    const [gateVisible, setGateVisible] = useState(false);
    const [pendingAction, setPendingAction] = useState<GateAction>(null);
    const [pendingProfileId, setPendingProfileId] = useState<string | null>(null);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

    const openGate = (action: GateAction, id?: string) => {
        setPendingAction(action);
        if (id) setPendingProfileId(id);
        setGateVisible(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleGateSuccess = () => {
        setGateVisible(false);
        setTimeout(() => {
            if (pendingAction === 'delete' && pendingProfileId) {
                const profile = profiles.find((p) => p.id === pendingProfileId);
                Alert.alert(
                    'Delete Profile',
                    `Are you sure you want to delete ${profile?.name}'s profile?`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                                deleteProfile(pendingProfileId);
                            },
                        },
                    ]
                );
            } else if (pendingAction === 'add') {
                router.push('/profile/create');
            } else if (pendingAction === 'edit' && pendingProfileId) {
                router.push(`/profile/${pendingProfileId}/edit`);
            } else if (pendingAction === 'delete_account') {
                Alert.alert('Delete Account', 'Are you sure you want to permanently delete your account and all kid profiles? This action cannot be undone.', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete Account', style: 'destructive', onPress: () => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                            handleDeleteAccount();
                        }
                    },
                ]);
            }
            setPendingAction(null);
            setPendingProfileId(null);
        }, 300); // Small delay to allow modal to close smoothly before alert/nav
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out Kaivity - The best app for supercharging your kid's development!`,
            });
        } catch (error) {
            console.error('Share failed', error);
        }
    };

    const handleDeleteAccount = async () => {
        if (isDeletingAccount) return;
        if (!user) {
            Alert.alert('Error', 'No active account found.');
            return;
        }

        setIsDeletingAccount(true);
        try {
            const { error } = await supabase.functions.invoke('delete-account', {
                body: { userId: user.id },
            });

            if (error) {
                Alert.alert('Delete Failed', 'Unable to delete your account right now. Please contact support.');
                return;
            }

            await signOut();
            Alert.alert('Account Deleted', 'Your account has been deleted.');
        } catch {
            Alert.alert('Delete Failed', 'Unable to delete your account right now. Please try again.');
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const handleResetPassword = async () => {
        if (!user?.email) return;

        Alert.alert(
            'Reset Password',
            `Send a password reset email to ${user.email}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send Email',
                    onPress: async () => {
                        const redirectUrl = LinkingApi.createURL('/(auth)/reset-password');
                        const { error } = await supabase.auth.resetPasswordForEmail(user.email!, {
                            redirectTo: redirectUrl,
                        });
                        if (error) {
                            Alert.alert('Error', error.message);
                        } else {
                            Alert.alert('Success', 'Password reset email sent! Check your inbox.');
                        }
                    }
                }
            ]
        );
    };

    const handleHelpSupport = () => {
        Linking.openURL('mailto:support@kaivity.com');
    };

    const handleRateApp = () => {
        // Placeholder IDs - swap with real ones before launch
        const url = Platform.OS === 'ios'
            ? 'itms-apps://itunes.apple.com/app/id123456789'
            : 'market://details?id=com.kaivity.app';
        Linking.openURL(url).catch(() => {
            Alert.alert('Error', 'Unable to open store.');
        });
    };

    const handlePrivacyTerms = () => {
        Linking.openURL('https://kaivity.com/privacy'); // Placeholder URL
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.flex}>
                <ScreenBackground />
                <ScrollView
                    style={[styles.container, { zIndex: 1 }]}
                    contentContainerStyle={[
                        styles.content,
                        isMobile && { paddingHorizontal: Spacing.lg, paddingTop: Spacing['xl'] }
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={[styles.header, isMobile && { marginBottom: Spacing.lg }]}>
                        <View style={[styles.headerIconContainer, isMobile && { width: 36, height: 36, borderRadius: 18 }]}>
                            <SettingsIcon size={isMobile ? 20 : 28} color={Colors.white} />
                        </View>
                        <Text style={[styles.title, isMobile && { fontSize: FontSize['2xl'] }]}>Settings</Text>
                    </View>

                    {/* Kid Profiles Section */}
                    <Text style={styles.sectionTitle}>Kid Profiles</Text>
                    <Card variant="elevated">
                        {profiles.map((profile, index) => (
                            <View key={profile.id}>
                                <View style={[styles.profileRow, isMobile && { paddingVertical: Spacing.sm }]}>
                                    <View style={styles.profileInfo}>
                                        <View
                                            style={[
                                                styles.avatar,
                                                isMobile && { width: 40, height: 40, borderRadius: 20 },
                                                { backgroundColor: profile.avatar_color },
                                            ]}
                                        >
                                            <Text style={[styles.avatarText, isMobile && { fontSize: FontSize.sm }]}>
                                                {profile.name.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View>
                                            <Text style={[styles.profileName, isMobile && { fontSize: FontSize.sm }]}>{profile.name}</Text>
                                            <Text style={[styles.profileMeta, isMobile && { fontSize: FontSize.xs }]}>
                                                {profile.age}yo · {profile.grade_level}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.profileActions}>                                        <GHTouchableOpacity
                                        style={[styles.actionIconBtn, isMobile && { width: 34, height: 34, borderRadius: 17 }, { backgroundColor: Colors.yellow }]}
                                        onPress={() => openGate('edit', profile.id)}
                                    >
                                        <Edit3 size={isMobile ? 16 : 16} color={Colors.textPrimary} />
                                    </GHTouchableOpacity>
                                        <GHTouchableOpacity
                                            style={[styles.actionIconBtn, isMobile && { width: 34, height: 34, borderRadius: 17 }, { backgroundColor: Colors.rad }]}
                                            onPress={() => openGate('delete', profile.id)}
                                        >
                                            <Trash2 size={isMobile ? 16 : 16} color={Colors.textPrimary} />
                                        </GHTouchableOpacity>
                                    </View>
                                </View>
                                {index < profiles.length - 1 && <View style={styles.divider} />}
                            </View>
                        ))}

                        <GHTouchableOpacity
                            style={styles.addProfileBtn}
                            onPress={() => openGate('add')}
                        >
                            <View style={[styles.iconContainer, isMobile && { width: 28, height: 28, borderRadius: 14 }, { backgroundColor: Colors.purple }]}>
                                <Plus size={isMobile ? 16 : 18} color={Colors.textPrimary} />
                            </View>
                            <Text style={[styles.addProfileText, isMobile && { fontSize: FontSize.xs }]}>Add Kid Profile</Text>
                        </GHTouchableOpacity>
                    </Card>

                    {/* Account Section */}
                    <Text style={styles.sectionTitle}>Account</Text>
                    <Card variant="elevated">
                        <View style={[styles.settingRow, isMobile && { paddingVertical: 12 }]}>
                            <View style={styles.settingLabelGroup}>
                                <View style={[styles.iconContainer, isMobile && { width: 32, height: 32, borderRadius: 16 }, { backgroundColor: Colors.blue }]}>
                                    <Mail size={isMobile ? 16 : 18} color={Colors.textPrimary} />
                                </View>
                                <Text style={[styles.settingLabel, isMobile && { fontSize: FontSize.sm }]}>Email</Text>
                            </View>
                            <Text style={[styles.settingValue, isMobile && { fontSize: 13 }]}>{user?.email ?? 'Not signed in'}</Text>
                        </View>
                        <View style={styles.divider} />
                        <GHTouchableOpacity
                            style={[styles.settingRow, isMobile && { paddingVertical: 12 }]}
                            onPress={handleResetPassword}
                            disabled={!user?.email}
                        >
                            <View style={styles.settingLabelGroup}>
                                <View style={[styles.iconContainer, isMobile && { width: 32, height: 32, borderRadius: 16 }, { backgroundColor: Colors.green }]}>
                                    <KeyRound size={isMobile ? 16 : 18} color={Colors.textPrimary} />
                                </View>
                                <Text style={[styles.settingLabel, isMobile && { fontSize: FontSize.sm }]}>Reset Password</Text>
                            </View>
                            <ChevronRight size={isMobile ? 16 : 18} color={Colors.textPrimary} />
                        </GHTouchableOpacity>
                        <View style={styles.divider} />
                        <GHTouchableOpacity
                            style={[styles.settingRow, isMobile && { paddingVertical: 12 }]}
                            onPress={() => openGate('delete_account')}
                        >
                            <View style={styles.settingLabelGroup}>
                                <View style={[styles.iconContainer, isMobile && { width: 32, height: 32, borderRadius: 16 }, { backgroundColor: Colors.rad }]}>
                                    <UserX size={isMobile ? 16 : 18} color={Colors.textPrimary} />
                                </View>
                                <Text style={[styles.settingLabel, { color: Colors.textPrimary }, isMobile && { fontSize: FontSize.sm }]}>Delete Account</Text>
                            </View>
                            <ChevronRight size={isMobile ? 16 : 18} color={Colors.textPrimary} />
                        </GHTouchableOpacity>
                    </Card>

                    {/* About Section */}
                    <Text style={styles.sectionTitle}>About & Support</Text>
                    <Card variant="elevated">
                        <GHTouchableOpacity style={[styles.settingRow, isMobile && { paddingVertical: 12 }]} onPress={handleHelpSupport}>
                            <View style={styles.settingLabelGroup}>
                                <View style={[styles.iconContainer, isMobile && { width: 32, height: 32, borderRadius: 16 }, { backgroundColor: Colors.purple }]}>
                                    <HelpCircle size={isMobile ? 16 : 18} color={Colors.textPrimary} />
                                </View>
                                <Text style={[styles.settingLabel, isMobile && { fontSize: FontSize.sm }]}>Help & Support</Text>
                            </View>
                            <ChevronRight size={isMobile ? 16 : 18} color={Colors.textPrimary} />
                        </GHTouchableOpacity>
                        <View style={styles.divider} />
                        <GHTouchableOpacity style={[styles.settingRow, isMobile && { paddingVertical: 12 }]} onPress={handleRateApp}>
                            <View style={styles.settingLabelGroup}>
                                <View style={[styles.iconContainer, isMobile && { width: 32, height: 32, borderRadius: 16 }, { backgroundColor: Colors.yellow }]}>
                                    <Star size={isMobile ? 16 : 18} color={Colors.textPrimary} />
                                </View>
                                <Text style={[styles.settingLabel, isMobile && { fontSize: FontSize.sm }]}>Rate App</Text>
                            </View>
                            <ChevronRight size={isMobile ? 16 : 18} color={Colors.textPrimary} />
                        </GHTouchableOpacity>
                        <View style={styles.divider} />
                        <GHTouchableOpacity style={[styles.settingRow, isMobile && { paddingVertical: 12 }]} onPress={handleShare}>
                            <View style={styles.settingLabelGroup}>
                                <View style={[styles.iconContainer, isMobile && { width: 32, height: 32, borderRadius: 16 }, { backgroundColor: Colors.blue }]}>
                                    <ShareIcon size={isMobile ? 16 : 18} color={Colors.textPrimary} />
                                </View>
                                <Text style={[styles.settingLabel, isMobile && { fontSize: FontSize.sm }]}>Share App</Text>
                            </View>
                            <ChevronRight size={isMobile ? 16 : 18} color={Colors.textPrimary} />
                        </GHTouchableOpacity>
                        <View style={styles.divider} />
                        <GHTouchableOpacity style={[styles.settingRow, isMobile && { paddingVertical: 12 }]} onPress={handlePrivacyTerms}>
                            <View style={styles.settingLabelGroup}>
                                <View style={[styles.iconContainer, isMobile && { width: 32, height: 32, borderRadius: 16 }, { backgroundColor: Colors.green }]}>
                                    <Shield size={isMobile ? 16 : 18} color={Colors.textPrimary} />
                                </View>
                                <Text style={[styles.settingLabel, isMobile && { fontSize: FontSize.sm }]}>Privacy & Terms</Text>
                            </View>
                            <ChevronRight size={isMobile ? 16 : 18} color={Colors.textPrimary} />
                        </GHTouchableOpacity>
                        <View style={styles.divider} />
                        <View style={[styles.settingRow, isMobile && { paddingVertical: 12 }]}>
                            <View style={styles.settingLabelGroup}>
                                <View style={[styles.iconContainer, isMobile && { width: 32, height: 32, borderRadius: 16 }, { backgroundColor: Colors.purple }]}>
                                    <Info size={isMobile ? 16 : 18} color={Colors.textPrimary} />
                                </View>
                                <Text style={[styles.settingLabel, isMobile && { fontSize: FontSize.sm }]}>App Version</Text>
                            </View>
                            <Text style={[styles.settingValue, isMobile && { fontSize: 13 }]}>1.0.0</Text>
                        </View>
                    </Card>

                    {/* Sign Out */}
                    <Button
                        title="Sign Out"
                        onPress={() => {
                            Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Sign Out', style: 'destructive', onPress: () => {
                                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                                        signOut();
                                    }
                                },
                            ]);
                        }}
                        size="lg"
                        icon={<LogOut size={18} color={Colors.white} />}
                        style={styles.signOutBtn}
                    />

                    <View style={[styles.bottomSpacer, { height: bottomPad }]} />
                </ScrollView>
            </View>
            <ParentGate
                visible={gateVisible}
                onClose={() => {
                    setGateVisible(false);
                    setPendingAction(null);
                }}
                onSuccess={handleGateSuccess}
                title="Password Required"
                description={
                    pendingAction === 'add' ? `Enter your password to add a new kid's profile.` :
                        pendingAction === 'edit' ? `Enter your password to edit the profile.` :
                            pendingAction === 'delete' ? `Enter your password to manage profiles.` :
                                pendingAction === 'delete_account' ? `Enter your password to verify your identity.` :
                                    'Enter your password to access account settings.'
                }
                userEmail={user?.email}
            />
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
    container: {
        flex: 1,
    },
    content: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing['3xl'],
        paddingBottom: Spacing.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    headerIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    title: {
        fontSize: FontSize['3xl'],
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },

    sectionTitle: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
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
        paddingVertical: Spacing.sm,
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    avatarText: {
        fontSize: FontSize.md,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.white,
    },
    profileName: {
        fontSize: FontSize.md,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    profileMeta: {
        fontSize: FontSize.xs,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        marginTop: 1,
        fontWeight: FontWeight.medium,
    },
    profileActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    actionIconBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },

    addProfileBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
        marginTop: Spacing.xs,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    addProfileText: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },

    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
    },
    settingLabelGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingLabel: {
        fontSize: FontSize.md,
        fontFamily: Fonts.bold,
        color: Colors.textPrimary,
        fontWeight: FontWeight.semibold,
    },
    settingValue: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        fontWeight: FontWeight.medium,
    },

    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginLeft: 52, // Align with text
    },

    signOutBtn: {
        marginTop: Spacing['3xl'],
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    bottomSpacer: {
        height: Spacing['3xl'],
    },
});
