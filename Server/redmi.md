# PollApp - Server

Simple Node/Express server used by the PollApp client. It stores data in `data.json` (file-based persistence) and exposes a small JSON API for authentication and poll management.

## What this does
- Registers and logs in users (JWT-based auth).
- Lets authenticated users create polls (with at least two options).
- Lets users list polls, view poll details, and vote (one vote per user per poll).
- Persists data to `data.json` in the `Server` folder.

## Prerequisites
- Node.js (v14+ recommended)
- npm (comes with Node)

## Quick start (PowerShell)
Open a PowerShell prompt inside the `Server` folder and run:

```powershell
cd Server
npm install
npm start
```

If you want to set a custom port or JWT secret (recommended for production):

```powershell
$env:PORT = 4000; $env:JWT_SECRET = 'a_strong_secret_here'; npm start
```

The server defaults to port 3000. You should see:

Server is running at http://localhost:3000

## API Overview
All endpoints under `/api` expect and return JSON. Endpoints that modify or return user-specific data require a Bearer token in the `Authorization` header (JWT returned by `/api/login`).

Base URL (local): http://localhost:3000

### Public (no auth)
- GET `/` — landing message
- POST `/api/register` — register new user
  - Body: { "username": "alice", "password": "secret" }
  - Returns 201 on success
- POST `/api/login` — login
  - Body: { "username": "alice", "password": "secret" }
  - Returns: { "token": "..." }

Example (PowerShell using Invoke-RestMethod):

```powershell
# register
a = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/register -Body (@{ username='alice'; password='secret' } | ConvertTo-Json) -ContentType 'application/json'

# login
$login = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/login -Body (@{ username='alice'; password='secret' } | ConvertTo-Json) -ContentType 'application/json'
$token = $login.token
```

### Authenticated endpoints (require `Authorization: Bearer <token>`)
- GET `/api/profile` — returns `{ username }`
- POST `/api/polls` — create poll
  - Body: { "title": "Favorite color?", "description": "Pick one", "options": ["Red", "Blue"] }
  - Returns: { id: 1 }
- GET `/api/polls` — list polls (summary)
- GET `/api/polls/:id` — poll details (options include vote counts)
- POST `/api/polls/:id/vote` — vote
  - Body: { "optionId": 1 }
  - Enforces one vote per user per poll; returns updated option counts on success
- PUT `/api/polls/:id` — update poll (owner only, only allowed if no votes cast)
- DELETE `/api/polls/:id` — delete poll (owner only)

Example: create poll and vote (PowerShell)

```powershell
$headers = @{ Authorization = "Bearer $token" }
# create poll
$create = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/polls -Headers $headers -Body (@{ title='Fav pet'; description='Pick one'; options=@('Dog','Cat') } | ConvertTo-Json) -ContentType 'application/json'
$pollId = $create.id

# vote
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/polls/$pollId/vote" -Headers $headers -Body (@{ optionId = 1 } | ConvertTo-Json) -ContentType 'application/json'
```

## Data file
`data.json` is created/updated automatically in the `Server` folder. It contains three arrays: `users`, `polls`, and `votes`.

- `users` stores `{ id, username, passwordHash }`
- `polls` stores `{ id, owner_id, title, description, created_at, options }`
- `votes` stores `{ id, poll_id, option_id, user_id, created_at }`

Do NOT store this file in a public repo with real user data.

## Security notes
- The default JWT secret is `dev_secret_key_change_me` (used when `JWT_SECRET` env var is not set). Change this in real deployments.
- Passwords are stored hashed using bcrypt.

## Troubleshooting
- If the server fails to start due to a missing dependency, re-run `npm install`.
- If you change the `JWT_SECRET`, existing tokens become invalid.

## License & contacts
This is a small demo server. Adapt and reuse as you need. If you want help improving or deploying it, tell me what you want next.
