import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api, { getImageUrl } from '../../lib/api';
import { Package, MapPin, Heart, MessageSquare, Settings, Save, Trash2, X } from 'lucide-react';
import { toast } from 'react-toastify';

const MyAccount = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'account';

  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [tickets, setTickets] = useState([]);
  
  const [name, setName] = useState(user.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketOrderId, setTicketOrderId] = useState('');

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      await api.put(`/api/me/orders/${orderId}/cancel`);
      toast.success("Order cancelled successfully");
      api.get('/api/me/orders').then(res => setOrders(res.data)).catch(console.error);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to cancel order");
    }
  };

  useEffect(() => {
    api.get('/api/me/orders').then(res => setOrders(res.data)).catch(console.error);
    api.get('/api/me/addresses').then(res => setAddresses(res.data)).catch(console.error);
    api.get('/api/me/tickets').then(res => setTickets(res.data)).catch(console.error);
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put('/api/me/profile', { name });
      toast.success('Profile updated successfully!');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/auth/change-password', { current_password: currentPassword, new_password: newPassword });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to change password');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("DANGER: Are you absolutely sure you want to delete your account? This action cannot be undone and all your data will be lost.")) {
      try {
        await api.delete('/api/auth/me/account');
        toast.success("Account deleted. We're sorry to see you go.");
        setTimeout(() => window.location.href = '/', 1500);
      } catch (err) {
        toast.error("Failed to delete account");
      }
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      await api.delete(`/api/me/addresses/${id}`);
      toast.success("Address deleted successfully");
      api.get('/api/me/addresses').then(res => setAddresses(res.data)).catch(console.error);
    } catch (err) {
      toast.error("Failed to delete address");
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/me/tickets', {
        subject: ticketSubject,
        message: ticketMessage,
        order_id: ticketOrderId || null
      });
      toast.success("Support ticket created!");
      setIsTicketModalOpen(false);
      setTicketSubject('');
      setTicketMessage('');
      setTicketOrderId('');
      api.get('/api/me/tickets').then(res => setTickets(res.data)).catch(console.error);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create ticket");
    }
  };

  const loadTicketDetails = async (id) => {
    try {
      const res = await api.get(`/api/me/tickets/${id}`);
      setSelectedTicket(res.data);
    } catch (err) {
      toast.error("Failed to load ticket.");
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    
    setReplyLoading(true);
    try {
      await api.post(`/api/me/tickets/${selectedTicket.id}/reply`, { message: replyMessage });
      setReplyMessage('');
      await loadTicketDetails(selectedTicket.id); // Reload to show new message
    } catch (err) {
      toast.error("Failed to send reply.");
    } finally {
      setReplyLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome, {user.name}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your orders, addresses, and account details here.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* TAB: ORDERS */}
        {activeTab === 'orders' && (
          <div className="card" style={{ padding: '2rem' }}>
            <div className="flex items-center gap-3" style={{ marginBottom: '1.5rem' }}>
              <Package size={24} className="text-accent-primary" />
              <h2 style={{ fontSize: '1.5rem' }}>My Orders</h2>
            </div>
            {orders.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>You haven't placed any orders yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {orders.map(order => (
                  <div key={order.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>Order #{order.id.toString().padStart(5, '0')} <span className={`badge ${order.payment_method === 'cod' ? 'badge-warning' : 'badge-info'}`} style={{ marginLeft: '0.5rem' }}>{order.payment_method === 'cod' ? 'COD' : 'Paid Online'}</span></div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(order.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>₹{order.total?.toFixed(2)}</div>
                        <div className={`badge badge-${order.status === 'delivered' ? 'success' : 'warning'}`} style={{ marginTop: '0.25rem' }}>{order.status}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                      {order.items?.map(item => (
                        <div key={item.id} className="flex gap-4 items-center">
                          {item.image && (
                            <div style={{ width: '40px', height: '40px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                              <img src={getImageUrl(item.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Qty: {item.quantity}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {(order.status === 'pending' || order.status === 'processing') && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button 
                          onClick={() => handleCancelOrder(order.id)} 
                          className="btn btn-outline" 
                          style={{ borderColor: 'var(--danger)', color: 'var(--danger)', padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                        >
                          Cancel Order
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: TICKETS */}
        {activeTab === 'tickets' && (
          <div className="card" style={{ padding: '2rem' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
              <div className="flex items-center gap-3">
                <MessageSquare size={24} className="text-accent-primary" />
                <h2 style={{ fontSize: '1.5rem' }}>Support Tickets</h2>
              </div>
              <button onClick={() => setIsTicketModalOpen(true)} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
                Create Ticket
              </button>
            </div>
            {tickets.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>You haven't opened any support tickets.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {tickets.map(ticket => (
                  <div key={ticket.id} onClick={() => loadTicketDetails(ticket.id)} style={{ padding: '1rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s' }}>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{ticket.subject}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Ticket #{ticket.id} • Opened {new Date(ticket.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={`badge badge-${ticket.status === 'open' ? 'warning' : 'success'}`}>
                      {ticket.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: ACCOUNT */}
        {activeTab === 'account' && (
          <>
            <div className="card" style={{ padding: '2rem' }}>
              <div className="flex items-center gap-3" style={{ marginBottom: '1.5rem' }}>
                <MapPin size={24} className="text-accent-primary" />
                <h2 style={{ fontSize: '1.5rem' }}>Addresses</h2>
              </div>
              {addresses.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No saved addresses.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {addresses.map(addr => (
                    <div key={addr.id} style={{ position: 'relative', padding: '1.25rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)' }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '1.05rem' }}>{addr.full_name} <span className="badge badge-info">{addr.label}</span></div>
                      <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                        {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br/>
                        {addr.city}, {addr.state} {addr.postal_code}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Phone: {addr.phone}</div>
                      <button type="button" onClick={() => handleDeleteAddress(addr.id)} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-muted)', padding: '0.5rem', borderRadius: '50%' }} className="hover:bg-red-50 hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card" style={{ padding: '2rem' }}>
              <div className="flex items-center gap-3" style={{ marginBottom: '1.5rem' }}>
                <Settings size={24} className="text-accent-primary" />
                <h2 style={{ fontSize: '1.5rem' }}>Account Settings</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Update Profile</h3>
                  <div>
                    <label className="label">Display Name</label>
                    <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="label">Email Address</label>
                    <input type="email" className="input" value={user.email} disabled style={{ opacity: 0.7 }} />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Save size={18} /> Save Changes
                  </button>
                </form>
                
                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '1px solid var(--border-light)', paddingLeft: '2rem' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Change Password</h3>
                  <div>
                    <label className="label">Current Password</label>
                    <input type="password" className="input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                  </div>
                  <div>
                    <label className="label">New Password</label>
                    <input type="password" className="input" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Save size={18} /> Update Password
                  </button>
                </form>
              </div>
              
              <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--danger)', marginBottom: '0.5rem' }}>Danger Zone</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button onClick={handleDeleteAccount} className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Trash2 size={16} /> Delete Account
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Create Ticket Modal */}
      {isTicketModalOpen && createPortal(
        <div 
          onClick={() => setIsTicketModalOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.6)', zIndex: 100,
            overflowY: 'auto', padding: '3rem 1rem'
          }}
        >
          <div onClick={e => e.stopPropagation()} className="card" style={{ 
            width: '100%', maxWidth: '500px', margin: '0 auto',
            display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)'
          }}>
            <div className="flex justify-between items-center" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <h2 style={{ fontSize: '1.5rem' }}>Create Support Ticket</h2>
              <button onClick={() => setIsTicketModalOpen(false)} style={{ color: 'var(--text-muted)' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateTicket} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Subject *</label>
                <input type="text" className="input" value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} required />
              </div>
              <div>
                <label className="label">Order ID (Optional)</label>
                <input type="text" className="input" placeholder="e.g. ORD-2026..." value={ticketOrderId} onChange={e => setTicketOrderId(e.target.value)} />
              </div>
              <div>
                <label className="label">Message *</label>
                <textarea className="input" rows="4" value={ticketMessage} onChange={e => setTicketMessage(e.target.value)} required></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsTicketModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}

      {/* View Ticket Modal */}
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
            <div className="flex justify-between items-center" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{selectedTicket.subject}</h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ticket #{selectedTicket.id} • Status: <span style={{fontWeight: 'bold', textTransform: 'capitalize'}}>{selectedTicket.status}</span></div>
              </div>
              <button onClick={() => setSelectedTicket(null)} style={{ color: 'var(--text-muted)' }}><X size={24} /></button>
            </div>
            
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
              {selectedTicket.messages?.length > 0 ? selectedTicket.messages.map(msg => (
                <div key={msg.id} style={{ 
                  alignSelf: msg.is_staff_reply ? 'flex-start' : 'flex-end',
                  maxWidth: '80%',
                  background: msg.is_staff_reply ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
                  color: msg.is_staff_reply ? 'var(--text-primary)' : '#fff',
                  padding: '1rem',
                  borderRadius: '1rem',
                  borderBottomLeftRadius: msg.is_staff_reply ? '0' : '1rem',
                  borderBottomRightRadius: msg.is_staff_reply ? '1rem' : '0',
                }}>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '0.25rem' }}>
                    {msg.is_staff_reply ? 'Support Staff' : 'You'} • {new Date(msg.created_at).toLocaleString()}
                  </div>
                  <div style={{ whiteSpace: 'pre-line' }}>{msg.message}</div>
                </div>
              )) : <div style={{textAlign: 'center', color: 'var(--text-muted)'}}>No messages yet.</div>}
            </div>

            {selectedTicket.status !== 'closed' && (
              <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
                <form onSubmit={handleReply} style={{ display: 'flex', gap: '1rem' }}>
                  <input 
                    type="text" 
                    required
                    placeholder="Type your reply..." 
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    style={{ flexGrow: 1 }}
                    className="input"
                    disabled={replyLoading}
                  />
                  <button type="submit" className="btn btn-primary" disabled={replyLoading}>
                    {replyLoading ? 'Sending...' : 'Send Reply'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      , document.body)}
    </div>
  );
};

export default MyAccount;
