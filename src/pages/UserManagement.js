import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, walletAPI, investmentAPI } from '../services/api';
import { AdminContext } from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/common/Pagination';
import {
  Search, Shield, User, Mail, Globe, Calendar,
  X, Wallet, ChevronRight, Lock, Unlock, Users, Filter, History, Zap, CheckCircle, UserPlus
} from 'lucide-react';
import '../styles/dashboard.css';

const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

const FILTERS = ['All', 'Active', 'Blocked', 'Admin'];

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

function UserManagement() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth(); // Logged-in admin
  const { isAdmin } = useContext(AdminContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [walletData, setWalletData] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [payoutUser, setPayoutUser] = useState(null); // User currently selected for payout
  const [confirmEmail, setConfirmEmail] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    country: '',
    isAdmin: false,
    referral: ''
  });
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!isAdmin) { navigate('/dashboard'); return; }
    fetchAllUsers();
  }, [isAdmin]);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getAllUsers();
      setUsers(response.data?.users || []);
    } catch {
      setMessage({ type: 'error', text: 'Error fetching users list.' });
    } finally {
      setLoading(false);
    }
  };

  const openDrawer = async (user) => {
    setSelectedUser(user);
    setDrawerOpen(true);
    setWalletData(null);
    setWalletLoading(true);
    try {
      const res = await walletAPI.getAdminUserWallet(user._id);
      setWalletData(res.data?.wallet);
    } catch { setWalletData(null); }
    finally { setWalletLoading(false); }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => { setSelectedUser(null); setWalletData(null); }, 300);
  };

  const handleToggleBlock = async (e, userId, currentlyBlocked) => {
    if (e) e.stopPropagation();
    setActionLoading(true);
    try {
      currentlyBlocked ? await authAPI.unblockUser(userId) : await authAPI.blockUser(userId);
      setMessage({ type: 'success', text: `User ${currentlyBlocked ? 'unblocked' : 'blocked'} successfully.` });
      await fetchAllUsers();
      if (selectedUser?._id === userId) setSelectedUser(prev => ({ ...prev, isBlocked: !currentlyBlocked }));
    } catch {
      setMessage({ type: 'error', text: 'Failed to update user status.' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3500);
    }
  };

  const handleManualPayout = async (e) => {
    if (e) e.preventDefault();
    if (confirmEmail.toLowerCase() !== currentUser?.email?.toLowerCase()) {
      setMessage({ type: 'error', text: 'Email verification failed. Action cancelled.' });
      return;
    }

    setPayoutLoading(true);
    try {
      const res = await investmentAPI.updateUserInvestment(payoutUser._id);
      const count = res.data?.processedCount || 0;
      
      setMessage({ 
        type: 'success', 
        text: count > 0 
          ? `Daily profits processed successfully for ${count} active investments.` 
          : `No investments were due for payout for ${payoutUser.firstName}.` 
      });
      setPayoutUser(null);
      setConfirmEmail('');
    } catch (err) {
      setMessage({ type: 'error', text: 'Payout failed. Please check system logs.' });
    } finally {
      setPayoutLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3500);
    }
  };

  const handleCreateUser = async (e) => {
    if (e) e.preventDefault();
    
    // Basic Validation
    if (formData.password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    if (!formData.country) {
      setMessage({ type: 'error', text: 'Please select a country.' });
      return;
    }

    setCreateLoading(true);
    try {
      await authAPI.adminCreateUser(formData);
      setMessage({ type: 'success', text: `Account for ${formData.firstName} created successfully.` });
      setShowCreateModal(false);
      setFormData({ firstName: '', lastName: '', email: '', password: '', country: '', isAdmin: false, referral: '' });
      setTouchedFields({});
      fetchAllUsers(); // Refresh list
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create user.' });
    } finally {
      setCreateLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch =
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.country || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter =
      activeFilter === 'All' ? true :
      activeFilter === 'Active' ? !u.isBlocked :
      activeFilter === 'Blocked' ? u.isBlocked :
      activeFilter === 'Admin' ? u.isAdmin : true;
    return matchSearch && matchFilter;
  });

  // Calculate Paginated List
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isAdmin) return null;

  return (
    <div className="dashboard-page" style={{ position: 'relative' }}>

      {/* Backdrop Overlay */}
      {drawerOpen && (
        <div onClick={closeDrawer} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 998, backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease'
        }} />
      )}

      {/* Slide-in Detail Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100dvh',
        width: 'min(420px, 100vw)',
        background: 'linear-gradient(180deg, #0f172a 0%, #0d1526 100%)',
        borderLeft: '1px solid rgba(255,255,255,0.07)',
        zIndex: 999, overflowY: 'auto',
        transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.32s cubic-bezier(0.16,1,0.3,1)',
        boxShadow: drawerOpen ? '-24px 0 80px rgba(0,0,0,0.5)' : 'none',
      }}>
        {selectedUser && (
          <>
            {/* Drawer Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              position: 'sticky', top: 0,
              background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)', zIndex: 10
            }}>
              <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)' }}>User Profile</span>
              <button onClick={closeDrawer} style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex'
              }}><X size={17} /></button>
            </div>

            {/* Avatar + Identity */}
            <div style={{ padding: '2rem 1.5rem 1.5rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{
                width: '76px', height: '76px', borderRadius: '50%', margin: '0 auto 1rem',
                background: selectedUser.isBlocked
                  ? 'linear-gradient(135deg,#450a0a,#7f1d1d)'
                  : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '1.6rem', fontWeight: '800',
                border: `3px solid ${selectedUser.isBlocked ? 'rgba(239,68,68,0.5)' : 'rgba(99,102,241,0.5)'}`,
                boxShadow: `0 8px 30px ${selectedUser.isBlocked ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.35)'}`,
              }}>
                {capitalize(selectedUser.firstName)[0]}{capitalize(selectedUser.lastName)[0]}
              </div>
              <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {capitalize(selectedUser.firstName)} {capitalize(selectedUser.lastName)}
              </h2>
              <p style={{ margin: '0 0 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{selectedUser.email}</p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <span style={badgePill(selectedUser.isAdmin ? 'purple' : 'gray')}>
                  {selectedUser.isAdmin ? <Shield size={11} /> : <User size={11} />}
                  {selectedUser.isAdmin ? 'Administrator' : 'Investor'}
                </span>
                <span style={badgePill(selectedUser.isBlocked ? 'red' : 'green')}>
                  {selectedUser.isBlocked ? '🔒 Blocked' : '✅ Active'}
                </span>
              </div>
            </div>

            {/* Info Details */}
            <div style={{ padding: '1.5rem' }}>
              <SectionLabel>Account Info</SectionLabel>
              {[
                { icon: <Mail size={14} />, label: 'Email', value: selectedUser.email },
                { icon: <Globe size={14} />, label: 'Country', value: capitalize(selectedUser.country) || 'Not specified' },
                { icon: <Calendar size={14} />, label: 'Member since', value: selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A' },
                { icon: <User size={14} />, label: 'Affiliate Code', value: selectedUser.affiliate || 'N/A' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.85rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--accent-primary)', marginTop: '3px', flexShrink: 0 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{item.label}</div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{item.value}</div>
                  </div>
                </div>
              ))}

              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '1.25rem 0' }} />
              <SectionLabel>Wallet Balance</SectionLabel>
              <div style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.04))',
                border: '1px solid rgba(16,185,129,0.2)', borderRadius: '14px',
                padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem'
              }}>
                <div style={{ background: 'rgba(16,185,129,0.12)', padding: '0.7rem', borderRadius: '10px', color: '#10b981', display: 'flex', flexShrink: 0 }}>
                  <Wallet size={22} />
                </div>
                {walletLoading
                  ? <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                  : walletData
                    ? <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '3px' }}>Available Balance</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10b981', lineHeight: 1 }}>
                          {walletData.formattedAmount || `$${Number(walletData.currencyAmount || 0).toLocaleString()}`}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{walletData.currencyType || 'USD'}</div>
                      </div>
                    : <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>No wallet found</span>
                }
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '1.5rem 0' }} />
              <SectionLabel>Access Control</SectionLabel>
              {selectedUser.isAdmin
                ? <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    🛡️ Admin accounts cannot be blocked.
                  </div>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                      onClick={() => navigate(`/user-wallets?userId=${selectedUser._id}`)}
                      style={{
                        width: '100%', padding: '0.9rem', borderRadius: '12px',
                        fontWeight: '700', fontSize: '0.92rem', border: 'none',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        background: 'rgba(99,102,241,0.12)', color: 'var(--accent-primary)',
                        border: '1.5px solid rgba(99,102,241,0.3)', transition: 'all 0.2s'
                      }}
                    >
                      <History size={17} /> View Investment History
                    </button>
                    <button
                      onClick={(e) => handleToggleBlock(e, selectedUser._id, selectedUser.isBlocked)}
                      disabled={actionLoading}
                      style={{
                        width: '100%', padding: '0.9rem', borderRadius: '12px',
                        fontWeight: '700', fontSize: '0.92rem', border: 'none',
                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        background: selectedUser.isBlocked ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                        color: selectedUser.isBlocked ? '#10b981' : '#ef4444',
                        border: `1.5px solid ${selectedUser.isBlocked ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        transition: 'all 0.2s', opacity: actionLoading ? 0.6 : 1
                      }}
                    >
                      {actionLoading
                        ? <div style={{ width: '16px', height: '16px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        : selectedUser.isBlocked ? <Unlock size={17} /> : <Lock size={17} />
                      }
                      {selectedUser.isBlocked ? 'Unblock User Access' : 'Block User Access'}
                    </button>
                  </div>
              }
            </div>
          </>
        )}
      </div>

      {/* Manual Payout Confirmation Modal */}
      {payoutUser && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease'
        }}>
          <div className="glass" style={{
            width: '100%', maxWidth: '450px', padding: '2rem', borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)',
                color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem', border: '2px solid rgba(99,102,241,0.2)'
              }}>
                <Zap size={32} fill="currentColor" />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white', marginBottom: '0.5rem' }}>Manual ROI Payout</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                You are about to manually trigger the daily profit calculation for <strong>{payoutUser.firstName} {payoutUser.lastName}</strong>. 
                This will update their wallet balance according to their active plans.
              </p>
            </div>

            <form onSubmit={handleManualPayout}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                  Verify Administrator Identity
                </label>
                <input 
                  type="email" 
                  required
                  placeholder="Enter your admin email to confirm..."
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  style={{
                    width: '100%', padding: '0.9rem 1rem', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white', outline: 'none', fontSize: '0.95rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  type="button"
                  onClick={() => { setPayoutUser(null); setConfirmEmail(''); }}
                  style={{ flex: 1, padding: '0.85rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={payoutLoading || !confirmEmail}
                  style={{
                    flex: 1.5, padding: '0.85rem', borderRadius: '12px', 
                    background: 'var(--accent-primary)', color: 'white', border: 'none', 
                    fontWeight: '700', cursor: payoutLoading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    boxShadow: '0 10px 15px -3px rgba(99,102,241,0.3)', opacity: payoutLoading ? 0.7 : 1
                  }}
                >
                  {payoutLoading ? <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> : <CheckCircle size={18} />}
                  Confirm Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1.5rem', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)'
        }}>
          <div className="glass modal-content" style={{
            width: '100%', maxWidth: '500px', borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden'
          }}>
            <div style={{
              padding: '1.5rem', borderBottom: '1px solid var(--border-color)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(255,255,255,0.02)'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>Provision New Account</h2>
              <button onClick={() => setShowCreateModal(false)} className="btn-close" style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label>First Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="text" required
                    value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                    onBlur={() => setTouchedFields({...touchedFields, firstName: true})}
                    style={{ border: touchedFields.firstName && !formData.firstName ? '1px solid #ef4444' : '' }}
                    placeholder="John"
                  />
                </div>
                <div className="form-group">
                  <label>Last Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="text" required
                    value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                    onBlur={() => setTouchedFields({...touchedFields, lastName: true})}
                    style={{ border: touchedFields.lastName && !formData.lastName ? '1px solid #ef4444' : '' }}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="email" required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  onBlur={() => setTouchedFields({...touchedFields, email: true})}
                  style={{ border: touchedFields.email && !formData.email ? '1px solid #ef4444' : '' }}
                  placeholder="john.doe@example.com"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label>Initial Password <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="text" required
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  onBlur={() => setTouchedFields({...touchedFields, password: true})}
                  style={{ border: touchedFields.password && !formData.password ? '1px solid #ef4444' : '' }}
                  placeholder="At least 8 characters"
                />
              </div>

              {/* Password Strength Meter */}
              {formData.password && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    {[1, 2, 3, 4].map(i => {
                      const strength = getPasswordStrength(formData.password);
                      return (
                        <div key={i} style={{
                          flex: 1, height: '4px', borderRadius: '2px',
                          background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.08)',
                          transition: 'background 0.3s'
                        }} />
                      );
                    })}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: getPasswordStrength(formData.password).color }}>
                    {getPasswordStrength(formData.password).label} password
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Country of Residence <span style={{ color: '#ef4444' }}>*</span></label>
                <select 
                  required
                  value={formData.country}
                  onChange={e => setFormData({...formData, country: e.target.value})}
                  onBlur={() => setTouchedFields({...touchedFields, country: true})}
                  style={{ 
                    border: touchedFields.country && !formData.country ? '1px solid #ef4444' : '',
                    background: 'rgba(255,255,255,0.03)', color: 'white', padding: '0.75rem'
                  }}
                >
                  <option value="" style={{ background: '#1e293b' }}>Select country...</option>
                  {COUNTRIES.map(c => (
                    <option key={c} value={c} style={{ background: '#1e293b' }}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Referral Code</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '400' }}>Optional</span>
                </label>
                <input 
                  type="text"
                  value={formData.referral}
                  onChange={e => setFormData({...formData, referral: e.target.value})}
                  placeholder="Enter referrer's affiliate code"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>


              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={createLoading}
                style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', fontSize: '1rem' }}
              >
                {createLoading ? <div className="spinner" style={{width: '20px', height: '20px'}} /> : 'Create Investor Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="dashboard-header" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={26} style={{ color: 'rgba(255,255,255,0.8)' }} /> User Management
          </h1>
          <p>
            {users.length} total users — manage access, view wallets, and monitor accounts.
          </p>
        </div>
      </div>

      {message.text && (
        <div className={message.type === 'error' ? 'error-message' : 'success-message'} style={{ marginBottom: '1.25rem', borderRadius: '12px' }}>
          {message.text}
        </div>
      )}

      {/* Stats Row */}
      <div className="stats-grid" style={{ marginTop: '0', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {[
          { label: 'Total Users', value: users.length, color: 'icon-purple', icon: Users },
          { label: 'Active', value: users.filter(u => !u.isBlocked && !u.isAdmin).length, color: 'icon-green', icon: Unlock },
          { label: 'Blocked', value: users.filter(u => u.isBlocked).length, color: 'icon-orange', icon: Lock },
          { label: 'Admins', value: users.filter(u => u.isAdmin).length, color: 'icon-blue', icon: Shield },
        ].map((s, i) => (
          <div key={i} className="stat-card-new glass">
            <div className="stat-content">
              <div>
                <p className="stat-title">{s.label}</p>
                <h3 className="stat-value">{s.value}</h3>
              </div>
              <div className={`stat-icon-wrapper ${s.color}`}>
                <s.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter Bar */}
      <div className="dashboard-panel glass" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div className="um-toolbar" style={{ marginBottom: '0' }}>
          <div className="search-bar glass" style={{ flex: 1, minWidth: '240px', background: 'rgba(255,255,255,0.02)' }}>
            <Search size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ flex: 1, color: 'white' }}
            />
            {searchTerm && <X size={14} className="text-secondary" style={{ cursor: 'pointer' }} onClick={() => setSearchTerm('')} />}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowCreateModal(true)}
              style={{ borderRadius: '20px', padding: '0.45rem 1.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem' }}
            >
              <UserPlus size={16} />
              <span>Create User</span>
            </button>
            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 0.5rem' }} />
            {FILTERS.map(f => (
              <button
                key={f}
                className={`btn btn-table ${activeFilter === f ? 'btn-primary' : 'glass'}`}
                style={{ borderRadius: '20px', padding: '0.4rem 1.25rem' }}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="premium-table-container">
        <table className="premium-table">
          {filteredUsers.length > 0 && (
            <thead className="um-desktop-thead">
              <tr>
                <th>Customer</th>
                <th className="um-col-hide-mobile">Contact & Region</th>
                <th className="um-col-hide-sm">Join Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
          )}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner"></div></td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                  <Users size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <p>No matching users found.</p>
                </td>
              </tr>
            ) : (
              currentItems.map((u) => (
                <tr key={u._id} onClick={() => openDrawer(u)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div className="type-indicator">
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: u.isBlocked ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: u.isBlocked ? '#ef4444' : 'var(--accent-primary)',
                        border: `2px solid ${u.isBlocked ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)'}`,
                      }}>
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {capitalize(u.firstName)} {capitalize(u.lastName)}
                          {u.isAdmin && <Shield size={12} className="text-accent" />}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ref: {u._id?.slice(-6)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="um-col-hide-mobile">
                    <div style={{ fontSize: '0.85rem' }}>{u.email}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Globe size={11} /> {capitalize(u.country) || 'Unknown'}
                    </div>
                  </td>
                  <td className="um-col-hide-sm" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td>
                    <span className={`status-badge ${u.isBlocked ? 'cancelled' : 'approved'}`}>
                      {u.isBlocked ? <Lock size={12} /> : <Unlock size={12} />} {u.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      {!u.isAdmin && (
                        <>
                          <button
                            className="btn-table glass"
                            title="View History"
                            onClick={(e) => { e.stopPropagation(); navigate(`/user-wallets?userId=${u._id}`); }}
                            style={{ padding: '0.4rem', minWidth: 'auto' }}
                          >
                            <History size={16} />
                          </button>
                          <button
                            className="btn-table glass"
                            title="Manual ROI Payout"
                            onClick={(e) => { e.stopPropagation(); setPayoutUser(u); }}
                            style={{ padding: '0.4rem', minWidth: 'auto', color: 'var(--accent-primary)' }}
                          >
                            <Zap size={16} fill="currentColor" />
                          </button>
                          <button
                            className={`btn-table ${u.isBlocked ? 'btn-table-approve' : 'btn-table-reject'}`}
                            onClick={(e) => { e.stopPropagation(); handleToggleBlock(e, u._id, u.isBlocked); }}
                            disabled={actionLoading}
                          >
                            {u.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        </>
                      )}
                      <ChevronRight size={18} className="text-secondary" style={{ opacity: 0.5 }} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination 
          currentPage={currentPage}
          totalItems={filteredUsers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .um-toolbar {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.55rem 1rem;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          background: rgba(255,255,255,0.03);
        }
        .search-bar input {
          background: none;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 0.9rem;
          padding: 0;
          width: 100%;
        }

        @media (max-width: 820px) {
          .premium-table, .premium-table tbody, .premium-table tr, .premium-table td {
            display: block;
            width: 100%;
          }
          .um-desktop-thead { display: none; }
          .premium-table tr {
            margin-bottom: 1.25rem;
            padding: 1.25rem;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.07);
            border-radius: 16px;
            position: relative;
          }
          .premium-table td {
            padding: 0.6rem 0 !important;
            border: none !important;
          }
          .premium-table td:not(:last-child) {
            border-bottom: 1px solid rgba(255, 255, 255, 0.04) !important;
          }
          .table-actions {
            justify-content: flex-start !important;
            margin-top: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.06)' }} />
      {children}
      <span style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.06)' }} />
    </p>
  );
}

function badgePill(variant) {
  const map = {
    purple: { bg: 'rgba(99,102,241,0.12)', color: 'var(--accent-primary)', border: 'rgba(99,102,241,0.3)' },
    gray: { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: 'var(--border-color)' },
    red: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.25)' },
    green: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'rgba(16,185,129,0.25)' },
  };
  const v = map[variant] || map.gray;
  return {
    padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600',
    background: v.bg, color: v.color, border: `1px solid ${v.border}`,
    display: 'inline-flex', alignItems: 'center', gap: '5px'
  };
}

export default UserManagement;
