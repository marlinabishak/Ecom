import React, { useState, useEffect } from 'react';
import { Search, Shield, ShieldAlert } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (window.confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) {
      try {
        await api.put(`/api/admin/users/${userId}/role`, { role: newRole });
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      } catch (err) {
        alert(err.response?.data?.detail || "Failed to update role. You may not have permission.");
      }
    }
  };

  const filtered = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-col gap-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: '2rem' }}>User & Role Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Promote users and manage system access levels.</p>
        </div>
      </div>

      {currentUser?.role !== 'super_admin' && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={20} />
          <strong>Warning:</strong> You are not a Super Admin. You can view users but you cannot change their roles.
        </div>
      )}

      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="flex justify-between items-center mb-4">
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}><div className="spinner"></div></div>
        ) : (
          <div className="responsive-table">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>ID</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Name</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Email</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Joined</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Access Role</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td data-label="ID" style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{u.id}</td>
                    <td data-label="Name" style={{ padding: '1rem', fontWeight: 600 }}>{u.name} {u.id === currentUser?.id ? '(You)' : ''}</td>
                    <td data-label="Email" style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td data-label="Joined" style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td data-label="Access Role" style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {u.role === 'super_admin' && <Shield size={16} color="var(--accent-primary)" />}
                        <select 
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={currentUser?.role !== 'super_admin' || u.id === currentUser?.id}
                          style={{ 
                            padding: '0.25rem 0.5rem', width: '140px', fontSize: '0.85rem', fontWeight: 600,
                            background: u.role === 'customer' ? 'var(--bg-secondary)' : 'rgba(16, 185, 129, 0.1)',
                            color: u.role === 'customer' ? 'var(--text-primary)' : 'var(--success)'
                          }}
                        >
                          <option value="customer">Customer</option>
                          <option value="support">Support</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
