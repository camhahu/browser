import type { ReactNode } from 'react'

export function FormField({
  label,
  children,
  description,
}: {
  label: string
  children: ReactNode
  description?: ReactNode
}) {
  return (
    <label className="grid gap-4">
      <span className="font-semibold">{label}</span>
      {children}
      {description ? <span className="text-zinc-600">{description}</span> : null}
    </label>
  )
}
