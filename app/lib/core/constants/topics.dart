import 'dart:math';

const Map<String, List<String>> suggestedTopics = {
  'puzzles': ['Mazes', 'Patterns', 'Find the Difference', 'Matching', 'Sequences', 'Sorting', 'Shadows', 'Odd One Out', 'Sudoku', 'Logic Grids', 'Symmetry'],
  'tracing': ['Alphabet', 'Numbers', 'Shapes', 'Lines', 'Animal', 'Vehicles', 'Sight Words'],
  'science': ['Space', 'Animal', 'Dinosaurs', 'Ocean', 'Geography', 'Human Body', 'Weather', 'Plants', 'Insects', 'Volcanoes', 'Recycling', 'Solar System'],
  'art': ['Coloring Pages', 'Step-by-step Drawing', 'Origami', 'Crafts', 'Mandala', 'Pixel Art', 'Paper Airplanes', 'Finger Painting', 'Mask Making'],
  'math': ['Addition', 'Counting', 'Subtraction', 'Shapes', 'Money', 'Time', 'Fractions', 'Multiplication', 'Measuring', 'Finance', 'Word Problems'],
  'reading': ['Bedtime Stories', 'Sight Words', 'Reading Comprehension', 'Phonics', 'Adventure Tales', 'Fairy Tales', 'Poetry', 'Myths & Legends', 'Rhyming', 'Vocabulary'],
};

/// Returns a randomized list of suggested topics for a given category.
List<String> getRandomSuggestions(String category, {int count = 6}) {
  final topics = List<String>.from(suggestedTopics[category] ?? []);
  topics.shuffle(Random());
  return topics.take(count).toList();
}
