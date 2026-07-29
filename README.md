# AI Notion Task Manager

A mobile-friendly web app for adding, editing, and deleting entries in a Notion database. Built on Vercel serverless functions that proxy CRUD requests to the Notion API, with a PIN-gated single-page frontend.

## Features

- Add / edit / delete tasks (name, status, start & end date)
- Reads and writes directly to a Notion database (`ClaudeDBs` / `CTaskTBL`)
- PIN-protected access
- Light/dark theme toggle
- Responsive layout for phone and desktop

## Tech stack

- Node.js serverless function (`api/tasks.js`) calling the Notion REST API
- Vanilla HTML/CSS/JS frontend (`index.html`), no build step
- Deployed on Vercel

## Setup

1. Create a Notion integration and share your task database with it.
2. Copy `.env.example` to `.env.local` and fill in:
   - `NOTION_TOKEN` — Notion integration secret
   - `NOTION_DATABASE_ID` — target database ID
   - `APP_PIN` — access PIN for the app
3. Run locally: `node dev-server.js` and open `http://localhost:3000`.
4. Deploy: `vercel --prod` (set the same env vars in the Vercel project settings).
