export const INTEREST_OPTIONS = [
    { label: '🚀 Space', value: 'Space' },
    { label: '🦕 Dinosaurs', value: 'Dinosaurs' },
    { label: '🐾 Animals', value: 'Animals' },
    { label: '🎨 Art', value: 'Art' },
    { label: '🎵 Music', value: 'Music' },
    { label: '⚽ Sports', value: 'Sports' },
    { label: '🌿 Nature', value: 'Nature' },
    { label: '🚗 Cars', value: 'Cars' },
    { label: '🍳 Cooking', value: 'Cooking' },
    { label: '🔬 Science', value: 'Science' },
    { label: '🔢 Math', value: 'Math' },
    { label: '📚 Reading', value: 'Reading' },
    { label: '🏛️ History', value: 'History' },
    { label: '🌍 Geography', value: 'Geography' },
    { label: '🤖 Robots', value: 'Robots' },
    { label: '🌊 Ocean', value: 'Ocean' },
    { label: '🌤️ Weather', value: 'Weather' },
    { label: '🚂 Trains', value: 'Trains' },
    { label: '🦸 Superheroes', value: 'Superheroes' },
    { label: '🧚 Fairy Tales', value: 'Fairy Tales' },
] as const;

export type Interest = (typeof INTEREST_OPTIONS)[number]['value'];
