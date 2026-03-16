import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ACTIVITY_CATEGORIES, type ActivityCategory } from '@/constants/categories';
import { Colors, Spacing, Radius, FontSize, Fonts, Shadows } from '@/constants/theme';

interface CategorySelectorProps {
    selectedCategory: ActivityCategory | null;
    onSelect: (category: ActivityCategory) => void;
}

export function CategorySelector({ selectedCategory, onSelect }: CategorySelectorProps) {
    return (
        <View style={styles.categoryGrid}>
            {ACTIVITY_CATEGORIES.map((cat) => (
                <CategoryCard
                    key={cat.id}
                    cat={cat}
                    isSelected={selectedCategory === cat.id}
                    onPress={() => {
                        onSelect(cat.id);
                        Haptics.selectionAsync();
                    }}
                />
            ))}
        </View>
    );
}

function CategoryCard({ cat, isSelected, onPress }: { cat: typeof ACTIVITY_CATEGORIES[number], isSelected: boolean, onPress: () => void }) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={[styles.categoryCardWrapper, animatedStyle]}>
            <Pressable
                onPress={onPress}
                onPressIn={() => (scale.value = withSpring(0.95))}
                onPressOut={() => (scale.value = withSpring(1))}
                style={[
                    styles.categoryCard,
                    { backgroundColor: cat.color },
                    isSelected && {
                        borderColor: cat.accent,
                        borderWidth: 3,
                    },
                ]}
            >
                {isSelected && (
                    <View style={[styles.selectedPip, { backgroundColor: cat.accent }]}>
                        <Check size={14} color={Colors.white} strokeWidth={4} />
                    </View>
                )}

                <Text
                    style={[
                        styles.categoryLabel,
                        isSelected && { color: cat.accent },
                    ]}
                    numberOfLines={2}
                >
                    {cat.label}
                </Text>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
        justifyContent: 'center'
    },
    categoryCardWrapper: {
        width: '31%',
    },
    categoryCard: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: Radius['2xl'],
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.md,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    categoryLabel: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.bold,
        color: Colors.textPrimary,
        textAlign: 'center',
        paddingHorizontal: Spacing.xs,
        lineHeight: 20,
    },
    selectedPip: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        ...Shadows.sm,
        borderWidth: 2,
        borderColor: Colors.white,
    },
});
