import { useState } from 'react'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function callEndpoint(path) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`http://localhost:3000/api/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'request failed')

      // If user Logged in , store the token in the browser's local storage
      if (data.token) {
        localStorage.setItem('token', data.token)
        onLogin && onLogin()
        console.log(data.token);
        
      } else {
        // Show the success message for the registration 
        setError(data.message || 'success')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 360 , display:"flex", justifyContent: 'center', flexDirection:'column' }}>
      <h2>Login / Register</h2>
      <div style={{ marginBottom: 8  }}>
        <input style={{outline: 'none' , border: '1px solid #ccc', padding: 8}} placeholder="username" value={username} onChange={e => setUsername(e.target.value)} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <input style={{outline: 'none' , border: '1px solid #ccc', padding: 8}} type="password" placeholder="password" value={password} onChange={e => setPassword(e.target.value)} />
      </div>
      <div style={{ display: 'block', gap: 8 , hover:{cursor: 'pointer'}}}>
        <button onClick={() => callEndpoint('login')} disabled={loading}>Login</button>
        <button onClick={() => callEndpoint('register')} disabled={loading}>Register</button>
      </div>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </div>
  )
}
