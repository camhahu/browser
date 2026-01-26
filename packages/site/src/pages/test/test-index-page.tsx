import { Link } from '@tanstack/react-router'
import { labelClass, mutedClass, sectionClass } from '../../components/layout'
import { testPages } from '../../data/test-pages'

export function TestIndexPage() {
  return (
    <section className={`${sectionClass} space-y-4`}>
      <div className="space-y-4">
        <p className={labelClass}>Test pages</p>
        <h1 className="font-semibold">CLI test pages</h1>
        <p className={mutedClass}>
          Each route mirrors a CLI test file with stable selectors and content.
        </p>
      </div>
      <div className="space-y-4">
        {testPages.map((page) => (
          <Link
            key={page.slug}
            to="/test/$slug"
            params={{ slug: page.slug }}
            className="block border-t border-neutral-800 pt-4"
          >
            <p className="font-semibold">{page.title}</p>
            <p className={mutedClass}>/test/{page.slug}</p>
            <p className={mutedClass}>{page.description}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
