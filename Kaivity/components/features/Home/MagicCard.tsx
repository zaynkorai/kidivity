import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Clock, ChevronRight } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, Fonts, Shadows } from '@/constants/theme';
import { ProfileSwitcherButton } from '../ProfileSwitcherButton';
import { getGreeting } from '@/lib/dates';
import { GreetingIcon } from '@/components/ui/GreetingIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KidProfile } from '@/types/profile';
import { Activity } from '@/types/activity';

interface MagicCardProps {
  activeProfile: KidProfile | undefined;
  lastActivity: Activity | undefined;
  onPress: () => void;
  onProfilePress: () => void;
  onOpenLastPress: () => void;
  isCompact: boolean;
  isShort: boolean;
}

export function MagicCard({
  activeProfile,
  lastActivity,
  onPress,
  onProfilePress,
  onOpenLastPress,
  isCompact,
  isShort,
}: MagicCardProps) {
  const insets = useSafeAreaInsets();
  const magicScale = useSharedValue(1);

  const magicAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: magicScale.value }],
  }));

  const noScale = { allowFontScaling: false, maxFontSizeMultiplier: 1 };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        magicScale.value = withSpring(0.96);
      }}
      onPressOut={() => {
        magicScale.value = withSpring(1);
      }}
      style={[
        styles.magicCard,
        isCompact && { padding: Spacing.lg },
        isShort && { paddingVertical: Spacing.md, marginBottom: Spacing.md },
      ]}
    >
      <Animated.View style={magicAnimatedStyle}>
        {/* Header Integrated into Magic Card */}
        <View style={[
          styles.magicHeaderTopRow,
          { paddingTop: Math.max(insets.top + Spacing.md, Spacing.xl) }
        ]}>
          <View style={styles.magicGreetingRow}>
            <GreetingIcon color={Colors.white} />
            <Text style={styles.magicGreetingText}>{getGreeting()}</Text>
          </View>

          <ProfileSwitcherButton
            variant="onPrimary"
            onPress={() => {
              Haptics.selectionAsync();
              onProfilePress();
            }}
          />
        </View>

        <View style={styles.magicBackdropSoft} />
        <View style={styles.magicContent}>
          <View style={styles.magicHeaderRow}>
            <View style={styles.magicHeaderLeft}>
              <View style={styles.magicHeaderText}>
                <Text style={styles.magicTitle} numberOfLines={1} ellipsizeMode="tail" {...noScale}>
                  Print ready in minutes
                </Text>
              </View>
            </View>

            {lastActivity && (
              <TouchableOpacity
                style={styles.magicOpenLastBtn}
                activeOpacity={0.85}
                onPress={(e) => {
                  e.stopPropagation();
                  Haptics.selectionAsync();
                  onOpenLastPress();
                }}
              >
                <Clock size={16} color={Colors.primary} />
                <Text style={styles.magicOpenLastText} {...noScale}>Open last</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.magicSubtitle} numberOfLines={2} ellipsizeMode="tail" {...noScale}>
            {activeProfile
              ? `Printable, screen-free activities tailored to ${activeProfile.age}yo · ${activeProfile.grade_level}`
              : 'Add a profile to generate your first printable activity.'}
          </Text>

          <View style={styles.magicFooterRow}>
            <View style={styles.magicCTA}>
              <Text style={styles.magicCTAText} {...noScale}>Generate</Text>
              <ChevronRight size={18} color={Colors.primary} />
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  magicCard: {
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: Radius['2xl'],
    borderBottomRightRadius: Radius['2xl'],
    marginHorizontal: -Spacing.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  magicBackdropSoft: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: Colors.secondary,
    opacity: 0.15,
  },
  magicContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  magicHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  magicGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  magicGreetingText: {
    fontSize: FontSize.md,
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
  magicHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  magicHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  magicHeaderText: {
    flex: 1,
  },
  magicTitle: {
    marginTop: 2,
    fontSize: FontSize['xl'],
    fontFamily: Fonts.bold,
    color: Colors.white,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  magicSubtitle: {
    fontSize: FontSize.sm,
    fontFamily: Fonts.sans,
    color: Colors.white,
    lineHeight: 20,
  },
  magicFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  magicCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    ...Shadows.sm,
  },
  magicCTAText: {
    fontSize: FontSize.sm,
    fontFamily: Fonts.bold,
    color: Colors.primary,
    lineHeight: 20,
  },
  magicOpenLastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    ...Shadows.sm,
  },
  magicOpenLastText: {
    fontSize: FontSize.xs,
    fontFamily: Fonts.bold,
    color: Colors.primaryDark,
    lineHeight: 18,
  },
});
