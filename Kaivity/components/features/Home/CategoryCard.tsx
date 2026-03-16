import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, Fonts, Shadows } from '@/constants/theme';
import { ACTIVITY_CATEGORIES } from '@/constants/categories';

interface CategoryCardProps {
  cat: (typeof ACTIVITY_CATEGORIES)[number];
  categoryCardWidth: number;
  isCompact: boolean;
  isShort: boolean;
  onPress: () => void;
}

export function CategoryCard({ cat, categoryCardWidth, isCompact, isShort, onPress }: CategoryCardProps) {
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

const styles = StyleSheet.create({
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
});
