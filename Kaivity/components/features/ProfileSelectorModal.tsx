import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Check, ChevronDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileStore } from '@/store/profileStore';
import { Colors, Spacing, Radius, FontSize, Fonts, Shadows, FontWeight } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

interface ProfileSelectorModalProps {
    visible: boolean;
    onClose: () => void;
}

export function ProfileSelectorModal({ visible, onClose }: ProfileSelectorModalProps) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isShort } = useResponsive();
    
    const profiles = useProfileStore((state) => state.profiles);
    const activeProfileId = useProfileStore((state) => state.activeProfileId);
    const setActiveProfile = useProfileStore((state) => state.setActiveProfile);

    const handleSelectProfile = (id: string) => {
        setActiveProfile(id);
        onClose();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleAddKid = () => {
        onClose();
        router.push('/profile/create');
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.dropdownOverlay}>
                    <View style={[styles.dropdownMenu, { top: insets.top + (isShort ? 12 : 18) }]}>
                        {/* Arrow Indicator */}
                        <View style={styles.dropdownTriangle} />

                        <Text style={styles.dropdownHeader}>Switch Profile</Text>

                        {profiles.map((p) => (
                            <TouchableOpacity
                                key={p.id}
                                style={[
                                    styles.dropdownItem,
                                    activeProfileId === p.id && styles.dropdownItemActive
                                ]}
                                onPress={() => handleSelectProfile(p.id)}
                            >
                                <View style={[styles.profileAvatar, { backgroundColor: p.avatar_color }]}>
                                    <Text style={styles.profileInitial}>{p.name.charAt(0).toUpperCase()}</Text>
                                </View>
                                <View style={styles.profileTextContainer}>
                                    <Text 
                                        style={[styles.profileName, activeProfileId === p.id && styles.dropdownItemTextActive]} 
                                        numberOfLines={1}
                                    >
                                        {p.name}
                                    </Text>
                                    <Text style={styles.profileMeta}>{p.age}yo · {p.grade_level}</Text>
                                </View>
                                {activeProfileId === p.id && (
                                    <View style={styles.checkBadge}>
                                        <Check size={12} color={Colors.white} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}

                        <View style={styles.dropdownDivider} />

                        <TouchableOpacity
                            style={styles.dropdownAddBtn}
                            onPress={handleAddKid}
                        >
                            <View style={styles.dropdownAddIcon}>
                                <Plus size={16} color={Colors.primary} />
                            </View>
                            <Text style={styles.dropdownAddText}>Add another kid</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    dropdownOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    dropdownMenu: {
        position: 'absolute',
        right: Spacing.xl,
        width: 240,
        backgroundColor: Colors.white,
        borderRadius: Radius['2xl'],
        padding: Spacing.sm,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.2,
                shadowRadius: 16,
            },
            android: {
                elevation: 12,
            },
        }),
    },
    dropdownTriangle: {
        position: 'absolute',
        top: -12,
        right: 48,
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 12,
        borderRightWidth: 12,
        borderBottomWidth: 12,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: Colors.white,
    },
    dropdownHeader: {
        fontSize: FontSize.xs,
        fontFamily: Fonts.bold,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.xs,
        paddingBottom: Spacing.sm,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        borderRadius: Radius.xl,
        marginBottom: 4,
    },
    dropdownItemActive: {
        backgroundColor: Colors.primary + '10',
    },
    dropdownItemTextActive: {
        color: Colors.primaryDark,
    },
    profileAvatar: {
        width: 34,
        height: 34,
        borderRadius: Radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInitial: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.white,
    },
    profileTextContainer: {
        flexShrink: 1,
    },
    profileName: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    profileMeta: {
        fontSize: FontSize.xs,
        fontFamily: Fonts.sans,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    checkBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 'auto',
    },
    dropdownDivider: {
        height: 1,
        backgroundColor: Colors.border + '40',
        marginVertical: Spacing.sm,
        marginHorizontal: Spacing.sm,
    },
    dropdownAddBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        borderRadius: Radius.xl,
    },
    dropdownAddIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary + '08',
        borderWidth: 1,
        borderColor: Colors.primary + '20',
        borderStyle: 'dashed',
    },
    dropdownAddText: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
});
