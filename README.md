<div align="center">

# 🏏 HandCricket Arena

### A Production-Ready Real-Time Multiplayer Hand Cricket Experience

Real-time multiplayer hand cricket built with **React 19**, **TypeScript**, **Node.js**, **Express**, and **Socket.IO**, featuring server-authoritative gameplay, synchronized animations, procedural audio, SVG hand animations, and a professional npm workspaces monorepo architecture.

</div>

---

# 🌐 Live Deployment

**Frontend:** https://handcricket-arena-sc.vercel.app

**Backend:** https://handcricket-arena-server.onrender.com

---

# ✨ Features

- 🎮 Real-time multiplayer gameplay using Socket.IO
- 🔒 Private room creation with secure room codes
- ⚡ Server-authoritative game engine to ensure fair gameplay
- 🤝 Synchronized gameplay using latency-compensated move reveals
- ✋ Interactive animated SVG hand gestures
- 🎨 Premium glassmorphism-inspired dark UI
- 🔊 Procedural sound effects using the Web Audio API
- 📊 Persistent local player statistics
- 🔄 Automatic reconnection with grace period support
- 📱 Responsive interface for desktop and mobile devices
- 🚀 Independent frontend and backend deployments

---

# 🏗️ Architecture

HandCricket Arena follows a professional **npm Workspaces Monorepo** architecture.

```text
HandCricket-Arena
│
├── client/      React + Vite + Tailwind CSS
├── server/      Express + Socket.IO
├── shared/      Shared TypeScript Models
│
├── package.json
└── tsconfig.json
```

### Client

- React 19
- Vite 8
- Tailwind CSS v4
- Socket.IO Client
- SVG Animation System
- Web Audio API
- Local Statistics Manager

### Server

- Node.js
- Express
- Socket.IO
- Server-authoritative Game State Machine
- Room Manager
- Reconnection Handling
- CORS Management

### Shared

A dedicated workspace providing a **single source of truth** for:

- Game models
- Room models
- Socket event types
- Shared interfaces

---

# 🧩 Technology Stack

| Category | Technologies |
|-----------|--------------|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS v4 |
| Backend | Node.js, Express, Socket.IO |
| Realtime | WebSockets (Socket.IO) |
| Language | TypeScript |
| Animation | SVG + CSS Animations |
| Audio | Web Audio API |
| Storage | LocalStorage |
| Build System | npm Workspaces |

---

# 🎮 Gameplay Flow

| Phase | Description |
|:------|:------------|
| 🏠 **Create Room** | Host creates a private multiplayer room with a unique room code. |
| 👥 **Lobby** | Guest joins, both players enter the lobby and configure the match. |
| ✅ **Ready** | Players mark themselves as ready. The host starts the game. |
| 🪙 **Coin Toss** | Guest predicts **Heads** or **Tails**. The server determines the winner. |
| ⚔️ **Bat / Bowl** | Toss winner chooses whether to **Bat** or **Bowl** first. |
| 🏏 **First Innings** | Batter scores until both players choose the same number (OUT). |
| 🔄 **Change Innings** | Target is calculated and batting/bowling roles are swapped. |
| 🎯 **Second Innings** | Chasing player attempts to beat the target before getting OUT. |
| 🏆 **Match Result** | Winner (or Draw) is declared and statistics are updated. |
| 🔁 **Rematch** | Both players may accept a rematch or return to the lobby. |

---

# 🧠 Server-Authoritative Game Engine

The backend acts as the **single source of truth**.

Clients never determine:

- Match outcome
- Runs scored
- Wickets
- Targets
- Turn resolution

Instead, every action is validated on the server before being broadcast to all connected players.

This architecture prevents inconsistent game states and provides synchronized gameplay for every participant.

---

# ⚡ Real-Time Synchronization

To ensure both players observe gameplay simultaneously, the project implements:

- Clock synchronization
- Latency compensation
- Blind move submission
- Scheduled synchronized reveals
- Server timestamp alignment
- Graceful reconnection handling

This prevents players from seeing turns resolve at different times due to network latency.

---

# 🎨 User Experience

The interface focuses on responsiveness and immersion.

Highlights include:

- Glassmorphism-inspired design
- Animated SVG hand gestures
- Smooth page transitions
- Responsive layouts
- Animated countdowns
- Match timeline
- Live score updates
- Dynamic connection indicators

---

# 🔊 Procedural Audio

Instead of shipping audio assets, HandCricket Arena synthesizes sound effects in real time using the **Web Audio API**.

Generated effects include:

- UI interactions
- Countdown ticks
- Coin toss
- Hand reveal
- Victory fanfare
- Defeat cues
- Ambient crowd effects

This reduces bundle size while eliminating external audio dependencies.

---

# 📊 Player Statistics

Player statistics are stored locally using LocalStorage.

Tracked metrics include:

- Games Played
- Wins
- Losses
- Win Rate
- Highest Score
- Highest Chase
- Average Runs
- Win Streaks
- Match History

---

# 📂 Project Structure

```text
HandCricket-Arena
│
├── client
│   ├── src
│   │   ├── components
│   │   ├── hooks
│   │   ├── utils
│   │   └── views
│   ├── package.json
│   └── vite.config.ts
│
├── server
│   ├── src
│   │   ├── game
│   │   ├── services
│   │   ├── socket
│   │   └── index.ts
│   └── package.json
│
├── shared
│   ├── src
│   └── package.json
│
├── package.json
└── tsconfig.json
```

---

# 🚀 Local Development

## Clone the repository

```bash
git clone https://github.com/sc-likes-to-code/HandCricket-Arena.git

cd HandCricket-Arena
```

## Install dependencies

```bash
npm install
```

## Start development

```bash
npm run dev
```

---

# 🌍 Deployment

## Frontend

**Platform:** Vercel

Environment Variable

```env
VITE_SERVER_URL=https://your-backend.onrender.com
```

---

## Backend

**Platform:** Render

Build Command

```bash
npm run build
```

Start Command

```bash
npm run start --workspace=@handcricket/server
```

Environment Variables

```env
CLIENT_URL=https://your-frontend.vercel.app
```

---

# 🎯 Design Goals

- Fair multiplayer gameplay
- Server-authoritative architecture
- Low-latency synchronization
- Responsive user experience
- Zero external audio assets
- Type-safe full-stack development
- Independent frontend/backend deployments
- Professional monorepo organization

---

# 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

**Built with ❤️ using React, TypeScript, Express, Socket.IO, and modern web technologies.**

</div>
