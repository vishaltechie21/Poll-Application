import { useEffect, useState } from 'react'
import './App.css'
import Login from './components/Login'

function App() {
  const [user, setUser] = useState(null)
  const [polls, setPolls] = useState([])
  const [selectedPoll, setSelectedPoll] = useState(null)
  const [loading, setLoading] = useState(false)

  // Fetch user profile to check if logged in or not
  async function fetchProfile() {
    const token = localStorage.getItem('token')
    if (!token) { setUser(null); return }
    try {
      const res = await fetch('http://localhost:3000/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('unauthenticated')
      const data = await res.json()
      setUser(data.username)
    } catch (err) {
      console.warn('profile fetch failed', err)
      localStorage.removeItem('token')
      setUser(null)
    }
  }

  async function fetchPolls() {
    const token = localStorage.getItem('token')
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch('http://localhost:3000/api/polls', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('failed to load')
      const data = await res.json()
      setPolls(data)
    } catch (err) {
      console.error(err)
    } finally { setLoading(false) }
  }

  useEffect(() => {
    (async () => {
      await fetchProfile()
    })()
  }, [])

  useEffect(() => {
    if (user) fetchPolls()
  }, [user])

  function handleLogout() {
    localStorage.removeItem('token')
    setUser(null)
    setPolls([])
    setSelectedPoll(null)
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Poll Application</h1>
      {user ? (
        <div>
          <p>Welcome, <strong>{user}</strong></p>
          <button onClick={handleLogout}>Logout</button>

          <div style={{ display: 'flex', gap: 24, marginTop: 20 }}>
            <div style={{ flex: 1 }}>
              <h3>Recent Polls</h3>
              {loading && <div>Loading...</div>}
              {!loading && polls.length === 0 && <div>No polls yet.</div>}
              <ul>
                {polls.map(p => (
                  <li key={p.id} style={{ marginBottom: 8 }}>
                    <strong>{p.title}</strong> — <em>by {p.owner}</em>
                    <div><button onClick={async () => {
                      const token = localStorage.getItem('token')
                      const res = await fetch(`http://localhost:3000/api/polls/${p.id}`, { headers: { Authorization: `Bearer ${token}` } })
                      if (res.ok) {
                        const data = await res.json()
                        setSelectedPoll(data)
                      }
                    }}>View</button></div>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ width: 420 }}>
              <h3>Create Poll</h3>
              <CreatePoll onCreated={() => fetchPolls()} />

              <hr />

              {selectedPoll && (
                <PollDetail
                  poll={selectedPoll}
                  user={user}
                  onClose={() => setSelectedPoll(null)}
                  onVoted={() => {
                    // refresh poll details
                    const token = localStorage.getItem('token')
                    fetch(`http://localhost:3000/api/polls/${selectedPoll.id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => setSelectedPoll(d))
                  }}
                  onDeleted={() => { setSelectedPoll(null); fetchPolls(); }}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        <Login onLogin={async () => { await fetchProfile(); }} />
      )}
    </div>
  )
}

function CreatePoll({ onCreated }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function setOptionAt(i, v) {
    const copy = [...options]; copy[i] = v; setOptions(copy)
  }
  function addOption() { setOptions(prev => [...prev, '']) }

  async function handleCreate() {
    setError(null)
    const filtered = options.map(o => o.trim()).filter(Boolean)
    if (!title.trim() || filtered.length < 2) { setError('title and at least two options required'); return }
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:3000/api/polls', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), options: filtered })
      })
      if (!res.ok) {
        const data = await res.json(); throw new Error(data.error || 'create failed')
      }
      setTitle(''); setDescription(''); setOptions(['', ''])
      onCreated && onCreated()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div><input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} /></div>
      <div><input placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} /></div>
      <div style={{ marginTop: 8 }}>
        <strong>Options</strong>
        {options.map((opt, i) => (
          <div key={i}><input placeholder={`Option ${i+1}`} value={opt} onChange={e => setOptionAt(i, e.target.value)} /></div>
        ))}
        <div style={{ marginTop: 8 }}><button onClick={addOption}>Add option</button></div>
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={handleCreate} disabled={loading}>Create Poll</button>
        {error && <div style={{ color: 'red' }}>{error}</div>}
      </div>
    </div>
  )
}

function PollDetail({ poll, onClose, onVoted, user, onDeleted }) {
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [title, setTitle] = useState(poll.title)
  const [description, setDescription] = useState(poll.description || '')

  // keep local edit fields in sync when poll prop changes
  useEffect(() => {
    setTitle(poll.title)
    setDescription(poll.description || '')
  }, [poll])

  const isOwner = user && poll && user === poll.owner
  const hasVotes = Array.isArray(poll.options) && poll.options.some(o => (o.votes || 0) > 0)

  async function handleVote() {
    setError(null); setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:3000/api/polls/${poll.id}/vote`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ optionId: selected }) })
      if (!res.ok) {
        const data = await res.json(); throw new Error(data.error || 'vote failed')
      }
      const data = await res.json()
      if (data.options) {
        poll.options = data.options
      }
      onVoted && onVoted()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function handleSaveEdit() {
    setError(null); setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:3000/api/polls/${poll.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ title: title.trim(), description: description.trim() }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'update failed')
      setEditMode(false)
      onVoted && onVoted()
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  async function handleDelete() {
    setError(null); setLoading(true)
    try {
      if (!window.confirm('Delete this poll? This cannot be undone.')) { setLoading(false); return }
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:3000/api/polls/${poll.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'delete failed')
      onDeleted && onDeleted()
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ marginTop: 12, border: '1px solid #ddd', padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0 }}>{poll.title}</h4>
        <div>
          {isOwner && !editMode && (
            <>
              <button onClick={() => setEditMode(true)} disabled={hasVotes} style={{ marginRight: 8 }}>Edit</button>
              <button onClick={handleDelete} disabled={loading}>Delete</button>
            </>
          )}
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={{ fontStyle: 'italic' }}>by {poll.owner}</div>
        {editMode ? (
          <div style={{ marginTop: 8 }}>
            <div><input value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%' }} /></div>
            <div style={{ marginTop: 8 }}><input value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%' }} /></div>
            <div style={{ marginTop: 8 }}>
              <button onClick={handleSaveEdit} disabled={loading}>Save</button>
              <button onClick={() => { setEditMode(false); setError(null); }} style={{ marginLeft: 8 }}>Cancel</button>
              {hasVotes && <div style={{ color: 'red', marginTop: 6 }}>Cannot edit poll after votes have been cast.</div>}
              {error && <div style={{ color: 'red', marginTop: 6 }}>{error}</div>}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 8 }}>{poll.description}</div>
        )}
      </div>

      <div style={{ marginTop: 8 }}>
        {poll.voted ? (
          <div>
            <strong>Results</strong>
            <ul>
              {poll.options.map(o => <li key={o.id}>{o.text} — {o.votes}</li>)}
            </ul>
          </div>
        ) : (
          <div>
            <strong>Vote</strong>
            <div>
              {poll.options.map(o => (
                <div key={o.id}><label><input type="radio" name="opt" value={o.id} onChange={() => setSelected(o.id)} /> {o.text}</label></div>
              ))}
            </div>
            <div style={{ marginTop: 8 }}>
              <button onClick={handleVote} disabled={!selected || loading}>Vote</button>
              {error && <div style={{ color: 'red' }}>{error}</div>}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 8 }}>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

export default App
