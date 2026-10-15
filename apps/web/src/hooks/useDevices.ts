import { useQuery } from '@tanstack/react-query'
import { listDevices } from '../api'

const POLL_MS = Number(import.meta.env.VITE_DEVICE_POLL_MS) || 5000

export function useDevices() {
  return useQuery({
    queryKey: ['devices'],
    queryFn: listDevices,
    refetchInterval: POLL_MS,
  })
}