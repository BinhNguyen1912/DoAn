import { useQuery } from '@tanstack/react-query'
import { listEvents } from '../api'

export function useEvents(limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['events', limit, offset],
    queryFn: () => listEvents(limit, offset),
    refetchInterval: 4000,
  })
}