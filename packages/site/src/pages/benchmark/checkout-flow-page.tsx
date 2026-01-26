import { useState } from 'react'
import {
  buttonGhost,
  buttonPrimary,
  inputBase,
  labelClass,
  mutedClass,
  panelClass,
} from '../../components/layout'
import {
  companySizes,
  initialWizardData,
  plans,
  type WizardData,
} from '../../data/benchmark-5-data'

type Step = 'plan' | 'billing' | 'payment' | 'company' | 'review'

const allSteps: Step[] = ['plan', 'billing', 'payment', 'company', 'review']

const stepTitles: Record<Step, string> = {
  plan: 'Select Plan',
  billing: 'Billing Cycle',
  payment: 'Payment Method',
  company: 'Company Info',
  review: 'Review',
}

export function CheckoutFlowPage() {
  const [currentStep, setCurrentStep] = useState<Step>('plan')
  const [data, setData] = useState<WizardData>(initialWizardData)
  const [errors, setErrors] = useState<Partial<Record<keyof WizardData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const getVisibleSteps = (): Step[] => {
    const steps: Step[] = ['plan', 'billing', 'payment']
    if (data.plan === 'enterprise') {
      steps.push('company')
    }
    steps.push('review')
    return steps
  }

  const visibleSteps = getVisibleSteps()
  const currentStepIndex = visibleSteps.indexOf(currentStep)

  const updateData = <K extends keyof WizardData>(field: K, value: WizardData[K]) => {
    setData({ ...data, [field]: value })
    setErrors({ ...errors, [field]: undefined })
  }

  const validateStep = (step: Step): boolean => {
    const newErrors: Partial<Record<keyof WizardData, string>> = {}

    if (step === 'plan') {
      if (!data.plan) newErrors.plan = 'Please select a plan.'
    }

    if (step === 'billing') {
      if (!data.billingCycle) newErrors.billingCycle = 'Please select a billing cycle.'
    }

    if (step === 'payment') {
      if (!data.paymentMethod) newErrors.paymentMethod = 'Please select a payment method.'
      if (data.paymentMethod === 'card') {
        if (!data.cardNumber) newErrors.cardNumber = 'Card number is required.'
        if (!data.cardExpiry) newErrors.cardExpiry = 'Expiry date is required.'
        if (!data.cardCvc) newErrors.cardCvc = 'CVC is required.'
      }
      if (data.paymentMethod === 'bank') {
        if (!data.bankAccount) newErrors.bankAccount = 'Account number is required.'
        if (!data.bankRouting) newErrors.bankRouting = 'Routing number is required.'
      }
      if (data.paymentMethod === 'invoice') {
        if (!data.invoiceEmail) newErrors.invoiceEmail = 'Invoice email is required.'
      }
    }

    if (step === 'company') {
      if (!data.companyName) newErrors.companyName = 'Company name is required.'
      if (!data.companySize) newErrors.companySize = 'Please select company size.'
    }

    if (step === 'review') {
      if (!data.agreeTerms) newErrors.agreeTerms = 'You must agree to the terms.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) return

    const nextIndex = currentStepIndex + 1
    if (nextIndex < visibleSteps.length) {
      setCurrentStep(visibleSteps[nextIndex])
    }
  }

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(visibleSteps[prevIndex])
    }
  }

  const handleSubmit = () => {
    if (!validateStep('review')) return

    setIsSubmitting(true)
    window.setTimeout(() => {
      setIsSubmitting(false)
      setIsComplete(true)
    }, 1200)
  }

  const getPlanPrice = () => {
    const plan = plans.find((p) => p.id === data.plan)
    if (!plan) return 0
    return data.billingCycle === 'annual' ? plan.price * 10 : plan.price
  }

  const renderStepIndicator = () => (
    <div className="flex items-center gap-2 mb-6">
      {visibleSteps.map((step, index) => {
        const isActive = step === currentStep
        const isCompleted = index < currentStepIndex
        return (
          <div key={step} className="flex items-center gap-2">
            {index > 0 && (
              <div
                className={`h-px w-8 ${isCompleted ? 'bg-[#485f6b]' : 'bg-neutral-700'}`}
              />
            )}
            <button
              type="button"
              onClick={() => {
                if (isCompleted) setCurrentStep(step)
              }}
              disabled={!isCompleted}
              className={`flex h-8 w-8 items-center justify-center border text-sm ${
                isActive
                  ? 'border-[#6b8fa3] bg-[#485f6b] text-white'
                  : isCompleted
                    ? 'border-[#6b8fa3] bg-white text-neutral-100 cursor-pointer'
                    : 'border-zinc-300 bg-neutral-800 text-neutral-500'
              }`}
            >
              {index + 1}
            </button>
            <span
              className={`text-sm hidden sm:inline ${isActive ? 'font-semibold' : mutedClass}`}
            >
              {stepTitles[step]}
            </span>
          </div>
        )
      })}
    </div>
  )

  const renderPlanStep = () => (
    <div className="space-y-4">
      <h2 className="font-semibold">Choose your plan</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => updateData('plan', plan.id)}
            className={`${panelClass} text-left ${
              data.plan === plan.id ? 'border-[#6b8fa3] border-2' : ''
            }`}
          >
            <p className="font-semibold">{plan.name}</p>
            <p className="text-2xl font-bold">${plan.price}<span className={`${mutedClass} text-sm`}>/mo</span></p>
            <ul className={`${mutedClass} mt-2 space-y-1 text-sm`}>
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </button>
        ))}
      </div>
      {errors.plan && <p className="text-red-400 text-sm">{errors.plan}</p>}
    </div>
  )

  const renderBillingStep = () => (
    <div className="space-y-4">
      <h2 className="font-semibold">Choose billing cycle</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => updateData('billingCycle', 'monthly')}
          className={`${panelClass} text-left ${
            data.billingCycle === 'monthly' ? 'border-[#6b8fa3] border-2' : ''
          }`}
        >
          <p className="font-semibold">Monthly</p>
          <p className={mutedClass}>Pay month-to-month, cancel anytime.</p>
        </button>
        <button
          type="button"
          onClick={() => updateData('billingCycle', 'annual')}
          className={`${panelClass} text-left ${
            data.billingCycle === 'annual' ? 'border-[#6b8fa3] border-2' : ''
          }`}
        >
          <p className="font-semibold">Annual</p>
          <p className={mutedClass}>Save 2 months with annual billing.</p>
        </button>
      </div>
      {errors.billingCycle && <p className="text-red-400 text-sm">{errors.billingCycle}</p>}
    </div>
  )

  const renderPaymentStep = () => (
    <div className="space-y-4">
      <h2 className="font-semibold">Payment method</h2>
      <div className="flex gap-4">
        {(['card', 'bank', 'invoice'] as const).map((method) => (
          <button
            key={method}
            type="button"
            onClick={() => updateData('paymentMethod', method)}
            className={`${buttonGhost} ${
              data.paymentMethod === method ? 'border-[#6b8fa3] border-2' : ''
            }`}
          >
            {method === 'card' && 'Credit Card'}
            {method === 'bank' && 'Bank Transfer'}
            {method === 'invoice' && 'Invoice'}
          </button>
        ))}
      </div>
      {errors.paymentMethod && <p className="text-red-400 text-sm">{errors.paymentMethod}</p>}

      {data.paymentMethod === 'card' && (
        <div className="space-y-4 mt-4">
          <label className="grid gap-2">
            <span className="text-sm font-semibold">Card number</span>
            <input
              className={inputBase}
              type="text"
              name="cardNumber"
              placeholder="4242 4242 4242 4242"
              value={data.cardNumber}
              onChange={(e) => updateData('cardNumber', e.target.value)}
            />
            {errors.cardNumber && <p className="text-red-400 text-sm">{errors.cardNumber}</p>}
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Expiry</span>
              <input
                className={inputBase}
                type="text"
                name="cardExpiry"
                placeholder="MM/YY"
                value={data.cardExpiry}
                onChange={(e) => updateData('cardExpiry', e.target.value)}
              />
              {errors.cardExpiry && <p className="text-red-400 text-sm">{errors.cardExpiry}</p>}
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">CVC</span>
              <input
                className={inputBase}
                type="text"
                name="cardCvc"
                placeholder="123"
                value={data.cardCvc}
                onChange={(e) => updateData('cardCvc', e.target.value)}
              />
              {errors.cardCvc && <p className="text-red-400 text-sm">{errors.cardCvc}</p>}
            </label>
          </div>
        </div>
      )}

      {data.paymentMethod === 'bank' && (
        <div className="space-y-4 mt-4">
          <label className="grid gap-2">
            <span className="text-sm font-semibold">Account number</span>
            <input
              className={inputBase}
              type="text"
              name="bankAccount"
              value={data.bankAccount}
              onChange={(e) => updateData('bankAccount', e.target.value)}
            />
            {errors.bankAccount && <p className="text-red-400 text-sm">{errors.bankAccount}</p>}
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold">Routing number</span>
            <input
              className={inputBase}
              type="text"
              name="bankRouting"
              value={data.bankRouting}
              onChange={(e) => updateData('bankRouting', e.target.value)}
            />
            {errors.bankRouting && <p className="text-red-400 text-sm">{errors.bankRouting}</p>}
          </label>
        </div>
      )}

      {data.paymentMethod === 'invoice' && (
        <div className="space-y-4 mt-4">
          <label className="grid gap-2">
            <span className="text-sm font-semibold">Invoice email</span>
            <input
              className={inputBase}
              type="email"
              name="invoiceEmail"
              value={data.invoiceEmail}
              onChange={(e) => updateData('invoiceEmail', e.target.value)}
            />
            {errors.invoiceEmail && <p className="text-red-400 text-sm">{errors.invoiceEmail}</p>}
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold">PO number (optional)</span>
            <input
              className={inputBase}
              type="text"
              name="invoicePo"
              value={data.invoicePo}
              onChange={(e) => updateData('invoicePo', e.target.value)}
            />
          </label>
        </div>
      )}
    </div>
  )

  const renderCompanyStep = () => (
    <div className="space-y-4">
      <h2 className="font-semibold">Company information</h2>
      <p className={mutedClass}>Required for Enterprise plans.</p>
      <label className="grid gap-2">
        <span className="text-sm font-semibold">Company name</span>
        <input
          className={inputBase}
          type="text"
          name="companyName"
          value={data.companyName}
          onChange={(e) => updateData('companyName', e.target.value)}
        />
        {errors.companyName && <p className="text-red-400 text-sm">{errors.companyName}</p>}
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-semibold">Company size</span>
        <select
          className={inputBase}
          name="companySize"
          value={data.companySize}
          onChange={(e) => updateData('companySize', e.target.value)}
        >
          <option value="">Select size</option>
          {companySizes.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        {errors.companySize && <p className="text-red-400 text-sm">{errors.companySize}</p>}
      </label>
    </div>
  )

  const renderReviewStep = () => {
    const plan = plans.find((p) => p.id === data.plan)
    return (
      <div className="space-y-4">
        <h2 className="font-semibold">Review your order</h2>
        <div className={panelClass}>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className={mutedClass}>Plan</span>
              <span className="font-semibold">{plan?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className={mutedClass}>Billing</span>
              <span>{data.billingCycle === 'annual' ? 'Annual' : 'Monthly'}</span>
            </div>
            <div className="flex justify-between">
              <span className={mutedClass}>Payment</span>
              <span className="capitalize">{data.paymentMethod}</span>
            </div>
            {data.plan === 'enterprise' && (
              <div className="flex justify-between">
                <span className={mutedClass}>Company</span>
                <span>{data.companyName}</span>
              </div>
            )}
            <div className="border-t border-neutral-800 pt-2 mt-2">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${getPlanPrice()}/{data.billingCycle === 'annual' ? 'year' : 'month'}</span>
              </div>
            </div>
          </div>
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="agreeTerms"
            checked={data.agreeTerms}
            onChange={(e) => updateData('agreeTerms', e.target.checked)}
          />
          <span className="text-sm">I agree to the terms of service and privacy policy.</span>
        </label>
        {errors.agreeTerms && <p className="text-red-400 text-sm">{errors.agreeTerms}</p>}
      </div>
    )
  }

  const renderComplete = () => (
    <div className="text-center py-12">
      <p className="text-4xl mb-4">✓</p>
      <h2 className="font-semibold text-xl">Order complete</h2>
      <p className={mutedClass}>Thank you for your purchase. A confirmation email has been sent.</p>
      <button
        type="button"
        className={`${buttonPrimary} mt-4`}
        onClick={() => {
          setData(initialWizardData)
          setCurrentStep('plan')
          setIsComplete(false)
        }}
      >
        Start over
      </button>
    </div>
  )

  if (isComplete) {
    return (
      <section className="space-y-4">
        <div className="space-y-4">
          <p className={labelClass}>Checkout flow</p>
          <h1 className="font-semibold">Multi-step wizard</h1>
        </div>
        {renderComplete()}
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="space-y-4">
        <div className="space-y-4">
          <p className={labelClass}>Checkout flow</p>
          <h1 className="font-semibold">Multi-step wizard</h1>
          <p className={mutedClass}>
            A checkout flow with conditional steps, validation, and state preservation.
            Enterprise plans show an additional company info step.
          </p>
        </div>
      </div>

      <div className={panelClass}>
        {renderStepIndicator()}

        {currentStep === 'plan' && renderPlanStep()}
        {currentStep === 'billing' && renderBillingStep()}
        {currentStep === 'payment' && renderPaymentStep()}
        {currentStep === 'company' && renderCompanyStep()}
        {currentStep === 'review' && renderReviewStep()}

        <div className="flex justify-between mt-6 pt-4 border-t border-neutral-800">
          <button
            type="button"
            className={buttonGhost}
            onClick={handleBack}
            disabled={currentStepIndex === 0}
          >
            Back
          </button>
          {currentStep === 'review' ? (
            <button
              type="button"
              className={buttonPrimary}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Complete purchase'}
            </button>
          ) : (
            <button
              type="button"
              className={buttonPrimary}
              onClick={handleNext}
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
