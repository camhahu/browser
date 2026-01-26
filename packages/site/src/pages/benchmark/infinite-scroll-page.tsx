import { useCallback, useEffect, useRef, useState } from 'react'
import {
  buttonGhost,
  buttonPrimary,
  inputBase,
  labelClass,
  mutedClass,
  panelClass,
} from '../../components/layout'
import {
  generateFeedItems,
  ITEMS_PER_PAGE,
  ITEM_HEIGHT,
  TOTAL_ITEMS,
  type FeedItem,
} from '../../data/benchmark-13-data'

export function InfiniteScrollPage() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [jumpToIndex, setJumpToIndex] = useState('')
  const [scrollPosition, setScrollPosition] = useState(0)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 })
  const [useVirtualization, setUseVirtualization] = useState(true)

  const containerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsLoading(true)
    const timeout = window.setTimeout(() => {
      setItems(generateFeedItems(0, ITEMS_PER_PAGE))
      setIsLoading(false)
    }, 800)
    return () => window.clearTimeout(timeout)
  }, [])

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    window.setTimeout(() => {
      const currentLength = items.length
      if (currentLength >= TOTAL_ITEMS) {
        setHasMore(false)
        setIsLoadingMore(false)
        return
      }

      const newItems = generateFeedItems(currentLength, ITEMS_PER_PAGE)
      setItems((prev) => [...prev, ...newItems])
      setIsLoadingMore(false)

      if (currentLength + ITEMS_PER_PAGE >= TOTAL_ITEMS) {
        setHasMore(false)
      }
    }, 600)
  }, [items.length, isLoadingMore, hasMore])

  useEffect(() => {
    if (isLoading) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [isLoading, hasMore, isLoadingMore, loadMore])

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return

    const scrollTop = containerRef.current.scrollTop
    setScrollPosition(scrollTop)

    if (useVirtualization) {
      const containerHeight = containerRef.current.clientHeight
      const start = Math.floor(scrollTop / ITEM_HEIGHT)
      const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT)
      const buffer = 5

      setVisibleRange({
        start: Math.max(0, start - buffer),
        end: Math.min(items.length, start + visibleCount + buffer),
      })
    }
  }, [items.length, useVirtualization])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  const handleJumpTo = () => {
    const index = parseInt(jumpToIndex, 10)
    if (isNaN(index) || index < 1 || index > items.length) return

    if (containerRef.current) {
      const scrollTo = (index - 1) * ITEM_HEIGHT
      containerRef.current.scrollTo({ top: scrollTo, behavior: 'smooth' })
    }
  }

  const handleRestorePosition = () => {
    if (containerRef.current && scrollPosition > 0) {
      containerRef.current.scrollTo({ top: scrollPosition, behavior: 'smooth' })
    }
  }

  const handleScrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const renderItem = (item: FeedItem, index: number) => {
    const style = useVirtualization
      ? {
          position: 'absolute' as const,
          top: index * ITEM_HEIGHT,
          left: 0,
          right: 0,
          height: ITEM_HEIGHT,
        }
      : {}

    return (
      <div
        key={item.id}
        className={`${panelClass} ${useVirtualization ? '' : 'mb-2'}`}
        style={style}
        data-item-index={index + 1}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{item.title}</p>
            <p className={`${mutedClass} text-sm`}>
              {item.author} · {item.timestamp} · {item.category}
            </p>
            <p className={`${mutedClass} text-sm mt-1 line-clamp-2`}>{item.preview}</p>
          </div>
          <span className="text-xs bg-zinc-100 px-2 py-1 ml-2">#{index + 1}</span>
        </div>
      </div>
    )
  }

  const renderSkeleton = () => (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={`${panelClass} animate-pulse`}>
          <div className="h-4 w-3/4 bg-zinc-200 mb-2" />
          <div className="h-3 w-1/2 bg-zinc-200 mb-2" />
          <div className="h-3 w-full bg-zinc-200" />
        </div>
      ))}
    </div>
  )

  const visibleItems = useVirtualization
    ? items.slice(visibleRange.start, visibleRange.end)
    : items

  const totalHeight = useVirtualization ? items.length * ITEM_HEIGHT : 'auto'

  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <p className={labelClass}>Infinite scroll</p>
          <h1 className="font-semibold">Virtualized feed</h1>
          <p className={mutedClass}>
            An infinite-scrolling list with virtualization. Only visible items are
            rendered in the DOM for performance. Scroll to load more items.
          </p>
        </div>
        <div className={`${panelClass} space-y-2`}>
          <div className="border-b border-zinc-900/20 pb-2">
            <p className="font-semibold text-sm">Challenge</p>
            <p className={`${mutedClass} text-sm`}>Scroll and load {TOTAL_ITEMS} items.</p>
          </div>
          <div className="border-b border-zinc-900/20 pb-2">
            <p className="font-semibold text-sm">Latency</p>
            <p className={`${mutedClass} text-sm`}>600ms per page load.</p>
          </div>
          <div>
            <p className="font-semibold text-sm">Scope</p>
            <p className={`${mutedClass} text-sm`}>Scroll, virtualize, jump.</p>
          </div>
        </div>
      </div>

      <div className={`${panelClass} space-y-4`}>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useVirtualization}
              onChange={(e) => setUseVirtualization(e.target.checked)}
            />
            <span className="text-sm">Enable virtualization</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              className={`${inputBase} w-24`}
              placeholder="Item #"
              value={jumpToIndex}
              onChange={(e) => setJumpToIndex(e.target.value)}
              min={1}
              max={items.length}
            />
            <button type="button" className={buttonGhost} onClick={handleJumpTo}>
              Jump to
            </button>
          </div>
          <button type="button" className={buttonGhost} onClick={handleScrollToTop}>
            Scroll to top
          </button>
          <button type="button" className={buttonGhost} onClick={handleRestorePosition}>
            Restore position
          </button>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <span>
            Loaded: <strong>{items.length}</strong> / {TOTAL_ITEMS}
          </span>
          <span>
            Scroll: <strong>{Math.round(scrollPosition)}px</strong>
          </span>
          {useVirtualization && (
            <span>
              Rendered: <strong>{visibleRange.end - visibleRange.start}</strong> items
            </span>
          )}
          {!useVirtualization && (
            <span>
              Rendered: <strong>{items.length}</strong> items (no virtualization)
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        renderSkeleton()
      ) : (
        <div
          ref={containerRef}
          className="border border-zinc-900/20 overflow-y-auto"
          style={{ height: 500 }}
        >
          <div
            className={useVirtualization ? 'relative' : 'p-2'}
            style={{ height: totalHeight }}
          >
            {useVirtualization
              ? visibleItems.map((item, i) =>
                  renderItem(item, visibleRange.start + i)
                )
              : visibleItems.map((item, i) => renderItem(item, i))}
          </div>

          {hasMore && (
            <div
              ref={loadMoreRef}
              className="p-4 text-center"
              style={useVirtualization ? { position: 'absolute', bottom: 0, left: 0, right: 0 } : {}}
            >
              {isLoadingMore ? (
                <span className={mutedClass}>Loading more...</span>
              ) : (
                <button type="button" className={buttonPrimary} onClick={loadMore}>
                  Load more
                </button>
              )}
            </div>
          )}

          {!hasMore && (
            <div className="p-4 text-center border-t border-zinc-900/20">
              <span className={mutedClass}>You've reached the end ({TOTAL_ITEMS} items)</span>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
