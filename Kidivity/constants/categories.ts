import { Puzzle, PenTool, BookOpen, Palette, Calculator, FlaskConical } from 'lucide-react-native';
import { Colors } from './theme';

export const ACTIVITY_CATEGORIES = [
    {
        id: 'puzzles' as const,
        label: 'Puzzles & Logic',
        icon: Puzzle,
        description: 'Mazes, matching & sorting',
        color: Colors.categoryPuzzles,
        accent: '#9B72DA',
    },
    {
        id: 'tracing' as const,
        label: 'Letters & Tracing',
        icon: PenTool,
        description: 'Alphabet, shapes & writing',
        color: Colors.categoryTracing,
        accent: '#E8757A',
    },
    {
        id: 'science' as const,
        label: 'Science & Discovery',
        icon: FlaskConical,
        description: 'Animals, space & facts',
        color: Colors.categoryScience,
        accent: '#31A87A',
    },
    {
        id: 'art' as const,
        label: 'Art & Creation',
        icon: Palette,
        description: 'Drawing, coloring & crafts',
        color: Colors.categoryArt,
        accent: '#D4920A',
    },
    {
        id: 'math' as const,
        label: 'Math & Numbers',
        icon: Calculator,
        description: 'Counting, addition & logic',
        color: Colors.categoryMath,
        accent: '#0EAAD4',
    },
    {
        id: 'reading' as const,
        label: 'Reading & Stories',
        icon: BookOpen,
        description: 'Stories & reading skills',
        color: Colors.categoryReading,
        accent: '#D46300',
    },
] as const;

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number]['id'];
