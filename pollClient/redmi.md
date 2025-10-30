# PollApp - Client

This is the client application for PollApp. It's a small React app built with Vite.

## What this does
- Provides UI for login/register, listing polls, viewing poll details, creating polls, and voting.
- Talks to the PollApp server API (see `../Server/readme.md`).

## Prerequisites
- Node.js (v14+ recommended)
- npm (comes with Node)

## Quick start (PowerShell)
Open PowerShell in the project root and run:

```powershell
cd pollClient
npm install
npm run dev
```

This starts the Vite dev server (by default on http://localhost:5173). Visit that URL in your browser.

## Build for production

```powershell
cd pollClient
npm run build
# preview the production build locally
npm run preview
```

## Scripts (from `package.json`)
- `npm run dev` — start Vite dev server
- `npm run build` — build production assets
- `npm run preview` — preview production build locally
- `npm run lint` — run ESLint

## Connecting the client to the server
By default the client expects the API at `http://localhost:3000` (the server's default). If your server runs at a different address, set the environment variable `VITE_API_BASE` before starting the dev server and the client will pick it up (the app reads `import.meta.env.VITE_API_BASE`). Example:

```powershell
# run server on port 3000 (Server folder)
cd ..\Server
npm install
npm start

# in a new terminal, start client with custom API base if needed
cd ..\pollClient
$env:VITE_API_BASE = 'http://localhost:3000'
npm run dev
```

If `VITE_API_BASE` is not set, the client will use the default hardcoded base (check `src` for `import.meta.env.VITE_API_BASE` usage).

## Testing the client quickly
1. Start the server (see `Server/README.md`).
2. Start the client (`npm run dev`).
3. Register a user at the client UI or using the API.
4. Login and create a poll, then vote.

## Notes & troubleshooting
- Vite hot reload should refresh the app on file changes.
- If you see CORS errors, ensure the server is running and has CORS enabled (it does by default in `Server/server.js`).
- If you change the server address, restart the dev server after updating `VITE_API_BASE`.

## Next improvements (Ideas)
- Add `concurrently` or a simple script to start both client and server together.
- Add a `.env.example` showing `VITE_API_BASE`.
- Add basic end-to-end tests with Playwright or Cypress.

If you'd like, I can add a `.env.example`, a start-all script, or wire up a quick `start:dev` that runs server and client together. Which would you prefer?