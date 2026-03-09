# Kidivity - Product Requirements Document

## 1. App Overview
**Kidivity** is a mobile application designed for parents (especially homeschoolers) to generate fun, customizable, and educational activities for their children using artificial intelligence (Google Gemini & AI image generation).

## 2. Target Audience
- Parents looking for quality time and educational activities with their kids.
- Homeschooling parents seeking tailored assignments.
- Parents who love AI and want to leverage it for their children's learning.

## 3. Core Features
- **Kid Profiles:** 
  - Ability to create multiple profiles for different children.
  - Profile fields: Name, Age, Grade Level, Interests (e.g., Space, Dinosaurs, Trains, Buses).
- **Journey Map:** 
  - A weekly calendar/map view where parents can schedule and create activities for specific days.
- **Activity Generation:**
  - Categories: Logic, Tracing, Educational, Screen-Free.
  - Customizable prompts based on the child's profile and selected topics.
  - Option to generate Black & White (for printing) or Colorful variants visually appealing diagrams.
- **AI Integration:**
  - Text generation powered by Google Gemini (e.g., Gemini 1.5 Flash).
  - Image/diagram generation powered by an image generation API.
- **Data Storage:**
  - Securely store kid profiles, generated activities, and journey map progress.

## 4. Tech Stack & Platforms (Proposed)
- **Frontend / Mobile App:** React Native with Expo (for cross-platform iOS & Android).
- **State Management:** Zustand.
- **Backend / Database:** Supabase (for authentication, PostgreSQL database, and edge functions to securely call AI APIs).
- **AI APIs:** Google Gemini API (Text), Image Generation API.

## 5. Design & User Experience
- Clean, playful, and visually appealing interface suitable for parents but fun for kids to look at.
- Output formatting: Activities should be print-ready (especially B&W variants).

## 6. Monetization / Business Model (Future Considerations)
- Freemium model with a set number of free AI generation credits.
- Premium subscription for unlimited activities and cloud storage of saved activities.
