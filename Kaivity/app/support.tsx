import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Send, HelpCircle, Bug, MessageSquare, Info, History as HistoryIcon, Clock, CheckCircle2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radius, FontSize, FontWeight, Fonts, Shadows } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { TouchableOpacity as GHTouchableOpacity } from 'react-native-gesture-handler';
import { useAuthStore } from '@/store/authStore';

const CATEGORIES = [
    { id: 'bug', label: 'Report a Bug', icon: Bug, color: Colors.categories.math.accent },
    { id: 'feedback', label: 'Feature Feedback', icon: MessageSquare, color: Colors.categories.art.accent },
    { id: 'question', label: 'General Question', icon: HelpCircle, color: Colors.secondary },
    { id: 'other', label: 'Other', icon: Info, color: Colors.success },
] as const;

export default function SupportScreen() {
    const router = useRouter();
    const session = useAuthStore((s) => s.session);
    const [viewMode, setViewMode] = useState<'form' | 'history'>('form');
    const [category, setCategory] = useState<typeof CATEGORIES[number]['id']>('bug');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const fetchHistory = async () => {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL;
        if (!apiUrl || !session?.access_token) return;

        setIsLoadingHistory(true);
        try {
            const response = await fetch(`${apiUrl}/api/support`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setHistory(data);
            }
        } catch (error) {
            console.error('[Support] Failed to fetch history', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (viewMode === 'history') {
            fetchHistory();
        }
    }, [viewMode]);

    const handleSubmit = async () => {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL;
        console.log('[Support] handleSubmit triggered', { apiUrl });

        if (!apiUrl) {
            console.error('[Support] EXPO_PUBLIC_API_URL is not defined');
            Alert.alert('Configuration Error', 'API URL is not configured.');
            return;
        }

        const endpoint = `${apiUrl}/api/support`;

        if (subject.trim().length < 2) {
            Alert.alert('Subject too short', 'Subject must be at least 2 characters.');
            return;
        }
        if (message.trim().length < 5) {
            Alert.alert('Message too short', 'Message must be at least 5 characters.');
            return;
        }

        setIsSubmitting(true);
        if (Platform.OS !== 'web') {
            try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch (e) { }
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log('[Support] Triggering timeout abort');
            controller.abort();
        }, 15000);

        try {
            console.log('[Support] Fetching:', endpoint);
            // Alert.alert('Debug', 'Starting fetch'); // Optional debug

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ category, subject, message }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            console.log('[Support] Response status:', response.status);

            let data;
            try {
                const text = await response.text();
                console.log('[Support] Raw response text:', text);
                data = text ? JSON.parse(text) : {};
            } catch (pErr) {
                console.error('[Support] Response parsing failed', pErr);
                data = { error: 'Invalid response from server' };
            }

            if (!response.ok) {
                console.error('[Support] Request failed', { status: response.status, data });
                if (data.details) {
                    const validationErrors = Object.entries(data.details)
                        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                        .join('\n');
                    throw new Error(`Validation failed:\n${validationErrors}`);
                }
                throw new Error(data.error || `Server error (${response.status})`);
            }

            console.log('[Support] Success detected, providing feedback...');

            if (Platform.OS !== 'web') {
                try {
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } catch (e) { }
            }

            const successMsg = 'Thank you! Your message has been sent. We will get back to you soon.';
            console.log('[Support] Showing success alert...');

            if (Platform.OS === 'web') {
                window.alert(successMsg);
                console.log('[Support] Redirection after alert...');
                router.back();
            } else {
                Alert.alert(
                    'Sent Successfully',
                    successMsg,
                    [{
                        text: 'OK', onPress: () => {
                            console.log('[Support] Alert OK pressed, redirecting...');
                            router.back();
                        }
                    }]
                );
            }
        } catch (error: any) {
            clearTimeout(timeoutId);
            console.error('[Support] Error caught:', error);

            if (Platform.OS !== 'web') {
                try {
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                } catch (e) { }
            }

            const errorTitle = error.name === 'AbortError' ? 'Request Timeout' : 'Submission Failed';
            const errorMsg = error.name === 'AbortError'
                ? 'The server took too long to respond. Please try again.'
                : (error.message || 'An unexpected error occurred.');

            console.log('[Support] Showing error alert...', { errorTitle, errorMsg });

            if (Platform.OS === 'web') {
                window.alert(`${errorTitle}: ${errorMsg}`);
            } else {
                Alert.alert(errorTitle, errorMsg);
            }
        } finally {
            console.log('[Support] Submission process finished');
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <ScreenBackground />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <View style={styles.header}>
                    <GHTouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ChevronLeft size={24} color={Colors.textPrimary} />
                    </GHTouchableOpacity>
                    <Text style={styles.title}>Help & Support</Text>
                    <GHTouchableOpacity
                        onPress={() => {
                            setViewMode(viewMode === 'form' ? 'history' : 'form');
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                        style={styles.historyToggleButton}
                    >
                        {viewMode === 'form' ? (
                            <>
                                <HistoryIcon size={18} color={Colors.primary} />
                                <Text style={styles.historyToggleText}>History</Text>
                            </>
                        ) : (
                            <>
                                <MessageSquare size={18} color={Colors.primary} />
                                <Text style={styles.historyToggleText}>New Ticket</Text>
                            </>
                        )}
                    </GHTouchableOpacity>
                </View>

                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {viewMode === 'form' ? (
                        <>
                            <Text style={styles.label}>Category</Text>
                            <View style={styles.categoryGrid}>
                                {CATEGORIES.map((cat) => {
                                    const Icon = cat.icon;
                                    const isSelected = category === cat.id;
                                    return (
                                        <GHTouchableOpacity
                                            key={cat.id}
                                            style={[
                                                styles.categoryCard,
                                                isSelected && { backgroundColor: Colors.white, borderColor: cat.color, borderWidth: 2 }
                                            ]}
                                            onPress={() => {
                                                setCategory(cat.id);
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            }}
                                        >
                                            <View style={[styles.categoryIcon, { backgroundColor: cat.color }]}>
                                                <Icon size={20} color={Colors.white} />
                                            </View>
                                            <Text style={[styles.categoryLabel, isSelected && { color: cat.color, fontFamily: Fonts.bold }]}>
                                                {cat.label}
                                            </Text>
                                        </GHTouchableOpacity>
                                    );
                                })}
                            </View>

                            <Card variant="elevated" style={styles.formCard}>
                                <Input
                                    label="Subject"
                                    placeholder="Brief summary of your issue"
                                    value={subject}
                                    onChangeText={setSubject}
                                    required
                                />
                                <View style={{ height: Spacing.md }} />
                                <Input
                                    label="Message"
                                    placeholder="Tell us more details..."
                                    value={message}
                                    onChangeText={setMessage}
                                    multiline
                                    numberOfLines={6}
                                    required
                                    textAlignVertical="top"
                                    style={styles.textArea}
                                />
                            </Card>

                            <Button
                                title={isSubmitting ? "Sending..." : "Send Message"}
                                onPress={handleSubmit}
                                disabled={isSubmitting}
                                loading={isSubmitting}
                                icon={<Send size={18} color={Colors.white} />}
                                style={styles.submitButton}
                            />
                        </>
                    ) : (
                        <View style={styles.historyList}>
                            <Text style={styles.label}>Previous Supports</Text>
                            {isLoadingHistory ? (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>Loading history...</Text>
                                </View>
                            ) : history.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <HistoryIcon size={48} color={Colors.secondary} style={{ marginBottom: Spacing.md }} />
                                    <Text style={styles.emptyText}>No previous support tickets found.</Text>
                                </View>
                            ) : (
                                history.map((ticket) => (
                                    <Card key={ticket.id} variant="elevated" style={styles.historyCard}>
                                        <View style={styles.historyHeader}>
                                            <View style={[styles.statusBadge, { backgroundColor: ticket.status === 'resolved' ? Colors.success : Colors.secondary }]}>
                                                {ticket.status === 'resolved' ? <CheckCircle2 size={12} color={Colors.white} /> : <Clock size={12} color={Colors.white} />}
                                                <Text style={styles.statusText}>{ticket.status || 'open'}</Text>
                                            </View>
                                            <Text style={styles.historyDate}>
                                                {new Date(ticket.created_at).toLocaleDateString()}
                                            </Text>
                                        </View>
                                        <Text style={styles.historySubject}>{ticket.subject}</Text>
                                        <Text style={styles.historyMessage} numberOfLines={2}>{ticket.message}</Text>
                                    </Card>
                                ))
                            )}
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    flex: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: Radius.full,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.sm,
    },
    title: {
        fontSize: FontSize.xl,
        fontFamily: Fonts.bold,
        color: Colors.textPrimary,
    },
    container: {
        flex: 1,
    },
    content: {
        padding: Spacing.md,
        paddingBottom: Spacing['3xl'],
    },
    label: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xs,
        textTransform: 'uppercase',
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    categoryCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: Colors.primaryLight,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    categoryIcon: {
        width: 40,
        height: 40,
        borderRadius: Radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xs,
        ...Shadows.sm,
    },
    categoryLabel: {
        fontSize: FontSize.xs,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    formCard: {
        padding: Spacing.md,
        marginBottom: Spacing.xl,
    },
    textArea: {
        height: 120,
        borderRadius: Radius.xl,
        paddingTop: Spacing.md,
    },
    submitButton: {
        backgroundColor: Colors.primary,
        ...Shadows.md,
    },
    historyToggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Spacing.md,
        height: 40,
        borderRadius: Radius.full,
        backgroundColor: Colors.white,
        ...Shadows.sm,
    },
    historyToggleText: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
    historyList: {
        flex: 1,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing['3xl'],
    },
    emptyText: {
        fontSize: FontSize.md,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    historyCard: {
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: Radius.full,
    },
    statusText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
        color: Colors.white,
        textTransform: 'uppercase',
    },
    historyDate: {
        fontSize: FontSize.xs,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
    },
    historySubject: {
        fontSize: FontSize.md,
        fontFamily: Fonts.bold,
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    historyMessage: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.sans,
        color: Colors.textSecondary,
    },
});
