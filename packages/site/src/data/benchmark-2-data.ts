export type User = {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive' | 'pending'
  lastActive: string
  department: string
}

export const departments = [
  'Engineering',
  'Design',
  'Product',
  'Marketing',
  'Sales',
  'Support',
] as const

export const roles = [
  'Admin',
  'Editor',
  'Viewer',
  'Guest',
] as const

export const statuses = ['active', 'inactive', 'pending'] as const

export const initialUsers: User[] = [
  { id: '1', name: 'Alice Chen', email: 'alice@browsercli.dev', role: 'Admin', status: 'active', lastActive: '2024-01-15', department: 'Engineering' },
  { id: '2', name: 'Bob Martinez', email: 'bob@browsercli.dev', role: 'Editor', status: 'active', lastActive: '2024-01-14', department: 'Design' },
  { id: '3', name: 'Carol Williams', email: 'carol@browsercli.dev', role: 'Viewer', status: 'inactive', lastActive: '2024-01-10', department: 'Product' },
  { id: '4', name: 'David Kim', email: 'david@browsercli.dev', role: 'Editor', status: 'active', lastActive: '2024-01-15', department: 'Engineering' },
  { id: '5', name: 'Eva Johnson', email: 'eva@browsercli.dev', role: 'Guest', status: 'pending', lastActive: '2024-01-12', department: 'Marketing' },
  { id: '6', name: 'Frank Brown', email: 'frank@browsercli.dev', role: 'Viewer', status: 'active', lastActive: '2024-01-13', department: 'Sales' },
  { id: '7', name: 'Grace Lee', email: 'grace@browsercli.dev', role: 'Admin', status: 'active', lastActive: '2024-01-15', department: 'Engineering' },
  { id: '8', name: 'Henry Davis', email: 'henry@browsercli.dev', role: 'Editor', status: 'inactive', lastActive: '2024-01-08', department: 'Support' },
  { id: '9', name: 'Ivy Wilson', email: 'ivy@browsercli.dev', role: 'Viewer', status: 'active', lastActive: '2024-01-14', department: 'Design' },
  { id: '10', name: 'Jack Taylor', email: 'jack@browsercli.dev', role: 'Guest', status: 'pending', lastActive: '2024-01-11', department: 'Product' },
  { id: '11', name: 'Karen Moore', email: 'karen@browsercli.dev', role: 'Editor', status: 'active', lastActive: '2024-01-15', department: 'Marketing' },
  { id: '12', name: 'Leo Anderson', email: 'leo@browsercli.dev', role: 'Viewer', status: 'active', lastActive: '2024-01-13', department: 'Sales' },
  { id: '13', name: 'Mia Thomas', email: 'mia@browsercli.dev', role: 'Admin', status: 'active', lastActive: '2024-01-15', department: 'Engineering' },
  { id: '14', name: 'Noah Jackson', email: 'noah@browsercli.dev', role: 'Editor', status: 'inactive', lastActive: '2024-01-07', department: 'Support' },
  { id: '15', name: 'Olivia White', email: 'olivia@browsercli.dev', role: 'Viewer', status: 'active', lastActive: '2024-01-14', department: 'Design' },
  { id: '16', name: 'Paul Harris', email: 'paul@browsercli.dev', role: 'Guest', status: 'active', lastActive: '2024-01-12', department: 'Product' },
  { id: '17', name: 'Quinn Martin', email: 'quinn@browsercli.dev', role: 'Editor', status: 'active', lastActive: '2024-01-15', department: 'Engineering' },
  { id: '18', name: 'Rachel Garcia', email: 'rachel@browsercli.dev', role: 'Viewer', status: 'pending', lastActive: '2024-01-09', department: 'Marketing' },
  { id: '19', name: 'Sam Robinson', email: 'sam@browsercli.dev', role: 'Admin', status: 'active', lastActive: '2024-01-15', department: 'Sales' },
  { id: '20', name: 'Tina Clark', email: 'tina@browsercli.dev', role: 'Editor', status: 'active', lastActive: '2024-01-14', department: 'Support' },
]
