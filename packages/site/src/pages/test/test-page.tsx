import {
  mutedClass,
  panelClass,
  sectionClass,
  TestNav,
} from '../../components/layout'
import { getTestPage, type TestSlug } from '../../data/test-pages'
import { useParams } from '@tanstack/react-router'

export function TestPage() {
  const { slug } = useParams({ strict: false }) as { slug: TestSlug }
  const page = getTestPage(slug)

  return (
    <section className="space-y-4">
      <TestNav slug={page.slug} />
      <main className={`${sectionClass} space-y-4`} role="main" tabIndex={-1}>
        <div className={panelClass}>
          <h1 className="font-semibold">{page.title}</h1>
          <p className={mutedClass}>Hey there — {page.description}</p>
        </div>
        <div className="border border-dashed border-neutral-800 p-4 min-h-[120vh]">
          <p className="font-semibold">Scroll target</p>
          <ul className="list-disc space-y-4 pl-4">
            {Array.from({ length: 24 }).map((_, index) => (
              <li key={index}>Row {index + 1}</li>
            ))}
          </ul>
        </div>
      </main>
    </section>
  )
}
