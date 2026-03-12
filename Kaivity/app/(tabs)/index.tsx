import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Modal, TouchableWithoutFeedback, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Plus, Sun, Sunset, Moon, Clock, ChevronDown, ChevronRight } from 'lucide-react-native';
import { useProfileStore } from '@/store/profileStore';
import { useActivityStore } from '@/store/activityStore';
import { JourneyMap } from '@/components/ui/JourneyMap';
import { Colors, Spacing, Radius, FontSize, FontWeight, Fonts, Shadows } from '@/constants/theme';
import { ACTIVITY_CATEGORIES } from '@/constants/categories';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { useResponsive } from '@/hooks/useResponsive';
import { useOnboardingSessionStore } from '@/store/onboardingSession.store';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getGreetingIcon() {
  const hour = new Date().getHours();
  if (hour < 12) return <Sun size={18} color={Colors.primary} />;
  if (hour < 18) return <Sunset size={18} color={Colors.primary} />;
  return <Moon size={18} color={Colors.primary} />;
}

export default function HomeScreen() {
  const router = useRouter();
  const { isCompact, isShort } = useResponsive();
  const noScale = { allowFontScaling: false, maxFontSizeMultiplier: 1 };
  const tabBarHeight = useBottomTabBarHeight();
  const tabBarOffset = Platform.OS === 'ios' ? Spacing['2xl'] : Spacing.lg;
  const bottomPad = Math.max(tabBarHeight + tabBarOffset - Spacing.md, Spacing['3xl']);

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
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const restoreSession = useOnboardingSessionStore(state => state.restoreSession);

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
    <SafeAreaView style={styles.safe}>
      <ScreenBackground />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          isCompact && { paddingHorizontal: Spacing.lg },
          isShort && { paddingTop: Spacing.xl, paddingBottom: Spacing.md }
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
        <View style={[styles.header, isShort && { marginBottom: Spacing.md }]}>
          <View style={styles.topRow}>
            <View style={styles.greetingRow}>
              {getGreetingIcon()}
              <Text style={styles.greeting}>{getGreeting()}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setDropdownVisible(true)}
              style={styles.profileDropdownBtn}
              activeOpacity={0.85}
            >
              {activeProfile ? (
                <View style={styles.dropdownBtnContent}>
                  <View style={[styles.profileAvatar, { backgroundColor: activeProfile.avatar_color }]}>
                    <Text style={styles.profileInitial}>{activeProfile.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.profileTextContainer}>
                    <Text style={styles.profileName} numberOfLines={1}>
                      {activeProfile.name}
                    </Text>
                    <Text style={styles.profileMeta} numberOfLines={1}>
                      {activeProfile.age}yo · {activeProfile.grade_level}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.dropdownBtnText} numberOfLines={1}>
                  Select Kid
                </Text>
              )}
              <ChevronDown size={16} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dropdown Menu Modal */}
        <Modal visible={dropdownVisible} transparent animationType="fade">
          <TouchableWithoutFeedback onPress={() => setDropdownVisible(false)}>
            <View style={styles.dropdownOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.dropdownMenu, isCompact && { width: 190 }]}>
                  <ScrollView style={{ maxHeight: 300 }} bounces={false} showsVerticalScrollIndicator={false}>
                    {profiles.map(p => (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.dropdownItem, p.id === activeProfileId && styles.dropdownItemActive]}
                        onPress={() => {
                          setActiveProfile(p.id);
                          setDropdownVisible(false);
                          Haptics.selectionAsync();
                        }}
                      >
                        <View style={[styles.profileAvatar, { backgroundColor: p.avatar_color }]}>
                          <Text style={styles.profileInitial}>{p.name.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View style={styles.profileTextContainerDropdown}>
                          <Text style={[styles.profileName, p.id === activeProfileId && styles.dropdownItemTextActive]} numberOfLines={1}>
                            {p.name}
                          </Text>
                          <Text style={styles.profileMeta} numberOfLines={1}>
                            {p.age}yo · {p.grade_level}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity
                    style={styles.dropdownAddBtn}
                    onPress={() => {
                      setDropdownVisible(false);
                      router.push('/profile/create');
                    }}
                  >
                    <View style={styles.dropdownAddIcon}>
                      <Plus size={16} color={Colors.textPrimary} />
                    </View>
                    <Text style={styles.profileName}>Add Kid</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            router.push('/(tabs)/generate');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={[
            styles.magicCard,
            isCompact && { padding: Spacing.lg },
            isShort && { paddingVertical: Spacing.md, marginBottom: Spacing.md }
          ]}
        >
          <View style={styles.magicBackdrop} />
          <View style={styles.magicBackdropSoft} />
          <View style={styles.magicEdgeGlow} />

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
        </TouchableOpacity>

        <JourneyMap
          kidProfileId={activeProfileId ?? null}
          activities={recentActivities}
          activityStreak={stats?.streak ?? null}
        />

        <View style={styles.statsHeader}>
          <Text style={styles.sectionTitle}>Explore Categories</Text>
        </View>
        <View style={styles.categoryGrid}>
          {ACTIVITY_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryCard,
                  { width: categoryCardWidth },
                  isCompact && { height: 132 },
                  isShort && { height: 110 },
                  {
                    backgroundColor: cat.color + '50',
                    borderColor: cat.color,
                    shadowColor: cat.accent,
                  }
                ]}
                activeOpacity={0.82}
                onPress={() => {
                  router.push({ pathname: '/(tabs)/generate', params: { category: cat.id } } as any);
                  Haptics.selectionAsync();
                }}
              >

                {/* Chevron */}
                <View style={[styles.categoryChevron, { backgroundColor: cat.accent + '20' }, isShort && { top: Spacing.sm, right: Spacing.sm }]}>
                  <ChevronRight size={13} color={cat.accent} strokeWidth={2.5} />
                </View>

                <View style={styles.categoryCardContent}>
                  {/* Icon Block */}
                  <View style={[styles.categoryIconWrapper, isShort && { width: 28, height: 28 }]}>
                    <Icon size={isShort ? 24 : 30} color={cat.accent} />
                  </View>

                  {/* Text */}
                  <View style={styles.categoryTextWrapper}>
                    <Text style={styles.categoryName} numberOfLines={1}>
                      {cat.label}
                    </Text>
                    <Text style={styles.categorySub} numberOfLines={2}>
                      {cat.description}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.bottomSpacer, { height: bottomPad }]} />
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.xl,
  },

  header: {
    marginBottom: Spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.6)', // subtle white wash to make text pop against new bg
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  greeting: {
    fontSize: FontSize.md,
    fontFamily: Fonts.bold,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  profileDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)', // softer border edge
    ...Shadows.sm,
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
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 80,
    right: Spacing.xl,
    width: 220,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xs,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.pastelPurple, // Added touch of color to border
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.lg,
  },
  dropdownItemActive: {
    backgroundColor: Colors.primary + '0A',
  },
  dropdownItemTextActive: {
    color: Colors.primaryDark,
  },
  dropdownAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  dropdownAddIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
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
    borderRadius: Radius['2xl'],
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
    ...Shadows.lg,
    shadowColor: Colors.primary,
  },
  magicBackdrop: {
    position: 'absolute',
    top: -64,
    right: -24,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  magicBackdropSoft: {
    position: 'absolute',
    bottom: -72,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  magicEdgeGlow: {
    position: 'absolute',
    top: -8,
    left: 18,
    right: 18,
    height: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  magicContent: {
    gap: Spacing.md,
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  magicEyebrow: {
    fontSize: FontSize.xs,
    fontFamily: Fonts.medium,
    fontWeight: FontWeight.medium,
    color: 'rgba(255,255,255,0.9)',
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
    color: 'rgba(255, 255, 255, 0.92)',
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
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
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
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: Spacing.sm,
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
    marginBottom: Spacing.xl,
  },
  categoryCard: {
    height: 152,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
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
