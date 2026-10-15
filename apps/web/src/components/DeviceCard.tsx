import type { Device } from '../api'
import { timeAgo } from '../utils/format'
import { StatusPill } from './StatusPill'

export function DeviceCard({ device }: { device: Device }) {
  const online = device.status === 'online'
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-700/60 bg-slate-800/40 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-100">{device.name}</p>
        <p className="text-xs text-slate-400">
          {device.lastSeenAt ? `Hoạt động ${timeAgo(device.lastSeenAt)}` : 'Chưa từng báo về'}
        </p>
      </div>
      <StatusPill tone={online ? 'green' : 'slate'} pulse={online}>
        {online ? 'Trực tuyến' : 'Ngoại tuyến'}
      </StatusPill>
    </div>
  )
}