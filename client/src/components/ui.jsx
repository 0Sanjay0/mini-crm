import { useEffect, useState } from 'react';
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle, Typography,
} from '@mui/material';

const COLORS = {
  New: 'info', Contacted: 'warning', Qualified: 'success', Lost: 'default',
  Pending: 'default', 'In Progress': 'warning', Done: 'success',
};

export const StatusChip = ({ status }) => (
  <Chip size="small" label={status} color={COLORS[status] || 'default'} />
);

export const Loading = () => (
  <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
);

export const Empty = ({ text }) => (
  <Typography color="text.secondary" align="center" py={6}>{text}</Typography>
);

export const PageHeader = ({ title, action }) => (
  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
    <Typography variant="h5">{title}</Typography>
    {action}
  </Box>
);

export function ConfirmDialog({ open, title, text, loading, onClose, onConfirm }) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent><DialogContentText>{text}</DialogContentText></DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button color="error" onClick={onConfirm} disabled={loading}>Delete</Button>
      </DialogActions>
    </Dialog>
  );
}

export function useDebounce(value, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
