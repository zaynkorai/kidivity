import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Spacing } from '@/constants/theme';
import { ACTIVITY_CATEGORIES } from '@/constants/categories';
import { CategoryCard } from './CategoryCard';
import { useResponsive } from '@/hooks/useResponsive';

interface CategoryGridProps {
  isCompact: boolean;
  isShort: boolean;
  onCategoryPress: (catId: string) => void;
}

export function CategoryGrid({ isCompact, isShort, onCategoryPress }: CategoryGridProps) {
  const horizontalPadding = isCompact ? Spacing.lg : Spacing.xl;
  const gridGap = Spacing.md;
  const { width: screenWidth } = Dimensions.get('window');

  // Dynamic columns: minimum 2, but can expand on larger screens
  const availableWidth = screenWidth - (horizontalPadding * 2);
  const minColWidth = 160;
  const numColumns = Math.max(2, Math.floor((availableWidth + gridGap) / (minColWidth + gridGap)));
  
  // Robust width calculation without fragile "- 0.1" magic number
  const categoryCardWidth = Math.floor((availableWidth - (gridGap * (numColumns - 1))) / numColumns);

  return (
    <View style={styles.categoryGrid}>
      {ACTIVITY_CATEGORIES.map((cat) => (
        <CategoryCard
          key={cat.id}
          cat={cat}
          categoryCardWidth={categoryCardWidth}
          isCompact={isCompact}
          isShort={isShort}
          onPress={() => onCategoryPress(cat.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
});
