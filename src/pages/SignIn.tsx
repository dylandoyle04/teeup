import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { hasBackend } from '../supabase'
import { useAuth, sendMagicLink, verifyCode, signOut } from '../auth'

export default function SignIn() {
  const navigate = useNavigate()
  const { ready, user } = useAuth()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!hasBackend) {
    return (
      <div className="auth-wrap">
        <div className="card empty">
          <div className="big">⛳</div>
          <p>Accounts aren't turned on yet — you're using Flagstick Finder in guest mode.</p>
          <Link to="/explore" className="btn full gold" style={{ marginTop: 10 }}>
            Continue as guest →
          </Link>
        </div>
      </div>
    )
  }

  // already signed in → account view
  if (ready && user) {
    return (
      <div className="auth-wrap">
        <h1 className="page-title" style={{ textAlign: 'center' }}>
          Your account
        </h1>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ margin: '4px 0 14px' }}>
            Signed in as <strong>{user.email}</strong>
          </p>
          <Link to="/explore" className="btn full gold">
            Go to my trips →
          </Link>
          <button
            className="btn ghost full"
            style={{ marginTop: 10 }}
            onClick={async () => {
              await signOut()
              navigate('/')
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || busy) return
    setBusy(true)
    setError(null)
    const { error } = await sendMagicLink(email)
    setBusy(false)
    if (error) setError(error)
    else setSent(true)
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault()
    if (code.trim().length < 6 || busy) return
    setBusy(true)
    setError(null)
    const { error } = await verifyCode(email, code)
    setBusy(false)
    if (error) setError(error)
    else navigate('/explore') // onAuthStateChange sets the session
  }

  return (
    <div className="auth-wrap">
      <h1 className="page-title" style={{ textAlign: 'center' }}>
        Sign in
      </h1>
      <p className="page-sub" style={{ textAlign: 'center' }}>
        Sign in to create trips friends can join and keep score together.
      </p>

      {sent ? (
        <form className="card" onSubmit={submitCode}>
          <div className="big" style={{ textAlign: 'center' }}>
            📧
          </div>
          <p style={{ margin: '4px 0 14px', textAlign: 'center' }}>
            We emailed <strong>{email}</strong> a 6-digit code. Enter it below.
          </p>
          <div className="field">
            <label>6-digit code</label>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              autoFocus
              style={{ letterSpacing: '4px', fontSize: '18px', textAlign: 'center' }}
            />
          </div>
          {error && (
            <p className="hint" style={{ color: '#b3261e', margin: '0 4px 8px' }}>
              {error}
            </p>
          )}
          <button className="btn full gold" disabled={busy || code.length < 6}>
            {busy ? 'Verifying…' : 'Verify & sign in'}
          </button>
          <p className="hint" style={{ textAlign: 'center', marginTop: 10 }}>
            The email also has a tap-to-sign-in link.{' '}
            <button
              type="button"
              className="linklike"
              onClick={() => {
                setSent(false)
                setCode('')
                setError(null)
              }}
            >
              Use a different email
            </button>
          </p>
        </form>
      ) : (
        <form className="card" onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoFocus
            />
          </div>
          {error && (
            <p className="hint" style={{ color: '#b3261e', margin: '0 4px 8px' }}>
              {error}
            </p>
          )}
          <button className="btn full gold" disabled={busy || !email.trim()}>
            {busy ? 'Sending…' : 'Email me a magic link'}
          </button>
          <p className="hint" style={{ textAlign: 'center', marginTop: 10 }}>
            No password needed. Or{' '}
            <Link to="/explore">keep using guest mode</Link>.
          </p>
        </form>
      )}
    </div>
  )
}
