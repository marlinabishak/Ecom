import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { ShoppingCart, User, LogOut, Search, Moon, Sun, Menu, X } from 'lucide-react';
import CartDrawer from '../CartDrawer';

const PublicLayout = () => {
  const { user, logout } = useAuth();
  const { cart, toggleCart } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const totalItems = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  return (
    <div className="flex flex-col" style={{ minHeight: '100vh' }}>
      <header className="glass-panel" style={{ 
        position: 'sticky', top: 0, zIndex: 50, 
        borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderRadius: 0
      }}>
        <div className="container flex items-center justify-between" style={{ height: 'var(--nav-height)' }}>
          <Link to="/" className="flex items-center gap-2" style={{ fontWeight: 800, fontSize: '1.5rem', fontFamily: 'var(--font-heading)' }}>
            <span className="text-accent-gradient">Ecom</span>
          </Link>
          
          <nav className="desktop-nav flex items-center gap-8" style={{ fontWeight: 500 }}>
            <Link to="/shop" style={{ color: 'var(--text-secondary)' }}>Shop</Link>
            <Link to="/categories" style={{ color: 'var(--text-secondary)' }}>Categories</Link>
            <Link to="/about" style={{ color: 'var(--text-secondary)' }}>About</Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} style={{ color: 'var(--text-primary)' }} title="Toggle Theme">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <div className="desktop-search relative" style={{ display: 'flex', alignItems: 'center' }}>
              {showSearch ? (
                <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    placeholder="Search products..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    style={{
                      padding: '0.4rem 1rem',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      width: '200px'
                    }}
                  />
                  <button type="button" onClick={() => setShowSearch(false)} style={{ marginLeft: '-30px', color: 'var(--text-muted)' }}>
                    <X size={16} />
                  </button>
                </form>
              ) : (
                <button onClick={() => setShowSearch(true)} style={{ color: 'var(--text-primary)' }}>
                  <Search size={20} />
                </button>
              )}
            </div>
            
            <button onClick={toggleCart} style={{ color: 'var(--text-primary)', position: 'relative' }}>
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span style={{
                  position: 'absolute', top: -8, right: -8,
                  background: 'var(--accent-primary)', color: '#fff',
                  fontSize: '0.65rem', fontWeight: 'bold',
                  width: '18px', height: '18px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {totalItems}
                </span>
              )}
            </button>
            
            <div className="desktop-auth">
              {user ? (
                <div className="flex items-center gap-4" style={{ marginLeft: '1rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border-light)' }}>
                  <Link to={['admin', 'super_admin'].includes(user.role) ? '/admin' : user.role === 'support' ? '/support' : '/account'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                    <User size={18} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{user.name.split(' ')[0] || 'Account'}</span>
                  </Link>
                  <button onClick={handleLogout} style={{ color: 'var(--text-muted)' }} title="Logout">
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4" style={{ marginLeft: '1rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border-light)' }}>
                  <Link to="/login" style={{ fontWeight: 500 }}>Login</Link>
                  <Link to="/register" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>Sign Up</Link>
                </div>
              )}
            </div>
            
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ color: 'var(--text-primary)' }}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="mobile-menu" style={{ 
            borderTop: '1px solid var(--border-light)', 
            padding: '1.5rem', 
            background: 'var(--bg-primary)',
            display: 'flex', flexDirection: 'column', gap: '1.5rem'
          }}>
            <nav className="flex flex-col gap-4" style={{ fontWeight: 500 }}>
              <Link to="/shop" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-primary)' }}>Shop</Link>
              <Link to="/categories" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-primary)' }}>Categories</Link>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-primary)' }}>About</Link>
            </nav>
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {user ? (
                <>
                  <Link to={['admin', 'super_admin'].includes(user.role) ? '/admin' : user.role === 'support' ? '/support' : '/account'} onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                    <User size={18} /> My Account
                  </Link>
                  <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', textAlign: 'left' }}>
                    <LogOut size={18} /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{ fontWeight: 500 }}>Login</Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary" style={{ padding: '0.5rem', textAlign: 'center' }}>Sign Up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <footer style={{ borderTop: '1px solid var(--border-light)', padding: '4rem 0', marginTop: 'auto', background: 'var(--bg-secondary)' }}>
        <div className="container grid grid-cols-4 gap-8">
          <div>
            <h3 className="text-accent-gradient" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Ecom</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Premium eCommerce experience delivering quality and aesthetics.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h4 style={{ marginBottom: '1rem' }}>Shop</h4>
            <Link to="/shop" style={{ color: 'var(--text-muted)' }}>All Products</Link>
            <Link to="/categories" style={{ color: 'var(--text-muted)' }}>Categories</Link>
            <Link to="/shop?featured=true" style={{ color: 'var(--text-muted)' }}>Featured</Link>
          </div>
          <div className="flex flex-col gap-2">
            <h4 style={{ marginBottom: '1rem' }}>Support</h4>
            <Link to="/contact" style={{ color: 'var(--text-muted)' }}>Contact Us</Link>
            <Link to="/about" style={{ color: 'var(--text-muted)' }}>About Us</Link>
            <Link to="/legal" style={{ color: 'var(--text-muted)' }}>Terms & Privacy</Link>
          </div>
          <div className="flex flex-col gap-2">
            <h4 style={{ marginBottom: '1rem' }}>Account</h4>
            <Link to="/login" style={{ color: 'var(--text-muted)' }}>Login</Link>
            <Link to="/register" style={{ color: 'var(--text-muted)' }}>Register</Link>
            <Link to="/account" style={{ color: 'var(--text-muted)' }}>My Profile</Link>
          </div>
        </div>
      </footer>
      
      <CartDrawer />
    </div>
  );
};

export default PublicLayout;
