export const roles = [
  'Product Engineer',
  'Platform Engineer',
  'Developer Experience',
  'Security Engineer',
]

export const timezones = [
  'America/Los_Angeles',
  'America/New_York',
  'Europe/London',
  'Asia/Singapore',
]

export const preferenceOptions = [
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
] as const

export const securitySignals = [
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
] as const

export const initialProfile = {
  fullName: 'Avery Ellis',
  displayName: 'avery.ellis',
  email: 'avery@browsercli.dev',
  role: roles[0],
  timezone: timezones[0],
  bio: 'Shipping developer tooling and onboarding the next cohort of builders.',
}
