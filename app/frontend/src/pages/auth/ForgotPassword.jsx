import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { toast } from 'react-toastify';
import { ArrowLeft, CheckCircle, Mail, KeyRound, Lock } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
      toast.success('If the email exists, an OTP has been sent.');
      setStep(2);
    } catch (err) {
      toast.error('Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('OTP must be 6 digits');
    
    setLoading(true);
    try {
      await api.post('/api/auth/verify-otp', { email, otp });
      toast.success('OTP verified!');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { email, otp, password });
      toast.success('Password reset successfully!');
      setStep(4);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-enter" style={{ padding: '6rem 1.5rem', maxWidth: '500px', margin: '0 auto' }}>
      <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        <ArrowLeft size={16} /> Back to Login
      </Link>
      
      <div className="card" style={{ padding: '2.5rem' }}>
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="flex flex-col gap-6 page-enter">
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent-primary)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Mail size={32} />
              </div>
              <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Forgot Password</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Enter your email and we'll send you a 6-digit verification code to reset your password.</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Email Address</label>
              <input 
                type="email" 
                required 
                placeholder="john@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }} disabled={loading}>
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        )}
        
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="flex flex-col gap-6 page-enter">
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent-primary)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <KeyRound size={32} />
              </div>
              <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Enter OTP</h1>
              <p style={{ color: 'var(--text-secondary)' }}>We sent a 6-digit code to <strong>{email}</strong>.</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>6-Digit Code</label>
              <input 
                type="text" 
                required 
                maxLength={6}
                placeholder="123456"
                style={{ textAlign: 'center', letterSpacing: '0.25em', fontSize: '1.25rem', fontWeight: 'bold' }}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }} disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            
            <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
              <button type="button" onClick={handleSendOTP} style={{ color: 'var(--accent-primary)' }} disabled={loading}>
                Resend Code
              </button>
            </div>
          </form>
        )}
        
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-6 page-enter">
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent-primary)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Lock size={32} />
              </div>
              <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>New Password</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Create a new secure password for your account.</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>New Password</label>
              <input 
                type="password" 
                required 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Confirm New Password</label>
              <input 
                type="password" 
                required 
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }} disabled={loading || !password || !confirmPassword}>
              {loading ? 'Saving...' : 'Reset Password'}
            </button>
          </form>
        )}
        
        {step === 4 && (
          <div className="flex flex-col gap-6 page-enter" style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--accent-primary)', margin: '0 auto' }}>
              <CheckCircle size={64} />
            </div>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Password Reset!</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Your password has been successfully reset. You can now log in with your new password.</p>
            <Link to="/login" className="btn btn-primary" style={{ padding: '0.75rem', marginTop: '1rem' }}>
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
