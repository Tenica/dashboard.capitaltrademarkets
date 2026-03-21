import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { User, Mail, Globe, Lock, Eye, EyeOff, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import '../styles/App.css';

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua & Deps","Argentina","Armenia","Australia",
  "Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin",
  "Bhutan","Bolivia","Bosnia Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina","Burma","Burundi",
  "Cambodia","Cameroon","Canada","Cape Verde","Central African Rep","Chad","Chile","China","Colombia","Comoros",
  "Congo","Congo (Democratic Rep)","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic","Denmark","Djibouti",
  "Dominica","Dominican Republic","East Timor","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea",
  "Estonia","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada",
  "Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran",
  "Iraq","Ireland","Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati",
  "Korea North","Korea South","Kosovo","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya",
  "Liechtenstein","Lithuania","Luxembourg","Macedonia","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta",
  "Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro",
  "Morocco","Mozambique","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria",
  "Norway","Oman","Pakistan","Palau","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland",
  "Portugal","Qatar","Romania","Russian Federation","Rwanda","St Kitts & Nevis","St Lucia","Saint Vincent",
  "Samoa","San Marino","Sao Tome & Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone",
  "Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Sudan","Spain","Sri Lanka",
  "Sudan","Suriname","Swaziland","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand",
  "Togo","Tonga","Trinidad & Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine",
  "United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Vatican City",
  "Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
];

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

function Register() {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '',
    password: '', confirmPassword: '', country: '', referral: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleBlur = (e) => setTouched({ ...touched, [e.target.name]: true });

  const validateEmail = (email) => {
    return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const passwordsMismatch = formData.confirmPassword && formData.password !== formData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      firstName: true, lastName: true, email: true,
      country: true, password: true, confirmPassword: true
    });

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.country || !formData.password) {
      setError('Please fill in all mandatory fields.'); return;
    }
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address.'); return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.'); return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.'); return;
    }

    setLoading(true);
    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        country: formData.country,
        ...(formData.referral.trim() ? { referral: formData.referral.trim() } : {})
      };
      const res = await authAPI.createUser(payload);
      setSuccess(res.data?.message || 'Elite account created! Moving to login...');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'System failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const iconStyle = (field) => ({
    position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
    color: touched[field] && !formData[field] ? '#ef4444' : 'var(--text-secondary)',
    transition: 'color 0.2s', zIndex: 2
  });

  const inputStyle = (field) => ({
    width: '100%', padding: '0.85rem 1rem 0.85rem 2.8rem',
    borderRadius: '12px', fontSize: '0.95rem',
    border: `1.5px solid ${touched[field] && !formData[field] ? '#ef4444' : 'var(--border-color)'}`,
    background: 'var(--bg-primary)', color: 'var(--text-primary)',
    transition: 'all 0.2s ease', outline: 'none',
    boxShadow: touched[field] && !formData[field] ? '0 0 0 4px rgba(239, 68, 68, 0.05)' : 'none'
  });

  const labelStyle = {
    display: 'block', fontSize: '0.85rem', fontWeight: '600',
    color: 'var(--text-secondary)', marginBottom: '0.5rem'
  };

  return (
    <div className="auth-container" style={{ animation: 'fadeIn 0.6s ease-out' }}>
      <div className="auth-card glass" style={{ maxWidth: '620px', width: '95%', padding: '2.5rem' }}>
        <div className="logo" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img src="/logo.png" alt="Logo" style={{ maxWidth: '220px', width: '100%', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }} />
        </div>

        <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', textAlign: 'center', fontSize: '1.5rem', fontWeight: '800' }}>Portfolio Registration</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>Join the elite network of digital asset investors</p>

        {error && (
          <div className="error-message" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.85rem', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <Lock size={16} /> {error}
          </div>
        )}
        {success && (
          <div className="success-message" style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '0.75rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.85rem', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <ShieldCheck size={16} /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-grid">
            <div className="form-group">
              <label style={labelStyle}>First Name</label>
              <div style={{ position: 'relative' }}>
                <span style={iconStyle('firstName')}><User size={18} /></span>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} onBlur={handleBlur} placeholder="John" style={inputStyle('firstName')} />
              </div>
            </div>
            <div className="form-group">
              <label style={labelStyle}>Last Name</label>
              <div style={{ position: 'relative' }}>
                <span style={iconStyle('lastName')}><User size={18} /></span>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} onBlur={handleBlur} placeholder="Doe" style={inputStyle('lastName')} />
              </div>
            </div>
          </div>

          <div className="auth-grid-uneven">
            <div className="form-group">
              <label style={labelStyle}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <span style={iconStyle('email')}><Mail size={18} /></span>
                <input type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} placeholder="john@example.com" style={inputStyle('email')} />
              </div>
            </div>
            <div className="form-group">
              <label style={labelStyle}>Country</label>
              <div style={{ position: 'relative' }}>
                <span style={iconStyle('country')}><Globe size={18} /></span>
                <select name="country" value={formData.country} onChange={handleChange} onBlur={handleBlur} style={{ ...inputStyle('country'), appearance: 'none', cursor: 'pointer' }}>
                  <option value="">Select...</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="auth-grid">
            <div className="form-group">
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <span style={iconStyle('password')}><Lock size={18} /></span>
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} onBlur={handleBlur} placeholder="Min. 8 char" style={{ ...inputStyle('password'), paddingRight: '2.5rem' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label style={labelStyle}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <span style={iconStyle('confirmPassword')}><Lock size={18} /></span>
                <input type={showConfirm ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur} placeholder="Repeat it" style={{ ...inputStyle('confirmPassword'), paddingRight: '2.5rem', border: `1.5px solid ${passwordsMismatch ? '#ef4444' : 'var(--border-color)'}` }} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {formData.password && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i <= passwordStrength.score ? passwordStrength.color : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />)}
              </div>
              <div style={{ fontSize: '0.75rem', color: passwordStrength.color, fontWeight: '600' }}>{passwordStrength.label} Security</div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
              Referral Code <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: '400' }}>Optional</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={iconStyle('referral')}><ShieldCheck size={18} /></span>
              <input type="text" name="referral" value={formData.referral} onChange={handleChange} placeholder="Invite code" style={inputStyle('referral')} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', boxShadow: '0 8px 24px rgba(99, 102, 241, 0.2)', cursor: loading || success ? 'not-allowed' : 'pointer' }} disabled={loading || !!success}>
             {loading ? <Loader2 size={20} className="spinner" /> : null}
             {loading ? 'Processing Elite Account...' : '🚀 Create Your Strategy'}
          </button>
        </form>

        <div className="form-footer" style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Part of the collective? <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: '700', textDecoration: 'none' }}>Sign In <ArrowRight size={14} style={{ verticalAlign: 'middle' }} /></Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
