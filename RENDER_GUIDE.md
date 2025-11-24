# Render Deployment Guide

## 1. Project Setup
Your project is now set up to be a **Full Stack Application** (Frontend + Backend).
- **Frontend**: React + Vite (in `src/`)
- **Backend**: Node.js + Express (in `server/`)

## 2. Deploying to Render
1.  Push your latest code to **GitHub**.
2.  Go to [Render.com](https://render.com) and create a new **Web Service**.
3.  Connect your GitHub repository.
4.  **Settings**:
    - **Name**: `omix-ai` (or whatever you like)
    - **Environment**: `Node`
    - **Build Command**: `npm install && npm run build`
    - **Start Command**: `npm start`
5.  **Environment Variables**:
    - Add `GROQ_API_KEY`: `gsk_9LAP...` (Your Key)
    - Add `GEMINI_API_KEY`: `AIzaSy...` (Your Key)
    - Add `NODE_ENV`: `production`

## 3. How it Works
- When you deploy, Render will install dependencies and build your React frontend (`npm run build`).
- Then it starts the Node server (`npm start`).
- The Node server serves the built frontend files AND handles the API requests at `/api/chat` and `/api/image`.
