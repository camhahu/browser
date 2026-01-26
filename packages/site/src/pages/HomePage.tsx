import { Link } from '@tanstack/react-router'
import {
  buttonGhost,
  buttonPrimary,
  labelClass,
  mutedClass,
  sectionClass,
} from '../components/Layout'

export function HomePage() {
  return (
    <section className={`${sectionClass} space-y-4`}>
      <div className="space-y-4">
        <p className={labelClass}>browser CLI</p>
        <h1 className="font-semibold">Developer benchmark playground</h1>
        <p className={mutedClass}>
          Local pages that mirror common developer workflows for evaluation
          benchmarks.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link to="/benchmark/1" className={buttonPrimary}>
            Benchmark 1
          </Link>
          <Link to="/benchmark/2" className={buttonPrimary}>
            Benchmark 2
          </Link>
          <Link to="/benchmark/3" className={buttonPrimary}>
            Benchmark 3
          </Link>
          <Link to="/test" className={buttonGhost}>
            Test pages
          </Link>
        </div>
      </div>
      <div className="space-y-4">
        <div className="border-t border-zinc-900/20 pt-4">
          <p className="font-semibold">Benchmark 1 · Account setup</p>
          <p className={mutedClass}>
            Login, 2FA, profile, preferences, and async saves.
          </p>
        </div>
        <div className="border-t border-zinc-900/20 pt-4">
          <p className="font-semibold">Benchmark 2 · Data table</p>
          <p className={mutedClass}>
            Sort, filter, search, inline edit, and bulk actions.
          </p>
        </div>
        <div className="border-t border-zinc-900/20 pt-4">
          <p className="font-semibold">Benchmark 3 · Drag and drop</p>
          <p className={mutedClass}>
            Kanban board, reorder cards, drop zones, and undo/redo.
          </p>
        </div>
        <div className="border-t border-zinc-900/20 pt-4">
          <p className="font-semibold">Test pages</p>
          <p className={mutedClass}>
            One route per test file to anchor CLI command coverage.
          </p>
        </div>
        <div className="border-t border-zinc-900/20 pt-4">
          <p className="font-semibold">Offline by design</p>
          <p className={mutedClass}>
            No external network calls. All latency is mocked.
          </p>
        </div>
      </div>
    </section>
  )
}
