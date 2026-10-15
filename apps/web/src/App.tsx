import { Header } from './components/Header'
import { ZoneCanvas } from './components/ZoneCanvas'
import { DeviceCard } from './components/DeviceCard'
import { EventsTable } from './components/EventsTable'
import { StatusPill } from './components/StatusPill'
import { useZones } from './hooks/useZones'
import { useDevices } from './hooks/useDevices'
import { useEvents } from './hooks/useEvents'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</h2>
      {children}
    </section>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-slate-700/60 bg-slate-800/40 p-6 text-center text-sm text-slate-400">{children}</div>
}

export default function App() {
  const zones = useZones()
  const devices = useDevices()
  const events = useEvents(50, 0)

  const onlineCount = devices.data?.filter((d) => d.status === 'online').length ?? 0
  const totalDevices = devices.data?.length ?? 0

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Header />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section title="Vùng cảnh báo">
            {zones.isLoading ? (
              <Centered>Đang tải vùng…</Centered>
            ) : zones.isError || !zones.data?.length ? (
              <Centered>Chưa có vùng nào được cấu hình.</Centered>
            ) : (
              <ZoneCanvas zone={zones.data[0]} />
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Trạng thái loa">
            {devices.isLoading ? (
              <Centered>Đang tải thiết bị…</Centered>
            ) : devices.isError || !devices.data?.length ? (
              <Centered>Chưa đăng ký thiết bị loa nào.</Centered>
            ) : (
              <div className="space-y-2">
                {devices.data.map((d) => (
                  <DeviceCard key={d.id} device={d} />
                ))}
              </div>
            )}
          </Section>

          <Section title="Tổng quan">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-700/60 bg-slate-800/40 p-4">
                <p className="text-xs text-slate-400">Thiết bị trực tuyến</p>
                <p className="mt-1 text-xl font-semibold text-slate-100">
                  {onlineCount}/{totalDevices}
                </p>
              </div>
              <div className="rounded-lg border border-slate-700/60 bg-slate-800/40 p-4">
                <p className="text-xs text-slate-400">Sự kiện đã ghi</p>
                <p className="mt-1 text-xl font-semibold text-slate-100">{events.data?.total ?? 0}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-700/60 bg-slate-800/40 px-4 py-2.5">
              <span className="text-xs text-slate-400">Edge AI</span>
              <StatusPill tone="slate">Chưa kết nối</StatusPill>
            </div>
          </Section>
        </div>
      </div>

      <div className="mt-6">
        <Section title="Lịch sử sự kiện xâm nhập">
          {events.isLoading ? (
            <Centered>Đang tải sự kiện…</Centered>
          ) : events.isError ? (
            <Centered>Không tải được sự kiện.</Centered>
          ) : (
            <EventsTable events={events.data?.items ?? []} />
          )}
        </Section>
      </div>
    </main>
  )
}