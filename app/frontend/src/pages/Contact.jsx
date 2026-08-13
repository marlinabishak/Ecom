import React, { useState } from 'react';
import api from '../lib/api';
import { toast } from 'react-toastify';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/feedback', formData);
      toast.success('Message sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter container" style={{ padding: '4rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem', maxWidth: '600px', margin: '0 auto 4rem auto' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Contact <span className="text-accent-gradient">Us</span></h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Have a question or feedback? We'd love to hear from you. Fill out the form below and our team will be in touch.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8" style={{ alignItems: 'start' }}>
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Send a Message</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Name</label>
              <input 
                type="text" 
                required 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="John Doe"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email Address</label>
              <input 
                type="email" 
                required 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Subject</label>
              <input 
                type="text" 
                required 
                value={formData.subject}
                onChange={e => setFormData({...formData, subject: e.target.value})}
                placeholder="How can we help?"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Message</label>
              <textarea 
                required 
                rows="5"
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
                placeholder="Write your message here..."
              ></textarea>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Sending...' : <><Send size={18} /> Send Message</>}
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-6">
          <div className="card" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-full)', color: 'var(--accent-primary)' }}>
              <Mail size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Email Us</h3>
              <p style={{ color: 'var(--text-muted)' }}>abi@gmail.com</p>
            </div>
          </div>
          
          <div className="card" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-full)', color: 'var(--info)' }}>
              <Phone size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Call Us</h3>
              <p style={{ color: 'var(--text-muted)' }}>+91 98765 43210</p>
            </div>
          </div>

          <div className="card" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-full)', color: 'var(--warning)' }}>
              <MapPin size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Visit Us</h3>
              <p style={{ color: 'var(--text-muted)' }}>123 Commerce Avenue<br/>Tech Park, Bangalore, India</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
