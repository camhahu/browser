import { useEffect, useRef, useState } from 'react'
import {
  buttonGhost,
  buttonPrimary,
  inputBase,
  labelClass,
  mutedClass,
  panelClass,
} from '../../components/layout'
import {
  autocompleteSuggestions,
  menuItems,
  treeData,
  type MenuItem,
  type TreeNode,
} from '../../data/benchmark-8-data'

export function AccessibilityPage() {
  const [liveMessage, setLiveMessage] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedMenuItem, setSelectedMenuItem] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['src']))
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [comboValue, setComboValue] = useState('')
  const [comboOpen, setComboOpen] = useState(false)
  const [comboIndex, setComboIndex] = useState(-1)
  const [tabIndex, setTabIndex] = useState(0)

  const dialogRef = useRef<HTMLDivElement>(null)
  const dialogFirstFocusRef = useRef<HTMLButtonElement>(null)
  const dialogLastFocusRef = useRef<HTMLButtonElement>(null)
  const menuBarRef = useRef<HTMLDivElement>(null)
  const treeRef = useRef<HTMLDivElement>(null)
  const comboInputRef = useRef<HTMLInputElement>(null)
  const comboListRef = useRef<HTMLUListElement>(null)
  const mainContentRef = useRef<HTMLDivElement>(null)

  const announce = (message: string) => {
    setLiveMessage(message)
    window.setTimeout(() => setLiveMessage(''), 1000)
  }

  // Focus trap for dialog
  useEffect(() => {
    if (!dialogOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDialogOpen(false)
        announce('Dialog closed')
        return
      }
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === dialogFirstFocusRef.current) {
          e.preventDefault()
          dialogLastFocusRef.current?.focus()
        } else if (!e.shiftKey && document.activeElement === dialogLastFocusRef.current) {
          e.preventDefault()
          dialogFirstFocusRef.current?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    dialogFirstFocusRef.current?.focus()

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [dialogOpen])

  // Combobox filtering
  const filteredSuggestions = autocompleteSuggestions.filter((s) =>
    s.toLowerCase().includes(comboValue.toLowerCase())
  )

  const handleComboKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setComboOpen(true)
      setComboIndex((prev) => Math.min(prev + 1, filteredSuggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setComboIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && comboIndex >= 0) {
      e.preventDefault()
      setComboValue(filteredSuggestions[comboIndex])
      setComboOpen(false)
      setComboIndex(-1)
      announce(`Selected ${filteredSuggestions[comboIndex]}`)
    } else if (e.key === 'Escape') {
      setComboOpen(false)
      setComboIndex(-1)
    }
  }

  // Menu bar keyboard navigation
  const handleMenuBarKeyDown = (e: React.KeyboardEvent, menuId: string, menuIndex: number) => {
    const menu = menuItems.find((m) => m.id === menuId)
    if (!menu) return

    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const nextIndex = (menuIndex + 1) % menuItems.length
      setOpenMenuId(menuItems[nextIndex].id)
      const nextButton = menuBarRef.current?.querySelector(`[data-menu-id="${menuItems[nextIndex].id}"]`) as HTMLElement
      nextButton?.focus()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prevIndex = (menuIndex - 1 + menuItems.length) % menuItems.length
      setOpenMenuId(menuItems[prevIndex].id)
      const prevButton = menuBarRef.current?.querySelector(`[data-menu-id="${menuItems[prevIndex].id}"]`) as HTMLElement
      prevButton?.focus()
    } else if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpenMenuId(menuId)
    } else if (e.key === 'Escape') {
      setOpenMenuId(null)
    }
  }

  const handleMenuItemKeyDown = (e: React.KeyboardEvent, menu: MenuItem, itemIndex: number) => {
    const children = menu.children || []

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const nextIndex = (itemIndex + 1) % children.length
      const nextItem = document.querySelector(`[data-menuitem-id="${children[nextIndex].id}"]`) as HTMLElement
      nextItem?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prevIndex = (itemIndex - 1 + children.length) % children.length
      const prevItem = document.querySelector(`[data-menuitem-id="${children[prevIndex].id}"]`) as HTMLElement
      prevItem?.focus()
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setSelectedMenuItem(children[itemIndex].id)
      setOpenMenuId(null)
      announce(`${children[itemIndex].label} activated`)
    } else if (e.key === 'Escape') {
      setOpenMenuId(null)
      const menuButton = menuBarRef.current?.querySelector(`[data-menu-id="${menu.id}"]`) as HTMLElement
      menuButton?.focus()
    }
  }

  // Tree view keyboard navigation
  const flattenTree = (nodes: TreeNode[], parentPath: string[] = []): { node: TreeNode; path: string[] }[] => {
    const result: { node: TreeNode; path: string[] }[] = []
    for (const node of nodes) {
      const path = [...parentPath, node.id]
      result.push({ node, path })
      if (node.children && expandedNodes.has(node.id)) {
        result.push(...flattenTree(node.children, path))
      }
    }
    return result
  }

  const flatTree = flattenTree(treeData)

  const handleTreeKeyDown = (e: React.KeyboardEvent, nodeId: string) => {
    const currentIndex = flatTree.findIndex((item) => item.node.id === nodeId)
    const currentItem = flatTree[currentIndex]
    if (!currentItem) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const nextIndex = Math.min(currentIndex + 1, flatTree.length - 1)
      setSelectedNode(flatTree[nextIndex].node.id)
      const nextEl = treeRef.current?.querySelector(`[data-tree-id="${flatTree[nextIndex].node.id}"]`) as HTMLElement
      nextEl?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prevIndex = Math.max(currentIndex - 1, 0)
      setSelectedNode(flatTree[prevIndex].node.id)
      const prevEl = treeRef.current?.querySelector(`[data-tree-id="${flatTree[prevIndex].node.id}"]`) as HTMLElement
      prevEl?.focus()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      if (currentItem.node.children && !expandedNodes.has(nodeId)) {
        setExpandedNodes((prev) => new Set([...prev, nodeId]))
        announce(`${currentItem.node.label} expanded`)
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      if (currentItem.node.children && expandedNodes.has(nodeId)) {
        setExpandedNodes((prev) => {
          const next = new Set(prev)
          next.delete(nodeId)
          return next
        })
        announce(`${currentItem.node.label} collapsed`)
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setSelectedNode(nodeId)
      announce(`${currentItem.node.label} selected`)
    }
  }

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = !!node.children
    const isSelected = selectedNode === node.id

    return (
      <div key={node.id} role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined} aria-selected={isSelected}>
        <div
          data-tree-id={node.id}
          tabIndex={isSelected ? 0 : -1}
          className={`flex items-center gap-2 px-2 py-1 cursor-pointer outline-none focus:bg-neutral-700 ${isSelected ? 'bg-neutral-800' : ''}`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            setSelectedNode(node.id)
            if (hasChildren) {
              setExpandedNodes((prev) => {
                const next = new Set(prev)
                if (next.has(node.id)) {
                  next.delete(node.id)
                } else {
                  next.add(node.id)
                }
                return next
              })
            }
          }}
          onKeyDown={(e) => handleTreeKeyDown(e, node.id)}
        >
          {hasChildren && (
            <span className="w-4 text-center">{isExpanded ? '▼' : '▶'}</span>
          )}
          {!hasChildren && <span className="w-4" />}
          <span>{node.label}</span>
        </div>
        {hasChildren && isExpanded && (
          <div role="group">
            {node.children!.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const handleSkipToMain = () => {
    mainContentRef.current?.focus()
    announce('Skipped to main content')
  }

  const tabs = ['Overview', 'Menu Bar', 'Tree View', 'Combobox']

  return (
    <section className="space-y-4">
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-[#485f6b] focus:text-white focus:px-4 focus:py-2"
        onClick={(e) => {
          e.preventDefault()
          handleSkipToMain()
        }}
      >
        Skip to main content
      </a>

      {/* ARIA live region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveMessage}
      </div>

      <div className="space-y-4">
        <div className="space-y-4">
          <p className={labelClass}>Accessibility</p>
          <h1 className="font-semibold">Keyboard navigation</h1>
          <p className={mutedClass}>
            Test keyboard-only navigation patterns including tab order, arrow keys,
            focus traps, skip links, and ARIA live regions.
          </p>
        </div>
      </div>

      {/* Tab list */}
      <div
        role="tablist"
        aria-label="Accessibility demos"
        className="flex border-b border-neutral-800"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab}
            role="tab"
            aria-selected={tabIndex === index}
            aria-controls={`panel-${index}`}
            id={`tab-${index}`}
            tabIndex={tabIndex === index ? 0 : -1}
            className={`px-4 py-2 border-b-2 ${tabIndex === index ? 'border-[#6b8fa3] font-semibold' : 'border-transparent'}`}
            onClick={() => {
              setTabIndex(index)
              announce(`${tab} tab selected`)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') {
                e.preventDefault()
                const next = (index + 1) % tabs.length
                setTabIndex(next)
                const nextTab = document.getElementById(`tab-${next}`)
                nextTab?.focus()
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault()
                const prev = (index - 1 + tabs.length) % tabs.length
                setTabIndex(prev)
                const prevTab = document.getElementById(`tab-${prev}`)
                prevTab?.focus()
              }
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div
        id="main-content"
        ref={mainContentRef}
        tabIndex={-1}
        className="outline-none"
      >
        {/* Overview panel */}
        <div
          role="tabpanel"
          id="panel-0"
          aria-labelledby="tab-0"
          hidden={tabIndex !== 0}
          className={`${panelClass} space-y-4`}
        >
          <h2 className="font-semibold">Keyboard Navigation Overview</h2>
          <p>This benchmark tests several accessibility patterns:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Skip link</strong> - Press Tab on page load to reveal skip link</li>
            <li><strong>Tab panels</strong> - Use arrow keys to navigate tabs</li>
            <li><strong>Menu bar</strong> - Arrow keys navigate menus, Enter selects</li>
            <li><strong>Tree view</strong> - Arrow keys navigate, left/right expand/collapse</li>
            <li><strong>Combobox</strong> - Type to filter, arrows to select, Enter to confirm</li>
            <li><strong>Focus trap</strong> - Tab cycles within open dialogs</li>
            <li><strong>Live regions</strong> - Actions are announced to screen readers</li>
          </ul>
          <button
            type="button"
            className={buttonPrimary}
            onClick={() => {
              setDialogOpen(true)
              announce('Dialog opened')
            }}
          >
            Open focus trap dialog
          </button>
        </div>

        {/* Menu bar panel */}
        <div
          role="tabpanel"
          id="panel-1"
          aria-labelledby="tab-1"
          hidden={tabIndex !== 1}
          className={`${panelClass} space-y-4`}
        >
          <h2 className="font-semibold">Menu Bar</h2>
          <p className={mutedClass}>Use arrow keys to navigate. Enter or Space to select.</p>
          <div
            ref={menuBarRef}
            role="menubar"
            aria-label="Application menu"
            className="flex border border-neutral-800"
          >
            {menuItems.map((menu, menuIndex) => (
              <div key={menu.id} className="relative">
                <button
                  data-menu-id={menu.id}
                  role="menuitem"
                  aria-haspopup="true"
                  aria-expanded={openMenuId === menu.id}
                  className={`px-4 py-2 ${openMenuId === menu.id ? 'bg-neutral-800' : ''}`}
                  onClick={() => setOpenMenuId(openMenuId === menu.id ? null : menu.id)}
                  onKeyDown={(e) => handleMenuBarKeyDown(e, menu.id, menuIndex)}
                >
                  {menu.label}
                </button>
                {openMenuId === menu.id && menu.children && (
                  <div
                    role="menu"
                    aria-label={menu.label}
                    className="absolute top-full left-0 bg-neutral-900 border border-neutral-800 min-w-[200px] z-10"
                  >
                    {menu.children.map((item, itemIndex) => (
                      <button
                        key={item.id}
                        data-menuitem-id={item.id}
                        role="menuitem"
                        tabIndex={-1}
                        className={`w-full px-4 py-2 text-left flex justify-between items-center hover:bg-neutral-800 focus:bg-neutral-800 outline-none ${selectedMenuItem === item.id ? 'bg-neutral-800/50' : ''}`}
                        onClick={() => {
                          setSelectedMenuItem(item.id)
                          setOpenMenuId(null)
                          announce(`${item.label} activated`)
                        }}
                        onKeyDown={(e) => handleMenuItemKeyDown(e, menu, itemIndex)}
                      >
                        <span>{item.label}</span>
                        {item.shortcut && <span className={mutedClass}>{item.shortcut}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {selectedMenuItem && (
            <p className="text-sm">Last action: <strong>{selectedMenuItem}</strong></p>
          )}
        </div>

        {/* Tree view panel */}
        <div
          role="tabpanel"
          id="panel-2"
          aria-labelledby="tab-2"
          hidden={tabIndex !== 2}
          className={`${panelClass} space-y-4`}
        >
          <h2 className="font-semibold">Tree View</h2>
          <p className={mutedClass}>Use arrow keys to navigate. Left/Right to collapse/expand.</p>
          <div
            ref={treeRef}
            role="tree"
            aria-label="File explorer"
            className="border border-neutral-800 p-2 max-h-64 overflow-auto"
          >
            {treeData.map((node) => renderTreeNode(node))}
          </div>
          {selectedNode && (
            <p className="text-sm">Selected: <strong>{selectedNode}</strong></p>
          )}
        </div>

        {/* Combobox panel */}
        <div
          role="tabpanel"
          id="panel-3"
          aria-labelledby="tab-3"
          hidden={tabIndex !== 3}
          className={`${panelClass} space-y-4`}
        >
          <h2 className="font-semibold">Combobox / Autocomplete</h2>
          <p className={mutedClass}>Type to filter. Use arrow keys to navigate, Enter to select.</p>
          <div className="relative max-w-xs">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Select a fruit</span>
              <input
                ref={comboInputRef}
                type="text"
                role="combobox"
                aria-expanded={comboOpen}
                aria-autocomplete="list"
                aria-controls="combo-listbox"
                aria-activedescendant={comboIndex >= 0 ? `combo-option-${comboIndex}` : undefined}
                className={inputBase}
                value={comboValue}
                onChange={(e) => {
                  setComboValue(e.target.value)
                  setComboOpen(true)
                  setComboIndex(-1)
                }}
                onFocus={() => setComboOpen(true)}
                onBlur={() => window.setTimeout(() => setComboOpen(false), 200)}
                onKeyDown={handleComboKeyDown}
                placeholder="Type to search..."
              />
            </label>
            {comboOpen && filteredSuggestions.length > 0 && (
              <ul
                ref={comboListRef}
                id="combo-listbox"
                role="listbox"
                className="absolute top-full left-0 right-0 bg-neutral-900 border border-neutral-800 max-h-48 overflow-auto z-10"
              >
                {filteredSuggestions.map((suggestion, index) => (
                  <li
                    key={suggestion}
                    id={`combo-option-${index}`}
                    role="option"
                    aria-selected={comboIndex === index}
                    className={`px-3 py-2 cursor-pointer ${comboIndex === index ? 'bg-neutral-800' : ''}`}
                    onClick={() => {
                      setComboValue(suggestion)
                      setComboOpen(false)
                      setComboIndex(-1)
                      announce(`Selected ${suggestion}`)
                    }}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
            {comboOpen && filteredSuggestions.length === 0 && (
              <div className="absolute top-full left-0 right-0 bg-neutral-900 border border-neutral-800 p-3 text-center">
                <span className={mutedClass}>No results found</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Focus trap dialog */}
      {dialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDialogOpen(false)
              announce('Dialog closed')
            }
          }}
        >
          <div
            ref={dialogRef}
            className="bg-neutral-900 p-6 max-w-md w-full mx-4 space-y-4"
          >
            <h2 id="dialog-title" className="font-semibold text-lg">Focus Trap Dialog</h2>
            <p>
              Focus is trapped within this dialog. Press Tab to cycle through
              focusable elements. Press Escape to close.
            </p>
            <div className="flex gap-2">
              <button
                ref={dialogFirstFocusRef}
                type="button"
                className={buttonPrimary}
                onClick={() => {
                  setDialogOpen(false)
                  announce('Confirmed and closed')
                }}
              >
                Confirm
              </button>
              <button
                ref={dialogLastFocusRef}
                type="button"
                className={buttonGhost}
                onClick={() => {
                  setDialogOpen(false)
                  announce('Dialog closed')
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
