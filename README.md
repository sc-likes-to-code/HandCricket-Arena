# HandCricket Arena Monorepo

Welcome to **HandCricket Arena**, a real-time multiplayer Web socket-based recreation of the classic Hand Cricket game! 

This repository is structured as an **npm Workspaces Monorepo** optimized for independent development and deployment of the frontend and backend.

---

## Directory Architecture

```
HandCricket-Arena/
├── client/                 # React + Vite Client (Deployed to Vercel)
│   ├── .env.example        # Client environment template
│   ├── package.json        # Client dependencies & scripts
│   ├── tsconfig.json       # Client TypeScript configurations
│   ├── vite.config.ts      # Vite configuration
│   ├── src/                # Frontend codebase
│   └── public/             # Static frontend assets
│
├── server/                 # Express + Socket.io Server (Deployed to Railway)
│   ├── .env.example        # Server environment template
│   ├── package.json        # Server dependencies & scripts
│   ├── tsconfig.json       # Server TypeScript configurations
│   └── src/                # Backend codebase
│
├── shared/                 # Shared Workspace (Single Source of Truth for Types)
│   ├── package.json        # Shared workspace config
│   ├── tsconfig.json       # Shared TypeScript configuration
│   └── src/                # Sibling-resolvable type files
│
├── package.json            # Lightweight root workspaces configuration
└── README.md               # Monorepo setup guide
```

---

## Local Setup & Development

### 1. Installation
Install all dependencies for all workspaces (`client`, `server`, and `shared`) with a single command from the root:
```bash
npm install
```

### 2. Configure Environment Variables
Create local environment files for both packages.

**For the Client (`/client/.env`)**:
```env
VITE_SERVER_URL=http://localhost:3000
```

**For the Server (`/server/.env`)**:
```env
PORT=3000
CLIENT_URL=http://localhost:5173
```

### 3. Run Development Servers
Launch both the frontend client and the backend server concurrently from the root directory:
```bash
npm run dev
```
Alternatively, you can run workspaces independently:
*   Frontend: `npm run client` (or `npm run dev` inside `client/`)
*   Backend: `npm run server` (or `npm run dev` inside `server/`)

---

## Production Builds

Before deploying, verify that workspaces compile and build:
*   `npm run build`: Compiles the shared package, then the server package (alias for `build:server`).
*   `npm run build:server`: Compiles the shared package, then the server package.
*   `npm run build:client`: Compiles the shared package, then the client package.
*   `npm run build:all`: Compiles all packages (shared, server, and client) sequentially.

---

## Deployment Guide

This workspace configuration is optimized for separate deployments:

### Frontend (Vercel)
1.  Import this repository into Vercel.
2.  Set the **Root Directory** option to `client`.
3.  Configure the build commands:
    *   **Build Command** (override default): `cd .. && npm run build:client`
    *   **Output Directory**: `dist`
4.  Define environment variables:
    *   `VITE_SERVER_URL`: URL of your deployed backend (e.g. `https://your-backend.onrender.com`).

### Backend (Render)
1.  Import this repository into Render as a **Web Service**.
2.  Leave the **Root Directory** as the repository root (empty/default).
3.  Configure the build and start commands:
    *   **Build Command**: `npm run build` (Builds `shared` and then `server`).
    *   **Start Command**: `npm run start --workspace=@handcricket/server`
4.  Define environment variables:
    *   `PORT`: `3000` (Render will auto-bind if not specified, or use the injected port).
    *   `CLIENT_URL`: URL of your deployed frontend (e.g. `https://your-app.vercel.app`).
    *   `NODE_ENV`: `production`