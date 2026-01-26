import { Link, Outlet } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import {
  testBlogPaths,
  testPagePaths,
  type TestSlug,
} from '../data/test-pages'

export const containerClass = 'mx-auto w-full max-w-4xl'
export const sectionClass = `${containerClass} p-4`
export const panelClass = 'border border-zinc-900/20 p-4'
export const labelClass = 'text-zinc-600'
export const mutedClass = 'text-zinc-600'
export const buttonBase = 'border border-zinc-900/30 px-3 py-2'
export const buttonPrimary = `${buttonBase} bg-zinc-900 text-zinc-50`
export const buttonGhost = `${buttonBase} bg-transparent`
export const inputBase =
  'w-full border border-zinc-900/30 bg-white px-3 py-2 text-zinc-900 outline outline-2 outline-transparent focus:outline-zinc-900'

export function RootLayout() {
  return (
    <div className="min-h-screen text-zinc-900">
      <Outlet />
    </div>
  )
}

export function BenchmarkLayout() {
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
              to="/benchmark/account-setup"
              className="data-[active=true]:underline"
              activeProps={{ 'data-active': 'true' }}
            >
              Account Setup
            </Link>
            <Link
              to="/benchmark/data-table"
              className="data-[active=true]:underline"
              activeProps={{ 'data-active': 'true' }}
            >
              Data Table
            </Link>
            <Link
              to="/benchmark/drag-drop"
              className="data-[active=true]:underline"
              activeProps={{ 'data-active': 'true' }}
            >
              Drag & Drop
            </Link>
            <Link
              to="/benchmark/checkout-flow"
              className="data-[active=true]:underline"
              activeProps={{ 'data-active': 'true' }}
            >
              Checkout Flow
            </Link>
            <Link
              to="/benchmark/accessibility"
              className="data-[active=true]:underline"
              activeProps={{ 'data-active': 'true' }}
            >
              Accessibility
            </Link>
            <Link
              to="/benchmark/error-states"
              className="data-[active=true]:underline"
              activeProps={{ 'data-active': 'true' }}
            >
              Error States
            </Link>
            <Link
              to="/benchmark/infinite-scroll"
              className="data-[active=true]:underline"
              activeProps={{ 'data-active': 'true' }}
            >
              Infinite Scroll
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

export function TestLayout({ children }: { children?: ReactNode }) {
  return <>{children ?? <Outlet />}</>
}

export function TestNav({ slug }: { slug: TestSlug }) {
  return (
    <header className="border-b border-zinc-900/20" role="banner">
      <nav
        className={`${containerClass} flex items-center justify-between px-4 py-4`}
        aria-label="Primary"
      >
        <a href={testPagePaths[slug]} className="font-semibold">
          browser CLI
        </a>
        <a href={testBlogPaths[slug]} className="test-link underline">
          Blog
        </a>
      </nav>
    </header>
  )
}
