import type { SafeZoneEvent } from '../api'
import { AlertStatusBadge } from './AlertStatusBadge'
import { formatConfidence, formatDateTime, timeAgo } from '../utils/format'

function Attempts({ event }: { event: SafeZoneEvent }) {
  if (event.alertAttempts.length === 0) {
    return <span className="text-xs text-slate-500">Chưa có lệnh phát</span>
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {event.alertAttempts.map((a) => (
        <AlertStatusBadge key={a.id} status={a.status} />
      ))}
    </div>
  )
}

export function EventsTable({ events }: { events: SafeZoneEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700/60 bg-slate-800/40 p-8 text-center text-sm text-slate-400">
        Chưa có sự kiện xâm nhập nào. Khi Edge AI phát hiện người trong vùng, sự kiện sẽ hiển thị tại đây.
      </div>
    )
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700/60 bg-slate-800/40">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-800/80 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Thời gian phát hiện</th>
            <th className="px-4 py-3 font-medium">Vùng</th>
            <th className="px-4 py-3 font-medium">Độ tin cậy</th>
            <th className="px-4 py-3 font-medium">Lần phát cảnh báo</th>
            <th className="px-4 py-3 font-medium">Nhận về lúc</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50">
          {events.map((event) => (
            <tr key={event.eventId} className="hover:bg-slate-700/20">
              <td className="px-4 py-3">
                <div className="font-medium text-slate-100">{formatDateTime(event.detectedAt)}</div>
                <div className="text-xs text-slate-500">{timeAgo(event.detectedAt)}</div>
              </td>
              <td className="px-4 py-3 text-slate-300">Vùng #{event.zoneId}</td>
              <td className="px-4 py-3">
                <span className="font-mono text-slate-200">{formatConfidence(event.confidence)}</span>
              </td>
              <td className="px-4 py-3">
                <Attempts event={event} />
              </td>
              <td className="px-4 py-3 text-xs text-slate-400">{formatDateTime(event.receivedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}