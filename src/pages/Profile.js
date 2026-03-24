import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminContext } from '../components/layout/Layout';
import {
  User, Mail, Globe, MapPin, Briefcase, Edit3, Shield, CheckCircle,
  Plus, Trash2, Wallet, X, Save, ToggleLeft, ToggleRight, AlertTriangle, Loader2, ShieldCheck, Copy
} from 'lucide-react';
import { systemWalletAPI, authAPI } from '../services/api';
import '../styles/dashboard.css';

const CURRENCIES = ['USDT', 'BTC', 'ETH', 'USDC', 'BNB'];

const CURRENCY_COLORS = {
  USDT: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', color: '#10b981' },
  BTC:  { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', color: '#f59e0b' },
  ETH:  { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.25)', color: '#6366f1' },
  USDC: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', color: '#3b82f6' },
  BNB:  { bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.25)', color: '#eab308' },
};

const EMPTY_FORM = { label: '', currency: 'USDT', address: '', network: '', isActive: true };

function Profile() {
  const { user } = useAuth();
  const { isAdmin } = useContext(AdminContext);

  // System Wallet state (admin only)
  const [wallets, setWallets] = useState([]);
  const [loadingWallets, setLoadingWallets] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // wallet id to confirm delete
  const [deleting, setDeleting] = useState(false);
  const [walletMsg, setWalletMsg] = useState({ type: '', text: '' });

  // 2FA state
  const [twoFaSetupData, setTwoFaSetupData] = useState(null);
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [twoFaCode, setTwoFaCode] = useState('');
  const [twoFaMsg, setTwoFaMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (isAdmin) fetchWallets();
  }, [isAdmin]);

  const fetchWallets = async () => {
    setLoadingWallets(true);
    try {
      const res = await systemWalletAPI.getAllSystemWallets();
      const allData = res.data?.message || [];
      // Filter out "rubbish" (empty or malformed objects)
      const validWallets = allData.filter(w => w && w.address && w.currency);
      setWallets(validWallets);
    } catch {
      setWalletMsg({ type: 'error', text: 'Failed to load system wallets.' });
    } finally {
      setLoadingWallets(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setWalletMsg({ type: '', text: '' });
  };

  const openEdit = (w) => {
    setEditingId(w._id);
    setForm({ label: w.label, currency: w.currency, address: w.address, network: w.network || '', isActive: w.isActive });
    setShowForm(true);
    setWalletMsg({ type: '', text: '' });
  };

  const cancelForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.label.trim() || !form.address.trim()) {
      setWalletMsg({ type: 'error', text: 'Label and Address are required.' });
      return;
    }
    setSaving(true);
    setWalletMsg({ type: '', text: '' });
    try {
      if (editingId) {
        await systemWalletAPI.editSystemWallet(editingId, form);
        setWalletMsg({ type: 'success', text: 'Wallet updated successfully!' });
      } else {
        await systemWalletAPI.createSystemWallet(form);
        setWalletMsg({ type: 'success', text: 'Wallet added successfully!' });
      }
      cancelForm();
      fetchWallets();
    } catch (err) {
      setWalletMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save wallet.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await systemWalletAPI.deleteSystemWallet(id);
      setWallets(w => w.filter(x => x._id !== id));
      setDeleteConfirm(null);
      setWalletMsg({ type: 'success', text: 'Wallet deleted.' });
    } catch {
      setWalletMsg({ type: 'error', text: 'Failed to delete wallet.' });
    } finally {
      setDeleting(false);
    }
  };

  const start2FASetup = async () => {
    setTwoFaLoading(true);
    setTwoFaMsg({ type: '', text: '' });
    try {
      const res = await authAPI.generate2FaSecret();
      setTwoFaSetupData(res.data);
    } catch (err) {
      setTwoFaMsg({ type: 'error', text: 'Error generating 2FA secret.' });
    } finally {
      setTwoFaLoading(false);
    }
  };

  const confirm2FASetup = async (e) => {
    e.preventDefault();
    if (twoFaCode.length < 6) return setTwoFaMsg({ type: 'error', text: 'Enter 6-digit code.'});
    setTwoFaLoading(true);
    setTwoFaMsg({ type: '', text: '' });
    try {
      await authAPI.enable2Fa(twoFaCode);
      setTwoFaMsg({ type: 'success', text: '2FA Activated Successfully!' });
      
      // Update local storage user state optimistically
      if (user) {
        user.isTwoFactorEnabled = true;
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      setTwoFaSetupData(null);
    } catch (err) {
      setTwoFaMsg({ type: 'error', text: err.response?.data?.message || 'Invalid code.' });
    } finally {
      setTwoFaLoading(false);
    }
  };

  const inp = (error) => ({
    width: '100%', padding: '0.75rem 0.9rem',
    background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
    color: '#f8fafc', borderRadius: '10px', fontSize: '0.9rem',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s'
  });

  const lbl = { display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.4px' };

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>My Profile</h1>
          <p>Manage your account settings and {isAdmin ? 'system wallets' : 'personal details'}.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Avatar Card */}
        <div className="card glass" style={{ padding: '2rem', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '100%', background: 'var(--accent-gradient)', opacity: 0.03, clipPath: 'circle(150px at 100% 50%)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ width: '90px', height: '90px', borderRadius: '24px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.4rem', fontWeight: '800', color: 'white', boxShadow: '0 10px 25px -5px rgba(99,102,241,0.4)' }}>
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <div>
                <h2 style={{ margin: '0 0 0.3rem', fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {user?.firstName?.charAt(0).toUpperCase() + user?.firstName?.slice(1).toLowerCase()} {user?.lastName?.charAt(0).toUpperCase() + user?.lastName?.slice(1).toLowerCase()}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <Briefcase size={14} /> {user?.isAdmin ? 'Administrator' : 'Premium Investor'}
                  <span style={{ opacity: 0.3 }}>•</span>
                  <MapPin size={14} /> {user?.country || 'World'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem' }}>
                  <Mail size={13} style={{ color: '#64748b' }} />
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{user?.email}</span>
                </div>
              </div>
            </div>
            {user?.isAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', padding: '0.5rem 1rem', borderRadius: '10px' }}>
                <Shield size={16} style={{ color: '#6366f1' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#818cf8' }}>Admin Account</span>
              </div>
            )}
          </div>
        </div>

        {/* Personal Info Card */}
        <div className="card glass" style={{ padding: '1.75rem', borderRadius: '20px' }}>
          <h3 style={{ margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            <User size={18} style={{ color: '#6366f1' }} /> Personal Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
            {[
              { label: 'First Name', value: user?.firstName?.charAt(0).toUpperCase() + user?.firstName?.slice(1).toLowerCase() },
              { label: 'Last Name', value: user?.lastName?.charAt(0).toUpperCase() + user?.lastName?.slice(1).toLowerCase() },
              { label: 'Email', value: user?.email },
              { label: 'Country', value: user?.country || '—' },
              { label: 'Account Type', value: user?.isAdmin ? 'Administrator' : 'Investor' },
              { label: 'Status', value: user?.isBlocked ? 'Blocked' : 'Active', color: user?.isBlocked ? '#ef4444' : '#10b981' },
            ].map((item, i) => (
              <div key={i}>
                <label style={{ ...lbl, textTransform: 'none', letterSpacing: 0, fontSize: '0.78rem' }}>{item.label}</label>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: item.color || 'var(--text-primary)' }}>{item.value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle size={18} color="#10b981" />
            <span style={{ fontSize: '0.85rem', color: '#6ee7b7', fontWeight: '600' }}>Account Verified — Full platform privileges unlocked.</span>
          </div>
        </div>

        {/* Security Info Card */}
        <div className="card glass" style={{ padding: '1.75rem', borderRadius: '20px' }}>
          <h3 style={{ margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            <ShieldCheck size={18} style={{ color: '#10b981' }} /> Security Settings
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.25rem', borderRadius: '12px' }}>
            <div>
              <h4 style={{ margin: '0 0 0.2rem', color: '#f8fafc', fontSize: '1rem' }}>Two-Factor Authentication (2FA)</h4>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', maxWidth: '400px', lineHeight: 1.5 }}>
                Add an extra layer of security to your account. When logging in, you'll need to provide a code from Google Authenticator.
              </p>
            </div>
            
            {user?.isTwoFactorEnabled ? (
              <div style={{ padding: '0.6rem 1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px', color: '#10b981', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={16} /> 2FA Enabled
              </div>
            ) : !twoFaSetupData ? (
              <button 
                onClick={start2FASetup} 
                disabled={twoFaLoading}
                style={{ background: 'var(--accent-gradient)', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', color: 'white', fontWeight: '700', fontSize: '0.85rem', cursor: twoFaLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {twoFaLoading ? <Loader2 size={15} style={{ animation: 'spin 1s infinite' }} /> : <Shield size={15}/>} 
                Set Up 2FA
              </button>
            ) : null}
          </div>

          {twoFaMsg.text && (
            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: twoFaMsg.type === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${twoFaMsg.type === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`, color: twoFaMsg.type === 'error' ? '#fca5a5' : '#6ee7b7' }}>
              {twoFaMsg.type === 'error' ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
              {twoFaMsg.text}
              <button onClick={() => setTwoFaMsg({ type: '', text: '' })} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}><X size={14} /></button>
            </div>
          )}

          {twoFaSetupData && !user?.isTwoFactorEnabled && (
            <div style={{ marginTop: '1.25rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', animation: 'fadeIn 0.3s ease-out' }}>
               <h4 style={{ margin: '0 0 1rem', color: '#f8fafc', fontSize: '1rem', textAlign: 'center' }}>Scan QR Code</h4>
               <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                 <div style={{ background: 'white', padding: '0.5rem', borderRadius: '8px' }}>
                    <img src={twoFaSetupData.qrCodeUrl} alt="2FA QR Code" style={{ width: '160px', height: '160px' }} />
                 </div>
               </div>
               <p style={{ textAlign: 'center', margin: '0 0 0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>Or enter this code manually:</p>
               <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', gap: '0.5rem' }}>
                  <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem 1rem', borderRadius: '6px', color: '#818cf8', fontSize: '0.9rem', letterSpacing: '1px' }}>{twoFaSetupData.secret}</code>
               </div>

               <form onSubmit={confirm2FASetup} style={{ maxWidth: '300px', margin: '0 auto' }}>
                  <div style={{ marginBottom: '1rem' }}>
                     <input type="text" maxLength={6} placeholder="000000" value={twoFaCode} onChange={e => setTwoFaCode(e.target.value.replace(/\D/g, ''))} style={{ ...inp(false), textAlign: 'center', fontSize: '1.2rem', letterSpacing: '6px', fontWeight: '800' }} required />
                  </div>
                  <button type="submit" disabled={twoFaLoading} style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white', fontWeight: '700', fontSize: '0.9rem', cursor: twoFaLoading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                    {twoFaLoading ? <Loader2 size={16} style={{ animation: 'spin 1s infinite' }} /> : <CheckCircle size={16} />} Verify & Enable
                  </button>
               </form>
            </div>
          )}
        </div>

        {/* ============================================================
            ADMIN-ONLY: System Wallet Management
            ============================================================ */}
        {isAdmin && (
          <div className="card glass" style={{ padding: '1.75rem', borderRadius: '20px' }}>
            {/* Section header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                <Wallet size={18} style={{ color: '#f59e0b' }} /> System Wallets
                <span style={{ fontSize: '0.72rem', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', padding: '0.2rem 0.55rem', borderRadius: '5px', fontWeight: '700', letterSpacing: '0.3px' }}>
                  ADMIN ONLY
                </span>
              </h3>
              {!showForm && (
                <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', color: 'white', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}>
                  <Plus size={15} /> Add Wallet
                </button>
              )}
            </div>

            {/* Feedback messages */}
            {walletMsg.text && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: walletMsg.type === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${walletMsg.type === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`, color: walletMsg.type === 'error' ? '#fca5a5' : '#6ee7b7' }}>
                {walletMsg.type === 'error' ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                {walletMsg.text}
                <button onClick={() => setWalletMsg({ type: '', text: '' })} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}><X size={14} /></button>
              </div>
            )}

            {/* Add / Edit Form */}
            {showForm && (
              <form onSubmit={handleSave} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.25rem', animation: 'fadeIn 0.2s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '0.95rem', fontWeight: '700' }}>
                    {editingId ? '✏️ Edit Wallet' : '➕ Add New Wallet'}
                  </h4>
                  <button type="button" onClick={cancelForm} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex' }}><X size={16} /></button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label style={lbl}>Label *</label>
                    <input type="text" placeholder="e.g. Main USDT Wallet" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} style={inp(false)} required />
                  </div>
                  <div>
                    <label style={lbl}>Currency *</label>
                    <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} style={{ ...inp(false), cursor: 'pointer', appearance: 'none' }}>
                      {CURRENCIES.map(c => <option key={c} value={c} style={{ background: '#1e293b' }}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={lbl}>Wallet Address *</label>
                  <input type="text" placeholder="e.g. TXx3K...p9mZ" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} style={{ ...inp(false), fontFamily: 'monospace' }} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={lbl}>Network</label>
                    <input type="text" placeholder="e.g. TRC20, ERC20..." value={form.network} onChange={e => setForm(f => ({ ...f, network: e.target.value }))} style={inp(false)} />
                  </div>
                  <div>
                    <label style={lbl}>Status</label>
                    <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: `1.5px solid ${form.isActive ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, background: form.isActive ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', color: form.isActive ? '#10b981' : '#ef4444', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                      {form.isActive ? <><ToggleRight size={16} /> Active</> : <><ToggleLeft size={16} /> Inactive</>}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={cancelForm} disabled={saving} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} style={{ flex: 2, padding: '0.75rem', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: saving ? 0.7 : 1 }}>
                    {saving ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Save size={15} /> {editingId ? 'Update Wallet' : 'Add Wallet'}</>}
                  </button>
                </div>
              </form>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
              <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '1rem 1.1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
                  <AlertTriangle size={16} color="#ef4444" />
                  <span style={{ fontWeight: '700', color: '#fca5a5', fontSize: '0.9rem' }}>Delete this wallet? This cannot be undone.</span>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button onClick={() => setDeleteConfirm(null)} disabled={deleting} style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                    Cancel
                  </button>
                  <button onClick={() => handleDelete(deleteConfirm)} disabled={deleting} style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', background: '#ef4444', border: 'none', color: 'white', cursor: deleting ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', opacity: deleting ? 0.7 : 1 }}>
                    {deleting ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={13} />} Delete
                  </button>
                </div>
              </div>
            )}

            {/* Wallet list */}
            {loadingWallets ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
                <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '0.85rem' }}>Loading wallets...</p>
              </div>
            ) : wallets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'rgba(245, 158, 11, 0.05)', border: '1.5px dashed rgba(245, 158, 11, 0.2)', borderRadius: '16px' }}>
                <Wallet size={42} style={{ margin: '0 auto 1.25rem', color: '#f59e0b', opacity: 0.8 }} />
                <h4 style={{ margin: '0 0 0.5rem', color: '#f8fafc', fontSize: '1.1rem' }}>No System Wallets Configured</h4>
                <p style={{ margin: '0 0 1.5rem', fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto' }}>
                  Users need a wallet address to pay for their investments. Please add at least one (e.g., USDT, BTC) to enable payments.
                </p>
                {!showForm && (
                  <button onClick={openAdd} style={{ padding: '0.65rem 1.5rem', borderRadius: '10px', background: '#f59e0b', border: 'none', color: '#0f172a', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={16} /> Add First Wallet
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {wallets.map(w => {
                  const col = CURRENCY_COLORS[w.currency] || CURRENCY_COLORS.USDT;
                  return (
                    <div key={w._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.9rem 1rem', background: 'rgba(255,255,255,0.025)', border: `1px solid rgba(255,255,255,0.07)`, borderRadius: '12px', flexWrap: 'wrap' }}>
                      {/* Currency badge */}
                      <div style={{ background: col.bg, border: `1px solid ${col.border}`, color: col.color, borderRadius: '8px', padding: '0.35rem 0.7rem', fontWeight: '800', fontSize: '0.8rem', flexShrink: 0 }}>
                        {w.currency}
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '700', color: '#f8fafc', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {w.label}
                          {w.network && <span style={{ fontSize: '0.7rem', color: '#64748b', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{w.network}</span>}
                          <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '0.1rem 0.45rem', borderRadius: '5px', background: w.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)', color: w.isActive ? '#10b981' : '#ef4444', border: `1px solid ${w.isActive ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.2)'}` }}>
                            {w.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#64748b', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '320px' }}>
                          {w.address}
                        </div>
                      </div>
                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '0.45rem', flexShrink: 0 }}>
                        <button onClick={() => openEdit(w)} style={{ padding: '0.45rem 0.8rem', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Edit3 size={13} /> Edit
                        </button>
                        <button onClick={() => { setDeleteConfirm(w._id); setWalletMsg({ type: '', text: '' }); }} style={{ padding: '0.45rem 0.8rem', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .text-accent { color: var(--accent-primary) !important; }
        .text-secondary { color: var(--text-secondary) !important; }
      `}</style>
    </div>
  );
}

export default Profile;
