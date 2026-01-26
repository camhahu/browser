import { Link, Outlet } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import {
  testBlogPaths,
  testPagePaths,
  type TestSlug,
} from '../data/test-pages'

// Dark theme color palette based on oklch(0.4176 0.0789 203.29)
// Primary teal: rgb(72, 95, 107) / #485f6b
export const containerClass = 'mx-auto w-full max-w-4xl'
export const sectionClass = `${containerClass} p-4`
export const panelClass = 'border border-neutral-800 bg-neutral-950 p-4'
export const labelClass = 'text-neutral-500'
export const mutedClass = 'text-neutral-500'
export const buttonBase = 'border border-neutral-700 px-3 py-2 transition-colors'
export const buttonPrimary = `${buttonBase} bg-[#485f6b] text-neutral-100 hover:bg-[#5a7585]`
export const buttonGhost = `${buttonBase} bg-transparent text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100`
export const inputBase =
  'w-full border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 placeholder:text-neutral-600 outline outline-2 outline-transparent focus:outline-[#485f6b] focus:border-[#485f6b]'

export function RootLayout() {
  return (
    <div className="min-h-screen bg-black text-neutral-100">
      <Outlet />
    </div>
  )
}

export function BenchmarkLayout() {
  return (
    <div className="min-h-screen bg-black text-neutral-100">
      <header className="border-b border-neutral-800">
        <div className={`${containerClass} space-y-4 px-4 py-4`}>
          <div className="flex flex-wrap items-baseline gap-4">
            <Link to="/" className="font-semibold text-neutral-300 hover:text-neutral-100 transition-colors">
              browser
            </Link>
          </div>
          <nav className="flex flex-wrap gap-4 text-sm" aria-label="Primary">
            <Link
              to="/benchmark/account-setup"
              className="text-neutral-500 hover:text-neutral-200 data-[active=true]:text-[#6b8fa3] transition-colors"
              activeProps={{ 'data-active': 'true' }}
            >
              Account Setup
            </Link>
            <Link
              to="/benchmark/data-table"
              className="text-neutral-500 hover:text-neutral-200 data-[active=true]:text-[#6b8fa3] transition-colors"
              activeProps={{ 'data-active': 'true' }}
            >
              Data Table
            </Link>
            <Link
              to="/benchmark/drag-drop"
              className="text-neutral-500 hover:text-neutral-200 data-[active=true]:text-[#6b8fa3] transition-colors"
              activeProps={{ 'data-active': 'true' }}
            >
              Drag & Drop
            </Link>
            <Link
              to="/benchmark/checkout-flow"
              className="text-neutral-500 hover:text-neutral-200 data-[active=true]:text-[#6b8fa3] transition-colors"
              activeProps={{ 'data-active': 'true' }}
            >
              Checkout Flow
            </Link>
            <Link
              to="/benchmark/accessibility"
              className="text-neutral-500 hover:text-neutral-200 data-[active=true]:text-[#6b8fa3] transition-colors"
              activeProps={{ 'data-active': 'true' }}
            >
              Accessibility
            </Link>
            <Link
              to="/benchmark/error-states"
              className="text-neutral-500 hover:text-neutral-200 data-[active=true]:text-[#6b8fa3] transition-colors"
              activeProps={{ 'data-active': 'true' }}
            >
              Error States
            </Link>
            <Link
              to="/benchmark/infinite-scroll"
              className="text-neutral-500 hover:text-neutral-200 data-[active=true]:text-[#6b8fa3] transition-colors"
              activeProps={{ 'data-active': 'true' }}
            >
              Infinite Scroll
            </Link>
            <Link
              to="/test"
              className="text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              Tests
            </Link>
          </nav>
        </div>
      </header>
      <main className={sectionClass}>
        <Outlet />
      </main>
      <footer className={`${containerClass} px-4 p-4 text-neutral-600 text-sm`}>
        All data and latency are simulated locally.
      </footer>
    </div>
  )
}

export function TestLayout({ children }: { children?: ReactNode }) {
  return <>{children ?? <Outlet />}</>
}

export function TestNav({ slug }: { slug: TestSlug }) {
  return (
    <header className="border-b border-neutral-800 bg-black" role="banner">
      <nav
        className={`${containerClass} flex items-center justify-between px-4 py-4`}
        aria-label="Primary"
      >
        <a href={testPagePaths[slug]} className="font-semibold text-neutral-300 hover:text-neutral-100 transition-colors">
          browser
        </a>
        <a href={testBlogPaths[slug]} className="test-link text-[#6b8fa3] hover:text-[#8bb0c4] transition-colors">
          Blog
        </a>
      </nav>
    </header>
  )
}
