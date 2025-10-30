const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_me';

app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'data.json');

function loadDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = { users: [], polls: [], votes: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('failed to load db', err);
    return { users: [], polls: [], votes: [] };
  }
}

function saveDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function nextId(items) {
  if (!items || items.length === 0) return 1;
  return Math.max(...items.map(i => i.id || 0)) + 1;
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const match = auth.match(/^Bearer (.+)$/i);
  if (!match) return res.status(401).json({ error: 'missing token' });
  const token = match[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const db = loadDb();
    const user = db.users.find(u => u.username === payload.username);
    if (!user) return res.status(401).json({ error: 'invalid token user' });
    req.user = { id: user.id, username: user.username };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid token' });
  }
}

app.get('/', (req, res) => {
  res.send('PollApp Server - json-file persistence');
});

// Register
app.post('/api/register', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const db = loadDb();
  const existing = db.users.find(u => u.username === username);
  if (existing) return res.status(409).json({ error: 'user already exists' });
  const passwordHash = bcrypt.hashSync(password, 8);
  const id = nextId(db.users);
  db.users.push({ id, username, passwordHash });
  saveDb(db);
  return res.status(201).json({ message: 'user registered' });
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const db = loadDb();
  const user = db.users.find(u => u.username === username);
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '8h' });
  return res.json({ token });
});

app.get('/api/profile', authMiddleware, (req, res) => {
  return res.json({ username: req.user.username });
});

// Create poll
app.post('/api/polls', authMiddleware, (req, res) => {
  const { title, description, options } = req.body || {};
  if (!title || !Array.isArray(options) || options.length < 2) return res.status(400).json({ error: 'title and at least two options required' });
  const db = loadDb();
  const pid = nextId(db.polls);
  const pollOptions = options.map((t, idx) => ({ id: idx + 1, text: t }));
  db.polls.push({ id: pid, owner_id: req.user.id, title, description: description || '', created_at: Date.now(), options: pollOptions });
  saveDb(db);
  return res.status(201).json({ id: pid });
});

// List polls
app.get('/api/polls', authMiddleware, (req, res) => {
  const db = loadDb();
  const out = db.polls.slice().sort((a, b) => b.created_at - a.created_at).map(p => ({ id: p.id, title: p.title, description: p.description, created_at: p.created_at, owner: (db.users.find(u => u.id === p.owner_id) || {}).username || 'unknown' }));
  return res.json(out);
});

// Poll details
app.get('/api/polls/:id', authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const db = loadDb();
  const poll = db.polls.find(p => p.id === id);
  if (!poll) return res.status(404).json({ error: 'poll not found' });
  const options = poll.options.map(o => ({ id: o.id, text: o.text, votes: db.votes.filter(v => v.option_id === o.id && v.poll_id === id).length }));
  const voted = db.votes.find(v => v.poll_id === id && v.user_id === req.user.id);
  const owner = (db.users.find(u => u.id === poll.owner_id) || {}).username || 'unknown';
  return res.json({ id: poll.id, title: poll.title, description: poll.description, created_at: poll.created_at, owner, options, voted: !!voted, votedOptionId: voted ? voted.option_id : null });
});

// Vote
app.post('/api/polls/:id/vote', authMiddleware, (req, res) => {
  const pollId = Number(req.params.id);
  const { optionId } = req.body || {};
  if (!optionId) return res.status(400).json({ error: 'optionId required' });
  const db = loadDb();
  const poll = db.polls.find(p => p.id === pollId);
  if (!poll) return res.status(404).json({ error: 'poll not found' });
  const option = poll.options.find(o => o.id === optionId);
  if (!option) return res.status(400).json({ error: 'invalid option' });

  // enforce one vote per user per poll at backend level
  const existing = db.votes.find(v => v.poll_id === pollId && v.user_id === req.user.id);
  if (existing) return res.status(409).json({ error: 'user already voted' });

  const vid = nextId(db.votes);
  db.votes.push({ id: vid, poll_id: pollId, option_id: optionId, user_id: req.user.id, created_at: Date.now() });
  saveDb(db);

  const options = poll.options.map(o => ({ id: o.id, text: o.text, votes: db.votes.filter(v => v.option_id === o.id && v.poll_id === pollId).length }));
  return res.json({ success: true, options });
});

// Update poll (only owner) - allow edits only if no votes
app.put('/api/polls/:id', authMiddleware, (req, res) => {
  const pollId = Number(req.params.id);
  const { title, description } = req.body || {};
  const db = loadDb();
  const poll = db.polls.find(p => p.id === pollId);
  if (!poll) return res.status(404).json({ error: 'poll not found' });
  if (poll.owner_id !== req.user.id) return res.status(403).json({ error: 'not authorized' });
  const voteExists = db.votes.find(v => v.poll_id === pollId);
  if (voteExists) return res.status(400).json({ error: 'cannot edit poll after votes have been cast' });
  poll.title = title || poll.title;
  poll.description = description || poll.description;
  saveDb(db);
  return res.json({ success: true });
});

// Delete poll (owner only)
app.delete('/api/polls/:id', authMiddleware, (req, res) => {
  const pollId = Number(req.params.id);
  const db = loadDb();
  const idx = db.polls.findIndex(p => p.id === pollId);
  if (idx === -1) return res.status(404).json({ error: 'poll not found' });
  const poll = db.polls[idx];
  if (poll.owner_id !== req.user.id) return res.status(403).json({ error: 'not authorized' });
  db.polls.splice(idx, 1);
  // remove votes
  db.votes = db.votes.filter(v => v.poll_id !== pollId);
  saveDb(db);
  return res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
