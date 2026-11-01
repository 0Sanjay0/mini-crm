import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField,
} from '@mui/material';
import api from '../api/axios';
import { LEAD_STATUSES, idOf, useCompanyOptions, useUsers } from '../api/crm';
import { useAuth } from '../context/AuthContext';
import { useNotify } from './NotifyProvider';

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PHONE_RE = /^[0-9+()\-\s]{7,15}$/;

export default function LeadFormDialog({ lead, onClose }) {
  const isEdit = !!lead?._id;
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const notify = useNotify();
  const qc = useQueryClient();

  const companies = useCompanyOptions();
  const users = useUsers(isAdmin);

  const [f, setF] = useState({
    name: lead?.name ?? '',
    email: lead?.email ?? '',
    phone: lead?.phone ?? '',
    status: lead?.status ?? 'New',
    company: idOf(lead?.company),
    assignedTo: idOf(lead?.assignedTo),
  });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const save = useMutation({
    mutationFn: (body) => (isEdit ? api.put(`/leads/${lead._id}`, body) : api.post('/leads', body)),
    onSuccess: () => {
      notify.success(isEdit ? 'Lead updated' : 'Lead created');
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['companies'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
    onError: (e) => notify.error(e),
  });

  const validate = () => {
    const e = {};
    if (!f.name.trim()) e.name = 'Name is required';
    if (!f.email.trim()) e.email = 'Email is required';
    else if (!EMAIL_RE.test(f.email.trim())) e.email = 'Enter a valid email';
    if (f.phone.trim() && !PHONE_RE.test(f.phone.trim())) e.phone = 'Enter a valid phone number';
    return e;
  };

  const submit = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    const body = { name: f.name.trim(), email: f.email.trim(), status: f.status };
    if (f.phone.trim()) body.phone = f.phone.trim();
    if (f.company) body.company = f.company;
    else if (isEdit) body.company = null;
    if (isAdmin && f.assignedTo) body.assignedTo = f.assignedTo; // admin-only field
    save.mutate(body);
  };

  return (
    <Dialog open onClose={save.isPending ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'Edit Lead' : 'Add Lead'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField label="Name" value={f.name} onChange={set('name')} error={!!errors.name} helperText={errors.name} required />
          <TextField label="Email" value={f.email} onChange={set('email')} error={!!errors.email} helperText={errors.email} required />
          <TextField label="Phone" value={f.phone} onChange={set('phone')} error={!!errors.phone} helperText={errors.phone} />
          <TextField select label="Status" value={f.status} onChange={set('status')}>
            {LEAD_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField select label="Company" value={f.company} onChange={set('company')} disabled={companies.isPending}>
            <MenuItem value="">None</MenuItem>
            {(companies.data ?? []).map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
          </TextField>
          {isAdmin && (
            <TextField select label="Assigned To" value={f.assignedTo} onChange={set('assignedTo')} disabled={users.isPending}>
              <MenuItem value="">Unassigned</MenuItem>
              {(users.data ?? []).map((u) => <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>)}
            </TextField>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={save.isPending}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
