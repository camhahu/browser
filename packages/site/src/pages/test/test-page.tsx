import {
  buttonGhost,
  inputBase,
  labelClass,
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
  const inputId = `test-input-${slug}`
  const selectId = `test-select-${slug}`
  const sourceId = `test-source-${slug}`
  const targetId = `test-target-${slug}`

  return (
    <section className="space-y-4">
      <TestNav slug={page.slug} />
      <main className={`${sectionClass} space-y-4`} role="main" tabIndex={-1}>
        <div className={panelClass}>
          <p className={labelClass}>Test page · {slug}</p>
          <h1 className="font-semibold">{page.title}</h1>
          <p className={mutedClass}>
            Hey there — this is the browser CLI test page. {page.description}
          </p>
        </div>
        <div className={panelClass}>
          <label className="grid gap-4" htmlFor={inputId}>
            <span className="font-semibold">Test input</span>
            <input
              id={inputId}
              className={inputBase}
              type="text"
              placeholder="Type here"
            />
          </label>
          <label className="grid gap-4" htmlFor={selectId}>
            <span className="font-semibold">Test select</span>
            <select id={selectId} className={inputBase} defaultValue="green">
              <option value="red">Red</option>
              <option value="green">Green</option>
            </select>
          </label>
          <div className="flex gap-4">
            <div id={sourceId} className="border border-zinc-900/20 px-4 py-4">
              Source
            </div>
            <div id={targetId} className="border border-zinc-900/20 px-4 py-4">
              Target
            </div>
          </div>
        </div>
        <div className={panelClass}>
          <h2 className="font-semibold">Selector targets</h2>
          <p className={mutedClass}>
            Use this area for text, html, and outline commands. The navigation
            and blog links are stable anchors for click and find tests.
          </p>
          <button className={buttonGhost} type="button">
            Trigger action
          </button>
        </div>
        <div className="border border-dashed border-zinc-900/20 p-4 min-h-[120vh]">
          <p className="font-semibold">Scrollable content</p>
          <p className={mutedClass}>
            This block intentionally extends the page height so scroll commands
            have a stable target to move the viewport.
          </p>
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
