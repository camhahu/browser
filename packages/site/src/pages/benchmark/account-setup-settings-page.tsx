import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  buttonGhost,
  buttonPrimary,
  inputBase,
  labelClass,
  mutedClass,
  panelClass,
} from '../../components/layout'
import {
  initialProfile,
  preferenceOptions,
  roles,
  securitySignals,
  timezones,
} from '../../data/benchmark-1-data'

type ProfileForm = typeof initialProfile

type PreferenceKey = (typeof preferenceOptions)[number]['key']

type Preferences = Record<PreferenceKey, boolean>

type ProfileField = keyof ProfileForm

type ProfileErrors = Partial<Record<ProfileField, string>>

type SaveState = 'idle' | 'saving' | 'saved'

export function AccountSetupSettingsPage() {
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
        <div className="border-t border-neutral-800 pt-4">
          <p className="font-semibold">Environment</p>
          <p className={mutedClass}>Sandbox · latency target 450ms.</p>
        </div>
        <div className="border-t border-neutral-800 pt-4">
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
                  <div className="flex h-20 w-20 items-center justify-center border border-neutral-800 font-semibold">
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
                    <label className="relative inline-flex items-center gap-4 border border-neutral-800 px-4 py-4">
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
                        touched.fullName && errors.fullName ? ' border-red-500' : ''
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
                      <span className="text-red-400">{errors.fullName}</span>
                    ) : null}
                  </label>
                  <label className="grid gap-4">
                    <span className="font-semibold">Display name</span>
                    <input
                      className={`${inputBase}${
                        touched.displayName && errors.displayName
                          ? ' border-red-500'
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
                      <span className="text-red-400">{errors.displayName}</span>
                    ) : null}
                  </label>
                  <label className="grid gap-4">
                    <span className="font-semibold">Email</span>
                    <input
                      className={`${inputBase}${
                        touched.email && errors.email ? ' border-red-500' : ''
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
                      <span className="text-red-400">{errors.email}</span>
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
                    touched.bio && errors.bio ? ' border-red-500' : ''
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
                  <span className="text-red-400">{errors.bio}</span>
                ) : null}
              </label>
              <div className="flex flex-wrap items-center gap-4">
                <button className={buttonPrimary} type="submit">
                  {saveState === 'saving' ? 'Saving...' : 'Save changes'}
                </button>
                <div className="flex flex-wrap items-center gap-4 text-neutral-400">
                  <span className="border border-neutral-800 px-4 py-4">
                    {saveMessage}
                  </span>
                  {formNotice ? (
                    <span className="text-red-400">{formNotice}</span>
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
                  className="flex items-center justify-between gap-4 border border-neutral-800 p-4"
                  key={option.key}
                >
                  <div>
                    <p className="font-semibold">{option.label}</p>
                    <p className={mutedClass}>{option.description}</p>
                  </div>
                  <button
                    className={`h-8 w-12 border border-neutral-800 p-4 ${
                      preferences[option.key] ? 'bg-[#485f6b]' : 'bg-transparent'
                    }`}
                    type="button"
                    aria-pressed={preferences[option.key]}
                    onClick={() => handleToggle(option.key)}
                  >
                    <span
                      className={`block h-4 w-4 bg-neutral-300 ${
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
                  className="flex items-center justify-between gap-4 border border-neutral-800 p-4"
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
              <li className="flex items-center justify-between gap-4 border border-neutral-800 p-4">
                <div>
                  <p className="font-semibold">MacBook Pro · SF, CA</p>
                  <p className={mutedClass}>Chrome · 2 hours ago</p>
                </div>
                <span className="border border-neutral-800 px-4 py-4">
                  Trusted
                </span>
              </li>
              <li className="flex items-center justify-between gap-4 border border-neutral-800 p-4">
                <div>
                  <p className="font-semibold">iPhone 15 · Seattle, WA</p>
                  <p className={mutedClass}>Safari · Yesterday</p>
                </div>
                <span className="border border-neutral-800 px-4 py-4">
                  Verified
                </span>
              </li>
              <li className="flex items-center justify-between gap-4 border border-neutral-800 p-4">
                <div>
                  <p className="font-semibold">Linux VM · Dublin</p>
                  <p className={mutedClass}>Firefox · 3 days ago</p>
                </div>
                <span className="border border-neutral-800 px-4 py-4">
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
