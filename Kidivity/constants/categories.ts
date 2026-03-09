import { Puzzle, PenTool, BookOpen, Palette } from 'lucide-react-native';
import { Colors } from './theme';

export const ACTIVITY_CATEGORIES = [
    {
        id: 'logic' as const,
        label: 'Logic',
        icon: Puzzle,
        description: 'Puzzles, patterns & matching',
        color: Colors.categoryLogic,
    },
    {
        id: 'tracing' as const,
        label: 'Tracing',
        icon: PenTool,
        description: 'Letters, shapes & writing',
        color: Colors.categoryTracing,
    },
    {
        id: 'educational' as const,
        label: 'Educational',
        icon: BookOpen,
        description: 'Facts, quizzes & reading',
        color: Colors.categoryEducational,
    },
    {
        id: 'screen-free' as const,
        label: 'Screen-Free',
        icon: Palette,
        description: 'Crafts & physical activities',
        color: Colors.categoryScreenFree,
    },
] as const;

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number]['id'];
