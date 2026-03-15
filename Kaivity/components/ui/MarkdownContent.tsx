import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, Fonts, Radius } from '@/constants/theme';

export function normalizeActivityContent(raw: string) {
    let text = raw ?? '';
    const trimmed = text.trim();

    try {
        if (
            (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
            trimmed.startsWith('{') ||
            trimmed.startsWith('[')
        ) {
            const parsed = JSON.parse(trimmed);
            if (typeof parsed === 'string') {
                text = parsed;
            } else if (parsed && typeof parsed === 'object') {
                const obj = parsed as Record<string, unknown>;
                const title = typeof obj.title === 'string' ? obj.title : '';
                const instructions = typeof obj.instructions === 'string' ? obj.instructions : '';
                const content = typeof obj.content === 'string' ? obj.content : '';
                if (title || instructions || content) {
                    text = `${title ? `# ${title}\n\n` : ''}${instructions ? `${instructions}\n\n` : ''}${content}`;
                }
            }
        }
    } catch {
        // ignore
    }

    // Handle double-escaped newlines coming from storage/API (e.g. "\\n" instead of "\n").
    // Keep this narrow to avoid unexpectedly changing other escape sequences.
    if (text.includes('\\n') || text.includes('\\r\\n')) {
        text = text.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
    }

    return text;
}

/** Render bold and italic inline */
export function renderInline(text: string): React.ReactNode {
    // Split by **bold** markers
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return (
                <Text key={i} style={styles.inlineBold}>
                    {part.slice(2, -2)}
                </Text>
            );
        }
        return part;
    });
}

/** Simple markdown-ish renderer: handles #, ##, ###, **, *, -, numbered lists */
export function MarkdownContent({ content, compact = false }: { content: string; compact?: boolean }) {
    const elements = useMemo(() => {
        const safeContent = normalizeActivityContent(content);
        const lines = safeContent.split('\n');
        const result: React.ReactElement[] = [];

        lines.forEach((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) {
                result.push(<View key={idx} style={compact ? styles.spacerCompact : styles.spacer} />);
                return;
            }

            const boldLine = trimmed.match(/^\*\*(.+)\*\*$/)?.[1]?.trim();

            // Headings
            if (trimmed.startsWith('### ')) {
                result.push(
                    <Text key={idx} style={compact ? mdStyles.h3Compact : mdStyles.h3}>
                        {trimmed.slice(4)}
                    </Text>
                );
            } else if (trimmed.startsWith('## ')) {
                result.push(
                    <Text key={idx} style={compact ? mdStyles.h2Compact : mdStyles.h2}>
                        {trimmed.slice(3)}
                    </Text>
                );
            } else if (trimmed.startsWith('# ')) {
                result.push(
                    <Text key={idx} style={compact ? mdStyles.h1Compact : mdStyles.h1}>
                        {trimmed.slice(2)}
                    </Text>
                );
            }
            // Blockquote
            else if (trimmed.startsWith('>')) {
                const quote = trimmed.replace(/^>\s?/, '').trim();
                result.push(
                    <View key={idx} style={compact ? mdStyles.blockquoteCompact : mdStyles.blockquote}>
                        <Text style={compact ? mdStyles.blockquoteTextCompact : mdStyles.blockquoteText}>{renderInline(quote)}</Text>
                    </View>
                );
            }
            // Fully-bold line (common for prompt sections)
            else if (boldLine) {
                const isShort = boldLine.length <= 60;
                const isNumbered = /^\d+\.\s/.test(boldLine);
                const headingStyle = compact ? mdStyles.h3Compact : mdStyles.h3;
                const paraStyle = compact ? mdStyles.paragraphCompact : mdStyles.paragraph;
                result.push(
                    <Text key={idx} style={(isNumbered || isShort) ? headingStyle : paraStyle}>
                        {renderInline(trimmed)}
                    </Text>
                );
            }
            // Bullet list
            else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                result.push(
                    <View key={idx} style={compact ? mdStyles.listItemCompact : mdStyles.listItem}>
                        <Text style={compact ? mdStyles.bulletCompact : mdStyles.bullet}>•</Text>
                        <Text style={compact ? mdStyles.listTextCompact : mdStyles.listText}>
                            {renderInline(trimmed.slice(2))}
                        </Text>
                    </View>
                );
            }
            // Numbered list
            else if (/^\d+\.\s/.test(trimmed)) {
                const match = trimmed.match(/^(\d+)\.\s(.*)$/);
                if (match) {
                    result.push(
                        <View key={idx} style={compact ? mdStyles.listItemCompact : mdStyles.listItem}>
                            <Text style={compact ? mdStyles.numberCompact : mdStyles.number}>{match[1]}.</Text>
                            <Text style={compact ? mdStyles.listTextCompact : mdStyles.listText}>
                                {renderInline(match[2])}
                            </Text>
                        </View>
                    );
                }
            }
            // Horizontal rule
            else if (trimmed === '---' || trimmed === '***') {
                result.push(<View key={idx} style={mdStyles.hr} />);
            }
            // Normal paragraph
            else {
                result.push(
                    <Text key={idx} style={compact ? mdStyles.paragraphCompact : mdStyles.paragraph}>
                        {renderInline(trimmed)}
                    </Text>
                );
            }
        });

        return result;
    }, [content, compact]);

    return <View>{elements}</View>;
}

const styles = StyleSheet.create({
    spacer: {
        height: 8,
    },
    spacerCompact: {
        height: 5,
    },
    inlineBold: {
        fontFamily: Fonts.bold,
        fontWeight: 'bold',
    },
});

const mdStyles = StyleSheet.create({
    // ─── Default (tablet / large screens) ─────────────
    h1: {
        fontFamily: Fonts.bold,
        fontSize: FontSize['3xl'],
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginTop: Spacing.sm,
        marginBottom: Spacing.md,
    },
    h2: {
        fontFamily: Fonts.bold,
        fontSize: FontSize.xl,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginTop: Spacing.md,
        marginBottom: Spacing.xs,
    },
    h3: {
        fontFamily: Fonts.medium,
        fontSize: FontSize.lg,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginTop: Spacing.md,
        marginBottom: Spacing.xs,
    },
    paragraph: {
        fontFamily: Fonts.sans,
        fontSize: FontSize.md,
        color: Colors.textPrimary,
        lineHeight: 24,
        marginBottom: Spacing.xs,
    },
    listItem: {
        flexDirection: 'row',
        paddingLeft: Spacing.sm,
        marginBottom: 4,
    },
    bullet: {
        fontFamily: Fonts.bold,
        fontSize: FontSize.md,
        color: Colors.textPrimary,
        marginRight: Spacing.sm,
        width: 16,
    },
    number: {
        fontFamily: Fonts.medium,
        fontSize: FontSize.md,
        color: Colors.textPrimary,
        fontWeight: '600',
        marginRight: Spacing.sm,
        width: 20,
    },
    listText: {
        flex: 1,
        fontFamily: Fonts.sans,
        fontSize: FontSize.md,
        color: Colors.textPrimary,
        lineHeight: 24,
    },
    hr: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: Spacing.md,
    },
    blockquote: {
        backgroundColor: Colors.primaryLight + '55',
        borderLeftWidth: 3,
        borderLeftColor: Colors.secondary,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: Radius.sm,
        marginBottom: Spacing.sm,
    },
    blockquoteText: {
        fontFamily: Fonts.sans,
        fontSize: FontSize.md,
        color: Colors.textPrimary,
        lineHeight: 24,
        fontStyle: 'italic',
    },

    // ─── Compact (mobile ≤ 430px) ─────────────────────
    h1Compact: {
        fontFamily: Fonts.bold,
        fontSize: FontSize.xl,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginTop: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    h2Compact: {
        fontFamily: Fonts.bold,
        fontSize: FontSize.lg,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginTop: Spacing.sm,
        marginBottom: Spacing.xs,
    },
    h3Compact: {
        fontFamily: Fonts.medium,
        fontSize: FontSize.md,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginTop: Spacing.sm,
        marginBottom: Spacing.xs,
    },
    paragraphCompact: {
        fontFamily: Fonts.sans,
        fontSize: FontSize.sm,
        color: Colors.textPrimary,
        lineHeight: 20,
        marginBottom: Spacing.xs,
    },
    listItemCompact: {
        flexDirection: 'row',
        paddingLeft: Spacing.xs,
        marginBottom: 3,
    },
    bulletCompact: {
        fontFamily: Fonts.bold,
        fontSize: FontSize.sm,
        color: Colors.textPrimary,
        marginRight: Spacing.xs,
        width: 14,
    },
    numberCompact: {
        fontFamily: Fonts.medium,
        fontSize: FontSize.sm,
        color: Colors.textPrimary,
        fontWeight: '600',
        marginRight: Spacing.xs,
        width: 18,
    },
    listTextCompact: {
        flex: 1,
        fontFamily: Fonts.sans,
        fontSize: FontSize.sm,
        color: Colors.textPrimary,
        lineHeight: 20,
    },
    blockquoteCompact: {
        backgroundColor: Colors.primaryLight + '55',
        borderLeftWidth: 2,
        borderLeftColor: Colors.secondary,
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.md,
        borderRadius: Radius.sm,
        marginBottom: Spacing.xs,
    },
    blockquoteTextCompact: {
        fontFamily: Fonts.sans,
        fontSize: FontSize.sm,
        color: Colors.textPrimary,
        lineHeight: 20,
        fontStyle: 'italic',
    },
});
