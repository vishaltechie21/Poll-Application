# Poll Application

A small polling app with a React + Vite frontend and an Express backend that persists data to a JSON file.

## Tech stack

- Client (folder `pollClient`):
	- React (react, react-dom) — UI
	- Vite — dev server, build tool
	- ESLint — linting
	- Language: JavaScript (ESM)

- Server (folder `Server`):
	- Node.js + Express — HTTP API
	- CORS — cross-origin resource sharing
	- bcryptjs — password hashing
	- jsonwebtoken — JWT-based auth
	- Persistence: simple JSON file (`Server/data.json`)

- Tooling:
	- npm for package management
	- Recommended Node.js: 18+ (recent LTS)

## How to run (Windows PowerShell)

1. Install Node.js (recommended v18 or newer) and ensure `npm` is available in your PATH.

2. Start the backend server:

```powershell
cd Server
npm install
npm start
```

The server listens on port 3000 by default (or $env:PORT if you set it). After starting you'll see a message like:

```
Server is running at http://localhost:3000
```

3. Start the frontend (development) server:

```powershell
cd ..\pollClient
npm install
npm run dev
```

Vite usually serves the client at http://localhost:5173 (check the console output from `npm run dev`).

4. Build and preview the frontend (optional):

```powershell
cd pollClient
npm run build
npm run preview
```

## Available scripts (quick reference)

- Server (`Server/package.json`):
	- `npm start` — runs `node server.js` (starts the API server)

- Client (`pollClient/package.json`):
	- `npm run dev` — start Vite dev server
	- `npm run build` — build production assets
	- `npm run preview` — preview built production assets
	- `npm run lint` — run ESLint

## Notes

- The server stores data in `Server/data.json` (created automatically on first run). This is a simple, file-based persistence layer intended for development/demo purposes only.
- There is a default JWT secret used when `JWT_SECRET` is not set — for production change `JWT_SECRET` via environment variables.
- If you want to run the client and server concurrently, open two PowerShell windows or use a process manager to run them in parallel.

If you'd like, I can also add a script at the repo root to start both (for example using `concurrently`) or add a short CONTRIBUTING section.
