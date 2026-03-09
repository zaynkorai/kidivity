import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Plus, ChevronRight, Palette, Wand2 } from 'lucide-react-native';
import { useProfileStore } from '@/store/profileStore';
import { useActivityStore } from '@/store/activityStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '@/constants/theme';
import { ACTIVITY_CATEGORIES } from '@/constants/categories';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning! ☀️';
  if (hour < 18) return 'Good afternoon! 👋';
  return 'Good evening! 🌙';
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
            <Text style={styles.greeting}>{getGreeting()}</Text>
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

        {/* Quick Generate CTA */}
        <TouchableOpacity
          style={styles.generateCta}
          activeOpacity={0.9}
          onPress={() => {
            router.push('/(tabs)/generate');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <View style={styles.generateCtaContent}>
            <Wand2 size={28} color={Colors.white} />
            <View style={styles.generateCtaText}>
              <Text style={styles.generateCtaTitle}>Generate Activity</Text>
              <Text style={styles.generateCtaSubtitle}>
                AI-powered fun for your kids
              </Text>
            </View>
          </View>
          <ChevronRight size={24} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* Category Quick Access */}
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.categoryGrid}>
          {ACTIVITY_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryCard]}
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/generate')}
              >
                <Icon size={28} color={cat.color} style={{ marginBottom: Spacing.sm }} />
                <Text style={styles.categoryLabel}>{cat.label}</Text>
                <Text style={styles.categoryDesc}>{cat.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Recent Activities */}
        <Text style={styles.sectionTitle}>Recent Activities</Text>
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
    padding: Spacing.xl,
  },

  // Header
  header: {
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontSize: FontSize['2xl'],
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

  // Generate CTA
  generateCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing['2xl'],
    ...Shadows.lg,
  },
  generateCtaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  generateCtaText: {},
  generateCtaTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  generateCtaSubtitle: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },

  // Section
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  // Categories
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  categoryCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryEmoji: {
    fontSize: 28,
    marginBottom: Spacing.sm,
  },
  categoryLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  categoryDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
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
