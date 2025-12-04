import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  QuestionAnswer,
  Dashboard,
  Person,
  Logout,
  Menu as MenuIcon
} from '@mui/icons-material';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
    handleMenuClose();
    setMobileOpen(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Mobile drawer content
  const drawer = (
    <Box sx={{ width: 280, pt: 2 }}>
      <Box sx={{ px: 2, pb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ width: 48, height: 48, bgcolor: '#8CD1BC' }}>
          {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#365E63' }}>
            {currentUser?.full_name || currentUser?.email || 'User'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
            {currentUser?.email || ''}
          </Typography>
        </Box>
      </Box>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleNavigation('/questions')}
            selected={isActive('/questions')}
            sx={{
              minHeight: 48,
              '&.Mui-selected': {
                backgroundColor: 'rgba(54, 94, 99, 0.1)',
                borderLeft: '4px solid #365E63',
              },
            }}
          >
            <ListItemIcon>
              <QuestionAnswer sx={{ color: isActive('/questions') ? '#365E63' : '#666' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Questions" 
              primaryTypographyProps={{
                fontWeight: isActive('/questions') ? 'bold' : 'normal',
                color: isActive('/questions') ? '#365E63' : '#333',
              }}
            />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleNavigation('/dashboard')}
            selected={isActive('/dashboard')}
            sx={{
              minHeight: 48,
              '&.Mui-selected': {
                backgroundColor: 'rgba(54, 94, 99, 0.1)',
                borderLeft: '4px solid #365E63',
              },
            }}
          >
            <ListItemIcon>
              <Dashboard sx={{ color: isActive('/dashboard') ? '#365E63' : '#666' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Dashboard" 
              primaryTypographyProps={{
                fontWeight: isActive('/dashboard') ? 'bold' : 'normal',
                color: isActive('/dashboard') ? '#365E63' : '#333',
              }}
            />
          </ListItemButton>
        </ListItem>
        <Divider sx={{ my: 1 }} />
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{ minHeight: 48 }}
          >
            <ListItemIcon>
              <Logout sx={{ color: '#d32f2f' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Logout" 
              primaryTypographyProps={{ color: '#d32f2f' }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar 
        position="static" 
        elevation={1}
        sx={{
          backgroundColor: '#365E63', // Dark teal
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          {currentUser && isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              flexGrow: 1, 
              fontWeight: 'bold',
              cursor: 'pointer',
              color: '#FFFFFF',
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
            onClick={() => navigate('/questions')}
          >
            Daily Questions
          </Typography>

          {currentUser && !isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                color="inherit"
                startIcon={<QuestionAnswer />}
                onClick={() => navigate('/questions')}
                sx={{
                  backgroundColor: isActive('/questions') ? 'rgba(255,255,255,0.1)' : 'transparent',
                  minHeight: 44, // Touch target
                }}
              >
                Questions
              </Button>
              
              <Button
                color="inherit"
                startIcon={<Dashboard />}
                onClick={() => navigate('/dashboard')}
                sx={{
                  backgroundColor: isActive('/dashboard') ? 'rgba(255,255,255,0.1)' : 'transparent',
                  minHeight: 44, // Touch target
                }}
              >
                Dashboard
              </Button>

              <IconButton
                color="inherit"
                onClick={handleMenuOpen}
                sx={{ 
                  ml: 1,
                  minWidth: 44,
                  minHeight: 44,
                }}
              >
                <Avatar sx={{ width: 36, height: 36, bgcolor: '#8CD1BC' }}>
                  {currentUser.email?.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleLogout} sx={{ minHeight: 44 }}>
                  <Logout sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          )}

          {currentUser && isMobile && (
            <IconButton
              color="inherit"
              onClick={handleMenuOpen}
              sx={{ 
                minWidth: 44,
                minHeight: 44,
              }}
            >
              <Avatar sx={{ width: 36, height: 36, bgcolor: '#8CD1BC' }}>
                {currentUser.email?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          )}

          {currentUser && isMobile && (
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleLogout} sx={{ minHeight: 44 }}>
                <Logout sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      {currentUser && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 280,
            },
          }}
        >
          {drawer}
        </Drawer>
      )}
    </>
  );
}

export default Navbar;


