import { useEffect, useMemo, useRef, useState } from 'react'
import {
  buttonGhost,
  buttonPrimary,
  inputBase,
  labelClass,
  mutedClass,
  panelClass,
} from '../../components/layout'
import {
  departments,
  initialUsers,
  roles,
  statuses,
  type User,
} from '../../data/benchmark-2-data'

type SortField = 'name' | 'email' | 'role' | 'status' | 'lastActive' | 'department'
type SortDirection = 'asc' | 'desc'

const PAGE_SIZE = 5

export function DataTablePage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterDepartment, setFilterDepartment] = useState<string>('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'name' | 'email' } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [actionNotice, setActionNotice] = useState('')
  const lastSelectedIndex = useRef<number | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIsLoading(true)
    const timeout = window.setTimeout(() => {
      setUsers(initialUsers)
      setIsLoading(false)
    }, 800)
    return () => window.clearTimeout(timeout)
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setCurrentPage(1)
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [searchQuery])

  useEffect(() => {
    if (editingCell) {
      editInputRef.current?.focus()
      editInputRef.current?.select()
    }
  }, [editingCell])

  const filteredUsers = useMemo(() => {
    let result = users

    if (debouncedQuery) {
      const query = debouncedQuery.toLowerCase()
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      )
    }

    if (filterStatus) {
      result = result.filter((user) => user.status === filterStatus)
    }

    if (filterDepartment) {
      result = result.filter((user) => user.department === filterDepartment)
    }

    return result
  }, [users, debouncedQuery, filterStatus, filterDepartment])

  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers]
    sorted.sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      const comparison = aVal.localeCompare(bVal)
      return sortDirection === 'asc' ? comparison : -comparison
    })
    return sorted
  }, [filteredUsers, sortField, sortDirection])

  const totalPages = Math.ceil(sortedUsers.length / PAGE_SIZE)
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleRowSelect = (id: string, index: number, event: React.MouseEvent) => {
    const newSelected = new Set(selectedIds)

    if (event.shiftKey && lastSelectedIndex.current !== null) {
      const start = Math.min(lastSelectedIndex.current, index)
      const end = Math.max(lastSelectedIndex.current, index)
      for (let i = start; i <= end; i++) {
        newSelected.add(paginatedUsers[i].id)
      }
    } else {
      if (newSelected.has(id)) {
        newSelected.delete(id)
      } else {
        newSelected.add(id)
      }
    }

    setSelectedIds(newSelected)
    lastSelectedIndex.current = index
  }

  const handleSelectAll = () => {
    if (selectedIds.size === paginatedUsers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedUsers.map((u) => u.id)))
    }
  }

  const handleDeleteSelected = () => {
    setIsLoading(true)
    window.setTimeout(() => {
      setUsers(users.filter((u) => !selectedIds.has(u.id)))
      setActionNotice(`Deleted ${selectedIds.size} user(s).`)
      setSelectedIds(new Set())
      setIsLoading(false)
    }, 500)
  }

  const handleExportSelected = () => {
    const selectedUsers = users.filter((u) => selectedIds.has(u.id))
    const csv = [
      ['Name', 'Email', 'Role', 'Status', 'Department', 'Last Active'].join(','),
      ...selectedUsers.map((u) =>
        [u.name, u.email, u.role, u.status, u.department, u.lastActive].join(',')
      ),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users-export.csv'
    a.click()
    URL.revokeObjectURL(url)
    setActionNotice(`Exported ${selectedIds.size} user(s).`)
  }

  const handleStartEdit = (user: User, field: 'name' | 'email') => {
    setEditingCell({ id: user.id, field })
    setEditValue(user[field])
  }

  const handleSaveEdit = () => {
    if (!editingCell) return
    setUsers(
      users.map((u) =>
        u.id === editingCell.id ? { ...u, [editingCell.field]: editValue } : u
      )
    )
    setEditingCell(null)
    setEditValue('')
  }

  const handleCancelEdit = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const handleEditKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSaveEdit()
    } else if (event.key === 'Escape') {
      handleCancelEdit()
    }
  }

  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return ''
    return sortDirection === 'asc' ? ' ↑' : ' ↓'
  }

  const getStatusBadge = (status: User['status']) => {
    const colors = {
      active: 'bg-emerald-900/50 text-emerald-300',
      inactive: 'bg-neutral-800 text-neutral-400',
      pending: 'bg-amber-900/50 text-amber-300',
    }
    return (
      <span className={`inline-block px-2 py-1 text-sm ${colors[status]}`}>
        {status}
      </span>
    )
  }

  const renderSkeleton = () => (
    <div className="space-y-2">
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          <div className="h-10 w-8 bg-neutral-800" />
          <div className="h-10 flex-1 bg-neutral-800" />
          <div className="h-10 flex-1 bg-neutral-800" />
          <div className="h-10 w-24 bg-neutral-800" />
          <div className="h-10 w-24 bg-neutral-800" />
          <div className="h-10 w-28 bg-neutral-800" />
          <div className="h-10 w-28 bg-neutral-800" />
        </div>
      ))}
    </div>
  )

  const renderEmptyState = () => (
    <div className="py-12 text-center">
      <p className="font-semibold">No users found</p>
      <p className={mutedClass}>Try adjusting your search or filters.</p>
      <button
        className={`${buttonGhost} mt-4`}
        type="button"
        onClick={() => {
          setSearchQuery('')
          setFilterStatus('')
          setFilterDepartment('')
        }}
      >
        Clear filters
      </button>
    </div>
  )

  return (
    <section className="space-y-4">
      <div className="space-y-4">
        <div className="space-y-4">
          <p className={labelClass}>Benchmark 2 · Data table</p>
          <h1 className="font-semibold">User management table</h1>
          <p className={mutedClass}>
            A data table with sorting, filtering, pagination, inline editing, and
            bulk actions. All operations are mocked locally for evaluation benchmarks.
          </p>
        </div>
      </div>

      <div className={`${panelClass} space-y-4`}>
        <div className="space-y-4">
          <h2 className="font-semibold">Filters</h2>
          <label className="grid gap-2">
            <span className="text-sm font-semibold">Search</span>
            <input
              className={inputBase}
              type="text"
              name="search"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold">Status</span>
            <select
              className={inputBase}
              name="status"
              value={filterStatus}
              onChange={(event) => {
                setFilterStatus(event.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="">All statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold">Department</span>
            <select
              className={inputBase}
              name="department"
              value={filterDepartment}
              onChange={(event) => {
                setFilterDepartment(event.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="">All departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="md:col-span-2 space-y-4">
        {selectedIds.size > 0 ? (
          <div className="flex items-center gap-4 border border-neutral-800 p-4">
            <span className="font-semibold">{selectedIds.size} selected</span>
            <button
              className={buttonGhost}
              type="button"
              onClick={handleDeleteSelected}
              disabled={isLoading}
            >
              Delete selected
            </button>
            <button
              className={buttonGhost}
              type="button"
              onClick={handleExportSelected}
            >
              Export selected
            </button>
            <button
              className={buttonGhost}
              type="button"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear selection
            </button>
          </div>
        ) : null}

        {actionNotice ? (
          <div className="flex items-center justify-between border border-neutral-800 bg-neutral-900 p-4">
            <span>{actionNotice}</span>
            <button
              className={buttonGhost}
              type="button"
              onClick={() => setActionNotice('')}
            >
              Dismiss
            </button>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          {isLoading ? (
            renderSkeleton()
          ) : sortedUsers.length === 0 ? (
            renderEmptyState()
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-zinc-900/20">
                  <th className="p-2 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === paginatedUsers.length && paginatedUsers.length > 0}
                      onChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="p-2 text-left">
                    <button
                      type="button"
                      className="font-semibold hover:underline"
                      onClick={() => handleSort('name')}
                    >
                      Name{getSortIndicator('name')}
                    </button>
                  </th>
                  <th className="p-2 text-left">
                    <button
                      type="button"
                      className="font-semibold hover:underline"
                      onClick={() => handleSort('email')}
                    >
                      Email{getSortIndicator('email')}
                    </button>
                  </th>
                  <th className="p-2 text-left">
                    <button
                      type="button"
                      className="font-semibold hover:underline"
                      onClick={() => handleSort('role')}
                    >
                      Role{getSortIndicator('role')}
                    </button>
                  </th>
                  <th className="p-2 text-left">
                    <button
                      type="button"
                      className="font-semibold hover:underline"
                      onClick={() => handleSort('status')}
                    >
                      Status{getSortIndicator('status')}
                    </button>
                  </th>
                  <th className="p-2 text-left">
                    <button
                      type="button"
                      className="font-semibold hover:underline"
                      onClick={() => handleSort('department')}
                    >
                      Department{getSortIndicator('department')}
                    </button>
                  </th>
                  <th className="p-2 text-left">
                    <button
                      type="button"
                      className="font-semibold hover:underline"
                      onClick={() => handleSort('lastActive')}
                    >
                      Last Active{getSortIndicator('lastActive')}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`border-b border-neutral-800/50 ${selectedIds.has(user.id) ? 'bg-neutral-800/50' : ''}`}
                  >
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(user.id)}
                        onChange={(e) => handleRowSelect(user.id, index, e as unknown as React.MouseEvent)}
                        onClick={(e) => handleRowSelect(user.id, index, e)}
                        aria-label={`Select ${user.name}`}
                      />
                    </td>
                    <td className="p-2">
                      {editingCell?.id === user.id && editingCell?.field === 'name' ? (
                        <input
                          ref={editInputRef}
                          className={`${inputBase} w-full`}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyDown={handleEditKeyDown}
                        />
                      ) : (
                        <button
                          type="button"
                          className="hover:underline text-left"
                          onClick={() => handleStartEdit(user, 'name')}
                          title="Click to edit"
                        >
                          {user.name}
                        </button>
                      )}
                    </td>
                    <td className="p-2">
                      {editingCell?.id === user.id && editingCell?.field === 'email' ? (
                        <input
                          ref={editInputRef}
                          className={`${inputBase} w-full`}
                          type="email"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyDown={handleEditKeyDown}
                        />
                      ) : (
                        <button
                          type="button"
                          className="hover:underline text-left"
                          onClick={() => handleStartEdit(user, 'email')}
                          title="Click to edit"
                        >
                          {user.email}
                        </button>
                      )}
                    </td>
                    <td className="p-2">{user.role}</td>
                    <td className="p-2">{getStatusBadge(user.status)}</td>
                    <td className="p-2">{user.department}</td>
                    <td className="p-2">{user.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!isLoading && sortedUsers.length > 0 ? (
          <div className="flex items-center justify-between">
            <span className={mutedClass}>
              Showing {(currentPage - 1) * PAGE_SIZE + 1}-
              {Math.min(currentPage * PAGE_SIZE, sortedUsers.length)} of{' '}
              {sortedUsers.length} users
            </span>
            <div className="flex gap-2">
              <button
                className={buttonGhost}
                type="button"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={page === currentPage ? buttonPrimary : buttonGhost}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className={buttonGhost}
                type="button"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
