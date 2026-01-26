import { Link, Outlet } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import {
  testBlogPaths,
  testPagePaths,
  type TestSlug,
} from '../data/testPages'

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
              to="/benchmark/1"
              className="data-[active=true]:underline"
              activeProps={{ 'data-active': 'true' }}
            >
              Benchmark 1
            </Link>
            <Link
              to="/benchmark/1/settings"
              className="data-[active=true]:underline"
              activeProps={{ 'data-active': 'true' }}
            >
              Settings
            </Link>
            <Link
              to="/benchmark/2"
              className="data-[active=true]:underline"
              activeProps={{ 'data-active': 'true' }}
            >
              Benchmark 2
            </Link>
            <Link
              to="/benchmark/3"
              className="data-[active=true]:underline"
              activeProps={{ 'data-active': 'true' }}
            >
              Benchmark 3
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
