import { Rocket, Bone, Dog, Palette, Music, Trophy, Leaf, Car, ChefHat, FlaskConical, Calculator, Book, Landmark, Globe, Bot, Waves, CloudSun, Train, Shield, Wand2 } from 'lucide-react-native';

export const INTEREST_OPTIONS = [
    { label: 'Space', value: 'Space', icon: Rocket },
    { label: 'Dinosaurs', value: 'Dinosaurs', icon: Bone },
    { label: 'Animals', value: 'Animals', icon: Dog },
    { label: 'Art', value: 'Art', icon: Palette },
    { label: 'Music', value: 'Music', icon: Music },
    { label: 'Sports', value: 'Sports', icon: Trophy },
    { label: 'Nature', value: 'Nature', icon: Leaf },
    { label: 'Cars', value: 'Cars', icon: Car },
    { label: 'Cooking', value: 'Cooking', icon: ChefHat },
    { label: 'Science', value: 'Science', icon: FlaskConical },
    { label: 'Math', value: 'Math', icon: Calculator },
    { label: 'Reading', value: 'Reading', icon: Book },
    { label: 'History', value: 'History', icon: Landmark },
    { label: 'Geography', value: 'Geography', icon: Globe },
    { label: 'Robots', value: 'Robots', icon: Bot },
    { label: 'Ocean', value: 'Ocean', icon: Waves },
    { label: 'Weather', value: 'Weather', icon: CloudSun },
    { label: 'Trains', value: 'Trains', icon: Train },
    { label: 'Superheroes', value: 'Superheroes', icon: Shield },
    { label: 'Fairy Tales', value: 'Fairy Tales', icon: Wand2 },
] as const;

export type Interest = (typeof INTEREST_OPTIONS)[number]['value'];
