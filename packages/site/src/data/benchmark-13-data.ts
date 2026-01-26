export type FeedItem = {
  id: string
  title: string
  author: string
  timestamp: string
  preview: string
  category: string
}

const categories = ['Engineering', 'Design', 'Product', 'Marketing', 'Announcements']
const authors = ['Alice Chen', 'Bob Martinez', 'Carol Williams', 'David Kim', 'Eva Johnson', 'Frank Brown', 'Grace Lee']

const titlePrefixes = [
  'Introducing',
  'How to',
  'Understanding',
  'Building',
  'Optimizing',
  'Deep dive into',
  'Getting started with',
  'Best practices for',
  'A guide to',
  'Exploring',
]

const titleSubjects = [
  'React Server Components',
  'TypeScript Generics',
  'CSS Grid Layouts',
  'API Design Patterns',
  'Database Indexing',
  'Authentication Flows',
  'Performance Monitoring',
  'Error Handling',
  'State Management',
  'Testing Strategies',
  'CI/CD Pipelines',
  'Microservices',
  'GraphQL Schemas',
  'WebSocket Connections',
  'Caching Strategies',
]

export function generateFeedItem(index: number): FeedItem {
  const prefix = titlePrefixes[index % titlePrefixes.length]
  const subject = titleSubjects[index % titleSubjects.length]
  const author = authors[index % authors.length]
  const category = categories[index % categories.length]

  const daysAgo = Math.floor(index / 3)
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  const timestamp = date.toISOString().split('T')[0]

  return {
    id: `item-${index + 1}`,
    title: `${prefix} ${subject}`,
    author,
    timestamp,
    preview: `Learn about ${subject.toLowerCase()} and how it can improve your development workflow. This comprehensive guide covers everything you need to know.`,
    category,
  }
}

export function generateFeedItems(start: number, count: number): FeedItem[] {
  return Array.from({ length: count }, (_, i) => generateFeedItem(start + i))
}

export const ITEMS_PER_PAGE = 20
export const TOTAL_ITEMS = 500
export const ITEM_HEIGHT = 120
