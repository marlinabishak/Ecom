import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, MessageCircle } from 'lucide-react';
import api from '../../lib/api';

const SupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/support/tickets');
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetails = async (id) => {
    try {
      const res = await api.get(`/api/support/tickets/${id}`);
      setSelectedTicket(res.data);
    } catch (err) {
      alert("Failed to load ticket.");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/api/support/tickets/${id}/status`, { status: newStatus });
      setTickets(tickets.map(t => t.id === id ? { ...t, status: newStatus } : t));
      if (selectedTicket?.id === id) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    
    setReplyLoading(true);
    try {
      await api.post(`/api/support/tickets/${selectedTicket.id}/reply`, { message: replyMessage });
      setReplyMessage('');
      await loadTicketDetails(selectedTicket.id); // Reload to show new message
      
      // Also update local list to show 'in_progress' if it was open
      if (selectedTicket.status === 'open') {
        setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, status: 'in_progress' } : t));
      }
    } catch (err) {
      alert("Failed to send reply.");
    } finally {
      setReplyLoading(false);
    }
  };

  const filtered = tickets.filter(t => 
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.toString().includes(searchTerm)
  );

  return (
    <div className="flex-col gap-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: '2rem' }}>Support Tickets</h1>
          <p style={{ color: 'var(--text-muted)' }}>Respond to customer inquiries and issues.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="flex justify-between items-center mb-4">
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search tickets..." 
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
                <tr style={{ borderBottom: '1px solid var(--border-strong)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1.5rem', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID</th>
                  <th style={{ padding: '1.5rem', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</th>
                  <th style={{ padding: '1.5rem', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order ID</th>
                  <th style={{ padding: '1.5rem', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '1.5rem', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td data-label="ID" style={{ padding: '1.5rem', fontWeight: 600, color: 'var(--accent-primary)' }}>#{t.id}</td>
                    <td data-label="Subject" style={{ padding: '1.5rem', fontWeight: 500, fontSize: '1.05rem' }}>{t.subject}</td>
                    <td data-label="Order ID" style={{ padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{t.order_id || '-'}</td>
                    <td data-label="Status" style={{ padding: '1.5rem' }}>
                      <select 
                        value={t.status}
                        onChange={(e) => handleStatusChange(t.id, e.target.value)}
                        style={{ padding: '0.4rem 0.75rem', width: 'auto', fontSize: '0.85rem', fontWeight: 600, background: 'var(--bg-tertiary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)' }}
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td data-label="Actions" style={{ padding: '1.5rem', textAlign: 'right' }}>
                      <button onClick={() => loadTicketDetails(t.id)} className="btn" style={{ padding: '0.5rem 1rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-strong)' }}>
                        <MessageCircle size={16} style={{ marginRight: '0.5rem' }} /> Reply
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                      No tickets found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && createPortal(
        <div 
          onClick={() => setSelectedTicket(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.6)', zIndex: 100,
            overflowY: 'auto', padding: '3rem 1rem'
          }}
        >
          <div onClick={e => e.stopPropagation()} className="card" style={{ 
            width: '100%', maxWidth: '700px', margin: '0 auto',
            display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)'
          }}>
            <div className="flex justify-between items-center modal-responsive-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{selectedTicket.subject}</h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ticket #{selectedTicket.id} • Order: {selectedTicket.order_id || 'None'}</div>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="btn btn-secondary">Close</button>
            </div>
            
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedTicket.messages?.map(msg => (
                <div key={msg.id} style={{ 
                  alignSelf: msg.is_staff_reply ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  background: msg.is_staff_reply ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: msg.is_staff_reply ? '#fff' : 'var(--text-primary)',
                  padding: '1rem',
                  borderRadius: '1rem',
                  borderBottomRightRadius: msg.is_staff_reply ? '0' : '1rem',
                  borderBottomLeftRadius: msg.is_staff_reply ? '1rem' : '0',
                }}>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '0.25rem' }}>
                    {msg.is_staff_reply ? 'Support Staff' : 'Customer'} • {new Date(msg.created_at).toLocaleString()}
                  </div>
                  <div style={{ whiteSpace: 'pre-line' }}>{msg.message}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
              <form onSubmit={handleReply} className="filters-responsive" style={{ display: 'flex', gap: '1rem' }}>
                <input 
                  type="text" 
                  required
                  placeholder="Type your reply to the customer..." 
                  value={replyMessage}
                  onChange={e => setReplyMessage(e.target.value)}
                  style={{ flexGrow: 1 }}
                  disabled={replyLoading}
                />
                <button type="submit" className="btn btn-primary" disabled={replyLoading}>
                  {replyLoading ? 'Sending...' : 'Send Reply'}
                </button>
              </form>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
};

export default SupportTickets;
