import { isMockMode } from '../api'
import { StatusPill } from './StatusPill'

export function Header() {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Safe Zone Monitor</h1>
        <p className="text-sm text-slate-400">
          Hệ thống giám sát vùng nguy hiểm bằng Edge AI &amp; cảnh báo giọng nói tiếng Việt
        </p>
      </div>
      {isMockMode ? (
        <StatusPill tone="amber">Chế độ xem trước (mock data)</StatusPill>
      ) : (
        <StatusPill tone="green" pulse>
          Đang nối backend
        </StatusPill>
      )}
    </header>
  )
}