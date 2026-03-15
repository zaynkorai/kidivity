import React, { useEffect, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Alert,
    TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Printer, FileDown, Search } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActivityStore } from '@/store/activityStore';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, FontSize, FontWeight, Fonts, Radius } from '@/constants/theme';
import { ACTIVITY_CATEGORIES } from '@/constants/categories';
import { MarkdownContent, normalizeActivityContent } from '@/components/ui/MarkdownContent';
import type { Activity } from '@/types/activity';

function markdownToHtml(md: string): string {
    return md
        .split('\n')
        .map((line) => {
            const t = line.trim();
            if (!t) return '<br/>';
            if (t.startsWith('### ')) return `<h3>${t.slice(4)}</h3>`;
            if (t.startsWith('## ')) return `<h2>${t.slice(3)}</h2>`;
            if (t.startsWith('# ')) return `<h1>${t.slice(2)}</h1>`;
            if (t.startsWith('- ') || t.startsWith('* ')) return `<li>${t.slice(2)}</li>`;
            if (/^\d+\.\s/.test(t)) {
                const match = t.match(/^\d+\.\s(.*)$/);
                return match ? `<li>${match[1]}</li>` : `<p>${t}</p>`;
            }
            if (t === '---' || t === '***') return '<hr/>';
            const bolded = t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            return `<p>${bolded}</p>`;
        })
        .join('\n');
}

function buildWorkbookHtml(activities: Activity[]): string {
    const sections = activities
        .map((activity, index) => {
            const category = ACTIVITY_CATEGORIES.find((c) => c.id === activity.category);
            const htmlContent = markdownToHtml(normalizeActivityContent(activity.content));
            return `
      <section class="activity ${index === activities.length - 1 ? 'last' : ''}">
        <div class="header">
          <div class="badge">${category?.label ?? activity.category}</div>
          <h1>${activity.topic}</h1>
          <div class="meta">
            ${activity.kid_name ? `For ${activity.kid_name} · ` : ''}
            ${activity.difficulty.charAt(0).toUpperCase() + activity.difficulty.slice(1)} · 
            ${new Date(activity.created_at).toLocaleDateString()}
          </div>
        </div>
        ${activity.image_url ? `<img src="${activity.image_url}" class="generated-image" />` : ''}
        ${htmlContent}
      </section>`;
        })
        .join('\n');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    @page { margin: 0.75in; size: letter; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; }
    body {
      font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
      color: ${Colors.textPrimary};
      font-size: 14px;
      line-height: 1.6;
      background: ${Colors.white};
    }
    .activity {
      page-break-after: always;
      break-after: page;
      padding-bottom: 16px;
    }
    .activity.last {
      page-break-after: auto;
      break-after: auto;
    }
    .header {
      width: 100%;
      text-align: center;
      padding-bottom: 16px;
      margin-bottom: 20px;
      border-bottom: 2px solid ${Colors.primary};
    }
    .header h1 {
      font-size: 24px;
      margin-bottom: 4px;
      color: ${Colors.primary};
    }
    .header .meta {
      font-size: 12px;
      color: ${Colors.textSecondary};
    }
    .badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
      background: ${Colors.categories.reading.pastel};
      color: ${Colors.primary};
    }
    h1 { font-size: 22px; margin: 16px 0 8px; }
    h2 { font-size: 18px; margin: 14px 0 6px; color: ${Colors.primaryDark}; }
    h3 { font-size: 16px; margin: 12px 0 4px; }
    p { margin: 6px 0; }
    li { margin: 4px 0; margin-left: 20px; }
    hr { border: none; border-top: 1px solid ${Colors.border}; margin: 16px 0; }
    strong { font-weight: 700; }
    .generated-image {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin-top: 10px;
      margin-bottom: 20px;
      display: block;
      margin-left: auto;
      margin-right: auto;
    }
  </style>
</head>
<body>
${sections}
</body>
</html>`;
}

export default function WorkbookPreviewScreen() {
    const insets = useSafeAreaInsets();
    const bottomPad = Math.max(insets.bottom + Spacing.lg, Spacing['3xl']);
    const router = useRouter();
    const { ids } = useLocalSearchParams<{ ids?: string }>();

    const fetchRecent = useActivityStore((state) => state.fetchRecent);
    const fetchSaved = useActivityStore((state) => state.fetchSaved);
    const recentActivities = useActivityStore((s) => s.recentActivities);
    const savedActivities = useActivityStore((s) => s.savedActivities);

    useEffect(() => {
        fetchRecent();
        fetchSaved();
    }, [fetchRecent, fetchSaved]);

    const idList = useMemo(() => {
        if (!ids) return [] as string[];
        return String(ids).split(',').map((id) => id.trim()).filter(Boolean);
    }, [ids]);

    const activities = useMemo(() => {
        const pool = [...savedActivities, ...recentActivities];
        return idList
            .map((id) => pool.find((a) => a.id === id))
            .filter(Boolean) as Activity[];
    }, [idList, recentActivities, savedActivities]);

    const html = useMemo(() => {
        if (!activities.length) return '';
        return buildWorkbookHtml(activities);
    }, [activities]);

    if (!activities.length) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.centered}>
                    <Search size={48} color={Colors.textPrimary} style={styles.searchIcon} />
                    <Text style={styles.emptyTitle}>Workbook not found</Text>
                    <Button
                        title="Go Back"
                        onPress={() => router.back()}
                        variant="primary"
                        size="md"
                        style={styles.goBackBtn}
                    />
                </View>
            </SafeAreaView>
        );
    }

    const handlePrint = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            await Print.printAsync({ html });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
            Alert.alert('Print Failed', 'Could not open the print dialog. Please try again.');
        }
    };

    const handleSavePdf = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const { uri } = await Print.printToFileAsync({ html });
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Workbook Export',
                    UTI: 'com.adobe.pdf',
                });
            } else {
                Alert.alert('PDF Saved', `PDF saved to: ${uri}`);
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
            Alert.alert('Export Failed', 'Could not create PDF. Please try again.');
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.topBar}>
                <View style={styles.topBarLeft}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={20} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.topTitle}>Workbook Preview</Text>
                </View>

                <View style={styles.topBarActions}>
                    <Button
                        title="Export PDF"
                        onPress={handleSavePdf}
                        variant="secondary"
                        size="sm"
                        icon={<FileDown size={14} color={Colors.textPrimary} />}
                        textStyle={{ color: Colors.textPrimary }}
                    />
                    <Button
                        title="Print Now"
                        onPress={handlePrint}
                        variant="secondary"
                        size="sm"
                        icon={<Printer size={14} color={Colors.textPrimary} />}
                        textStyle={{ color: Colors.textPrimary }}
                    />
                </View>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {activities.map((activity) => {
                    const category = ACTIVITY_CATEGORIES.find((c) => c.id === activity.category);
                    return (
                        <View key={activity.id} style={styles.previewCard}>
                            <View style={styles.previewHeader}>
                                <View style={[styles.badge, { backgroundColor: (category?.color ?? Colors.primary) + '15' }]}>
                                    <Text style={[styles.badgeText, { color: Colors.textPrimary }]}>
                                        {category?.label}
                                    </Text>
                                </View>
                                <Text style={styles.previewTitle}>{activity.topic}</Text>
                                <Text style={styles.previewMeta}>
                                    {activity.kid_name ? `For ${activity.kid_name} · ` : ''}
                                    {activity.difficulty.charAt(0).toUpperCase() + activity.difficulty.slice(1)} ·{' '}
                                    {new Date(activity.created_at).toLocaleDateString()}
                                </Text>
                            </View>
                            <View style={styles.previewBody}>
                                <MarkdownContent content={activity.content} />
                            </View>
                        </View>
                    );
                })}

                <View style={[styles.bottomSpacer, { height: bottomPad }]} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing['4xl'],
    },
    emptyTitle: {
        fontSize: FontSize.lg,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
        marginTop: Spacing.md,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.white,
    },
    topBarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    topBarActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    backBtn: {
        padding: Spacing.xs,
    },
    topTitle: {
        fontSize: FontSize.lg,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    container: {
        flex: 1,
    },
    content: {
        padding: Spacing.xl,
    },
    previewCard: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: Spacing.xl,
        marginBottom: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    previewHeader: {
        alignItems: 'center',
        paddingBottom: Spacing.lg,
        marginBottom: Spacing.lg,
        borderBottomWidth: 2,
        borderBottomColor: Colors.primary,
    },
    badge: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: Radius.sm,
        marginBottom: Spacing.sm,
    },
    badgeText: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.semibold,
    },
    previewTitle: {
        fontSize: FontSize['2xl'],
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: 4,
    },
    previewMeta: {
        fontSize: FontSize.xs,
        fontFamily: Fonts.sans,
        color: Colors.textPrimary,
    },
    previewBody: {
        marginBottom: Spacing.lg,
    },
    goBackBtn: {
        marginTop: Spacing.lg,
    },
    searchIcon: {
        marginBottom: Spacing.md,
    },
    bottomSpacer: {
        height: Spacing['3xl'],
    },
});
