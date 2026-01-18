import {
  labelClass,
  mutedClass,
  panelClass,
  sectionClass,
  TestNav,
} from '../../components/Layout'
import { getTestPage, type TestSlug } from '../../data/testPages'
import { useParams } from '@tanstack/react-router'

export function TestBlogPage() {
  const { slug } = useParams({ strict: false }) as { slug: TestSlug }
  const page = getTestPage(slug)

  return (
    <section className="space-y-4">
      <TestNav slug={page.slug} />
      <main className={`${sectionClass} space-y-4`} role="main" tabIndex={-1}>
        <div className={panelClass}>
          <p className={labelClass}>Blog · {slug}</p>
          <h1 className="font-semibold">Blog</h1>
          <p className={mutedClass}>
            A secondary route to validate navigation history and URL updates.
          </p>
        </div>
        <div className={panelClass}>
          <h2 className="font-semibold">Release notes</h2>
          <p className={mutedClass}>
            This section is intentionally brief. The goal is to keep navigation
            predictable while still providing semantic headings and paragraphs.
          </p>
        </div>
        <div className="border border-dashed border-zinc-900/20 p-4 min-h-[120vh]">
          <p className="font-semibold">Additional notes</p>
          <p className={mutedClass}>
            Extra content to ensure the page scrolls for navigation tests.
          </p>
          <ul className="list-disc space-y-4 pl-4">
            {Array.from({ length: 16 }).map((_, index) => (
              <li key={index}>Update {index + 1}</li>
            ))}
          </ul>
        </div>
      </main>
    </section>
  )
}
