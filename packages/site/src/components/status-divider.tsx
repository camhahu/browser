import type { ReactNode } from 'react'
import { mutedClass } from './Layout'

export function StatusDivider({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-zinc-900/20 pt-4">
      <p className="font-semibold">{title}</p>
      <p className={mutedClass}>{children}</p>
    </div>
  )
}
