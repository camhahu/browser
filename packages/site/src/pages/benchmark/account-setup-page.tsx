import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  buttonGhost,
  buttonPrimary,
  inputBase,
  labelClass,
  mutedClass,
  panelClass,
} from '../../components/layout'

export function AccountSetupPage() {
  const navigate = useNavigate()
  const codeInputRef = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberDevice, setRememberDevice] = useState(true)
  const [status, setStatus] = useState<'idle' | 'authorizing' | 'verifying'>(
    'idle',
  )
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [resentAt, setResentAt] = useState('')
  const [loginNote, setLoginNote] = useState('')

  useEffect(() => {
    if (showTwoFactor) {
      codeInputRef.current?.focus()
    }
  }, [showTwoFactor])

  const isAuthorizing = status === 'authorizing'
  const isVerifying = status === 'verifying'
  const canSubmit = email.length > 0 && password.length > 0

  const handleLoginSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoginNote('')
    setStatus('authorizing')
    window.setTimeout(() => {
      setStatus('idle')
      setShowTwoFactor(true)
      setResentAt('')
    }, 700)
  }

  const handleVerify = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (code.trim().length !== 6) {
      setCodeError('Enter the 6 digit code to continue.')
      return
    }
    setCodeError('')
    setStatus('verifying')
    window.setTimeout(() => {
      setStatus('idle')
      setShowTwoFactor(false)
      setLoginNote('Session established. Redirecting to settings...')
      navigate({ to: '/benchmark/account-setup/settings' })
    }, 900)
  }

  const handleResend = () => {
    setResentAt(
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    )
  }

  const handleCloseModal = () => {
    setShowTwoFactor(false)
    setCode('')
    setCodeError('')
  }

  return (
    <section className="grid gap-4 md:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <div className="space-y-4">
          <p className={labelClass}>Benchmark 1 · Account setup</p>
          <h1 className="font-semibold">Sign in to configure browser CLI</h1>
          <p className={mutedClass}>
            A simulated login with two-factor verification and async handoff into
            account settings. All responses are mocked locally for evaluation
            benchmarks.
          </p>
        </div>
        <div className="space-y-4">
          <div className="border-t border-zinc-900/20 pt-4">
            <p className="font-semibold">Challenge</p>
            <p className={mutedClass}>2FA prompt with focus capture.</p>
          </div>
          <div className="border-t border-zinc-900/20 pt-4">
            <p className="font-semibold">Latency</p>
            <p className={mutedClass}>700ms simulated auth handshake.</p>
          </div>
          <div className="border-t border-zinc-900/20 pt-4">
            <p className="font-semibold">Scope</p>
            <p className={mutedClass}>Email, password, and device settings.</p>
          </div>
        </div>
      </div>
      <div className={`${panelClass} space-y-4`}>
        <div className="space-y-4">
          <h2 className="font-semibold">Login</h2>
          <p className={mutedClass}>Use any credentials. Verification is mocked.</p>
        </div>
        <form className="space-y-4" onSubmit={handleLoginSubmit}>
          <label className="grid gap-4">
            <span className="font-semibold">Email</span>
            <input
              className={inputBase}
              type="email"
              name="email"
              autoComplete="username"
              placeholder="you@browsercli.dev"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-4">
            <span className="font-semibold">Password</span>
            <input
              className={inputBase}
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Enter any password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <label className="flex items-center gap-4 text-zinc-600">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(event) => setRememberDevice(event.target.checked)}
            />
            <span>Remember this device for 30 days.</span>
          </label>
          <button className={buttonPrimary} type="submit" disabled={!canSubmit}>
            {isAuthorizing ? 'Checking credentials...' : 'Continue'}
          </button>
          <p className={mutedClass}>{loginNote}</p>
        </form>
        <div className="space-y-4 border-t border-zinc-900/20 pt-4">
          <p className="font-semibold">No network calls</p>
          <p className={mutedClass}>
            Every response and session token is generated in-memory for
            benchmarking.
          </p>
          <button className={buttonGhost} type="button">
            Use passkey
          </button>
        </div>
      </div>
      {showTwoFactor ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div
            className="relative w-full max-w-md border border-zinc-900/20 bg-white p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="twofa-title"
          >
            <button
              className="absolute right-4 top-4 h-8 w-8 border border-zinc-900/20 bg-white"
              type="button"
              onClick={handleCloseModal}
              aria-label="Close"
            >
              ×
            </button>
            <div className="space-y-4">
              <h2 id="twofa-title" className="font-semibold">
                Two-factor challenge
              </h2>
              <p className={mutedClass}>
                Enter the six-digit code from your authenticator app. The modal
                captures focus for keyboard navigation tests.
              </p>
            </div>
            <form className="space-y-4" onSubmit={handleVerify}>
              <label className="grid gap-4">
                <span className="font-semibold">Authentication code</span>
                <input
                  ref={codeInputRef}
                  className={`${inputBase}${codeError ? ' border-red-600' : ''}`}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="123456"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  required
                />
                {codeError ? (
                  <span className="text-red-700">{codeError}</span>
                ) : null}
              </label>
              <div className="flex flex-wrap gap-4">
                <button className={buttonGhost} type="button" onClick={handleResend}>
                  Resend code
                </button>
                <button className={buttonPrimary} type="submit">
                  {isVerifying ? 'Verifying...' : 'Verify & continue'}
                </button>
              </div>
              {resentAt ? (
                <p className={mutedClass}>Code resent at {resentAt}.</p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}
