# 🌸 Kaizen — Continuous Improvement

A sleek, modern life-OS app built with **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**.

## ✨ Features

### Core tools
- 📊 **Dashboard** — Greeting, completion rate, stats overview, recent tasks
- ✅ **Tasks** — Add/complete/delete, priority levels (low/medium/high), projects, search, filtering
- 🍅 **Pomodoro Timer** — Focus, short break, long break modes with animated circular progress & session tracking
- 📝 **Notes** — Colorful sticky-note cards, pinning, search, modal editor, 6 accent colors
- 🔥 **Habits** — Daily streaks, 7-day tracker grid, custom icons & colors
- 📅 **Calendar** — Month view with task indicators, day detail view

### Life spaces (coming soon)
- 📁 **Projects**
- 💪 **Workout**
- 💼 **Career**
- 🎮 **Entertainment**
- ❤️ **Health**

## 🎨 Design

- Dark glassmorphism UI with violet → cyan → pink gradient accents
- Smooth page/element animations via Framer Motion
- Mesh-gradient background
- Custom scrollbars and glowing checkboxes
- Inter + JetBrains Mono typography
- LocalStorage persistence (tasks, notes, habits, projects)

## 🚀 Getting Started

```bash
cd productivity-app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
productivity-app/
├── app/
│   ├── globals.css      # Tailwind + custom styles
│   ├── layout.tsx       # Root layout w/ StoreProvider
│   └── page.tsx         # Main app shell w/ view routing
├── components/
│   ├── Sidebar.tsx
│   ├── Dashboard.tsx
│   ├── Tasks.tsx
│   ├── Pomodoro.tsx
│   ├── Notes.tsx
│   ├── Habits.tsx
│   └── Calendar.tsx
└── lib/
    ├── types.ts
    └── store.tsx        # React Context store w/ localStorage
```

## 🛠 Tech Stack

- Next.js 16 (App Router + Pages Router)
- React 19
- TypeScript
- Tailwind CSS 3
- Framer Motion
- Lucide React icons
