import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Modal, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Plus, Wand2, Sun, Sunset, Moon, Flame, Clock, History, ChevronDown, ChevronRight, FileText, Calendar } from 'lucide-react-native';
import { useProfileStore } from '@/store/profileStore';
import { useActivityStore } from '@/store/activityStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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

function getGreetingIcon() {
  const hour = new Date().getHours();
  if (hour < 12) return <Sun size={18} color={Colors.primary} />;
  if (hour < 18) return <Sunset size={18} color={Colors.primary} />;
  return <Moon size={18} color={Colors.primary} />;
}

function formatShortDate(dateIso: string): string {
  const d = new Date(dateIso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function HomeScreen() {
  const router = useRouter();
  const { isCompact, isSmallMobile, isShort } = useResponsive();

  // Calculate dynamic card width for perfect grid consistency
  const horizontalPadding = isCompact ? Spacing.lg : Spacing.xl;
  const gridGap = Spacing.md;
  const { width: screenWidth } = Dimensions.get('window');
  const categoryCardWidth = (screenWidth - (horizontalPadding * 2) - gridGap) / 2;

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
          <Text style={[styles.title, isCompact && { fontSize: FontSize['2xl'] }]}>
            {activeProfile ? `Today for ${activeProfile.name}` : 'Start with a kid profile'}
          </Text>
          <Text style={styles.subtitle}>
            {activeProfile
              ? `Printable, screen-free activities tailored to ${activeProfile.age}yo · ${activeProfile.grade_level}`
              : 'Add a profile to generate your first printable activity.'}
          </Text>
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
          <View style={styles.magicCardContent}>
            <View style={styles.magicCardText}>
              <Text style={styles.magicCardTitle}>Create Activity!</Text>
              <Text style={styles.magicCardSubtitle}>Generate personalized, print-ready activities instantly.</Text>

              <View style={styles.magicCardBadge}>
                <Text style={styles.magicCardBadgeText}>Tap to start</Text>
              </View>
            </View>

            <View style={styles.magicRightColumn}>

              {lastActivity && (
                <TouchableOpacity
                  style={styles.magicOpenLastBtn}
                  activeOpacity={0.85}
                  onPress={(e) => {
                    e.stopPropagation(); // Prevent triggering the outer Generate card push
                    router.push(`/activity/${lastActivity.id}` as any);
                  }}
                >
                  <Clock size={16} color={Colors.primary} />
                  <Text style={styles.magicOpenLastText}>Open last</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {activeProfile && (
          <View style={[styles.statsContainer, isShort && { marginBottom: Spacing.md }]}>
            <View style={[styles.statsHeader, isShort && { marginBottom: Spacing.xs }]}>
              <Text style={styles.sectionTitle}>Snapshot</Text>
              {stats?.lastCreatedAt ? (
                <Text style={styles.statsDate}>Last: {formatShortDate(stats.lastCreatedAt)}</Text>
              ) : (
                <Text style={styles.statsDate}>No activities yet</Text>
              )}
            </View>

            <View style={styles.statsGrid}>
              <View style={[styles.statCard, isCompact && { paddingVertical: Spacing.md }]}>
                <View style={[styles.statIconWrapper, { backgroundColor: Colors.pastelYellow }, isCompact && { width: 36, height: 36, borderRadius: 18 }]}>
                  <Flame size={isCompact ? 18 : 22} color={Colors.primary} />
                </View>
                <Text style={[styles.statValue, isCompact && { fontSize: 20 }]}>{stats ? stats.streak : '—'}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>

              <View style={[styles.statCard, isCompact && { paddingVertical: Spacing.md }]}>
                <View style={[styles.statIconWrapper, { backgroundColor: Colors.pastelPurple }, isCompact && { width: 36, height: 36, borderRadius: 18 }]}>
                  <FileText size={isCompact ? 18 : 22} color={Colors.primaryPurple} />
                </View>
                <Text style={[styles.statValue, isCompact && { fontSize: 20 }]}>{stats ? stats.total : '—'}</Text>
                <Text style={styles.statLabel}>Printables</Text>
              </View>

              <View style={[styles.statCard, isCompact && { paddingVertical: Spacing.md }]}>
                <View style={[styles.statIconWrapper, { backgroundColor: Colors.pastelPeach }, isCompact && { width: 36, height: 36, borderRadius: 18 }]}>
                  <Calendar size={isCompact ? 18 : 22} color={Colors.primary} />
                </View>
                <Text style={[styles.statValue, isCompact && { fontSize: 20 }]}>{stats ? stats.weekCount : '—'}</Text>
                <Text style={styles.statLabel}>This Week</Text>
              </View>

            </View>
          </View>
        )}

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

        <View style={styles.bottomSpacer} />
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
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.md,
    shadowColor: Colors.primary,
  },
  magicCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  magicCardText: {
    flex: 1,
    paddingRight: Spacing.lg,
  },
  magicCardTitle: {
    fontSize: FontSize.xl,
    fontFamily: Fonts.bold,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: -0.3,
  },
  magicCardSubtitle: {
    fontSize: FontSize.sm,
    fontFamily: Fonts.sans,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  magicCardBadge: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  magicCardBadgeText: {
    fontSize: FontSize.xs,
    fontFamily: Fonts.bold,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  magicIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  magicIconGlow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  magicRightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 110, // Gives enough space between icon and button
  },
  magicOpenLastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
    ...Shadows.sm,
  },
  magicOpenLastText: {
    fontSize: FontSize.xs,
    fontFamily: Fonts.bold,
    fontWeight: FontWeight.bold,
    color: Colors.primaryDark,
  },

  statsContainer: {
    marginBottom: Spacing.xl,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontFamily: Fonts.bold,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  statsDate: {
    fontSize: FontSize.xs,
    fontFamily: Fonts.medium,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    ...Shadows.sm,
  },
  statIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    marginTop: 2,
    textAlign: 'center',
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
