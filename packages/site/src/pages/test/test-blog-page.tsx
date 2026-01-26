import {
  mutedClass,
  panelClass,
  sectionClass,
  TestNav,
} from '../../components/layout'
import { getTestPage, type TestSlug } from '../../data/test-pages'
import { useParams } from '@tanstack/react-router'

export function TestBlogPage() {
  const { slug } = useParams({ strict: false }) as { slug: TestSlug }
  const page = getTestPage(slug)

  return (
    <section className="space-y-4">
      <TestNav slug={page.slug} />
      <main className={`${sectionClass} space-y-4`} role="main" tabIndex={-1}>
        <div className={panelClass}>
          <h1 className="font-semibold">Blog</h1>
          <p className={mutedClass}>Secondary route for navigation tests.</p>
        </div>
        <div className="border border-dashed border-neutral-800 p-4 min-h-[120vh]">
          <p className="font-semibold">Notes</p>
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
