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

Before deploying, verify that both workspaces compile and build independently:
```bash
npm run build:all
```
This runs:
*   `npm run build --workspace=@handcricket/client`: Compiles the React client using `tsc` and bundles assets inside `/client/dist`.
*   `npm run build --workspace=@handcricket/server`: Compiles the server codebase using `tsc` to `/server/dist` for a production Node.js runtime (no dependency on `tsx` watch mode).

---

## Deployment Guide

This workspace configuration is optimized for separate deployments:

### Frontend (e.g., Vercel)
1.  Import this repository into Vercel.
2.  Set the **Root Directory** option to `client`.
3.  Configure the build commands:
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
4.  Define environment variables:
    *   `VITE_SERVER_URL`: URL of your deployed backend (e.g. `https://your-backend.railway.app`).

### Backend (e.g., Railway)
1.  Import this repository into Railway.
2.  Configure the **Root Directory** or build command to run inside `server/`.
3.  Configure the startup commands:
    *   **Build Command**: `npm run build`
    *   **Start Command**: `npm run start` (which executes `node dist/index.js`)
4.  Define environment variables:
    *   `PORT`: `3000` (automatically injected by Railway)
    *   `CLIENT_URL`: URL of your deployed frontend (e.g. `https://your-app.vercel.app`).