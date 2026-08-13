import React, { useState, useEffect } from 'react';
import { Search, CheckCircle } from 'lucide-react';
import api from '../../lib/api';

const AdminFeedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/feedback');
      setFeedback(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await api.put(`/api/admin/feedback/${id}/resolve`);
      setFeedback(feedback.map(f => f.id === id ? { ...f, resolved: true } : f));
    } catch (err) {
      alert("Failed to mark as resolved.");
    }
  };

  const filtered = feedback.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-col gap-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: '2rem' }}>Customer Feedback</h1>
          <p style={{ color: 'var(--text-muted)' }}>Read and manage contact form submissions.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="flex justify-between items-center mb-4">
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search feedback..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}><div className="spinner"></div></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filtered.map(f => (
              <div key={f.id} style={{ 
                padding: '2rem', 
                background: 'var(--bg-tertiary)', 
                borderRadius: 'var(--radius-lg)',
                borderLeft: f.resolved ? '4px solid var(--border-strong)' : '4px solid var(--accent-primary)',
                boxShadow: 'var(--shadow-md)',
                marginBottom: '1rem'
              }}>
                <div className="flex justify-between items-start mb-6" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '250px' }}>
                    <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', color: f.resolved ? 'var(--text-secondary)' : 'var(--text-primary)', fontWeight: 600 }}>
                      {f.subject}
                    </h3>
                    <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                      <span>From: <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{f.name}</span></span>
                      <span style={{ color: 'var(--border-strong)' }}>•</span>
                      <span>{f.email}</span>
                      <span style={{ color: 'var(--border-strong)' }}>•</span>
                      <span>{new Date(f.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    {!f.resolved && (
                      <button 
                        onClick={() => handleResolve(f.id)} 
                        className="btn" 
                        style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-primary)', padding: '0.6rem 1.25rem', fontWeight: 600, borderRadius: 'var(--radius-md)' }}
                      >
                        <CheckCircle size={18} style={{ marginRight: '0.5rem' }} /> Mark Resolved
                      </button>
                    )}
                    {f.resolved && (
                      <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                        <CheckCircle size={14} style={{ marginRight: '0.25rem' }} /> Resolved
                      </span>
                    )}
                  </div>
                </div>
                
                <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <p style={{ whiteSpace: 'pre-line', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '1rem', margin: 0 }}>
                    {f.message}
                  </p>
                </div>
              </div>
            ))}
            
            {filtered.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No feedback found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFeedback;
