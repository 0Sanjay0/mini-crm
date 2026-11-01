import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material'
import { get, normDoc, normList } from '../api/crm'
import { Loading, PageHeader, StatusChip } from '../components/ui'
import { useQueryError } from '../components/NotifyProvider'

// leadsByStatus may be { Qualified: 3 } or [{ _id: 'Qualified', count: 3 }]
const qualifiedOf = (by) =>
  Array.isArray(by)
    ? (by.find((x) => (x._id ?? x.status) === 'Qualified')?.count ?? 0)
    : (by?.Qualified ?? 0)

const isToday = (d) =>
  !!d && new Date(d).toDateString() === new Date().toDateString()

function StatCard({ label, value }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography color="text.secondary" variant="body2">
          {label}
        </Typography>
        <Typography variant="h4">{value}</Typography>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const stats = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => get('/dashboard/stats'),
  })
  const done = useQuery({
    queryKey: ['dashboard', 'tasks-done'],
    queryFn: () => get('/tasks', { status: 'Done', limit: 1 }),
  })
  const open = useQuery({
    queryKey: ['dashboard', 'tasks-open'],
    queryFn: () => get('/tasks', { limit: 100 }),
  })
  useQueryError(stats.error)
  useQueryError(done.error)
  useQueryError(open.error)

  if (stats.isPending || done.isPending || open.isPending) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <Loading />
      </>
    )
  }

  const s = normDoc(stats.data) ?? {}
  const dueToday = normList(open.data).rows.filter(
    (t) => t.status !== 'Done' && isToday(t.dueDate),
  ).length
  const completed = normList(done.data).pagination?.total ?? 0
  const recent = s.recentLeads ?? []

  const cards = [
    ['Total Leads', s.totalLeads ?? 0],
    ['Qualified Leads', qualifiedOf(s.leadsByStatus)],
    ['Tasks Due Today', dueToday],
    ['Completed Tasks', completed],
  ]

  return (
    <>
      <PageHeader title="Dashboard" />
      <Grid container spacing={2}>
        {cards.map(([label, value]) => (
          <Grid item xs={12} sm={6} md={3} key={label}>
            <StatCard label={label} value={value} />
          </Grid>
        ))}
      </Grid>
      <Box mt={4}>
        <Typography variant="h6">Recent Leads</Typography>
        {recent.length === 0 ? (
          <Typography color="text.secondary" py={2}>
            No leads yet.
          </Typography>
        ) : (
          <List dense>
            {recent.map((l) => (
              <ListItem
                key={l._id}
                secondaryAction={<StatusChip status={l.status} />}
              >
                <ListItemText primary={l.name} secondary={l.email} />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </>
  )
}
