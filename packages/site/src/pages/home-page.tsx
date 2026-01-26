import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useCallback } from 'react'

const benchmarks = [
  { slug: 'account-setup', name: 'Account Setup' },
  { slug: 'data-table', name: 'Data Table' },
  { slug: 'drag-drop', name: 'Drag & Drop' },
  { slug: 'checkout-flow', name: 'Checkout Flow' },
  { slug: 'accessibility', name: 'Accessibility' },
  { slug: 'error-states', name: 'Error States' },
  { slug: 'infinite-scroll', name: 'Infinite Scroll' },
]

function HalftoneCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const targetMouseRef = useRef({ x: -1000, y: -1000 })
  const animationRef = useRef<number>()
  const timeRef = useRef(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, rect.width, rect.height)

    mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * 0.08
    mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * 0.08

    const spacing = 14
    const cols = Math.ceil(rect.width / spacing) + 1
    const rows = Math.ceil(rect.height / spacing) + 1
    const baseRadius = 1.2
    const maxRadius = 5
    const mouseRadius = 180

    timeRef.current += 0.025

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * spacing
        const y = j * spacing

        const dx = x - mouseRef.current.x
        const dy = y - mouseRef.current.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        const wave1 = Math.sin(dist * 0.012 - timeRef.current * 1.2) * 0.5 + 0.5
        const wave2 = Math.sin(x * 0.015 + y * 0.015 - timeRef.current * 0.6) * 0.3 + 0.5

        const mouseInfluence = Math.pow(Math.max(0, 1 - dist / mouseRadius), 1.5)
        const waveCombo = (wave1 + wave2) / 2

        let size = baseRadius + waveCombo * 1.5
        size += mouseInfluence * maxRadius * 2

        size = Math.max(0.3, Math.min(size, maxRadius * 1.5))

        // Base color: oklch(0.4176 0.0789 203.29) ≈ rgb(72, 95, 107)
        const r = Math.floor(45 + mouseInfluence * 35 + waveCombo * 20)
        const g = Math.floor(60 + waveCombo * 40 + mouseInfluence * 45)
        const b = Math.floor(70 + mouseInfluence * 50 + waveCombo * 35)
        const alpha = 0.4 + mouseInfluence * 0.6 + waveCombo * 0.25

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    animationRef.current = requestAnimationFrame(draw)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      targetMouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }

    const handleMouseLeave = () => {
      targetMouseRef.current = { x: -1000, y: -1000 }
    }

    window.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    draw()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
    />
  )
}

export function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <HalftoneCanvas />

      <div className="relative z-10 min-h-screen flex flex-col">
        <main className="flex-1 flex items-center px-6 py-20">
          <div className="max-w-4xl mx-auto w-full">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight mb-6 text-neutral-400">
              browser
            </h1>
            <p className="text-neutral-600 max-w-sm text-sm leading-relaxed">
              Evaluating browser automation agents through interaction.
            </p>
          </div>
        </main>

        <nav className="px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
              {benchmarks.map((b, i) => (
                <Link
                  key={b.slug}
                  to={`/benchmark/${b.slug}`}
                  className="group flex items-baseline gap-2 text-sm text-neutral-600 hover:text-neutral-300 transition-colors"
                >
                  <span className="text-[10px] text-neutral-800">{String(i + 1).padStart(2, '0')}</span>
                  <span>{b.name}</span>
                </Link>
              ))}
              <Link
                to="/test"
                className="text-sm text-neutral-700 hover:text-neutral-300 transition-colors"
              >
                Tests
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </div>
  )
}
