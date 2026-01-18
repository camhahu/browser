import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
  useNavigate,
} from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'

type ProfileForm = {
  fullName: string
  displayName: string
  email: string
  role: string
  timezone: string
  bio: string
}

type Preferences = {
  weeklyDigest: boolean
  productUpdates: boolean
  securityAlerts: boolean
  sessionLock: boolean
}

type PreferenceKey = keyof Preferences

type ProfileField = keyof ProfileForm

type ProfileErrors = Partial<Record<ProfileField, string>>

type SaveState = 'idle' | 'saving' | 'saved'

type TestSlug =
  | 'page'
  | 'browser'
  | 'viewport'
  | 'cookies'
  | 'tabs'
  | 'useragent'
  | 'screenshot'
  | 'storage'
  | 'network'
  | 'content'
  | 'navigation'
  | 'config'

type TestPage = {
  slug: TestSlug
  title: string
  description: string
}

const roles = [
  'Product Engineer',
  'Platform Engineer',
  'Developer Experience',
  'Security Engineer',
]

const timezones = [
  'America/Los_Angeles',
  'America/New_York',
  'Europe/London',
  'Asia/Singapore',
]

const preferenceOptions: Array<{
  key: PreferenceKey
  label: string
  description: string
}> = [
  {
    key: 'weeklyDigest',
    label: 'Weekly digest',
    description: 'Summary of changes every Tuesday at 9am.',
  },
  {
    key: 'productUpdates',
    label: 'Product updates',
    description: 'Releases, beta features, and roadmap notes.',
  },
  {
    key: 'securityAlerts',
    label: 'Security alerts',
    description: 'Login anomalies and admin policy changes.',
  },
  {
    key: 'sessionLock',
    label: 'Session lock',
    description: 'Require re-auth after 15 minutes of idle.',
  },
]

const securitySignals = [
  {
    title: '2FA coverage',
    value: 'Enabled',
    detail: 'Authenticator + SMS fallback in sandbox.',
  },
  {
    title: 'Device trust',
    value: '3 devices',
    detail: 'Last verified 2 hours ago.',
  },
  {
    title: 'Policy status',
    value: 'Compliant',
    detail: 'No open policy exceptions.',
  },
]

const initialProfile: ProfileForm = {
  fullName: 'Avery Ellis',
  displayName: 'avery.ellis',
  email: 'avery@browsercli.dev',
  role: roles[0],
  timezone: timezones[0],
  bio: 'Shipping developer tooling and onboarding the next cohort of builders.',
}

const testPages: TestPage[] = [
  {
    slug: 'page',
    title: 'Page commands',
    description: 'Find, click, scroll, and selection coverage.',
  },
  {
    slug: 'browser',
    title: 'Browser lifecycle',
    description: 'Start/stop and version verification page.',
  },
  {
    slug: 'viewport',
    title: 'Viewport controls',
    description: 'Device presets and custom dimensions.',
  },
  {
    slug: 'cookies',
    title: 'Cookies storage',
    description: 'Set, read, and delete cookie state.',
  },
  {
    slug: 'tabs',
    title: 'Tab management',
    description: 'Open, switch, and close tabs.',
  },
  {
    slug: 'useragent',
    title: 'User agent presets',
    description: 'Preview user agent overrides.',
  },
  {
    slug: 'screenshot',
    title: 'Screenshot captures',
    description: 'Static capture targets for image tests.',
  },
  {
    slug: 'storage',
    title: 'Local storage',
    description: 'Set, read, and delete storage values.',
  },
  {
    slug: 'network',
    title: 'Network logging',
    description: 'Mock network visibility for CLI checks.',
  },
  {
    slug: 'content',
    title: 'Content inspection',
    description: 'Text, HTML, and outline output.',
  },
  {
    slug: 'navigation',
    title: 'Navigation history',
    description: 'Navigate, back, forward, refresh.',
  },
  {
    slug: 'config',
    title: 'Configuration',
    description: 'Default settings reference page.',
  },
]

const containerClass = 'mx-auto w-full max-w-4xl'
const sectionClass = `${containerClass} p-4`
const panelClass = 'border border-zinc-900/20 p-4'
const labelClass = 'text-zinc-600'
const mutedClass = 'text-zinc-600'
const buttonBase = 'border border-zinc-900/30 px-3 py-2'
const buttonPrimary = `${buttonBase} bg-zinc-900 text-zinc-50`
const buttonGhost = `${buttonBase} bg-transparent`
const inputBase =
  'w-full border border-zinc-900/30 bg-white px-3 py-2 text-zinc-900 outline outline-2 outline-transparent focus:outline-zinc-900'

function RootLayout() {
  return (
    <div className="min-h-screen text-zinc-900">
      <Outlet />
    </div>
  )
}

function HomePage() {
  return (
    <section className={`${sectionClass} space-y-4`}>
      <div className="space-y-4">
        <p className={labelClass}>browser CLI</p>
        <h1 className="font-semibold">Developer benchmark playground</h1>
        <p className={mutedClass}>
          Local pages that mirror common developer workflows for evaluation
          benchmarks.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link to="/benchmark/1" className={buttonPrimary}>
            Benchmark 1
          </Link>
          <Link to="/test" className={buttonGhost}>
            Test pages
          </Link>
        </div>
      </div>
      <div className="space-y-4">
        <div className="border-t border-zinc-900/20 pt-4">
          <p className="font-semibold">Benchmark 1 · Account setup</p>
          <p className={mutedClass}>
            Login, 2FA, profile, preferences, and async saves.
          </p>
        </div>
        <div className="border-t border-zinc-900/20 pt-4">
          <p className="font-semibold">Test pages</p>
          <p className={mutedClass}>
            One route per test file to anchor CLI command coverage.
          </p>
        </div>
        <div className="border-t border-zinc-900/20 pt-4">
          <p className="font-semibold">Offline by design</p>
          <p className={mutedClass}>
            No external network calls. All latency is mocked.
          </p>
        </div>
      </div>
    </section>
  )
}

function BenchmarkLayout() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-900/20">
        <div className={`${containerClass} space-y-4 px-4 py-4`}>
          <div className="flex flex-wrap items-baseline gap-4">
            <span className="font-semibold">browser CLI</span>
            <span className={mutedClass}>Benchmark suite</span>
          </div>
          <nav className="flex flex-wrap gap-4" aria-label="Primary">
            <Link
              to="/benchmark/1"
              className="data-[active=true]:underline"
              activeProps={{ 'data-active': 'true' }}
            >
              Benchmark 1
            </Link>
            <Link
              to="/benchmark/1/settings"
              className="data-[active=true]:underline"
              activeProps={{ 'data-active': 'true' }}
            >
              Settings
            </Link>
            <Link to="/test">Test pages</Link>
          </nav>
          <span className={labelClass}>Mock network</span>
        </div>
      </header>
      <main className={sectionClass}>
        <Outlet />
      </main>
      <footer className={`${containerClass} px-4 p-4 text-zinc-600`}>
        All data and latency are simulated locally.
      </footer>
    </div>
  )
}

function LoginPage() {
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
      navigate({ to: '/benchmark/1/settings' })
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

function SettingsPage() {
  const [profile, setProfile] = useState<ProfileForm>(initialProfile)
  const [preferences, setPreferences] = useState<Preferences>({
    weeklyDigest: true,
    productUpdates: true,
    securityAlerts: true,
    sessionLock: false,
  })
  const [touched, setTouched] = useState<Partial<Record<ProfileField, boolean>>>(
    {},
  )
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [savedAt, setSavedAt] = useState('Not saved yet')
  const [formNotice, setFormNotice] = useState('')

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview('')
      return
    }
    const objectUrl = URL.createObjectURL(avatarFile)
    setAvatarPreview(objectUrl)
    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [avatarFile])

  const errors = useMemo(() => getProfileErrors(profile), [profile])

  const handleProfileChange = (field: ProfileField, value: string) => {
    setProfile((previous) => ({ ...previous, [field]: value }))
  }

  const handleToggle = (key: PreferenceKey) => {
    setPreferences((previous) => ({ ...previous, [key]: !previous[key] }))
  }

  const markTouched = (field: ProfileField) => {
    setTouched((previous) => ({ ...previous, [field]: true }))
  }

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormNotice('')
    setTouched({
      fullName: true,
      displayName: true,
      email: true,
      role: true,
      timezone: true,
      bio: true,
    })

    if (Object.keys(errors).length > 0) {
      setFormNotice('Fix the highlighted fields before saving.')
      return
    }

    setSaveState('saving')
    window.setTimeout(() => {
      setSaveState('saved')
      setSavedAt(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      )
    }, 900)
  }

  let saveMessage = 'Ready to save'
  if (saveState === 'saving') {
    saveMessage = 'Saving profile...'
  }
  if (saveState === 'saved') {
    saveMessage = `Saved at ${savedAt}`
  }

  const initials = profile.fullName
    .split(' ')
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <section className="space-y-4">
      <div className="space-y-4">
        <p className={labelClass}>Benchmark 1 · Account setup</p>
        <h1 className="font-semibold">Profile & security settings</h1>
        <p className={mutedClass}>
          Complete the profile, update security preferences, and simulate an
          async save cycle with client-side validation.
        </p>
        <div className="border-t border-zinc-900/20 pt-4">
          <p className="font-semibold">Environment</p>
          <p className={mutedClass}>Sandbox · latency target 450ms.</p>
        </div>
        <div className="border-t border-zinc-900/20 pt-4">
          <p className="font-semibold">Sync status</p>
          <p className={mutedClass}>{saveState === 'saving' ? 'Syncing' : 'Idle'}</p>
          <p className={mutedClass}>{savedAt}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <div className={panelClass}>
            <div className="space-y-4">
              <h2 className="font-semibold">Profile details</h2>
              <p className={mutedClass}>Required fields validate on save and blur.</p>
            </div>
            <form className="space-y-4" onSubmit={handleSave}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex h-20 w-20 items-center justify-center border border-zinc-900/20 font-semibold">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <div className="space-y-4">
                    <p className="font-semibold">Avatar upload</p>
                    <p className={mutedClass}>
                      PNG or JPG up to 2MB. Preview is local only.
                    </p>
                    <label className="relative inline-flex items-center gap-4 border border-zinc-900/20 px-4 py-4">
                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        className="absolute inset-0 cursor-pointer opacity-0"
                        onChange={(event) =>
                          setAvatarFile(event.target.files?.[0] ?? null)
                        }
                      />
                      <span>Upload new photo</span>
                    </label>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-4">
                    <span className="font-semibold">Full name</span>
                    <input
                      className={`${inputBase}${
                        touched.fullName && errors.fullName ? ' border-red-600' : ''
                      }`}
                      type="text"
                      value={profile.fullName}
                      onChange={(event) =>
                        handleProfileChange('fullName', event.target.value)
                      }
                      onBlur={() => markTouched('fullName')}
                      required
                    />
                    {touched.fullName && errors.fullName ? (
                      <span className="text-red-700">{errors.fullName}</span>
                    ) : null}
                  </label>
                  <label className="grid gap-4">
                    <span className="font-semibold">Display name</span>
                    <input
                      className={`${inputBase}${
                        touched.displayName && errors.displayName
                          ? ' border-red-600'
                          : ''
                      }`}
                      type="text"
                      value={profile.displayName}
                      onChange={(event) =>
                        handleProfileChange('displayName', event.target.value)
                      }
                      onBlur={() => markTouched('displayName')}
                      required
                    />
                    {touched.displayName && errors.displayName ? (
                      <span className="text-red-700">{errors.displayName}</span>
                    ) : null}
                  </label>
                  <label className="grid gap-4">
                    <span className="font-semibold">Email</span>
                    <input
                      className={`${inputBase}${
                        touched.email && errors.email ? ' border-red-600' : ''
                      }`}
                      type="email"
                      value={profile.email}
                      onChange={(event) =>
                        handleProfileChange('email', event.target.value)
                      }
                      onBlur={() => markTouched('email')}
                      required
                    />
                    {touched.email && errors.email ? (
                      <span className="text-red-700">{errors.email}</span>
                    ) : null}
                  </label>
                  <label className="grid gap-4">
                    <span className="font-semibold">Role</span>
                    <select
                      className={inputBase}
                      value={profile.role}
                      onChange={(event) =>
                        handleProfileChange('role', event.target.value)
                      }
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-4">
                    <span className="font-semibold">Time zone</span>
                    <select
                      className={inputBase}
                      value={profile.timezone}
                      onChange={(event) =>
                        handleProfileChange('timezone', event.target.value)
                      }
                    >
                      {timezones.map((zone) => (
                        <option key={zone} value={zone}>
                          {zone}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              <label className="grid gap-4">
                <span className="font-semibold">Bio</span>
                <textarea
                  className={`${inputBase} min-h-20 ${
                    touched.bio && errors.bio ? ' border-red-600' : ''
                  }`}
                  value={profile.bio}
                  onChange={(event) =>
                    handleProfileChange('bio', event.target.value)
                  }
                  onBlur={() => markTouched('bio')}
                  rows={4}
                />
                <span className={mutedClass}>
                  {profile.bio.length}/140 characters
                </span>
                {touched.bio && errors.bio ? (
                  <span className="text-red-700">{errors.bio}</span>
                ) : null}
              </label>
              <div className="flex flex-wrap items-center gap-4">
                <button className={buttonPrimary} type="submit">
                  {saveState === 'saving' ? 'Saving...' : 'Save changes'}
                </button>
                <div className="flex flex-wrap items-center gap-4 text-zinc-600">
                  <span className="border border-zinc-900/20 px-4 py-4">
                    {saveMessage}
                  </span>
                  {formNotice ? (
                    <span className="text-red-700">{formNotice}</span>
                  ) : null}
                </div>
              </div>
            </form>
          </div>
          <div className={panelClass}>
            <div className="space-y-4">
              <h2 className="font-semibold">Preferences</h2>
              <p className={mutedClass}>Toggle alerts and session behavior.</p>
            </div>
            <div className="space-y-4">
              {preferenceOptions.map((option) => (
                <div
                  className="flex items-center justify-between gap-4 border border-zinc-900/20 p-4"
                  key={option.key}
                >
                  <div>
                    <p className="font-semibold">{option.label}</p>
                    <p className={mutedClass}>{option.description}</p>
                  </div>
                  <button
                    className={`h-8 w-12 border border-zinc-900/20 p-4 ${
                      preferences[option.key] ? 'bg-zinc-900' : 'bg-transparent'
                    }`}
                    type="button"
                    aria-pressed={preferences[option.key]}
                    onClick={() => handleToggle(option.key)}
                  >
                    <span
                      className={`block h-4 w-4 bg-white ${
                        preferences[option.key] ? 'translate-x-4' : ''
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className={panelClass}>
            <div className="space-y-4">
              <h2 className="font-semibold">Security signals</h2>
              <p className={mutedClass}>Mocked system signals for audit checks.</p>
            </div>
            <div className="space-y-4">
              {securitySignals.map((signal) => (
                <div
                  className="flex items-center justify-between gap-4 border border-zinc-900/20 p-4"
                  key={signal.title}
                >
                  <div>
                    <p className="font-semibold">{signal.title}</p>
                    <p className={mutedClass}>{signal.detail}</p>
                  </div>
                  <span className="font-semibold">{signal.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={panelClass}>
            <div className="space-y-4">
              <h2 className="font-semibold">Access log</h2>
              <p className={mutedClass}>Recent sessions and device posture.</p>
            </div>
            <ul className="space-y-4">
              <li className="flex items-center justify-between gap-4 border border-zinc-900/20 p-4">
                <div>
                  <p className="font-semibold">MacBook Pro · SF, CA</p>
                  <p className={mutedClass}>Chrome · 2 hours ago</p>
                </div>
                <span className="border border-zinc-900/20 px-4 py-4">
                  Trusted
                </span>
              </li>
              <li className="flex items-center justify-between gap-4 border border-zinc-900/20 p-4">
                <div>
                  <p className="font-semibold">iPhone 15 · Seattle, WA</p>
                  <p className={mutedClass}>Safari · Yesterday</p>
                </div>
                <span className="border border-zinc-900/20 px-4 py-4">
                  Verified
                </span>
              </li>
              <li className="flex items-center justify-between gap-4 border border-zinc-900/20 p-4">
                <div>
                  <p className="font-semibold">Linux VM · Dublin</p>
                  <p className={mutedClass}>Firefox · 3 days ago</p>
                </div>
                <span className="border border-zinc-900/20 px-4 py-4">
                  Review
                </span>
              </li>
            </ul>
            <button className={buttonGhost} type="button">
              Export security report
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function TestLayout() {
  return <Outlet />
}

function TestNav({ slug }: { slug: TestSlug }) {
  return (
    <header className="border-b border-zinc-900/20" role="banner">
      <nav
        className={`${containerClass} flex items-center justify-between px-4 py-4`}
        aria-label="Primary"
      >
        <Link to="/test/$slug" params={{ slug }} className="font-semibold">
          browser CLI
        </Link>
        <Link
          to="/test/$slug/blog"
          params={{ slug }}
          className="test-link underline"
        >
          Blog
        </Link>
      </nav>
    </header>
  )
}

function TestIndexPage() {
  return (
    <section className={`${sectionClass} space-y-4`}>
      <div className="space-y-4">
        <p className={labelClass}>Test pages</p>
        <h1 className="font-semibold">CLI test pages</h1>
        <p className={mutedClass}>
          Each route mirrors a CLI test file with stable selectors and content.
        </p>
      </div>
      <div className="space-y-4">
        {testPages.map((page) => (
          <Link
            key={page.slug}
            to="/test/$slug"
            params={{ slug: page.slug }}
            className="block border-t border-zinc-900/20 pt-4"
          >
            <p className="font-semibold">{page.title}</p>
            <p className={mutedClass}>/test/{page.slug}</p>
            <p className={mutedClass}>{page.description}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

function TestPage() {
  const { slug } = testPageRoute.useParams()
  const page = testPages.find((entry) => entry.slug === slug)
  const title = page?.title ?? 'Test page'
  const description = page?.description ?? 'Stable selectors for CLI tests.'
  const slugValue = page?.slug ?? testPages[0].slug
  const inputId = `test-input-${slug}`
  const selectId = `test-select-${slug}`
  const sourceId = `test-source-${slug}`
  const targetId = `test-target-${slug}`

  return (
    <section className="space-y-4">
      <TestNav slug={slugValue} />
      <main className={`${sectionClass} space-y-4`} role="main" tabIndex={-1}>
        <div className={panelClass}>
          <p className={labelClass}>Test page · {slug}</p>
          <h1 className="font-semibold">{title}</h1>
          <p className={mutedClass}>
            Hey there — this is the browser CLI test page. {description}
          </p>
        </div>
        <div className={panelClass}>
          <label className="grid gap-4" htmlFor={inputId}>
            <span className="font-semibold">Test input</span>
            <input
              id={inputId}
              className={inputBase}
              type="text"
              placeholder="Type here"
            />
          </label>
          <label className="grid gap-4" htmlFor={selectId}>
            <span className="font-semibold">Test select</span>
            <select id={selectId} className={inputBase} defaultValue="green">
              <option value="red">Red</option>
              <option value="green">Green</option>
            </select>
          </label>
          <div className="flex gap-4">
            <div id={sourceId} className="border border-zinc-900/20 px-4 py-4">
              Source
            </div>
            <div id={targetId} className="border border-zinc-900/20 px-4 py-4">
              Target
            </div>
          </div>
        </div>
        <div className={panelClass}>
          <h2 className="font-semibold">Selector targets</h2>
          <p className={mutedClass}>
            Use this area for text, html, and outline commands. The navigation
            and blog links are stable anchors for click and find tests.
          </p>
          <button className={buttonGhost} type="button">
            Trigger action
          </button>
        </div>
        <div className="border border-dashed border-zinc-900/20 p-4 min-h-[120vh]">
          <p className="font-semibold">Scrollable content</p>
          <p className={mutedClass}>
            This block intentionally extends the page height so scroll commands
            have a stable target to move the viewport.
          </p>
          <ul className="list-disc space-y-4 pl-4">
            {Array.from({ length: 24 }).map((_, index) => (
              <li key={index}>Row {index + 1}</li>
            ))}
          </ul>
        </div>
      </main>
    </section>
  )
}

function TestBlogPage() {
  const { slug } = testBlogRoute.useParams()
  const slugValue =
    testPages.find((entry) => entry.slug === slug)?.slug ?? testPages[0].slug

  return (
    <section className="space-y-4">
      <TestNav slug={slugValue} />
      <main className={`${sectionClass} space-y-4`} role="main" tabIndex={-1}>
        <div className={panelClass}>
          <p className={labelClass}>Blog · {slug}</p>
          <h1 className="font-semibold">Blog</h1>
          <p className={mutedClass}>
            A secondary route to validate navigation history and URL updates.
          </p>
        </div>
        <div className={panelClass}>
          <h2 className="font-semibold">Release notes</h2>
          <p className={mutedClass}>
            This section is intentionally brief. The goal is to keep navigation
            predictable while still providing semantic headings and paragraphs.
          </p>
        </div>
        <div className="border border-dashed border-zinc-900/20 p-4 min-h-[120vh]">
          <p className="font-semibold">Additional notes</p>
          <p className={mutedClass}>
            Extra content to ensure the page scrolls for navigation tests.
          </p>
          <ul className="list-disc space-y-4 pl-4">
            {Array.from({ length: 16 }).map((_, index) => (
              <li key={index}>Update {index + 1}</li>
            ))}
          </ul>
        </div>
      </main>
    </section>
  )
}

function getProfileErrors(profile: ProfileForm): ProfileErrors {
  const errors: ProfileErrors = {}

  if (profile.fullName.trim().length === 0) {
    errors.fullName = 'Full name is required.'
  }

  if (profile.displayName.trim().length === 0) {
    errors.displayName = 'Display name is required.'
  }

  if (!profile.email.includes('@')) {
    errors.email = 'Enter a valid email address.'
  }

  if (profile.bio.trim().length > 140) {
    errors.bio = 'Bio must be 140 characters or fewer.'
  }

  return errors
}

const rootRoute = createRootRoute({
  component: RootLayout,
})

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const benchmarkLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/benchmark',
  component: BenchmarkLayout,
})

const benchmarkLoginRoute = createRoute({
  getParentRoute: () => benchmarkLayoutRoute,
  path: '1',
  component: LoginPage,
})

const benchmarkSettingsRoute = createRoute({
  getParentRoute: () => benchmarkLayoutRoute,
  path: '1/settings',
  component: SettingsPage,
})

const testLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/test',
  component: TestLayout,
})

const testIndexRoute = createRoute({
  getParentRoute: () => testLayoutRoute,
  path: '/',
  component: TestIndexPage,
})

const testPageRoute = createRoute({
  getParentRoute: () => testLayoutRoute,
  path: '$slug',
  component: TestPage,
})

const testBlogRoute = createRoute({
  getParentRoute: () => testLayoutRoute,
  path: '$slug/blog',
  component: TestBlogPage,
})

const routeTree = rootRoute.addChildren([
  homeRoute,
  benchmarkLayoutRoute.addChildren([
    benchmarkLoginRoute,
    benchmarkSettingsRoute,
  ]),
  testLayoutRoute.addChildren([testIndexRoute, testPageRoute, testBlogRoute]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
