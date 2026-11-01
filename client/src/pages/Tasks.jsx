import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, MenuItem,
  Pagination, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import api from '../api/axios';
import { TASK_STATUSES, fmtDate, get, idOf, nameOf, normList, useLeadOptions, useUsers } from '../api/crm';
import { useAuth } from '../context/AuthContext';
import { useNotify, useQueryError } from '../components/NotifyProvider';
import { Empty, Loading, PageHeader, StatusChip } from '../components/ui';

const NEXT = { Pending: ['In Progress', 'Start'], 'In Progress': ['Done', 'Complete'] };

function TaskDialog({ onClose }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const notify = useNotify();
  const qc = useQueryClient();
  const leads = useLeadOptions();
  const users = useUsers(isAdmin);
  const [f, setF] = useState({ title: '', lead: '', assignedTo: '', dueDate: '' });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const create = useMutation({
    mutationFn: (body) => api.post('/tasks', body),
    onSuccess: () => {
      notify.success('Task created');
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
    onError: (e) => notify.error(e),
  });

  const submit = () => {
    const e = {};
    if (!f.title.trim()) e.title = 'Title is required';
    if (!f.lead) e.lead = 'Select a lead';
    setErrors(e);
    if (Object.keys(e).length) return;
    const body = { title: f.title.trim(), lead: f.lead };
    if (f.dueDate) body.dueDate = f.dueDate;
    if (isAdmin && f.assignedTo) body.assignedTo = f.assignedTo; // admin-only field
    create.mutate(body);
  };

  return (
    <Dialog open onClose={create.isPending ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>New Task</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField label="Title" required value={f.title} onChange={set('title')} error={!!errors.title} helperText={errors.title} />
          <TextField select label="Lead" required value={f.lead} onChange={set('lead')} error={!!errors.lead} helperText={errors.lead} disabled={leads.isPending}>
            {(leads.data ?? []).map((l) => <MenuItem key={l._id} value={l._id}>{l.name}</MenuItem>)}
          </TextField>
          {isAdmin && (
            <TextField select label="Assign To" value={f.assignedTo} onChange={set('assignedTo')} disabled={users.isPending}>
              <MenuItem value="">Me</MenuItem>
              {(users.data ?? []).map((u) => <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>)}
            </TextField>
          )}
          <TextField label="Due Date" type="date" InputLabelProps={{ shrink: true }} value={f.dueDate} onChange={set('dueDate')} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={create.isPending}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={create.isPending}>
          {create.isPending ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Tasks() {
  const { user } = useAuth();
  const myId = user?._id ?? user?.id;
  const notify = useNotify();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);

  const tasks = useQuery({
    queryKey: ['tasks', { page, status }],
    queryFn: () => get('/tasks', { page, limit: 10, status }),
    placeholderData: keepPreviousData,
  });
  useQueryError(tasks.error);
  const { rows, pagination } = normList(tasks.data);

  const update = useMutation({
    mutationFn: ({ id, status: next }) => api.patch(`/tasks/${id}/status`, { status: next }),
    onSuccess: () => {
      notify.success('Task updated');
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e) => notify.error(e), // 403 if not the assignee
  });

  return (
    <>
      <PageHeader
        title="Tasks"
        action={<Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>New Task</Button>}
      />
      <Box mb={2}>
        <TextField
          select size="small" label="Status" value={status} sx={{ minWidth: 150 }}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <MenuItem value="">All</MenuItem>
          {TASK_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
      </Box>

      {tasks.isPending ? <Loading /> : rows.length === 0 ? (
        <Empty text="No tasks found." />
      ) : (
        <TableContainer component={Paper} variant="outlined">
          {tasks.isFetching && <LinearProgress />}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell><TableCell>Lead</TableCell><TableCell>Assigned To</TableCell>
                <TableCell>Due</TableCell><TableCell>Status</TableCell><TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((t) => {
                const isMine = !!myId && idOf(t.assignedTo) === myId;
                const next = NEXT[t.status];
                const busy = update.isPending && update.variables?.id === t._id;
                return (
                  <TableRow key={t._id} hover>
                    <TableCell>{t.title}</TableCell>
                    <TableCell>{nameOf(t.lead)}</TableCell>
                    <TableCell>{nameOf(t.assignedTo)}</TableCell>
                    <TableCell>{fmtDate(t.dueDate)}</TableCell>
                    <TableCell><StatusChip status={t.status} /></TableCell>
                    <TableCell align="right">
                      {next && (
                        <span title={isMine ? '' : 'Only the assignee can update this task'}>
                          <Button
                            size="small" variant="outlined"
                            disabled={!isMine || busy}
                            onClick={() => update.mutate({ id: t._id, status: next[0] })}
                          >
                            {next[1]}
                          </Button>
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {pagination?.pages > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination count={pagination.pages} page={page} onChange={(_, p) => setPage(p)} />
        </Box>
      )}
      {open && <TaskDialog onClose={() => setOpen(false)} />}
    </>
  );
}
