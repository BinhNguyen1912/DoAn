import { useQuery } from '@tanstack/react-query'
import { listZones } from '../api'

export function useZones() {
  return useQuery({ queryKey: ['zones'], queryFn: listZones })
}