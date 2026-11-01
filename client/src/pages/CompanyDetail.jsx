import { Link as RouterLink, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Alert, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { get, normDoc } from '../api/crm';
import { useQueryError } from '../components/NotifyProvider';
import { Empty, Loading, StatusChip } from '../components/ui';

export default function CompanyDetail() {
  const { id } = useParams();
  const company = useQuery({
    queryKey: ['companies', 'detail', id],
    queryFn: () => get(`/companies/${id}`),
    retry: false,
  });
  useQueryError(company.error);

  const back = (
    <Button component={RouterLink} to="/companies" startIcon={<ArrowBack />} sx={{ mb: 2 }}>
      Companies
    </Button>
  );

  if (company.isPending) return <>{back}<Loading /></>;
  if (company.isError) return <>{back}<Alert severity="error">Company not found.</Alert></>;

  const c = normDoc(company.data);
  const leads = c.leads ?? [];

  return (
    <>
      {back}
      <Typography variant="h5">{c.name}</Typography>
      <Typography color="text.secondary" mb={3}>{c.industry || 'No industry set'}</Typography>
      <Typography variant="h6" mb={1}>Leads ({leads.length})</Typography>
      {leads.length === 0 ? (
        <Empty text="No leads linked to this company." />
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow><TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Phone</TableCell><TableCell>Status</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {leads.map((l) => (
                <TableRow key={l._id}>
                  <TableCell>{l.name}</TableCell>
                  <TableCell>{l.email}</TableCell>
                  <TableCell>{l.phone || '—'}</TableCell>
                  <TableCell><StatusChip status={l.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
}
