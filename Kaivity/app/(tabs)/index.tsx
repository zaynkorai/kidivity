import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Modal, TouchableWithoutFeedback, Dimensions, Platform, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Plus, Sun, Sunset, Moon, Clock, ChevronDown, ChevronRight, Check } from 'lucide-react-native';
import { useProfileStore } from '@/store/profileStore';
import { useActivityStore } from '@/store/activityStore';
import { JourneyMap } from '@/components/ui/JourneyMap';
import { Colors, Spacing, Radius, FontSize, FontWeight, Fonts, Shadows } from '@/constants/theme';
import { ACTIVITY_CATEGORIES } from '@/constants/categories';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { useResponsive } from '@/hooks/useResponsive';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getGreetingIcon(color: string = Colors.primary) {
  const hour = new Date().getHours();
  if (hour < 12) return <Sun size={18} color={color} />;
  if (hour < 18) return <Sunset size={18} color={color} />;
  return <Moon size={18} color={color} />;
}

function CategoryCard({ cat, categoryCardWidth, isCompact, isShort, onPress }: {
  cat: (typeof ACTIVITY_CATEGORIES)[number];
  categoryCardWidth: number;
  isCompact: boolean;
  isShort: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const Icon = cat.icon;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.94, { damping: 12, stiffness: 200 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
    >
      <Animated.View
        style={[
          styles.categoryCard,
          { width: categoryCardWidth },
          isCompact && { height: 132 },
          isShort && { height: 110 },
          { backgroundColor: cat.color },
          animatedStyle,
        ]}
      >
        <View style={[styles.categoryChevron, { backgroundColor: cat.color }, isShort && { top: Spacing.sm, right: Spacing.sm }]}>
          <ChevronRight size={13} color={cat.accent} strokeWidth={2.5} />
        </View>

        <View style={styles.categoryCardContent}>
          <View style={[styles.categoryIconWrapper, isShort && { width: 28, height: 28 }]}>
            <Icon size={isShort ? 24 : 30} color={cat.accent} />
          </View>

          <View style={styles.categoryTextWrapper}>
            <Text style={styles.categoryName} numberOfLines={1}>
              {cat.label}
            </Text>
            <Text style={styles.categorySub} numberOfLines={2}>
              {cat.description}
            </Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isCompact, isShort } = useResponsive();
  const noScale = { allowFontScaling: false, maxFontSizeMultiplier: 1 };
  const tabBarHeight = useBottomTabBarHeight();
  const bottomPad = Math.max(tabBarHeight + insets.bottom + Spacing.lg, Spacing['3xl']);

  // Calculate dynamic card width for perfect grid consistency
  const horizontalPadding = isCompact ? Spacing.lg : Spacing.xl;
  const gridGap = Spacing.md;
  const { width: screenWidth } = Dimensions.get('window');

  // Dynamic columns: minimum 2, but can expand on larger screens
  const availableWidth = screenWidth - (horizontalPadding * 2);
  const minColWidth = 160;
  const numColumns = Math.max(2, Math.floor((availableWidth + gridGap) / (minColWidth + gridGap)));
  const categoryCardWidth = (availableWidth - (gridGap * (numColumns - 1))) / numColumns - 0.1;

  // Stable action selectors
  const fetchProfiles = useProfileStore((state) => state.fetchProfiles);
  const setActiveProfile = useProfileStore((state) => state.setActiveProfile);
  const fetchRecent = useActivityStore((state) => state.fetchRecent);
  const fetchKidStats = useActivityStore((state) => state.fetchKidStats);

  // State selectors
  const profiles = useProfileStore((state) => state.profiles);
  const activeProfileId = useProfileStore((state) => state.activeProfileId);
  const recentActivities = useActivityStore((state) => state.recentActivities);
  const stats = useActivityStore((state) => activeProfileId ? state.kidStats[activeProfileId] : undefined);

  const [refreshing, setRefreshing] = useState(false);
  const [dropdownShown, setDropdownVisible] = useState(false);

  const magicScale = useSharedValue(1);
  const headerScale = useSharedValue(1);

  const magicAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: magicScale.value }],
  }));

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
  }));

  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  useEffect(() => {
    if (!activeProfileId) return;
    fetchKidStats(activeProfileId);
  }, [activeProfileId, fetchKidStats]);

  const visibleActivities = useMemo(() => {
    if (!activeProfileId) return recentActivities;
    return recentActivities.filter((a) => a.kid_profile_id === activeProfileId);
  }, [activeProfileId, recentActivities]);

  const lastActivity = visibleActivities[0];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchProfiles(),
      fetchRecent(),
      activeProfileId ? fetchKidStats(activeProfileId) : Promise.resolve(),
    ]);
    setRefreshing(false);
  }, [activeProfileId, fetchKidStats, fetchProfiles, fetchRecent]);

  return (
    <View style={styles.safe}>
      <ScreenBackground />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          isCompact && { paddingHorizontal: Spacing.md },
          isShort && { paddingBottom: Spacing.md }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <Pressable
          onPress={() => {
            router.push('/(tabs)/generate');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
          onPressIn={() => {
            magicScale.value = withSpring(0.96);
          }}
          onPressOut={() => {
            magicScale.value = withSpring(1);
          }}
          style={({ pressed }) => [
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
                {getGreetingIcon(Colors.white)}
                <Text style={styles.magicGreetingText}>{getGreeting()}</Text>
              </View>

              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  setDropdownVisible(true);
                  Haptics.selectionAsync();
                }}
                onPressIn={() => {
                  headerScale.value = withSpring(0.95);
                }}
                onPressOut={() => {
                  headerScale.value = withSpring(1);
                }}
              >
                <Animated.View style={[styles.magicProfileBtn, headerAnimatedStyle]}>
                  {activeProfile ? (
                    <View style={styles.dropdownBtnContent}>
                      <View style={[styles.profileAvatar, { backgroundColor: activeProfile.avatar_color, borderWidth: 1.5, borderColor: Colors.white + '40' }]}>
                        <Text style={styles.profileInitial}>{activeProfile.name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={styles.profileTextContainer}>
                        <Text style={[styles.profileName, { color: Colors.white }]} numberOfLines={1}>
                          {activeProfile.name}
                        </Text>
                        <Text style={[styles.profileMeta, { color: Colors.white + 'CC' }]} numberOfLines={1}>
                          {activeProfile.age}yo · {activeProfile.grade_level}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={[styles.dropdownBtnText, { color: Colors.white }]} numberOfLines={1}>
                      Select Kid
                    </Text>
                  )}
                  <ChevronDown size={14} color={Colors.white} />
                </Animated.View>
              </Pressable>
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
                      router.push(`/activity/${lastActivity.id}` as any);
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

        <JourneyMap
          kidProfileId={activeProfileId ?? null}
          activities={recentActivities}
          activityStreak={stats?.streak ?? null}
        />

        <View style={styles.statsHeader}>
          <Text style={styles.sectionTitle}>Create by Categories</Text>
        </View>
        <View style={styles.categoryGrid}>
          {ACTIVITY_CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat.id}
              cat={cat}
              categoryCardWidth={categoryCardWidth}
              isCompact={isCompact}
              isShort={isShort}
              onPress={() => {
                router.push({ pathname: '/(tabs)/generate', params: { category: cat.id } } as any);
                Haptics.selectionAsync();
              }}
            />
          ))}
        </View>

        <View style={[styles.bottomSpacer, { height: bottomPad }]} />
      </ScrollView>

      <Modal
        visible={dropdownShown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDropdownVisible(false)}>
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
                  onPress={() => {
                    setActiveProfile(p.id);
                    setDropdownVisible(false);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }}
                >
                  <View style={[styles.profileAvatar, { backgroundColor: p.avatar_color, width: 34, height: 34 }]}>
                    <Text style={[styles.profileInitial, { fontSize: 13 }]}>{p.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.profileTextContainerDropdown}>
                    <Text style={[styles.profileName, activeProfileId === p.id && styles.dropdownItemTextActive]} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={styles.profileMetaLabel}>{p.age}yo · {p.grade_level}</Text>
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
                style={styles.dropdownAddBtnPolished}
                onPress={() => {
                  setDropdownVisible(false);
                  router.push({ pathname: '/(onboarding)/create-profile', params: { skipGuard: 'true' } });
                }}
              >
                <View style={styles.dropdownAddIconPolished}>
                  <Plus size={16} color={Colors.primary} />
                </View>
                <Text style={styles.dropdownAddText}>Add another kid</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
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
    paddingHorizontal: Spacing.md,
    paddingTop: 0,
    paddingBottom: Spacing.xl,
  },

  header: {
    display: 'none',
  },
  dropdownBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  profileAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
    maxWidth: 90,
  },
  profileTextContainerDropdown: {
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
    color: Colors.textPrimary,
    marginTop: 1,
  },
  dropdownBtnText: {
    fontSize: FontSize.sm,
    fontFamily: Fonts.bold,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
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
  dropdownDivider: {
    height: 1,
    backgroundColor: Colors.border + '40',
    marginVertical: Spacing.sm,
    marginHorizontal: Spacing.sm,
  },
  dropdownAddBtnPolished: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.xl,
  },
  dropdownAddIconPolished: {
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
  profileMetaLabel: {
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
  title: {
    fontSize: FontSize['xl'],
    fontFamily: Fonts.bold,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FontSize.sm,
    fontFamily: Fonts.sans,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    lineHeight: 22,
  },

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
  magicBackdrop: {
    position: 'absolute',
    top: -64,
    right: -24,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.vibrantWash,
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
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  magicProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm + 2,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
  magicIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.vibrantWash,
    borderWidth: 1,
    borderColor: Colors.vibrantWash,
  },
  magicEyebrow: {
    fontSize: FontSize.xs,
    fontFamily: Fonts.medium,
    fontWeight: FontWeight.medium,
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    lineHeight: 16,
  },
  magicTitle: {
    marginTop: 2,
    fontSize: FontSize['xl'],
    fontFamily: Fonts.bold,
    fontWeight: FontWeight.bold,
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
  magicChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    flex: 1,
  },
  magicChip: {
    backgroundColor: Colors.vibrantWash,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.vibrantWash,
  },
  magicChipText: {
    fontSize: FontSize.xs,
    fontFamily: Fonts.medium,
    fontWeight: FontWeight.medium,
    color: Colors.white,
    lineHeight: 18,
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
    fontWeight: FontWeight.bold,
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
    fontWeight: FontWeight.bold,
    color: Colors.primaryDark,
    lineHeight: 18,
  },

  sectionTitle: {
    fontSize: FontSize.xl,
    fontFamily: Fonts.bold,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  categoryCard: {
    height: 152,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    overflow: 'hidden',
    ...Shadows.md,
  },
  categoryChevron: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCardContent: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  categoryIconWrapper: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTextWrapper: {
    alignItems: 'flex-start',
    width: '100%',
  },
  categoryName: {
    fontSize: FontSize.sm,
    fontFamily: Fonts.bold,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    width: '100%',
    letterSpacing: -0.2,
  },
  categorySub: {
    fontSize: FontSize.xs,
    fontFamily: Fonts.sans,
    color: Colors.textSecondary,
    marginTop: 3,
    width: '100%',
    lineHeight: 17,
  },
  bottomSpacer: {
    height: Spacing['3xl'],
  },
});
