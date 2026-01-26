export type ErrorScenario = 'network' | '404' | '500' | 'session' | 'validation' | 'ratelimit'

export type ApiResponse = {
  success: boolean
  error?: string
  data?: unknown
}

export const errorScenarios = [
  { id: 'network', name: 'Network Error', description: 'Simulates a connection failure with retry option' },
  { id: '404', name: '404 Not Found', description: 'Resource does not exist' },
  { id: '500', name: '500 Server Error', description: 'Internal server error with error ID' },
  { id: 'session', name: 'Session Timeout', description: 'Session expired, re-authentication required' },
  { id: 'validation', name: 'Validation Errors', description: 'Server-side form validation failures' },
  { id: 'ratelimit', name: 'Rate Limited', description: 'Too many requests, retry after delay' },
] as const

export type FormData = {
  username: string
  email: string
  age: string
}

export const initialFormData: FormData = {
  username: '',
  email: '',
  age: '',
}

export type ServerValidationErrors = {
  username?: string
  email?: string
  age?: string
  general?: string
}
