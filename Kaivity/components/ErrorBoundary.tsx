import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, FontWeight, Fonts, Radius } from '@/constants/theme';
import { AlertCircle } from 'lucide-react-native';
import { Button } from './ui/Button';

interface Props {
    children: ReactNode;
    fallbackTitle?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Catches JS errors anywhere in the child tree and renders a friendly
 * fallback UI instead of crashing the whole app.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, info.componentStack);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <AlertCircle size={64} color={Colors.textPrimary} style={styles.icon} />
                    <Text style={styles.title}>
                        {this.props.fallbackTitle ?? 'Oops! Something went wrong'}
                    </Text>
                    <Text style={styles.message}>
                        Don&apos;t worry — this is just a hiccup. Try again and it should work.
                    </Text>
                    {__DEV__ && this.state.error && (
                        <View style={styles.devBox}>
                            <Text style={styles.devText} numberOfLines={5}>
                                {this.state.error.message}
                            </Text>
                        </View>
                    )}
                    <Button
                        title="Try Again"
                        onPress={this.handleRetry}
                        variant="primary"
                        size="md"
                        style={{ marginTop: Spacing.xl }}
                    />
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing['4xl'],
        backgroundColor: Colors.background,
    },
    icon: {
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: FontSize.xl,
        fontFamily: Fonts.bold,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        textAlign: 'center',
    },
    message: {
        fontSize: FontSize.sm,
        fontFamily: Fonts.sans,
        color: Colors.textPrimary,
        textAlign: 'center',
        marginTop: Spacing.sm,
        lineHeight: 20,
    },
    devBox: {
        marginTop: Spacing.lg,
        padding: Spacing.md,
        backgroundColor: Colors.accent + '10',
        borderRadius: Radius.sm,
        borderWidth: 1,
        borderColor: Colors.accent + '30',
        maxWidth: '100%',
    },
    devText: {
        fontSize: FontSize.xs,
        color: Colors.accent,
        fontFamily: Fonts.mono,
    },
});
