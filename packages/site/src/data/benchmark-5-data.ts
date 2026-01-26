export type PlanType = 'starter' | 'pro' | 'enterprise'

export type BillingCycle = 'monthly' | 'annual'

export type PaymentMethod = 'card' | 'bank' | 'invoice'

export type WizardData = {
  plan: PlanType | ''
  billingCycle: BillingCycle | ''
  paymentMethod: PaymentMethod | ''
  cardNumber: string
  cardExpiry: string
  cardCvc: string
  bankAccount: string
  bankRouting: string
  invoiceEmail: string
  invoicePo: string
  companyName: string
  companySize: string
  agreeTerms: boolean
}

export const initialWizardData: WizardData = {
  plan: '',
  billingCycle: '',
  paymentMethod: '',
  cardNumber: '',
  cardExpiry: '',
  cardCvc: '',
  bankAccount: '',
  bankRouting: '',
  invoiceEmail: '',
  invoicePo: '',
  companyName: '',
  companySize: '',
  agreeTerms: false,
}

export const plans = [
  { id: 'starter', name: 'Starter', price: 9, features: ['5 projects', '1 GB storage', 'Email support'] },
  { id: 'pro', name: 'Pro', price: 29, features: ['Unlimited projects', '10 GB storage', 'Priority support', 'API access'] },
  { id: 'enterprise', name: 'Enterprise', price: 99, features: ['Unlimited everything', 'Dedicated support', 'Custom integrations', 'SLA guarantee'] },
] as const

export const companySizes = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '500+ employees',
] as const
