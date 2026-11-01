import { NavLink, Outlet } from 'react-router-dom';
import {
  AppBar, Box, Button, Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, Toolbar, Typography,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 220;

const NAV = [
  { label: 'Dashboard', to: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Leads', to: '/leads', icon: <PeopleIcon /> },
  { label: 'Companies', to: '/companies', icon: <BusinessIcon /> },
  { label: 'Tasks', to: '/tasks', icon: <TaskAltIcon /> },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Mini CRM</Typography>
          <Typography sx={{ mr: 2 }}>{user?.name}</Typography>
          <Button color="inherit" onClick={logout}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <List>
          {NAV.map(({ label, to, icon }) => (
            <ListItemButton key={to} component={NavLink} to={to}
              sx={{ '&.active': { bgcolor: 'action.selected' } }}>
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, minWidth: 0 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
