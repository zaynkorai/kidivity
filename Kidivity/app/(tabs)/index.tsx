import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Sparkles, ChevronRight } from 'lucide-react-native';
import { useProfileStore } from '@/store/profileStore';
import { useActivityStore } from '@/store/activityStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '@/constants/theme';
import { ACTIVITY_CATEGORIES } from '@/constants/categories';

export default function HomeScreen() {
  const router = useRouter();
  const { profiles, activeProfileId, setActiveProfile, fetchProfiles } = useProfileStore();
  const { recentActivities, fetchRecent } = useActivityStore();
  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  useEffect(() => {
    fetchProfiles();
    fetchRecent();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning! 👋</Text>
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
              onPress={() => setActiveProfile(profile.id)}
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
          onPress={() => router.push('/(tabs)/generate')}
        >
          <View style={styles.generateCtaContent}>
            <Sparkles size={28} color={Colors.white} />
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
          {ACTIVITY_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryCard]}
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/generate')}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
              <Text style={styles.categoryDesc}>{cat.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activities */}
        <Text style={styles.sectionTitle}>Recent Activities</Text>
        {recentActivities.length === 0 ? (
          <Card variant="outlined" style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎨</Text>
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
            <Card key={activity.id} variant="elevated" style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <View
                  style={[
                    styles.activityBadge,
                    {
                      backgroundColor:
                        (ACTIVITY_CATEGORIES.find((c) => c.id === activity.category)
                          ?.color ?? Colors.primaryLight) + '20',
                    },
                  ]}
                >
                  <Text style={styles.activityBadgeText}>
                    {ACTIVITY_CATEGORIES.find((c) => c.id === activity.category)?.emoji}{' '}
                    {ACTIVITY_CATEGORIES.find((c) => c.id === activity.category)?.label}
                  </Text>
                </View>
                <Text style={styles.activityDate}>
                  {new Date(activity.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.activityTopic} numberOfLines={1}>
                {activity.topic}
              </Text>
              <Text style={styles.activityPreview} numberOfLines={2}>
                {activity.content}
              </Text>
            </Card>
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
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
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
  activityTopic: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  activityPreview: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
});
