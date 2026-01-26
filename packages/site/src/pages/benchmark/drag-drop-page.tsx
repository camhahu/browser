import { useEffect, useRef, useState } from 'react'
import {
  buttonGhost,
  labelClass,
  mutedClass,
  panelClass,
} from '../../components/layout'
import {
  initialColumns,
  priorityColors,
  type Card,
  type Column,
} from '../../data/benchmark-3-data'

type DragState = {
  cardId: string
  sourceColumnId: string
  sourceIndex: number
} | null

type HistoryEntry = Column[]

export function DragDropPage() {
  const [columns, setColumns] = useState<Column[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dragState, setDragState] = useState<DragState>(null)
  const [dropTarget, setDropTarget] = useState<{ columnId: string; index: number } | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [actionNotice, setActionNotice] = useState('')
  const draggedCardRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setIsLoading(true)
    const timeout = window.setTimeout(() => {
      setColumns(initialColumns)
      setHistory([initialColumns])
      setHistoryIndex(0)
      setIsLoading(false)
    }, 600)
    return () => window.clearTimeout(timeout)
  }, [])

  const pushHistory = (newColumns: Column[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newColumns)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setColumns(history[historyIndex - 1])
      setActionNotice('Undid last action.')
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setColumns(history[historyIndex + 1])
      setActionNotice('Redid last action.')
    }
  }

  const handleDragStart = (
    event: React.DragEvent,
    cardId: string,
    columnId: string,
    cardIndex: number
  ) => {
    setDragState({ cardId, sourceColumnId: columnId, sourceIndex: cardIndex })
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', cardId)
    if (draggedCardRef.current) {
      draggedCardRef.current.style.opacity = '0.5'
    }
  }

  const handleDragEnd = () => {
    setDragState(null)
    setDropTarget(null)
    if (draggedCardRef.current) {
      draggedCardRef.current.style.opacity = '1'
    }
  }

  const handleDragOver = (event: React.DragEvent, columnId: string, cardIndex: number) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDropTarget({ columnId, index: cardIndex })
  }

  const handleDragLeave = () => {
    setDropTarget(null)
  }

  const handleDrop = (event: React.DragEvent, targetColumnId: string, targetIndex: number) => {
    event.preventDefault()
    if (!dragState) return

    const { cardId, sourceColumnId, sourceIndex } = dragState

    if (sourceColumnId === targetColumnId && sourceIndex === targetIndex) {
      handleDragEnd()
      return
    }

    const newColumns = columns.map((col) => ({ ...col, cards: [...col.cards] }))
    const sourceColumn = newColumns.find((col) => col.id === sourceColumnId)
    const targetColumn = newColumns.find((col) => col.id === targetColumnId)

    if (!sourceColumn || !targetColumn) {
      handleDragEnd()
      return
    }

    const [movedCard] = sourceColumn.cards.splice(sourceIndex, 1)

    let adjustedIndex = targetIndex
    if (sourceColumnId === targetColumnId && sourceIndex < targetIndex) {
      adjustedIndex = targetIndex - 1
    }

    targetColumn.cards.splice(adjustedIndex, 0, movedCard)

    setColumns(newColumns)
    pushHistory(newColumns)
    setActionNotice(`Moved "${movedCard.title}" to ${targetColumn.title}.`)
    handleDragEnd()
  }

  const handleColumnDrop = (event: React.DragEvent, columnId: string) => {
    event.preventDefault()
    const column = columns.find((col) => col.id === columnId)
    if (column) {
      handleDrop(event, columnId, column.cards.length)
    }
  }

  const moveCard = (cardId: string, direction: 'up' | 'down') => {
    const newColumns = columns.map((col) => ({ ...col, cards: [...col.cards] }))

    for (const column of newColumns) {
      const cardIndex = column.cards.findIndex((c) => c.id === cardId)
      if (cardIndex === -1) continue

      const newIndex = direction === 'up' ? cardIndex - 1 : cardIndex + 1
      if (newIndex < 0 || newIndex >= column.cards.length) return

      const [card] = column.cards.splice(cardIndex, 1)
      column.cards.splice(newIndex, 0, card)

      setColumns(newColumns)
      pushHistory(newColumns)
      setActionNotice(`Moved "${card.title}" ${direction}.`)
      return
    }
  }

  const getCardById = (cardId: string): Card | undefined => {
    for (const column of columns) {
      const card = column.cards.find((c) => c.id === cardId)
      if (card) return card
    }
    return undefined
  }

  const renderSkeleton = () => (
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, colIndex) => (
        <div key={colIndex} className="space-y-3">
          <div className="h-6 w-24 bg-neutral-800 animate-pulse" />
          {Array.from({ length: 2 }).map((_, cardIndex) => (
            <div key={cardIndex} className="h-24 bg-neutral-800 animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  )

  const renderCard = (card: Card, columnId: string, cardIndex: number) => {
    const isBeingDragged = dragState?.cardId === card.id
    const isDropTarget =
      dropTarget?.columnId === columnId && dropTarget?.index === cardIndex

    return (
      <div key={card.id}>
        {isDropTarget && (
          <div className="h-1 bg-[#6b8fa3] mb-2" aria-hidden="true" />
        )}
        <div
          ref={isBeingDragged ? draggedCardRef : null}
          draggable
          onDragStart={(e) => handleDragStart(e, card.id, columnId, cardIndex)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, columnId, cardIndex)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, columnId, cardIndex)}
          className={`${panelClass} cursor-grab active:cursor-grabbing select-none ${
            isBeingDragged ? 'opacity-50' : ''
          }`}
          data-card-id={card.id}
        >
          <div className="space-y-2">
            <p className="font-medium">{card.title}</p>
            <div className="flex items-center justify-between">
              <span className={mutedClass}>{card.assignee}</span>
              <span
                className={`px-2 py-0.5 text-xs ${priorityColors[card.priority]}`}
              >
                {card.priority}
              </span>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                className={`${buttonGhost} px-2 py-1 text-xs`}
                onClick={() => moveCard(card.id, 'up')}
                disabled={cardIndex === 0}
                aria-label={`Move ${card.title} up`}
              >
                ↑
              </button>
              <button
                type="button"
                className={`${buttonGhost} px-2 py-1 text-xs`}
                onClick={() => moveCard(card.id, 'down')}
                disabled={
                  cardIndex ===
                  (columns.find((c) => c.id === columnId)?.cards.length ?? 0) - 1
                }
                aria-label={`Move ${card.title} down`}
              >
                ↓
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderColumn = (column: Column) => {
    const isDropTargetColumn =
      dropTarget?.columnId === column.id &&
      dropTarget?.index === column.cards.length

    return (
      <div
        key={column.id}
        className="space-y-3"
        onDragOver={(e) => {
          e.preventDefault()
          setDropTarget({ columnId: column.id, index: column.cards.length })
        }}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleColumnDrop(e, column.id)}
        data-column-id={column.id}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{column.title}</h3>
          <span className={`${mutedClass} text-sm`}>{column.cards.length}</span>
        </div>
        <div className="space-y-2 min-h-[100px] border border-dashed border-neutral-700 p-2">
          {column.cards.map((card, index) => renderCard(card, column.id, index))}
          {isDropTargetColumn && column.cards.length > 0 && (
            <div className="h-1 bg-[#6b8fa3]" aria-hidden="true" />
          )}
          {column.cards.length === 0 && (
            <p className={`${mutedClass} text-center py-4`}>Drop cards here</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <section className="space-y-4">
      <div className="space-y-4">
        <div className="space-y-4">
          <p className={labelClass}>Benchmark 3 · Drag and drop</p>
          <h1 className="font-semibold">Kanban board</h1>
          <p className={mutedClass}>
            A drag-and-drop kanban board with reorderable cards, visual drop
            zones, and undo/redo support. All operations are mocked locally.
          </p>
        </div>

        <div className={`${panelClass} space-y-4`}>
          <h2 className="font-semibold">Actions</h2>
          <div className="flex gap-2">
            <button
              type="button"
              className={buttonGhost}
              onClick={handleUndo}
              disabled={historyIndex <= 0}
            >
              Undo
            </button>
            <button
              type="button"
              className={buttonGhost}
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
            >
              Redo
            </button>
          </div>
        </div>
      </div>

      {actionNotice && (
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
      )}

      {isLoading ? (
        renderSkeleton()
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map(renderColumn)}
        </div>
      )}
    </section>
  )
}
