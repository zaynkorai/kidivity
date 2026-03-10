import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,

  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Plus, ChevronRight, Palette, Wand2, Star, Award, CheckCircle, Sun, Sunset, Moon, TrendingUp } from 'lucide-react-native';
import { useProfileStore } from '@/store/profileStore';
import { useActivityStore } from '@/store/activityStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '@/constants/theme';
import { ACTIVITY_CATEGORIES } from '@/constants/categories';
import { ScreenBackground } from '@/components/ui/ScreenBackground';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning!';
  if (hour < 18) return 'Good afternoon!';
  return 'Good evening!';
}

function getGreetingIcon() {
  const hour = new Date().getHours();
  if (hour < 12) return <Sun size={28} color={Colors.categoryReading} />;
  if (hour < 18) return <Sunset size={28} color={Colors.categoryMath} />;
  return <Moon size={28} color={Colors.primaryLight} />;
}

export default function HomeScreen() {
  const router = useRouter();
  const { profiles, activeProfileId, setActiveProfile, fetchProfiles } = useProfileStore();
  const { recentActivities, fetchRecent } = useActivityStore();
  const activeProfile = profiles.find((p) => p.id === activeProfileId);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProfiles();
    fetchRecent();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchProfiles(), fetchRecent()]);
    setRefreshing(false);
  }, []);

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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.greetingRow}>
              {getGreetingIcon()}
              <Text style={styles.greeting}>{getGreeting()}</Text>
            </View>
            <Text style={styles.subtitle}>
              {activeProfile
                ? `Activities for ${activeProfile.name}`
                : 'Add a kid to get started'}
            </Text>
          </View>
        </View>

        {/* Kid Profile Switcher */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.profileList}
        >
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
            >
              <View
                style={[
                  styles.profileAvatar,
                  { backgroundColor: profile.avatar_color },
                ]}
              >
                <Text style={styles.profileInitial}>
                  {profile.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text
                style={[
                  styles.profileName,
                  profile.id === activeProfileId && styles.profileNameActive,
                ]}
              >
                {profile.name}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Add Kid Button */}
          <TouchableOpacity
            onPress={() => router.push('/profile/create')}
            style={styles.addKidChip}
          >
            <View style={styles.addKidIcon}>
              <Plus size={16} color={Colors.primary} />
            </View>
            <Text style={styles.addKidText}>Add Kid</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Parent Insight */}
        {activeProfile && (
          <View style={styles.insightCard}>
            <View style={styles.insightIconWrap}>
              <TrendingUp size={20} color={Colors.white} />
            </View>
            <View style={styles.insightTextWrap}>
              <Text style={styles.insightTitle}>Parent Insight</Text>
              <Text style={styles.insightText}>
                {activeProfile.name} is building consistent learning habits. They are on a {Math.floor((activeProfile.activity_count || 0) / 3) + 1}-day streak!
              </Text>
            </View>
          </View>
        )}

        {/* Hero Generate CTA */}
        <TouchableOpacity
          style={styles.generateCta}
          activeOpacity={0.9}
          onPress={() => {
            router.push('/(tabs)/generate');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <View style={styles.generateCtaContent}>
            <View style={styles.generateIconContainer}>
              <Wand2 size={32} color={Colors.categoryMath} />
            </View>
            <View style={styles.generateCtaText}>
              <Text style={styles.generateCtaTitle}>Unlock Today's Quest</Text>
              <Text style={styles.generateCtaSubtitle}>
                A personalized challenge awaits {activeProfile ? activeProfile.name : 'your child'}!
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Player Stats Dashboard */}
        {activeProfile && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Daily Goals</Text>
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: Colors.categoryMath + '15', borderColor: Colors.categoryMath + '30' }]}>
                <View style={[styles.statIconWrap, { backgroundColor: Colors.categoryMath + '20' }]}>
                  <Award size={20} color={Colors.categoryMath} />
                </View>
                <Text style={styles.statValue}>Lvl {Math.floor((activeProfile.activity_count || 0) / 3) + 1}</Text>
                <Text style={styles.statLabel}>Explorer Rank</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: Colors.categoryArt + '15', borderColor: Colors.categoryArt + '30' }]}>
                <View style={[styles.statIconWrap, { backgroundColor: Colors.categoryArt + '20' }]}>
                  <Star size={20} color={'#F59E0B'} />
                </View>
                <Text style={styles.statValue}>{(activeProfile.activity_count || 0) * 10}</Text>
                <Text style={styles.statLabel}>Total XP</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: Colors.categoryScience + '15', borderColor: Colors.categoryScience + '30' }]}>
                <View style={[styles.statIconWrap, { backgroundColor: Colors.categoryScience + '20' }]}>
                  <CheckCircle size={20} color={Colors.categoryScience} />
                </View>
                <Text style={styles.statValue}>{activeProfile.activity_count || 0}</Text>
                <Text style={styles.statLabel}>Quests Done</Text>
              </View>
            </View>
          </View>
        )}

        {/* Category Quick Access */}
        <Text style={styles.sectionTitle}>Explore Categories</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
          style={{ marginBottom: Spacing['2xl'] }}
        >
          {ACTIVITY_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryPill, { borderColor: cat.color + '30', backgroundColor: cat.color + '10' }]}
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/generate')}
              >
                <View style={[styles.categoryPillIcon, { backgroundColor: cat.color }]}>
                  <Icon size={16} color={Colors.white} />
                </View>
                <Text style={styles.categoryPillLabel}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Recent Activities */}
        <Text style={styles.sectionTitle}>Recent Quests</Text>
        {recentActivities.length === 0 ? (
          <Card variant="outlined" style={styles.emptyState}>
            <Palette size={48} color={Colors.textSecondary} style={{ marginBottom: Spacing.md }} />
            <Text style={styles.emptyTitle}>No activities yet</Text>
            <Text style={styles.emptySubtitle}>
              Generate your first activity to see it here!
            </Text>
            <Button
              title="Create Activity"
              onPress={() => router.push('/(tabs)/generate')}
              variant="primary"
              size="sm"
              style={{ marginTop: Spacing.md }}
            />
          </Card>
        ) : (
          recentActivities.slice(0, 5).map((activity) => (
            <TouchableOpacity
              key={activity.id}
              activeOpacity={0.85}
              onPress={() => router.push(`/activity/${activity.id}` as any)}
            >
              <Card variant="elevated" style={styles.activityCard}>
                <View style={styles.activityHeader}>
                  <View
                    style={[
                      styles.activityBadge,
                      {
                        backgroundColor:
                          (ACTIVITY_CATEGORIES.find((c) => c.id === activity.category)
                            ?.color ?? Colors.primaryLight) + '20',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      },
                    ]}
                  >
                    {(() => {
                      const cat = ACTIVITY_CATEGORIES.find((c) => c.id === activity.category);
                      const Icon = cat?.icon;
                      return (
                        <>
                          {Icon && <Icon size={14} color={cat?.color} />}
                          <Text style={styles.activityBadgeText}>{cat?.label}</Text>
                        </>
                      );
                    })()}
                  </View>
                  <Text style={styles.activityDate}>
                    {new Date(activity.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.activityContent}>
                  <View style={styles.activityTextContent}>
                    <Text style={styles.activityTopic} numberOfLines={1}>
                      {activity.topic}
                    </Text>
                    <Text style={styles.activityPreview} numberOfLines={2}>
                      {activity.content}
                    </Text>
                  </View>
                  {activity.image_url && (
                    <Image
                      source={{ uri: activity.image_url }}
                      style={styles.activityThumbnail}
                      contentFit="cover"
                      transition={200}
                    />
                  )}
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}

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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.xl,
  },

  // Header
  header: {
    marginBottom: Spacing.xl,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  greeting: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },

  // Profile Switcher
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
  },
  profileChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  profileAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  profileName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  profileNameActive: {
    color: Colors.primary,
  },
  addKidChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
    borderStyle: 'dashed',
  },
  addKidIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '15',
  },
  addKidText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.primary,
  },

  // Insight
  insightCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
    alignItems: 'center',
  },
  insightIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  insightTextWrap: {
    flex: 1,
  },
  insightTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primaryDark,
    marginBottom: 2,
  },
  insightText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Generate CTA
  generateCta: {
    backgroundColor: Colors.categoryMath,
    borderRadius: Radius['2xl'],
    padding: Spacing['2xl'],
    marginBottom: Spacing['2xl'],
    ...Shadows.lg,
  },
  generateCtaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  generateIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  generateCtaText: {
    flex: 1,
  },
  generateCtaTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  generateCtaSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    flexShrink: 1,
  },

  // Stats Row
  statsSection: {
    marginBottom: Spacing['2xl'],
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },

  // Section
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  // Categories Scroll
  categoryScroll: {
    gap: Spacing.sm,
    paddingRight: Spacing.xl, // For nice scroll bleeding
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  categoryPillIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPillLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },

  // Activity Cards
  activityCard: {
    marginBottom: Spacing.md,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  activityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  activityBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  activityDate: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  activityContent: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  activityTextContent: {
    flex: 1,
  },
  activityTopic: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  activityThumbnail: {
    width: 60,
    height: 60,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
  },
  activityPreview: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
});
