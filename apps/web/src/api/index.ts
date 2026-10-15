import type { Schemas } from '@safe-zone/api-types'
import { realClient } from './client'
import { mockListDevices, mockListEvents, mockListZones } from './mock'

export type Zone = Schemas['ZoneResponseDto']
export type Device = Schemas['DeviceResponseDto']
export type SafeZoneEvent = Schemas['EventResponseDto']
export type AlertAttempt = Schemas['AlertAttemptResponseDto']
export type EventList = Schemas['EventListResponseDto']
export type AlertStatus = AlertAttempt['status']

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export async function listZones(): Promise<Zone[]> {
  if (USE_MOCK) return mockListZones()
  const { data, error } = await realClient.GET('/api/zones', {})
  if (error) throw error
  return data
}

export async function listDevices(): Promise<Device[]> {
  if (USE_MOCK) return mockListDevices()
  const { data, error } = await realClient.GET('/api/devices', {})
  if (error) throw error
  return data
}

export async function listEvents(limit = 50, offset = 0): Promise<EventList> {
  if (USE_MOCK) return mockListEvents(limit, offset)
  const { data, error } = await realClient.GET('/api/events', { params: { query: { limit, offset } } })
  if (error) throw error
  return data
}

export const isMockMode = USE_MOCK