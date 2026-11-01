import { useState } from 'react'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  Box,
  Button,
  IconButton,
  LinearProgress,
  MenuItem,
  Pagination,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material'
import { Add, Delete, Edit } from '@mui/icons-material'
import api from '../api/axios'
import { LEAD_STATUSES, get, nameOf, normList } from '../api/crm'
import LeadFormDialog from '../components/LeadFormDialog'
import { useNotify, useQueryError } from '../components/NotifyProvider'
import {
  ConfirmDialog,
  Empty,
  Loading,
  PageHeader,
  StatusChip,
  useDebounce,
} from '../components/ui'

const LIMIT = 10

export default function Leads() {
  const notify = useNotify()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [form, setForm] = useState(null) // null = closed, {} = new, lead = edit
  const [toDelete, setToDelete] = useState(null)
  const q = useDebounce(search)

  const leads = useQuery({
    queryKey: ['leads', { page, q, status }],
    queryFn: () => get('/leads', { page, limit: LIMIT, search: q, status }),
    placeholderData: keepPreviousData,
  })
  useQueryError(leads.error)
  const { rows, pagination } = normList(leads.data)

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/leads/${id}`),
    onSuccess: () => {
      notify.success('Lead deleted')
      if (rows.length === 1 && page > 1) setPage((p) => p - 1)
      setToDelete(null)
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['companies'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (e) => notify.error(e),
  })

  return (
    <>
      <PageHeader
        title="Leads"
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setForm({})}
          >
            Add Lead
          </Button>
        }
      />
      <Box display="flex" gap={2} mb={2}>
        <TextField
          size="small"
          label="Search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={status}
          sx={{ minWidth: 150 }}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
        >
          <MenuItem value="">All</MenuItem>
          {LEAD_STATUSES.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {leads.isPending ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Empty text="No leads found." />
      ) : (
        <TableContainer component={Paper} variant="outlined">
          {leads.isFetching && <LinearProgress />}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((l) => (
                <TableRow key={l._id} hover>
                  <TableCell>{l.name}</TableCell>
                  <TableCell>{l.email}</TableCell>
                  <TableCell>{l.phone || '—'}</TableCell>
                  <TableCell>{nameOf(l.company)}</TableCell>
                  <TableCell>{nameOf(l.assignedTo)}</TableCell>
                  <TableCell>
                    <StatusChip status={l.status} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      aria-label="edit"
                      onClick={() => setForm(l)}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="delete"
                      onClick={() => setToDelete(l)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {pagination?.pages > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination
            count={pagination.pages}
            page={page}
            onChange={(_, p) => setPage(p)}
          />
        </Box>
      )}

      {form && (
        <LeadFormDialog
          key={form._id ?? 'new'}
          lead={form}
          onClose={() => setForm(null)}
        />
      )}
      <ConfirmDialog
        open={!!toDelete}
        title="Delete lead?"
        text={`"${toDelete?.name ?? ''}" will be removed from your leads.`}
        loading={remove.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={() => remove.mutate(toDelete._id)}
      />
    </>
  )
}
