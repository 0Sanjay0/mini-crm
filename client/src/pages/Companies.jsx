import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Link, Pagination, Paper,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import api from '../api/axios';
import { get, normList } from '../api/crm';
import { useNotify, useQueryError } from '../components/NotifyProvider';
import { Empty, Loading, PageHeader } from '../components/ui';

function CompanyDialog({ onClose }) {
  const notify = useNotify();
  const qc = useQueryClient();
  const [f, setF] = useState({ name: '', industry: '' });
  const [error, setError] = useState('');

  const create = useMutation({
    mutationFn: (body) => api.post('/companies', body),
    onSuccess: () => {
      notify.success('Company created');
      qc.invalidateQueries({ queryKey: ['companies'] });
      onClose();
    },
    onError: (e) => notify.error(e), // includes 409 duplicate
  });

  const submit = () => {
    if (!f.name.trim()) return setError('Company name is required');
    setError('');
    const body = { name: f.name.trim() };
    if (f.industry.trim()) body.industry = f.industry.trim();
    create.mutate(body);
  };

  return (
    <Dialog open onClose={create.isPending ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>New Company</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Name" required autoFocus value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
            error={!!error} helperText={error}
          />
          <TextField label="Industry" value={f.industry} onChange={(e) => setF({ ...f, industry: e.target.value })} />
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

export default function Companies() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const companies = useQuery({
    queryKey: ['companies', 'list', { page }],
    queryFn: () => get('/companies', { page, limit: 10 }),
    placeholderData: keepPreviousData,
  });
  useQueryError(companies.error);
  const { rows, pagination } = normList(companies.data);

  return (
    <>
      <PageHeader
        title="Companies"
        action={<Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>New Company</Button>}
      />
      {companies.isPending ? <Loading /> : rows.length === 0 ? (
        <Empty text="No companies yet." />
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow><TableCell>Name</TableCell><TableCell>Industry</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c._id} hover>
                  <TableCell>
                    <Link component={RouterLink} to={`/companies/${c._id}`} underline="hover">{c.name}</Link>
                  </TableCell>
                  <TableCell>{c.industry || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {pagination?.pages > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination count={pagination.pages} page={page} onChange={(_, p) => setPage(p)} />
        </Box>
      )}
      {open && <CompanyDialog onClose={() => setOpen(false)} />}
    </>
  );
}
