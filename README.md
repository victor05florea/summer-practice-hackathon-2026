# ShowUp2Move 🏃

A smart social sports-matching platform that helps people quickly organize spontaneous sports activities with others nearby. Built for the Haufe Internship Hackathon 2026.

## 🎯 The Problem

Modern schedules make it hard to maintain fixed sports groups. People want to stay active, but coordinating with others takes too much effort.

## ✨ The Solution

ShowUp2Move removes the friction. Three steps:

1. **Set yourself as available** with one tap
2. **Join or create a lobby** for your sport
3. **Show up and play**

## 🚀 Key Features

### Smart Lobbies

- Auto-grouping based on sport, city, and availability
- Sport-specific group sizes (Football: 10, Tennis: 4, Padel: 4, etc.)
- Real-time progress bar showing how full each lobby is

### Captain System

- The lobby creator becomes the captain (👑)
- Only captains can set location and event time
- Eliminates chat chaos — one person decides

### People Nearby

- Discover compatible players in your city
- Filter by shared sports preferences
- See who's available right now

### AI-Powered Coach (Local LLM via Ollama)

Five distinct AI features running 100% locally for privacy:

- **Daily Motivation** — personalized boost on each login
- **Venue Suggestions** — AI proposes locations based on city + sport
- **Welcome Messages** — captain generates group greetings
- **Icebreaker Questions** — for first-time groups
- **Compatibility Insights** — explains why two players match

## 🛠 Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend & DB:** Supabase (PostgreSQL, Auth, Realtime)
- **AI:** Ollama with Llama 3.2 (local LLM)
- **Deployment:** Local development environment

## 🏗 Architecture

- Lightweight SPA with route-based navigation
- Supabase handles auth + persistent state
- Local LLM keeps user data private (no cloud AI calls)
- Optimistic UI updates for instant feedback

## 🚦 Setup

### Prerequisites

- Node.js 18+
- Ollama installed locally (`ollama.com`)
- Supabase project with the provided schema

### Installation

\`\`\`bash

# Clone and install

git clone https://github.com/victor05florea/summer-practice-hackathon-2026.git
cd summer-practice-hackathon-2026
npm install

# Set up environment

cp .env.example .env

# Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Start Ollama

ollama serve
ollama pull llama3.2

# Run app

npm run dev
\`\`\`

## 🎨 Design Philosophy

Dark theme with emerald accents. Minimal friction. Sentence-case throughout. Every interaction in 1-2 taps.

## 🔮 Future Improvements

- Group chat with Supabase Realtime
- Map integration for venue display
- Push notifications for lobby fill events
- Skill-level matching weights

---
