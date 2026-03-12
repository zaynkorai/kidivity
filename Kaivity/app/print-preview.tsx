import React, { useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Alert,
    TouchableOpacity,
    useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Printer, FileDown, Search, Heart } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActivityStore } from '@/store/activityStore';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, FontSize, FontWeight, Fonts, Radius } from '@/constants/theme';
import { ACTIVITY_CATEGORIES } from '@/constants/categories';
import { MarkdownContent, normalizeActivityContent } from '@/components/ui/MarkdownContent';

/** Convert markdown-ish content to simple HTML for printing */
function markdownToHtml(md: string): string {
    return md
        .split('\n')
        .map((line) => {
            const t = line.trim();
            if (!t) return '<br/>';
            if (t.startsWith('### ')) return `<h3>${t.slice(4)}</h3>`;
            if (t.startsWith('## ')) return `<h2>${t.slice(3)}</h2>`;
            if (t.startsWith('# ')) return `<h1>${t.slice(2)}</h1>`;
            if (t.startsWith('- ') || t.startsWith('* '))
                return `<li>${t.slice(2)}</li>`;
            if (/^\d+\.\s/.test(t)) {
                const match = t.match(/^\d+\.\s(.*)$/);
                return match ? `<li>${match[1]}</li>` : `<p>${t}</p>`;
            }
            if (t === '---' || t === '***') return '<hr/>';
            // Bold
            const bolded = t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            return `<p>${bolded}</p>`;
        })
        .join('\n');
}

function buildPrintHtml(activity: {
    topic: string;
    category: string;
    difficulty: string;
    style: string;
    content: string;
    image_url: string | null;
    kid_name?: string;
    created_at: string;
}): string {
    const category = ACTIVITY_CATEGORIES.find((c) => c.id === activity.category);
    const htmlContent = markdownToHtml(normalizeActivityContent(activity.content));
    const isBW = activity.style === 'bw';

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
      color: #1E1E2E;
      font-size: 14px;
      line-height: 1.6;
      ${isBW ? '' : 'background: #FAFAFE;'}
    }
    .header {
      width: 100%;
      text-align: center;
      padding-bottom: 16px;
      margin-bottom: 20px;
      border-bottom: 2px solid ${isBW ? '#333' : '#FF8A00'};
    }
    .header h1 {
      font-size: 24px;
      margin-bottom: 4px;
      ${isBW ? '' : 'color: #FF8A00;'}
    }
    .header .meta {
      font-size: 12px;
      color: #6B7280;
    }
    .badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
      ${isBW ? 'border: 1px solid #333;' : `background: ${(category?.color ?? '#FF8A00')}20; color: ${category?.color ?? '#FF8A00'};`}
    }
    h1 { font-size: 22px; margin: 16px 0 8px; }
    h2 { font-size: 18px; margin: 14px 0 6px; ${isBW ? '' : 'color: #4834D4;'} }
    h3 { font-size: 16px; margin: 12px 0 4px; }
    p { margin: 6px 0; }
    li { margin: 4px 0; margin-left: 20px; }
    hr { border: none; border-top: 1px solid #E8E8F0; margin: 16px 0; }
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
    .cover-page {
      width: 100%;
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      page-break-after: always;
      break-after: page;
    }
    .footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #E8E8F0;
      text-align: center;
      font-size: 10px;
      color: #9CA3AF;
    }
  </style>
</head>
<body>
  ${activity.image_url ? `
  <div class="cover-page">
    <img src="${activity.image_url}" class="generated-image" />
  </div>
  ` : ''}
  <div class="content-page">
    <div class="header">
      <div class="badge">${category?.label ?? activity.category}</div>
      <h1>${activity.topic}</h1>
      <div class="meta">
        ${activity.kid_name ? `For ${activity.kid_name} · ` : ''}
        ${activity.difficulty.charAt(0).toUpperCase() + activity.difficulty.slice(1)} · 
        ${new Date(activity.created_at).toLocaleDateString()}
      </div>
    </div>
    ${htmlContent}
    <div class="footer">Generated with ❤️ by Kaivity</div>
  </div>
</body>
</html>`;
}

export default function PrintPreviewScreen() {
    const insets = useSafeAreaInsets();
    const bottomPad = Math.max(insets.bottom + Spacing.lg, Spacing['3xl']);
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const recentActivities = useActivityStore((s) => s.recentActivities);
    const savedActivities = useActivityStore((s) => s.savedActivities);
    const { width } = useWindowDimensions();

    const isSmallScreen = width < 380;
    const isTablet = width > 768;

    const activity = useMemo(() => {
        return [...recentActivities, ...savedActivities].find((a) => a.id === id);
    }, [id, recentActivities, savedActivities]);

    const html = useMemo(() => {
        if (!activity) return '';
        return buildPrintHtml(activity);
    }, [activity]);

    if (!activity) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.centered}>
                    <Search size={48} color={Colors.textPrimary} style={styles.searchIcon} />
                    <Text style={styles.emptyTitle}>Activity not found</Text>
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
                    dialogTitle: `${activity.topic} Activity`,
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

    const category = ACTIVITY_CATEGORIES.find((c) => c.id === activity.category);

    return (
        <SafeAreaView style={styles.safe}>
            {/* Top bar */}
            <View style={styles.topBar}>
                <View style={styles.topBarLeft}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={isSmallScreen ? 20 : 22} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    {!isSmallScreen && <Text style={styles.topTitle}>Preview</Text>}
                </View>

                <View style={styles.topBarActions}>
                    <Button
                        title={isSmallScreen ? "PDF" : "Export PDF"}
                        onPress={handleSavePdf}
                        variant="secondary"
                        size="sm"
                        icon={<FileDown size={14} color={Colors.textPrimary} />}
                        textStyle={{ color: Colors.textPrimary }}
                    />
                    <Button
                        title={isSmallScreen ? "Print" : "Print Now"}
                        onPress={handlePrint}
                        variant="secondary"
                        size="sm"
                        icon={<Printer size={14} color={Colors.textPrimary} />}
                        textStyle={{ color: Colors.textPrimary }}
                    />
                </View>
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={[
                    styles.content,
                    isSmallScreen && { padding: Spacing.md },
                    isTablet && { maxWidth: 600, alignSelf: 'center', width: '100%' }
                ]}
            >
                {/* Page 1: Cover */}
                <View style={[
                    styles.previewCard,
                    isSmallScreen && { padding: Spacing.lg, borderRadius: Radius.md }
                ]}>
                    {/* Header */}
                    <View style={[
                        styles.previewHeader,
                        !activity.image_url && { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 },
                        isSmallScreen && { paddingBottom: Spacing.md, marginBottom: Spacing.md }
                    ]}>
                        <View style={[styles.badge, { backgroundColor: (Colors.pastels as any)[activity.category] ?? Colors.primary + '15' }]}>
                            <Text style={[styles.badgeText, { color: Colors.textPrimary }]}>
                                {category?.label}
                            </Text>
                        </View>
                        <Text style={[
                            styles.previewTitle,
                            isSmallScreen && { fontSize: FontSize.xl }
                        ]}>{activity.topic}</Text>
                        <Text style={styles.previewMeta}>
                            {activity.kid_name ? `For ${activity.kid_name} · ` : ''}
                            {activity.difficulty.charAt(0).toUpperCase() + activity.difficulty.slice(1)} ·{' '}
                            {new Date(activity.created_at).toLocaleDateString()}
                        </Text>
                    </View>

                    {activity.image_url && (
                        <View style={[styles.previewBody, { marginBottom: 0 }]}>
                            <Image
                                source={{ uri: activity.image_url }}
                                style={[styles.previewImage, { marginBottom: 0 }]}
                                contentFit="cover"
                            />
                        </View>
                    )}
                </View>

                {/* Page 2: Content */}
                <View style={[
                    styles.previewCard,
                    { minHeight: 300 },
                    isSmallScreen && { padding: Spacing.lg, borderRadius: Radius.md }
                ]}>
                    <View style={styles.previewBody}>
                        <MarkdownContent content={activity.content} />
                    </View>

                    <View style={styles.previewFooter}>
                        <Text style={styles.footerText}>
                            Generated with <Heart size={16} color={Colors.primary} fill={Colors.primary} /> by Kaivity
                        </Text>
                    </View>
                </View>

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
        // Page-like shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
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
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: 4,
    },
    previewMeta: {
        fontSize: FontSize.xs,
        fontFamily: Fonts.sans,
        color: Colors.textPrimary,
    },
    previewImage: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: Radius.sm,
        marginBottom: Spacing.md,
        backgroundColor: Colors.surface,
    },
    previewBody: {
        marginBottom: Spacing.lg,
    },
    previewContent: {
        fontSize: FontSize.sm,
        color: Colors.textPrimary,
        lineHeight: 22,
    },
    previewFooter: {
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        alignItems: 'center',
    },
    footerText: {
        fontSize: FontSize.md,
        color: Colors.textPrimary,
    },
    actionRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    flex1: {
        flex: 1,
    },
    goBackBtn: {
        marginTop: Spacing.lg,
    },
    searchIcon: {
        marginBottom: Spacing.md,
    },
    topBarSpacer: {
        width: 38,
    },
    bottomSpacer: {
        height: Spacing['3xl'],
    },
});
