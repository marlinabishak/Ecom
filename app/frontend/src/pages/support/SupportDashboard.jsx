import React, { useState, useEffect } from 'react';
import { MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

const SupportDashboard = () => {
  const [stats, setStats] = useState({ openTickets: 0, pendingFeedback: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [ticketsRes, feedbackRes] = await Promise.all([
        api.get('/api/support/tickets'),
        api.get('/api/support/feedback')
      ]);
      
      const open = ticketsRes.data.filter(t => t.status === 'open' || t.status === 'in_progress').length;
      const pending = feedbackRes.data.filter(f => !f.resolved).length;
      
      setStats({ openTickets: open, pendingFeedback: pending });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}><div className="spinner"></div></div>;
  }

  return (
    <div className="flex-col gap-6">
      <div className="mb-6">
        <h1 style={{ fontSize: '2rem' }}>Support Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Welcome to the customer service center.</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
            <AlertCircle size={32} />
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1 }}>{stats.openTickets}</div>
          <div style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>Open Tickets</div>
          <Link to="/support/tickets" className="btn btn-primary" style={{ width: '100%' }}>View Tickets</Link>
        </div>

        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--info)', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
            <MessageSquare size={32} />
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1 }}>{stats.pendingFeedback}</div>
          <div style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>Pending Feedback</div>
          <Link to="/support/feedback" className="btn btn-primary" style={{ width: '100%' }}>View Feedback</Link>
        </div>
      </div>
    </div>
  );
};

export default SupportDashboard;
