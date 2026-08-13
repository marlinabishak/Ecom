import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  LayoutDashboard, Package, ShoppingBag, Users, Tags, MessageSquare, 
  Settings, LogOut, Ticket, Home, Moon, Sun, Menu, X
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  const isAdmin = ['admin', 'super_admin'].includes(user.role);
  const isSupport = user.role === 'support' || isAdmin;

  const links = [];
  
  if (isAdmin) {
    links.push({ label: 'Overview', path: '/admin', icon: <LayoutDashboard size={18} /> });
    links.push({ label: 'Orders', path: '/admin/orders', icon: <ShoppingBag size={18} /> });
    links.push({ label: 'Products', path: '/admin/products', icon: <Package size={18} /> });
    links.push({ label: 'Categories', path: '/admin/categories', icon: <Tags size={18} /> });
    links.push({ label: 'Coupons', path: '/admin/coupons', icon: <Ticket size={18} /> });
    links.push({ label: 'Users', path: '/admin/users', icon: <Users size={18} /> });
    links.push({ label: 'Feedback', path: '/admin/feedback', icon: <MessageSquare size={18} /> });
  } else if (user.role === 'support') {
    links.push({ label: 'Support Dashboard', path: '/support', icon: <LayoutDashboard size={18} /> });
    links.push({ label: 'Tickets', path: '/support/tickets', icon: <MessageSquare size={18} /> });
    links.push({ label: 'Feedback', path: '/support/feedback', icon: <MessageSquare size={18} /> });
  } else {
    links.push({ label: 'My Account', path: '/account?tab=account', icon: <Users size={18} /> });
    links.push({ label: 'My Orders', path: '/account?tab=orders', icon: <ShoppingBag size={18} /> });
    links.push({ label: 'Support Tickets', path: '/account?tab=tickets', icon: <MessageSquare size={18} /> });
  }

  return (
    <div className="flex" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      
      {/* Mobile Overlay */}
      <div 
        className={`dashboard-overlay ${isSidebarOpen ? 'mobile-open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside 
        className={`dashboard-sidebar ${isSidebarOpen ? 'mobile-open' : ''}`}
      >
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" className="flex items-center gap-2" style={{ fontWeight: 800, fontSize: '1.5rem', fontFamily: 'var(--font-heading)' }}>
            <span className="text-accent-gradient">Ecom</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {isAdmin ? 'Admin' : isSupport ? 'Support' : 'Client'}
            </span>
          </Link>
          {isSidebarOpen && (
            <button className="md:hidden" onClick={() => setIsSidebarOpen(false)} style={{ color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
          )}
        </div>
        
        <nav className="no-scrollbar" style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto' }}>
          {links.map((link) => {
            const active = location.pathname + location.search === link.path || (location.pathname === link.path && !location.search && link.path.includes('?tab=account'));
            return (
              <Link key={link.path} to={link.path} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)', fontWeight: 500,
                background: active ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                transition: 'all var(--transition-fast)'
              }}>
                {link.icon}
                {link.label}
              </Link>
            );
          })}
        </nav>
        
        <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ marginBottom: '1rem', padding: '0 1rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
          </div>
          
          <button onClick={toggleTheme} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)', fontWeight: 500, color: 'var(--text-secondary)', width: '100%', textAlign: 'left'
              }}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />} Theme
          </button>
          <Link to="/" style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)', fontWeight: 500, color: 'var(--text-secondary)'
              }}>
            <Home size={18} /> Back to Store
          </Link>
          <button onClick={handleLogout} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)', fontWeight: 500, color: 'var(--danger)', width: '100%', textAlign: 'left'
              }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        
        {/* Mobile Header (Only visible on small screens) */}
        <div className="mobile-dashboard-header" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-light)', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)' }}>
          <button onClick={() => setIsSidebarOpen(true)} style={{ color: 'var(--text-primary)' }}>
            <Menu size={24} />
          </button>
          <Link to="/" style={{ fontWeight: 800, fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>
            <span className="text-accent-gradient">Ecom</span>
          </Link>
        </div>

        <div style={{ padding: '2rem 3rem' }} className="dashboard-main-content page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
