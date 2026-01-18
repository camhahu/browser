export type TestSlug =
  | 'page'
  | 'browser'
  | 'viewport'
  | 'cookies'
  | 'tabs'
  | 'useragent'
  | 'screenshot'
  | 'storage'
  | 'network'
  | 'content'
  | 'navigation'
  | 'config'

export type TestPageMeta = {
  slug: TestSlug
  title: string
  description: string
}

export const testPages: TestPageMeta[] = [
  {
    slug: 'page',
    title: 'Page commands',
    description: 'Find, click, scroll, and selection coverage.',
  },
  {
    slug: 'browser',
    title: 'Browser lifecycle',
    description: 'Start/stop and version verification page.',
  },
  {
    slug: 'viewport',
    title: 'Viewport controls',
    description: 'Device presets and custom dimensions.',
  },
  {
    slug: 'cookies',
    title: 'Cookies storage',
    description: 'Set, read, and delete cookie state.',
  },
  {
    slug: 'tabs',
    title: 'Tab management',
    description: 'Open, switch, and close tabs.',
  },
  {
    slug: 'useragent',
    title: 'User agent presets',
    description: 'Preview user agent overrides.',
  },
  {
    slug: 'screenshot',
    title: 'Screenshot captures',
    description: 'Static capture targets for image tests.',
  },
  {
    slug: 'storage',
    title: 'Local storage',
    description: 'Set, read, and delete storage values.',
  },
  {
    slug: 'network',
    title: 'Network logging',
    description: 'Mock network visibility for CLI checks.',
  },
  {
    slug: 'content',
    title: 'Content inspection',
    description: 'Text, HTML, and outline output.',
  },
  {
    slug: 'navigation',
    title: 'Navigation history',
    description: 'Navigate, back, forward, refresh.',
  },
  {
    slug: 'config',
    title: 'Configuration',
    description: 'Default settings reference page.',
  },
]

export const testPagePaths: Record<TestSlug, string> = {
  page: '/test/page',
  browser: '/test/browser',
  viewport: '/test/viewport',
  cookies: '/test/cookies',
  tabs: '/test/tabs',
  useragent: '/test/useragent',
  screenshot: '/test/screenshot',
  storage: '/test/storage',
  network: '/test/network',
  content: '/test/content',
  navigation: '/test/navigation',
  config: '/test/config',
}

export const testBlogPaths: Record<TestSlug, string> = {
  page: '/test/page/blog',
  browser: '/test/browser/blog',
  viewport: '/test/viewport/blog',
  cookies: '/test/cookies/blog',
  tabs: '/test/tabs/blog',
  useragent: '/test/useragent/blog',
  screenshot: '/test/screenshot/blog',
  storage: '/test/storage/blog',
  network: '/test/network/blog',
  content: '/test/content/blog',
  navigation: '/test/navigation/blog',
  config: '/test/config/blog',
}

export function getTestPage(slug: TestSlug): TestPageMeta {
  return testPages.find((page) => page.slug === slug) ?? testPages[0]
}
