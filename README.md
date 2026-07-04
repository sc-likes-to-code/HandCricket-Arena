# 🏏 HandCricket Arena

> A production-quality real-time multiplayer Hand Cricket web game featuring animated SVG hands, synchronized gameplay, private room matchmaking, and a modern glassmorphic interface.

![Status](https://img.shields.io/badge/status-active-success)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-black?logo=socketdotio)
![Express](https://img.shields.io/badge/Express.js-Backend-000000?logo=express)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?logo=tailwindcss)

---

## 📖 Overview

HandCricket Arena is a modern multiplayer recreation of the classic Hand Cricket game.

Instead of displaying numbers, players compete using beautifully animated vector hands that reveal finger gestures simultaneously, creating the feeling of sitting across a table playing Hand Cricket with a friend.

The game focuses on smooth gameplay, synchronized multiplayer, premium animations, and an instant-play experience without requiring accounts or authentication.

---

## ✨ Features

- 🎮 Real-time multiplayer gameplay
- 🤝 Private room-based matchmaking
- ✋ Animated SVG hand reveal system
- 🎲 Coin toss with batting/bowling selection
- ⚡ Server-authoritative game logic
- 🔄 Automatic reconnection handling
- 📊 Match history and player statistics
- 🔊 Procedural audio using the Web Audio API
- 📱 Fully responsive interface
- 🌙 Modern glassmorphic dark theme
- 🎉 Victory celebrations and smooth animations

---

## 🎯 Gameplay

1. Enter your nickname
2. Create a private room
3. Share the room code with a friend
4. Friend joins using the room code
5. Complete the coin toss
6. Choose to bat or bowl
7. Secretly select numbers from **1–6**
8. Both hands reveal simultaneously
9. Continue until both innings finish
10. The highest score wins

---

## 🧩 Core Gameplay Flow

```text
Landing
    │
    ▼
Choose Nickname
    │
    ▼
Dashboard
    │
 ┌──┴──────────────┐
 │                 │
 ▼                 ▼
Create Room     Join Room
 │                 │
 └──────┬──────────┘
        ▼
Private Lobby
        │
        ▼
Coin Toss
        │
        ▼
Bat / Bowl Selection
        │
        ▼
First Innings
        │
        ▼
Second Innings
        │
        ▼
Results
        │
        ▼
Play Again / Return Lobby
```

---

## 🎨 Design Highlights

- Premium dark gaming aesthetic
- Glassmorphism UI
- Neon cyan accents
- Smooth page transitions
- Animated score updates
- SVG hand rig with articulated fingers
- Responsive layouts
- Mobile-friendly controls

---

## 🛠 Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Socket.io Client

### Backend

- Node.js
- Express
- Socket.io

### Graphics

- SVG
- CSS Animations
- Tailwind CSS

### Audio

- Web Audio API
- Procedural synthesized sound effects

---

## ⚙️ Project Structure

```text
HandCricket Arena/
├── server/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   ├── views/
│   └── assets/
├── public/
└── ...
```

---

## 🚀 Getting Started

### Clone

```bash
git clone https://github.com/<your-username>/HandCricket-Arena.git
```

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

---

## 📈 Roadmap

- [x] Multiplayer room system
- [x] Server-authoritative gameplay
- [x] Animated SVG hand engine
- [x] Match statistics
- [x] Audio engine
- [ ] AI opponent
- [ ] Best-of-3 matches
- [ ] Unlockable hand themes
- [ ] Spectator mode
- [ ] Online leaderboard

---

## 🤝 Contributing

Contributions, suggestions, and feature requests are welcome.

Please open an issue before submitting major changes.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Shourjya Chakraborty**

Built with ❤️ using React, TypeScript, Express, Socket.io, Tailwind CSS, and lots of coffee.