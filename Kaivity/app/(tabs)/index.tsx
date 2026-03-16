import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useProfileStore } from '@/store/profileStore';
import { useActivityStore } from '@/store/activityStore';
import { JourneyMap } from '@/components/ui/JourneyMap';
import { Colors, Spacing, FontSize, Fonts } from '@/constants/theme';
import { ACTIVITY_CATEGORIES } from '@/constants/categories';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { ProfileSelectorModal } from '@/components/features';
import { MagicCard, CategoryCard, CategoryGrid } from '@/components/features/Home';
import { useResponsive } from '@/hooks/useResponsive';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isCompact, isShort } = useResponsive();
  const tabBarHeight = useBottomTabBarHeight();
  const bottomPad = Math.max(tabBarHeight + insets.bottom + Spacing.lg, Spacing['3xl']);

  // Stable action selectors
  const fetchProfiles = useProfileStore((state) => state.fetchProfiles);
  const fetchRecent = useActivityStore((state) => state.fetchRecent);
  const fetchKidStats = useActivityStore((state) => state.fetchKidStats);

  // State selectors
  const profiles = useProfileStore((state) => state.profiles);
  const activeProfileId = useProfileStore((state) => state.activeProfileId);
  const recentActivities = useActivityStore((state) => state.recentActivities);
  const stats = useActivityStore((state) => activeProfileId ? state.kidStats[activeProfileId] : undefined);

  const [refreshing, setRefreshing] = useState(false);
  const [dropdownShown, setDropdownVisible] = useState(false);

  const activeProfile = profiles.find((p) => p?.id === activeProfileId);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  useEffect(() => {
    if (!activeProfileId) return;
    fetchKidStats(activeProfileId);
  }, [activeProfileId, fetchKidStats]);

  const visibleActivities = useMemo(() => {
    const list = recentActivities || [];
    if (!activeProfileId) return list;
    return list.filter((a) => a?.kid_profile_id === activeProfileId);
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
        <MagicCard
          activeProfile={activeProfile}
          lastActivity={lastActivity}
          isCompact={isCompact}
          isShort={isShort}
          onPress={() => {
            router.push('/(tabs)/generate');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
          onProfilePress={() => {
            setDropdownVisible(true);
            Haptics.selectionAsync();
          }}
          onOpenLastPress={() => {
            if (lastActivity) {
              router.push(`/activity/${lastActivity.id}`);
            }
          }}
        />

        <JourneyMap
          kidProfileId={activeProfileId ?? null}
          activities={recentActivities}
          activityStreak={stats?.streak ?? null}
        />

        <View style={styles.statsHeader}>
          <Text style={styles.sectionTitle}>Create by Categories</Text>
        </View>

        <CategoryGrid
          isCompact={isCompact}
          isShort={isShort}
          onCategoryPress={(catId: string) => {
            router.push({ pathname: '/(tabs)/generate', params: { category: catId } });
            Haptics.selectionAsync();
          }}
        />

        <View style={[styles.bottomSpacer, { height: bottomPad }]} />
      </ScrollView>

      <ProfileSelectorModal
        visible={dropdownShown}
        onClose={() => setDropdownVisible(false)}
      />
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
  sectionTitle: {
    fontSize: FontSize.xl,
    fontFamily: Fonts.bold,
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
  bottomSpacer: {
    height: Spacing['3xl'],
  },
});
