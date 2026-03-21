import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Lock, Eye, EyeOff, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import '../styles/App.css';

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;
  if (score <= 1) return { score, label: 'Weak', color: '#ef4444' };
  if (score <= 2) return { score, label: 'Fair', color: '#f59e0b' };
  if (score <= 3) return { score, label: 'Good', color: '#3b82f6' };
  return { score, label: 'Strong', color: '#10b981' };
}

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleBlur = (e) => setTouched({ ...touched, [e.target.name]: true });

  const passwordStrength = getPasswordStrength(formData.password);
  const passwordsMismatch = formData.confirmPassword && formData.password !== formData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ password: true, confirmPassword: true });

    if (!formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authAPI.changePassword(token, formData.password);
      setSuccess('Your password has been successfully reset.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired recovery link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: '100%', padding: '0.85rem 1rem 0.85rem 2.8rem',
    borderRadius: '12px', fontSize: '0.95rem',
    border: `1.5px solid ${touched[field] && !formData[field] ? '#ef4444' : 'var(--border-color)'}`,
    background: 'var(--bg-primary)', color: 'var(--text-primary)',
    transition: 'all 0.2s ease', outline: 'none',
    boxShadow: touched[field] && !formData[field] ? '0 0 0 4px rgba(239, 68, 68, 0.05)' : 'none'
  });

  return (
    <div className="auth-container" style={{ animation: 'fadeIn 0.6s ease-out' }}>
      <div className="auth-card glass" style={{ maxWidth: '480px', width: '95%', padding: '2.5rem' }}>
        <div className="logo" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img src="/logo.png" alt="Logo" style={{ maxWidth: '220px', width: '100%', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }} />
        </div>

        <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', textAlign: 'center', fontSize: '1.5rem', fontWeight: '800' }}>New Password</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>Secure your account with a strong replacement password.</p>

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
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Replacement Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: touched.password && !formData.password ? '#ef4444' : 'var(--text-secondary)', transition: 'color 0.2s', zIndex: 2 }}>
                  <Lock size={18} />
                </span>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  onBlur={handleBlur}
                  placeholder="At least 8 characters" 
                  style={{ ...inputStyle('password'), paddingRight: '2.5rem' }} 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', zIndex: 3 }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Confirm Replacement</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: touched.confirmPassword && !formData.confirmPassword ? '#ef4444' : 'var(--text-secondary)', transition: 'color 0.2s', zIndex: 2 }}>
                  <Lock size={18} />
                </span>
                <input 
                  type={showConfirm ? 'text' : 'password'} 
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  onBlur={handleBlur}
                  placeholder="Repeat new password" 
                  style={{ ...inputStyle('confirmPassword'), paddingRight: '2.5rem', border: `1.5px solid ${passwordsMismatch ? '#ef4444' : 'var(--border-color)'}` }} 
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', zIndex: 3 }}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {formData.password && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i <= passwordStrength.score ? passwordStrength.color : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />)}
                </div>
                <div style={{ fontSize: '0.75rem', color: passwordStrength.color, fontWeight: '600' }}>{passwordStrength.label} Security</div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', boxShadow: '0 8px 24px rgba(99, 102, 241, 0.2)', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '1rem' }} disabled={loading}>
              {loading ? <Loader2 size={20} className="spinner" /> : 'Update Password'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
             <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>Redirecting to login in a few seconds...</p>
             <Link to="/login" className="btn btn-primary" style={{ width: '100%', textDecoration: 'none', padding: '0.85rem', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
               Back to Sign In
             </Link>
          </div>
        )}

        {!success && (
          <div className="form-footer" style={{ marginTop: '2rem', textAlign: 'center' }}>
            <Link to="/forgot-password" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
               Invalid link? Request a new one
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
