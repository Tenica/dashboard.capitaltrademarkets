import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import '../styles/App.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [requires2Fa, setRequires2Fa] = useState(false);
  const [twoFaUserId, setTwoFaUserId] = useState(null);
  const [twoFaCode, setTwoFaCode] = useState('');
  const { login, loginWith2Fa } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const getEmailError = () => {
    if (!touched.email) return '';
    if (!email) return 'Email is required';
    if (!validateEmail(email)) return 'Please enter a valid email address';
    return '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    
    if (!validateEmail(email) || !password) {
      setError('Please fix the errors before logging in.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        if (result.require2Fa) {
          setRequires2Fa(true);
          setTwoFaUserId(result.userId);
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(result.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('A connection error occurred. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FaSubmit = async (e) => {
    e.preventDefault();
    if (twoFaCode.length < 6) return setError('Enter a 6-digit code');
    setError('');
    setLoading(true);
    try {
      const result = await loginWith2Fa(twoFaUserId, twoFaCode);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Invalid code.');
      }
    } catch (err) {
      setError('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  const emailErr = getEmailError();

  return (
    <div className="auth-container" style={{ animation: 'fadeIn 0.6s ease-out' }}>
      <div className="auth-card glass" style={{ maxWidth: '420px', width: '90%', padding: '2.5rem' }}>
        {requires2Fa ? (
          // 2FA Screen
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div className="logo" style={{ marginBottom: '1.5rem', textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
              <div style={{ background: 'rgba(99,102,241,0.1)', padding: '1.25rem', borderRadius: '50%' }}>
                <ShieldCheck size={48} color="#6366f1" />
              </div>
            </div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', textAlign: 'center', fontSize: '1.5rem', fontWeight: '800' }}>Two-Factor Auth</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>Enter the 6-digit code from your authenticator app</p>
            
            <form onSubmit={handle2FaSubmit}>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <input
                  type="text"
                  maxLength={6}
                  value={twoFaCode}
                  onChange={e => setTwoFaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  style={{
                    width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)',
                    background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '1.5rem',
                    textAlign: 'center', letterSpacing: '8px', fontWeight: '800', transition: 'all 0.2s', outline: 'none'
                  }}
                  disabled={loading}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', cursor: loading ? 'not-allowed' : 'pointer'}} disabled={loading}>
                {loading ? <Loader2 size={18} className="spinner" /> : null} {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              <button type="button" onClick={() => { setRequires2Fa(false); setTwoFaCode(''); }} style={{ width: '100%', padding: '0.8rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.9rem', cursor: 'pointer', fontWeight: '600' }}>
                Back to Login
              </button>
            </form>
          </div>
        ) : (
          // Standard Login Screen
          <>
            <div className="logo" style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <img 
                src="/logo.png" 
                alt="CapitalTradeMarkets Logo" 
                style={{ maxWidth: '240px', width: '100%', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }} 
              />
            </div>

            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', textAlign: 'center', fontSize: '1.5rem', fontWeight: '800' }}>Welcome Back</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>Secure access to your wealth portfolio</p>

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: emailErr ? '#ef4444' : 'var(--text-secondary)' }}>
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => handleBlur('email')}
                    placeholder="yours@example.com"
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem 0.85rem 2.8rem',
                      borderRadius: '12px',
                      border: `1.5px solid ${emailErr ? '#ef4444' : 'var(--border-color)'}`,
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      boxShadow: emailErr ? '0 0 0 4px rgba(239, 68, 68, 0.05)' : 'none'
                    }}
                    disabled={loading}
                  />
                </div>
                {emailErr && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: '500' }}>{emailErr}</p>}
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                   <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Password</label>
                </div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                    <Lock size={18} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => handleBlur('password')}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '0.85rem 3rem 0.85rem 2.8rem',
                      borderRadius: '12px',
                      border: '1.5px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    disabled={loading}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.25rem'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" id="remember" style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }} />
                  <label htmlFor="remember" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>Remember me</label>
                </div>
                <button type="button" onClick={() => navigate('/forgot-password')} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', marginLeft: 'auto' }}>
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ 
                  width: '100%', 
                  padding: '1rem', 
                  borderRadius: '12px', 
                  fontSize: '1rem', 
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.2)',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
                disabled={loading}
              >
                {loading ? <Loader2 size={20} className="spinner" /> : null}
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div className="form-footer" style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              New to the platform? <Link to="/register" style={{ color: 'var(--accent-primary)', fontWeight: '700', textDecoration: 'none' }}>Create Account</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
