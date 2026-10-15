/** Vietnamese formatting helpers for the dashboard. */

const dt = (iso: string): Date => new Date(iso)

export function formatDateTime(iso: string): string {
  return dt(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function timeAgo(iso: string): string {
  const seconds = Math.round((Date.now() - dt(iso).getTime()) / 1000)
  if (seconds < 5) return 'vừa xong'
  if (seconds < 60) return `${seconds} giây trước`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.round(hours / 24)
  return `${days} ngày trước`
}

export function formatConfidence(value: number): string {
  return `${Math.round(value * 100)}%`
}