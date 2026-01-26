export type Card = {
  id: string
  title: string
  assignee: string
  priority: 'low' | 'medium' | 'high'
}

export type Column = {
  id: string
  title: string
  cards: Card[]
}

export const initialColumns: Column[] = [
  {
    id: 'backlog',
    title: 'Backlog',
    cards: [
      { id: 'card-1', title: 'Research competitor features', assignee: 'Alice', priority: 'low' },
      { id: 'card-2', title: 'Write API documentation', assignee: 'Bob', priority: 'medium' },
      { id: 'card-3', title: 'Design system audit', assignee: 'Carol', priority: 'low' },
    ],
  },
  {
    id: 'todo',
    title: 'To Do',
    cards: [
      { id: 'card-4', title: 'Implement user auth', assignee: 'David', priority: 'high' },
      { id: 'card-5', title: 'Set up CI pipeline', assignee: 'Eva', priority: 'medium' },
    ],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    cards: [
      { id: 'card-6', title: 'Build dashboard UI', assignee: 'Frank', priority: 'high' },
      { id: 'card-7', title: 'Database schema migration', assignee: 'Grace', priority: 'high' },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    cards: [
      { id: 'card-8', title: 'Project kickoff meeting', assignee: 'Henry', priority: 'medium' },
    ],
  },
]

export const priorityColors = {
  low: 'bg-zinc-100 text-zinc-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-red-100 text-red-700',
} as const
