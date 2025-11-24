# Deployment Guide for Omix AI

Since your application is built with **Vite + React**, deploying it to the web is very straightforward. You have two main options:

## Option 1: The Easiest Way (Vercel or Netlify)
This method is free and takes about 2 minutes.

### Prerequisites
1.  **GitHub Account**: You need to push your code to a GitHub repository.

### Steps
1.  **Push to GitHub**:
    *   Initialize git if you haven't: `git init`
    *   Add files: `git add .`
    *   Commit: `git commit -m "Initial commit"`
    *   Create a new repo on GitHub and push your code there.

2.  **Deploy on Vercel (Recommended)**:
    *   Go to [Vercel.com](https://vercel.com) and sign up/login.
    *   Click **"Add New..."** -> **"Project"**.
    *   Import your `omix-ai` repository from GitHub.
    *   **Build Settings**: Vercel usually detects Vite automatically.
        *   Framework Preset: `Vite`
        *   Build Command: `npm run build`
        *   Output Directory: `dist`
    *   **Environment Variables** (Crucial for Security):
        *   Instead of hardcoding API keys in `lib/models.ts`, you should use Environment Variables.
        *   In Vercel, go to **Settings > Environment Variables**.
        *   Add `VITE_GROQ_API_KEY` and `VITE_GEMINI_API_KEY` with your actual keys.
    *   Click **Deploy**.

## Option 2: Securing Your API Keys (Backend)
Currently, your API keys are inside the frontend code. This means a savvy user could find them in the browser's "Network" tab.

To fix this, you need a **Backend** (or Serverless Functions) to act as a middleman.

### Steps to Secure:
1.  **Use Vercel API Routes**:
    *   Create a folder `api/` in your project root.
    *   Create a file `api/chat.js`.
    *   Move the logic from `groqService.ts` and `geminiService.ts` to this backend function.
    *   Your frontend (`App.tsx`) will then call `/api/chat` instead of calling Groq/Gemini directly.

### Current Status
For now, you can deploy using **Option 1**. It will work perfectly fine. Just be aware that for a commercial product, you would want to move to Option 2 later.

## Checklist for Deployment
- [ ] Code pushed to GitHub
- [ ] Connected to Vercel/Netlify
- [ ] Build Command set to `npm run build`
- [ ] Output Directory set to `dist`
