import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableWithoutFeedback, TouchableOpacity, Pressable } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Fonts, Shadows } from '@/constants/theme';
import { ACTIVITY_CATEGORIES } from '@/constants/categories';
import type { Activity } from '@/types/activity';

interface ActivityPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: string | null;
  filteredActivities: Activity[];
  onSchedule: (activity: Activity) => void;
  router: any;
}

export function ActivityPickerModal({
  visible,
  onClose,
  selectedDate,
  filteredActivities,
  onSchedule,
  router,
}: ActivityPickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Schedule Activity</Text>
              <Text style={styles.modalSub}>
                {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Today'}
              </Text>
              <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                {filteredActivities.length === 0 ? (
                  <View style={styles.modalEmpty}>
                    <Text style={styles.modalEmptyText}>No recent activities yet.</Text>
                    <TouchableOpacity
                      style={styles.modalCreateBtn}
                      onPress={() => {
                        onClose();
                        router.push('/(tabs)/generate');
                      }}
                    >
                      <Plus size={16} color={Colors.white} />
                      <Text style={styles.modalCreateText}>Create New</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  filteredActivities.slice(0, 20).map((a: Activity) => {
                    const category = ACTIVITY_CATEGORIES.find((c: any) => c.id === a.category);
                    const Icon = category?.icon;
                    return (
                      <Pressable
                        key={a.id}
                        style={({ pressed }) => [styles.modalItem, pressed && styles.modalItemPressed]}
                        onPress={() => onSchedule(a)}
                        android_ripple={{ color: Colors.border }}
                      >
                        <View style={[styles.modalIcon, { backgroundColor: (category?.accent ?? Colors.primary) + '20' }]}>
                          {Icon && <Icon size={12} color={Colors.textPrimary} />}
                        </View>
                        <View style={styles.modalTextWrap}>
                          <Text style={styles.modalItemTitle} numberOfLines={1}>{a.topic}</Text>
                          <Text style={styles.modalItemMeta}>{category?.label}</Text>
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlayBackground,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.lg,
  },
  modalTitle: {
    fontFamily: Fonts.bold,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    marginBottom: Spacing.xs,
  },
  modalSub: {
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginBottom: Spacing.sm,
  },
  modalList: {
    maxHeight: 280,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalItemPressed: {
    backgroundColor: Colors.background,
  },
  modalIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTextWrap: {
    flex: 1,
  },
  modalItemTitle: {
    fontFamily: Fonts.medium,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
  },
  modalItemMeta: {
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  modalEmpty: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  modalEmptyText: {
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
  modalCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    ...Shadows.sm,
  },
  modalCreateText: {
    fontFamily: Fonts.bold,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    fontSize: FontSize.sm,
  },
});
