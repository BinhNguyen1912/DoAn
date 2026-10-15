import type { AlertStatus } from '../api'
import { StatusPill } from './StatusPill'

const LABELS: Record<AlertStatus, { tone: 'amber' | 'blue' | 'cyan' | 'green' | 'red'; text: string; pulse?: boolean }> = {
  sent: { tone: 'amber', text: 'Đã gửi' },
  received: { tone: 'blue', text: 'Đã nhận' },
  playing: { tone: 'cyan', text: 'Đang phát', pulse: true },
  done: { tone: 'green', text: 'Phát xong' },
  failed: { tone: 'red', text: 'Thất bại' },
}

export function AlertStatusBadge({ status }: { status: AlertStatus }) {
  const { tone, text, pulse } = LABELS[status]
  return (
    <StatusPill tone={tone} pulse={pulse}>
      {text}
    </StatusPill>
  )
}