import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Plus, Wand2, Sun, Sunset, Moon, Bookmark, Clock, History } from 'lucide-react-native';
import { useProfileStore } from '@/store/profileStore';
import { useActivityStore } from '@/store/activityStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '@/constants/theme';
import { ACTIVITY_CATEGORIES } from '@/constants/categories';
import { ScreenBackground } from '@/components/ui/ScreenBackground';

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
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.greetingRow}>
            {getGreetingIcon()}
            <Text style={styles.greeting}>{getGreeting()}</Text>
          </View>
          <Text style={styles.title}>
            {activeProfile ? `Today for ${activeProfile.name}` : 'Start with a kid profile'}
          </Text>
          <Text style={styles.subtitle}>
            {activeProfile
              ? `Printable, screen-free activities tailored to ${activeProfile.age}yo · ${activeProfile.grade_level}`
              : 'Add a profile to generate your first printable activity.'}
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileList}>
          <TouchableOpacity onPress={() => router.push('/profile/create')} style={styles.addKidChip} activeOpacity={0.85}>
            <View style={styles.addKidIcon}>
              <Plus size={16} color={Colors.textPrimary} />
            </View>
            <Text style={styles.addKidText}>Add Kid</Text>
          </TouchableOpacity>

          {profiles.map((profile) => (
            <TouchableOpacity
              key={profile.id}
              onPress={() => {
                setActiveProfile(profile.id);
                Haptics.selectionAsync();
              }}
              style={[
                styles.profileChip,
                profile.id === activeProfileId && styles.profileChipActive,
              ]}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.profileAvatar,
                  { backgroundColor: profile.avatar_color },
                  profile.id === activeProfileId && styles.profileAvatarActive,
                ]}
              >
                <Text style={styles.profileInitial}>{profile.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.profileTextContainer}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {profile.name}
                </Text>
                <Text style={styles.profileMeta} numberOfLines={1}>
                  {profile.age}yo · {profile.grade_level}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            router.push('/(tabs)/generate');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Card variant="elevated" style={styles.heroCard} color={Colors.primary}>
            <View style={styles.heroHeader}>
              <View style={styles.heroIcon}>
                <Wand2 size={24} color={Colors.primary} />
              </View>
              <View style={styles.heroText}>
                <Text style={styles.heroTitle}>Generate an activity</Text>
                <Text style={styles.heroSubtitle}>Print-ready worksheets, tailored to your kid.</Text>
              </View>
            </View>

            <View style={styles.heroActions}>
              <TouchableOpacity
                style={styles.heroAction}
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/activities')}
              >
                <History size={18} color={Colors.primary} />
                <Text style={styles.heroActionText}>Activities</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.heroAction, !lastActivity && styles.heroActionDisabled]}
                activeOpacity={0.85}
                disabled={!lastActivity}
                onPress={() => {
                  if (!lastActivity) return;
                  router.push(`/activity/${lastActivity.id}` as any);
                }}
              >
                <Clock size={18} color={Colors.primary} />
                <Text style={styles.heroActionText}>Open last</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </TouchableOpacity>

        {activeProfile && (
          <View style={styles.snapshot}>
            <Text style={styles.sectionTitle}>Snapshot</Text>
            <View style={styles.snapshotRow}>
              <View style={[styles.metricCard, { backgroundColor: Colors.pastelPurple, borderColor: Colors.purple }]}>
                <Text style={styles.metricValue}>{stats ? stats.total : '—'}</Text>
                <Text style={styles.metricLabel}>Activities</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: Colors.pastelMint, borderColor: Colors.green }]}>
                <Text style={styles.metricValue}>{stats ? stats.weekCount : '—'}</Text>
                <Text style={styles.metricLabel}>This week</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: Colors.pastelYellow, borderColor: Colors.yellow }]}>
                <Text style={styles.metricValue}>{stats ? stats.saved : '—'}</Text>
                <Text style={styles.metricLabel}>Saved</Text>
              </View>
            </View>
            <View style={styles.lastMadeRow}>
              <Clock size={14} color={Colors.textPrimary} />
              <Text style={styles.lastMadeText}>
                {stats?.lastCreatedAt ? `Last generated: ${formatShortDate(stats.lastCreatedAt)}` : 'No activities yet'}
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Explore categories</Text>
        <View style={styles.categoryGrid}>
          {ACTIVITY_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryTile,
                  { borderColor: cat.color + '26', backgroundColor: cat.color + '0B' },
                ]}
                activeOpacity={0.85}
                onPress={() => {
                  router.push({ pathname: '/(tabs)/generate', params: { category: cat.id } } as any);
                  Haptics.selectionAsync();
                }}
              >
                <View style={[styles.categoryTileIcon, { backgroundColor: cat.color }]}>
                  <Icon size={18} color={Colors.white} />
                </View>
                <View style={styles.categoryTileTextContainer}>
                  <Text style={styles.categoryTileLabel} numberOfLines={1}>
                    {cat.label}
                  </Text>
                  <Text style={styles.categoryTileSub} numberOfLines={1}>
                    {cat.description}
                  </Text>
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
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  greeting: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  title: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    lineHeight: 22,
  },

  profileList: {
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  profileChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '0A',
  },
  profileAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarActive: {
    borderWidth: 2,
    borderColor: Colors.white,
  },
  profileInitial: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  profileName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold, // increased weight
    color: Colors.textPrimary,
  },
  profileMeta: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    marginTop: 1,
  },
  profileTextContainer: {
    flexShrink: 1,
  },

  addKidChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: Colors.surface,
  },
  addKidIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  addKidText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  heroCard: {
    borderRadius: Radius['2xl'],
    borderWidth: 0,
    marginBottom: Spacing.xl,
    padding: Spacing.xl, // Custom padding over the default logic
    backgroundColor: Colors.primary,
    ...Shadows.md,
    shadowColor: Colors.primary,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  heroSubtitle: {
    fontSize: FontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    lineHeight: 20,
  },
  heroActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  heroAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  heroActionDisabled: {
    opacity: 0.85,
  },
  heroActionText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold, // changed to bold
    color: Colors.primaryDark,
  },

  snapshot: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  snapshotRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  metricValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
  },
  metricLabel: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
    marginTop: 2,
  },
  lastMadeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.sm,
  },
  lastMadeText: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing['2xl'],
  },
  categoryTile: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    backgroundColor: Colors.surface,
  },
  categoryTileIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  categoryTileLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  categoryTileSub: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  categoryTileTextContainer: {
    flex: 1,
  },
  bottomSpacer: {
    height: Spacing['3xl'],
  },

});
