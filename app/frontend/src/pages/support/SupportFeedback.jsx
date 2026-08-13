import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import api from '../../lib/api';

const SupportFeedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/support/feedback');
      setFeedback(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
          <p style={{ color: 'var(--text-muted)' }}>Read contact form submissions from customers.</p>
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
                padding: '1.5rem', 
                background: 'var(--bg-tertiary)', 
                borderRadius: 'var(--radius-md)',
                borderLeft: f.resolved ? '4px solid var(--text-muted)' : '4px solid var(--accent-primary)'
              }}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem', color: f.resolved ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                      {f.subject}
                    </h3>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      From: <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{f.name}</span> ({f.email}) {f.user_id ? <span className="badge badge-info" style={{ marginLeft: '0.5rem' }}>User ID: #{f.user_id}</span> : ''} • {new Date(f.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {f.resolved && (
                    <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>Resolved by Admin</span>
                  )}
                  {!f.resolved && (
                    <span className="badge badge-warning">Pending Admin Review</span>
                  )}
                </div>
                
                <p style={{ whiteSpace: 'pre-line', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  {f.message}
                </p>
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

export default SupportFeedback;
