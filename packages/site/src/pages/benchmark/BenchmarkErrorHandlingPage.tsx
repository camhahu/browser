import { useState } from 'react'
import {
  buttonGhost,
  buttonPrimary,
  inputBase,
  labelClass,
  mutedClass,
  panelClass,
} from '../../components/Layout'
import {
  errorScenarios,
  initialFormData,
  type ErrorScenario,
  type FormData,
  type ServerValidationErrors,
} from '../../data/benchmark-9-data'

type ViewState =
  | { type: 'menu' }
  | { type: 'network'; status: 'idle' | 'loading' | 'error' | 'success' }
  | { type: '404' }
  | { type: '500'; errorId: string }
  | { type: 'session'; status: 'expired' | 'reauth' | 'success' }
  | { type: 'validation'; status: 'idle' | 'loading' | 'error' | 'success'; errors: ServerValidationErrors }
  | { type: 'ratelimit'; status: 'idle' | 'loading' | 'limited' | 'success'; retryAfter: number; requestCount: number }
  | { type: 'confirm'; confirmed: boolean }

export function BenchmarkErrorHandlingPage() {
  const [view, setView] = useState<ViewState>({ type: 'menu' })
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [password, setPassword] = useState('')
  const [deleteItemName] = useState('Important Document.pdf')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const handleScenarioSelect = (scenario: ErrorScenario) => {
    switch (scenario) {
      case 'network':
        setView({ type: 'network', status: 'idle' })
        break
      case '404':
        setView({ type: '404' })
        break
      case '500':
        setView({ type: '500', errorId: `ERR-${Date.now().toString(36).toUpperCase()}` })
        break
      case 'session':
        setView({ type: 'session', status: 'expired' })
        break
      case 'validation':
        setFormData(initialFormData)
        setView({ type: 'validation', status: 'idle', errors: {} })
        break
      case 'ratelimit':
        setView({ type: 'ratelimit', status: 'idle', retryAfter: 0, requestCount: 0 })
        break
    }
  }

  const handleNetworkRequest = () => {
    if (view.type !== 'network') return
    setView({ type: 'network', status: 'loading' })
    window.setTimeout(() => {
      setView({ type: 'network', status: 'error' })
    }, 1500)
  }

  const handleNetworkRetry = () => {
    if (view.type !== 'network') return
    setView({ type: 'network', status: 'loading' })
    window.setTimeout(() => {
      setView({ type: 'network', status: 'success' })
    }, 800)
  }

  const handleReauth = () => {
    if (view.type !== 'session') return
    if (!password) return
    setView({ type: 'session', status: 'reauth' })
    window.setTimeout(() => {
      setView({ type: 'session', status: 'success' })
    }, 1000)
  }

  const handleValidationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (view.type !== 'validation') return

    setView({ type: 'validation', status: 'loading', errors: {} })

    window.setTimeout(() => {
      const errors: ServerValidationErrors = {}

      if (formData.username.length < 3) {
        errors.username = 'Username must be at least 3 characters.'
      }
      if (formData.username.toLowerCase() === 'admin') {
        errors.username = 'Username "admin" is reserved.'
      }
      if (!formData.email.includes('@')) {
        errors.email = 'Invalid email format.'
      }
      if (formData.email.endsWith('@test.com')) {
        errors.email = 'Email domain @test.com is not allowed.'
      }
      const age = parseInt(formData.age, 10)
      if (isNaN(age) || age < 18) {
        errors.age = 'You must be at least 18 years old.'
      }
      if (age > 120) {
        errors.age = 'Please enter a valid age.'
      }

      if (Object.keys(errors).length > 0) {
        setView({ type: 'validation', status: 'error', errors })
      } else {
        setView({ type: 'validation', status: 'success', errors: {} })
      }
    }, 1200)
  }

  const handleRateLimitRequest = () => {
    if (view.type !== 'ratelimit') return

    const newCount = view.requestCount + 1
    setView({ ...view, status: 'loading', requestCount: newCount })

    window.setTimeout(() => {
      if (newCount >= 3) {
        setView({
          type: 'ratelimit',
          status: 'limited',
          retryAfter: 30,
          requestCount: newCount,
        })
      } else {
        setView({
          type: 'ratelimit',
          status: 'success',
          retryAfter: 0,
          requestCount: newCount,
        })
      }
    }, 500)
  }

  const handleRateLimitReset = () => {
    setView({ type: 'ratelimit', status: 'idle', retryAfter: 0, requestCount: 0 })
  }

  const handleConfirmDelete = () => {
    setShowConfirmDialog(false)
    setView({ type: 'confirm', confirmed: true })
  }

  const renderMenu = () => (
    <div className="space-y-4">
      <h2 className="font-semibold">Select an error scenario</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {errorScenarios.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            onClick={() => handleScenarioSelect(scenario.id as ErrorScenario)}
            className={`${panelClass} text-left hover:border-zinc-900`}
          >
            <p className="font-semibold">{scenario.name}</p>
            <p className={mutedClass}>{scenario.description}</p>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowConfirmDialog(true)}
          className={`${panelClass} text-left hover:border-zinc-900`}
        >
          <p className="font-semibold">Confirmation Dialog</p>
          <p className={mutedClass}>Are you sure? destructive action prompt</p>
        </button>
      </div>
    </div>
  )

  const renderNetworkError = () => {
    if (view.type !== 'network') return null
    return (
      <div className="space-y-4">
        <h2 className="font-semibold">Network Error Simulation</h2>
        {view.status === 'idle' && (
          <div className={panelClass}>
            <p>Click the button to simulate a network request that will fail.</p>
            <button
              type="button"
              className={`${buttonPrimary} mt-4`}
              onClick={handleNetworkRequest}
            >
              Fetch Data
            </button>
          </div>
        )}
        {view.status === 'loading' && (
          <div className={panelClass}>
            <p>Loading...</p>
            <div className="mt-2 h-2 w-full bg-zinc-200 overflow-hidden">
              <div className="h-full w-1/2 bg-zinc-900 animate-pulse" />
            </div>
          </div>
        )}
        {view.status === 'error' && (
          <div className="border-2 border-red-500 bg-red-50 p-4 space-y-4">
            <p className="font-semibold text-red-700">Connection Failed</p>
            <p className="text-red-600">
              Unable to connect to the server. Please check your internet connection and try again.
            </p>
            <div className="flex gap-2">
              <button type="button" className={buttonPrimary} onClick={handleNetworkRetry}>
                Retry
              </button>
              <button type="button" className={buttonGhost} onClick={() => setView({ type: 'menu' })}>
                Cancel
              </button>
            </div>
          </div>
        )}
        {view.status === 'success' && (
          <div className="border-2 border-green-500 bg-green-50 p-4">
            <p className="font-semibold text-green-700">Success</p>
            <p className="text-green-600">Data fetched successfully after retry.</p>
            <button
              type="button"
              className={`${buttonGhost} mt-4`}
              onClick={() => setView({ type: 'menu' })}
            >
              Back to menu
            </button>
          </div>
        )}
      </div>
    )
  }

  const render404 = () => {
    if (view.type !== '404') return null
    return (
      <div className="space-y-4 text-center py-8">
        <p className="text-6xl font-bold text-zinc-300">404</p>
        <h2 className="font-semibold text-xl">Page Not Found</h2>
        <p className={mutedClass}>
          The resource you requested could not be found. It may have been moved or deleted.
        </p>
        <div className="flex justify-center gap-2">
          <button type="button" className={buttonPrimary} onClick={() => setView({ type: 'menu' })}>
            Go Home
          </button>
          <button type="button" className={buttonGhost} onClick={() => window.history.back()}>
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const render500 = () => {
    if (view.type !== '500') return null
    return (
      <div className="space-y-4 text-center py-8">
        <p className="text-6xl font-bold text-red-300">500</p>
        <h2 className="font-semibold text-xl">Internal Server Error</h2>
        <p className={mutedClass}>
          Something went wrong on our end. Our team has been notified.
        </p>
        <p className="text-sm font-mono bg-zinc-100 inline-block px-2 py-1">
          Error ID: {view.errorId}
        </p>
        <div className="flex justify-center gap-2">
          <button type="button" className={buttonPrimary} onClick={() => setView({ type: 'menu' })}>
            Try Again
          </button>
          <button type="button" className={buttonGhost}>
            Contact Support
          </button>
        </div>
      </div>
    )
  }

  const renderSessionTimeout = () => {
    if (view.type !== 'session') return null
    return (
      <div className="space-y-4">
        <h2 className="font-semibold">Session Timeout</h2>
        {view.status === 'expired' && (
          <div className="border-2 border-yellow-500 bg-yellow-50 p-4 space-y-4">
            <p className="font-semibold text-yellow-700">Session Expired</p>
            <p className="text-yellow-600">
              Your session has expired due to inactivity. Please enter your password to continue.
            </p>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Password</span>
              <input
                type="password"
                name="password"
                className={inputBase}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </label>
            <div className="flex gap-2">
              <button type="button" className={buttonPrimary} onClick={handleReauth}>
                Continue Session
              </button>
              <button type="button" className={buttonGhost} onClick={() => setView({ type: 'menu' })}>
                Log Out
              </button>
            </div>
          </div>
        )}
        {view.status === 'reauth' && (
          <div className={panelClass}>
            <p>Re-authenticating...</p>
          </div>
        )}
        {view.status === 'success' && (
          <div className="border-2 border-green-500 bg-green-50 p-4">
            <p className="font-semibold text-green-700">Session Restored</p>
            <p className="text-green-600">You have been re-authenticated successfully.</p>
            <button
              type="button"
              className={`${buttonGhost} mt-4`}
              onClick={() => {
                setPassword('')
                setView({ type: 'menu' })
              }}
            >
              Back to menu
            </button>
          </div>
        )}
      </div>
    )
  }

  const renderValidationErrors = () => {
    if (view.type !== 'validation') return null
    return (
      <div className="space-y-4">
        <h2 className="font-semibold">Server-Side Validation</h2>
        <p className={mutedClass}>
          This form validates on the server. Try submitting with invalid data.
        </p>
        {view.status === 'success' ? (
          <div className="border-2 border-green-500 bg-green-50 p-4">
            <p className="font-semibold text-green-700">Form Submitted</p>
            <p className="text-green-600">Your data was accepted by the server.</p>
            <button
              type="button"
              className={`${buttonGhost} mt-4`}
              onClick={() => setView({ type: 'menu' })}
            >
              Back to menu
            </button>
          </div>
        ) : (
          <form onSubmit={handleValidationSubmit} className={`${panelClass} space-y-4`}>
            {view.errors.general && (
              <div className="border border-red-500 bg-red-50 p-2 text-red-600 text-sm">
                {view.errors.general}
              </div>
            )}
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Username</span>
              <input
                type="text"
                name="username"
                className={`${inputBase} ${view.errors.username ? 'border-red-500' : ''}`}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter username (not 'admin')"
              />
              {view.errors.username && (
                <p className="text-red-600 text-sm">{view.errors.username}</p>
              )}
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Email</span>
              <input
                type="text"
                name="email"
                className={`${inputBase} ${view.errors.email ? 'border-red-500' : ''}`}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email (not @test.com)"
              />
              {view.errors.email && (
                <p className="text-red-600 text-sm">{view.errors.email}</p>
              )}
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Age</span>
              <input
                type="text"
                name="age"
                className={`${inputBase} ${view.errors.age ? 'border-red-500' : ''}`}
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="Must be 18+"
              />
              {view.errors.age && (
                <p className="text-red-600 text-sm">{view.errors.age}</p>
              )}
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                className={buttonPrimary}
                disabled={view.status === 'loading'}
              >
                {view.status === 'loading' ? 'Validating...' : 'Submit'}
              </button>
              <button
                type="button"
                className={buttonGhost}
                onClick={() => setView({ type: 'menu' })}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    )
  }

  const renderRateLimit = () => {
    if (view.type !== 'ratelimit') return null
    return (
      <div className="space-y-4">
        <h2 className="font-semibold">Rate Limiting</h2>
        <p className={mutedClass}>
          Click the button multiple times to trigger rate limiting (after 3 requests).
        </p>
        {view.status === 'limited' ? (
          <div className="border-2 border-orange-500 bg-orange-50 p-4 space-y-4">
            <p className="font-semibold text-orange-700">Too Many Requests</p>
            <p className="text-orange-600">
              You have exceeded the rate limit. Please wait before making more requests.
            </p>
            <p className="font-mono text-sm">Retry after: {view.retryAfter} seconds</p>
            <div className="flex gap-2">
              <button type="button" className={buttonPrimary} onClick={handleRateLimitReset}>
                Reset (simulate wait)
              </button>
              <button type="button" className={buttonGhost} onClick={() => setView({ type: 'menu' })}>
                Back to menu
              </button>
            </div>
          </div>
        ) : (
          <div className={panelClass}>
            <p>Requests made: {view.requestCount}/3</p>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                className={buttonPrimary}
                onClick={handleRateLimitRequest}
                disabled={view.status === 'loading'}
              >
                {view.status === 'loading' ? 'Requesting...' : 'Make Request'}
              </button>
              <button type="button" className={buttonGhost} onClick={() => setView({ type: 'menu' })}>
                Back to menu
              </button>
            </div>
            {view.status === 'success' && (
              <p className="text-green-600 mt-2">Request successful!</p>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderConfirmDialog = () => {
    if (!showConfirmDialog) return null
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 max-w-md w-full mx-4 space-y-4">
          <h2 className="font-semibold text-lg">Confirm Deletion</h2>
          <p>
            Are you sure you want to delete <strong>{deleteItemName}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={buttonGhost}
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="border border-red-500 bg-red-500 text-white px-3 py-2"
              onClick={handleConfirmDelete}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderConfirmResult = () => {
    if (view.type !== 'confirm') return null
    return (
      <div className="space-y-4">
        <h2 className="font-semibold">Confirmation Result</h2>
        <div className="border-2 border-green-500 bg-green-50 p-4">
          <p className="font-semibold text-green-700">Item Deleted</p>
          <p className="text-green-600">
            "{deleteItemName}" has been permanently deleted.
          </p>
          <button
            type="button"
            className={`${buttonGhost} mt-4`}
            onClick={() => setView({ type: 'menu' })}
          >
            Back to menu
          </button>
        </div>
      </div>
    )
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <p className={labelClass}>Error states</p>
          <h1 className="font-semibold">Error handling scenarios</h1>
          <p className={mutedClass}>
            Test various error states and recovery flows. Select a scenario to simulate
            different failure modes and edge cases.
          </p>
        </div>
        <div className={`${panelClass} space-y-2`}>
          <div className="border-b border-zinc-900/20 pb-2">
            <p className="font-semibold text-sm">Challenge</p>
            <p className={`${mutedClass} text-sm`}>Handle errors and recover.</p>
          </div>
          <div className="border-b border-zinc-900/20 pb-2">
            <p className="font-semibold text-sm">Latency</p>
            <p className={`${mutedClass} text-sm`}>500-1500ms per action.</p>
          </div>
          <div>
            <p className="font-semibold text-sm">Scope</p>
            <p className={`${mutedClass} text-sm`}>Errors, retry, dialogs.</p>
          </div>
        </div>
      </div>

      {view.type !== 'menu' && (
        <button
          type="button"
          className={buttonGhost}
          onClick={() => setView({ type: 'menu' })}
        >
          ← Back to scenarios
        </button>
      )}

      {view.type === 'menu' && renderMenu()}
      {renderNetworkError()}
      {render404()}
      {render500()}
      {renderSessionTimeout()}
      {renderValidationErrors()}
      {renderRateLimit()}
      {renderConfirmResult()}
      {renderConfirmDialog()}
    </section>
  )
}
