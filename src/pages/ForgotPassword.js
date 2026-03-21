import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Mail, ArrowLeft, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import '../styles/App.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [touched, setTouched] = useState(false);

  const validateEmail = (email) => {
    return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
  };

  const isEmailValid = validateEmail(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);

    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await authAPI.resetPassword(email.trim().toLowerCase());
      setSuccess(res.data?.message || 'Kindly check your email to continue.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to process request. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '0.85rem 1rem 0.85rem 2.8rem',
    borderRadius: '12px', fontSize: '0.95rem',
    border: `1.5px solid ${touched && !isEmailValid ? '#ef4444' : 'var(--border-color)'}`,
    background: 'var(--bg-primary)', color: 'var(--text-primary)',
    transition: 'all 0.2s ease', outline: 'none',
    boxShadow: touched && !isEmailValid ? '0 0 0 4px rgba(239, 68, 68, 0.05)' : 'none'
  };

  return (
    <div className="auth-container" style={{ animation: 'fadeIn 0.6s ease-out' }}>
      <div className="auth-card glass" style={{ maxWidth: '480px', width: '95%', padding: '2.5rem' }}>
        <div className="logo" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img src="/logo.png" alt="Logo" style={{ maxWidth: '220px', width: '100%', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }} />
        </div>

        <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', textAlign: 'center', fontSize: '1.5rem', fontWeight: '800' }}>Recover Access</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>Enter your email and we'll send recovery instructions.</p>

        {error && (
          <div className="error-message" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.85rem', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <AlertCircle size={16} /> {error}
          </div>
        )}
        {success && (
          <div className="success-message" style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '0.75rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.85rem', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <ShieldCheck size={16} /> {success}
          </div>
        )}

        {!success ? (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: touched && !isEmailValid ? '#ef4444' : 'var(--text-secondary)', transition: 'color 0.2s' }}>
                  <Mail size={18} />
                </span>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  onBlur={() => setTouched(true)}
                  placeholder="name@company.com" 
                  style={inputStyle} 
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', boxShadow: '0 8px 24px rgba(99, 102, 241, 0.2)', cursor: loading ? 'not-allowed' : 'pointer' }} disabled={loading}>
              {loading ? <Loader2 size={20} className="spinner" /> : 'Send Recovery Link'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
             <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>We've sent a secure link to <strong>{email}</strong>. Please check your inbox and spam folder.</p>
             <Link to="/login" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '600' }}>
               Back to Login
             </Link>
          </div>
        )}

        <div className="form-footer" style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link to="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
