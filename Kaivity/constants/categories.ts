import { Puzzle, PenTool, BookOpen, Palette, Calculator, FlaskConical } from 'lucide-react-native';
import { Colors } from './theme';

export const ACTIVITY_CATEGORIES = [
    {
        id: 'puzzles' as const,
        label: 'Puzzles & Logic',
        icon: Puzzle,
        description: 'Mazes, matching & sorting',
        color: Colors.categories.puzzles.pastel,
        accent: Colors.categories.puzzles.accent,
    },
    {
        id: 'tracing' as const,
        label: 'Letters & Tracing',
        icon: PenTool,
        description: 'Alphabet, shapes & writing',
        color: Colors.categories.tracing.pastel,
        accent: Colors.categories.tracing.accent,
    },
    {
        id: 'science' as const,
        label: 'Science & Discovery',
        icon: FlaskConical,
        description: 'Animals, space & facts',
        color: Colors.categories.science.pastel,
        accent: Colors.categories.science.accent,
    },
    {
        id: 'art' as const,
        label: 'Art & Creation',
        icon: Palette,
        description: 'Drawing, coloring & crafts',
        color: Colors.categories.art.pastel,
        accent: Colors.categories.art.accent,
    },
    {
        id: 'math' as const,
        label: 'Math & Numbers',
        icon: Calculator,
        description: 'Counting, addition & logic',
        color: Colors.categories.math.pastel,
        accent: Colors.categories.math.accent,
    },
    {
        id: 'reading' as const,
        label: 'Reading & Stories',
        icon: BookOpen,
        description: 'Stories & reading skills',
        color: Colors.categories.reading.pastel,
        accent: Colors.categories.reading.accent,
    },
] as const;

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number]['id'];
