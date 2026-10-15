import type { AlertAttempt, Device, SafeZoneEvent, Zone } from '@safe-zone/api-types'

// Normalized polygon (fractions of width/height). A Danger-Zone trapezoid in the lower-center.
const sampleZone: Zone = {
  id: 1,
  name: 'Vùng nguy hiểm',
  points: [
    { x: 0.28, y: 0.45 },
    { x: 0.72, y: 0.45 },
    { x: 0.82, y: 0.92 },
    { x: 0.18, y: 0.92 },
  ],
  updatedAt: new Date().toISOString(),
}

const sampleDevice: Device = {
  id: 1,
  name: 'Loa ESP32-01',
  status: 'online',
  lastSeenAt: new Date(Date.now() - 4_000).toISOString(),
}

const attempts = (deviceId: number, statuses: AlertAttempt['status'][]): AlertAttempt[] =>
  statuses.map((status, i) => ({
    id: 1000 + i,
    deviceId,
    status,
    error: status === 'failed' ? 'ESP32 timeout sau 2000ms' : null,
    updatedAt: new Date(Date.now() - (statuses.length - i) * 1_500).toISOString(),
  }))

const sampleEvents: SafeZoneEvent[] = [
  {
    eventId: '11111111-1111-4111-8111-111111111111',
    zoneId: 1,
    detectedAt: new Date(Date.now() - 60_000).toISOString(),
    confidence: 0.88,
    receivedAt: new Date(Date.now() - 59_800).toISOString(),
    evidencePath: null,
    alertAttempts: attempts(1, ['done']),
  },
  {
    eventId: '22222222-2222-4222-8222-222222222222',
    zoneId: 1,
    detectedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    confidence: 0.72,
    receivedAt: new Date(Date.now() - 5 * 60_000 + 120).toISOString(),
    evidencePath: null,
    alertAttempts: attempts(1, ['sent', 'received', 'playing']),
  },
  {
    eventId: '33333333-3333-4333-8333-333333333333',
    zoneId: 1,
    detectedAt: new Date(Date.now() - 12 * 60_000).toISOString(),
    confidence: 0.64,
    receivedAt: new Date(Date.now() - 12 * 60_000 + 90).toISOString(),
    evidencePath: null,
    alertAttempts: attempts(1, ['failed']),
  },
  {
    eventId: '44444444-4444-4444-8444-444444444444',
    zoneId: 1,
    detectedAt: new Date(Date.now() - 40 * 60_000).toISOString(),
    confidence: 0.91,
    receivedAt: new Date(Date.now() - 40 * 60_000 + 110).toISOString(),
    evidencePath: null,
    alertAttempts: attempts(1, ['done']),
  },
]

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function mockListZones(): Promise<Zone[]> {
  await wait(150)
  return [sampleZone]
}

export async function mockListDevices(): Promise<Device[]> {
  await wait(150)
  return [sampleDevice]
}

export async function mockListEvents(limit = 50, offset = 0): Promise<{
  items: SafeZoneEvent[]
  total: number
}> {
  await wait(200)
  return { items: sampleEvents.slice(offset, offset + limit), total: sampleEvents.length }
}