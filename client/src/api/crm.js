import { useQuery } from '@tanstack/react-query'
import api from './axios'

export const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Lost']
export const TASK_STATUSES = ['Pending', 'In Progress', 'Done']

// GET helper: drops empty params, returns response body

export const get = (url, params = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v != null),
  )
  return api.get(url, { params: clean }).then((r) => r.data)
}

// Tolerate both `[...]` and `{ data: [...], pagination }` responses
export const normList = (d) => ({
  rows: Array.isArray(d) ? d : (d?.data ?? d?.users ?? []),
  pagination: d?.pagination ?? null,
})
export const normDoc = (d) => d?.data ?? d

// Works for populated objects and raw ids
export const idOf = (v) =>
  (v && typeof v === 'object' ? (v._id ?? v.id) : v) ?? ''
export const nameOf = (v) => (v && typeof v === 'object' ? v.name : '') || '—'
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—')

export const useUsers = (enabled) =>
  useQuery({
    queryKey: ['users'],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: () => get('/users').then((d) => normList(d).rows),
  })

export const useCompanyOptions = () =>
  useQuery({
    queryKey: ['companies', 'options'],
    staleTime: 60 * 1000,
    queryFn: () =>
      get('/companies', { limit: 100 }).then((d) => normList(d).rows),
  })

export const useLeadOptions = () =>
  useQuery({
    queryKey: ['leads', 'options'],
    staleTime: 60 * 1000,
    queryFn: () => get('/leads', { limit: 100 }).then((d) => normList(d).rows),
  })
