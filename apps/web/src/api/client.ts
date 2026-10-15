import createClient from 'openapi-fetch'
import type { paths } from '@safe-zone/api-types'

// baseUrl is empty on purpose: the OpenAPI paths already carry the /api prefix, and the Vite
// dev proxy (or nginx in prod) maps /api to the backend so the browser stays same-origin.
export const realClient = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_BASE_URL || '',
})