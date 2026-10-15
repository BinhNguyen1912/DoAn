import { useEffect, useRef } from 'react'
import type { Zone } from '../api'

/**
 * Draws the danger-zone polygon in normalized image coordinates (x,y in 0..1) over a 16:9 frame
 * placeholder. This is the dashboard preview of what the Edge AI camera sees.
 */
export function ZoneCanvas({ zone }: { zone: Zone }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const draw = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const ratio = window.devicePixelRatio || 1
      const w = container.clientWidth
      const h = container.clientHeight
      canvas.width = Math.max(1, Math.floor(w * ratio))
      canvas.height = Math.max(1, Math.floor(h * ratio))
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

      // Background
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, w, h)

      // Grid
      ctx.strokeStyle = 'rgba(148,163,184,0.08)'
      ctx.lineWidth = 1
      for (let i = 1; i < 16; i++) {
        const x = (w / 16) * i
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }
      for (let i = 1; i < 9; i++) {
        const y = (h / 9) * i
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      // Polygon
      const pts = zone.points.map((p) => ({ x: p.x * w, y: p.y * h }))
      if (pts.length >= 3) {
        ctx.beginPath()
        ctx.moveTo(pts[0].x, pts[0].y)
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
        ctx.closePath()
        ctx.fillStyle = 'rgba(244,63,94,0.18)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(244,63,94,0.9)'
        ctx.lineWidth = 2
        ctx.stroke()

        // Vertices
        ctx.fillStyle = '#fb7185'
        for (const p of pts) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Label
      ctx.fillStyle = 'rgba(248,250,252,0.9)'
      ctx.font = '600 13px Inter, system-ui, sans-serif'
      ctx.fillText(zone.name, 12, 22)
      ctx.fillStyle = 'rgba(148,163,184,0.7)'
      ctx.font = '11px Inter, system-ui, sans-serif'
      ctx.fillText('Khung hình webcam (xem trước vùng cảnh báo)', 12, h - 12)
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(container)
    return () => ro.disconnect()
  }, [zone])

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full overflow-hidden rounded-lg border border-slate-700/60 bg-slate-900"
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  )
}