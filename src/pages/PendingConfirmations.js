import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { pendingConfirmationAPI, invoiceAPI, withdrawalAPI, walletAPI } from '../services/api';
import { AdminContext } from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowDownLeft, ArrowUpRight, Clock, CheckCircle, XCircle, 
  User, Mail, Globe, Wallet, ExternalLink, X, ChevronRight,
  Filter, Calendar, Search, ShieldCheck, AlertCircle
} from 'lucide-react';
import '../styles/dashboard.css';

const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

function PendingConfirmations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useContext(AdminContext);
  
  const [credits, setCredits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All'); // All, Deposits, Withdrawals
  const [searchTerm, setSearchTerm] = useState('');
  
  // Detail Drawer State
  const [selectedItem, setSelectedItem] = useState(null); // The transaction item
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userWallet, setUserWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  
  const [message, setMessage] = useState({ type: '', text: '' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [isAdmin, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [creditsRes, withdrawalsRes] = await Promise.all([
        pendingConfirmationAPI.viewAllPendingCredit(),
        pendingConfirmationAPI.viewAllPendingWithdrawal(),
      ]);

      const cData = creditsRes.data?.message || creditsRes.data?.pendingConfirmations || [];
      const wData = withdrawalsRes.data?.message || withdrawalsRes.data?.pendingWithdrawals || [];
      
      setCredits(Array.isArray(cData) ? cData : []);
      setWithdrawals(Array.isArray(wData) ? wData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to synchronize transaction stream.' });
    } finally {
      setLoading(false);
    }
  };

  const openDrawer = async (item, type) => {
    const enrichedItem = { ...item, _type: type };
    setSelectedItem(enrichedItem);
    setDrawerOpen(true);
    setUserWallet(null);
    setWalletLoading(true);

    const userId = type === 'deposit' ? item.invoice?.user?._id : item.userId?._id || item.userId;
    
    if (userId) {
      try {
        const res = await walletAPI.getAdminUserWallet(userId);
        setUserWallet(res.data?.wallet);
      } catch (err) {
        console.error('Wallet fetch error:', err);
      } finally {
        setWalletLoading(false);
      }
    } else {
      setWalletLoading(false);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => {
      setSelectedItem(null);
      setUserWallet(null);
    }, 300);
  };

  const handleAction = async (id, action, type) => {
    setActionLoading(true);
    try {
      if (type === 'deposit') {
        if (action === 'approve') {
          await pendingConfirmationAPI.confirmPendingTransaction(id);
        } else {
          await invoiceAPI.cancelInvoice(id);
        }
      } else {
        // Withdrawal
        if (action === 'approve') {
          await withdrawalAPI.confirmWithdrawal(id);
        } else {
          await withdrawalAPI.declineWithdrawal(id);
        }
      }
      
      setMessage({ 
        type: 'success', 
        text: `Transaction ${action === 'approve' ? 'approved' : 'rejected'} successfully.` 
      });
      fetchData();
      closeDrawer();
    } catch (error) {
      console.error(`Action error:`, error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Action failed.' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  // Combine and Filter Data
  const stream = [
    ...credits.map(c => ({ ...c, _type: 'deposit' })),
    ...withdrawals.map(w => ({ ...w, _type: 'withdrawal' }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const filteredStream = stream.filter(item => {
    const matchesFilter = 
      activeFilter === 'All' ? true :
      activeFilter === 'Deposits' ? item._type === 'deposit' :
      item._type === 'withdrawal';

    const userData = item._type === 'deposit' ? item.invoice?.user : item.userId;
    const name = `${userData?.firstName || '' } ${userData?.lastName || ''}`.toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || 
                         item._id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  if (!isAdmin) return null;

  return (
    <div className="dashboard-page" style={{ position: 'relative' }}>
      
      {/* Backdrop */}
      {drawerOpen && (
        <div onClick={closeDrawer} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 998, backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease'
        }} />
      )}

      {/* Detail Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100dvh',
        width: 'min(450px, 100vw)',
        background: 'linear-gradient(180deg, #0f172a 0%, #0d1526 100%)',
        borderLeft: '1px solid rgba(255,255,255,0.07)',
        zIndex: 999, overflowY: 'auto',
        transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: drawerOpen ? '-24px 0 80px rgba(0,0,0,0.5)' : 'none',
      }}>
        {selectedItem && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10
            }}>
              <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Transaction Details</span>
              <button onClick={closeDrawer} style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', color: 'var(--text-secondary)'
              }}><X size={18} /></button>
            </div>

            <div style={{ padding: '2rem 1.5rem' }}>
              {/* Type Header */}
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '0.5rem 1rem', 
                borderRadius: '12px',
                background: selectedItem._type === 'deposit' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                color: selectedItem._type === 'deposit' ? '#10b981' : '#f59e0b',
                marginBottom: '1.5rem',
                fontSize: '0.85rem',
                fontWeight: '700',
                border: `1px solid ${selectedItem._type === 'deposit' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`
              }}>
                {selectedItem._type === 'deposit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                {selectedItem._type === 'deposit' ? 'DEPOSIT CONFIRMATION' : 'WITHDRAWAL REQUEST'}
              </div>

              <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  ${Number(selectedItem.amount || selectedItem.invoice?.amount || 0).toLocaleString()}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                  Reference: <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{selectedItem._id}</span>
                </p>
              </div>

              {/* User Segment */}
              <SectionLabel icon={<User size={14} />}>Originating Investor</SectionLabel>
              <div style={{ 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.06)', 
                borderRadius: '16px', 
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                <div style={{ 
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: '800', fontSize: '1.1rem'
                }}>
                  {(selectedItem._type === 'deposit' ? selectedItem.invoice?.user?.firstName : selectedItem.userId?.firstName)?.[0] || 'U'}
                </div>
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '1rem' }}>
                    {capitalize(selectedItem._type === 'deposit' ? selectedItem.invoice?.user?.firstName : selectedItem.userId?.firstName)} {capitalize(selectedItem._type === 'deposit' ? selectedItem.invoice?.user?.lastName : selectedItem.userId?.lastName)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Mail size={12} /> {selectedItem._type === 'deposit' ? selectedItem.invoice?.user?.email : selectedItem.userId?.email}
                  </div>
                </div>
              </div>

              {/* Liquidity Check */}
              <SectionLabel icon={<Wallet size={14} />}>Current Liquidity</SectionLabel>
              <div style={{ 
                background: 'rgba(16,185,129,0.05)', 
                border: '1px solid rgba(16,185,129,0.15)', 
                borderRadius: '16px', 
                padding: '1.25rem',
                marginBottom: '2rem'
              }}>
                {walletLoading ? (
                  <div className="spinner" style={{ width: '20px', height: '20px' }} />
                ) : userWallet ? (
                  <>
                    <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available Balance</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', margin: '4px 0' }}>{userWallet.formattedAmount}</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(16,185,129,0.7)' }}>Last updated: {new Date(userWallet.updatedAt).toLocaleTimeString()}</div>
                  </>
                ) : <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No wallet data found.</span>}
              </div>

              {/* Meta Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Date Initiated</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                    {new Date(selectedItem.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Country</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Globe size={14} /> {capitalize(selectedItem._type === 'deposit' ? selectedItem.invoice?.user?.country : selectedItem.userId?.country) || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Action Area */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: 'auto' }}>
                <button 
                  disabled={actionLoading}
                  onClick={() => handleAction(selectedItem._id, 'reject', selectedItem._type)}
                  style={{
                    padding: '1rem', borderRadius: '14px', border: '1px solid rgba(239,68,68,0.3)',
                    background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: '700',
                    cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  <XCircle size={18} /> Reject
                </button>
                <button 
                  disabled={actionLoading}
                  onClick={() => handleAction(selectedItem._type === 'deposit' ? (selectedItem.invoice?._id || selectedItem.invoice) : selectedItem._id, 'approve', selectedItem._type)}
                  style={{
                    padding: '1rem', borderRadius: '14px', border: 'none',
                    background: 'var(--accent-primary)', color: 'white', fontWeight: '700',
                    cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 10px 20px -5px rgba(99,102,241,0.4)'
                  }}
                >
                  {actionLoading ? <div className="spinner" style={{ width: '18px', height: '18px' }} /> : <CheckCircle size={18} />}
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={28} className="text-accent" /> Confirmations
          </h1>
          <p>Global transaction verification queue and asset clearing house.</p>
        </div>
      </div>

      {message.text && (
        <div className={`message-banner ${message.type}`} style={{
          padding: '1.25rem', borderRadius: '16px', marginBottom: '2rem',
          background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          color: message.type === 'success' ? '#10b981' : '#ef4444',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      {/* Toolbar */}
      <div className="dashboard-panel glass" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
            {['All', 'Deposits', 'Withdrawals'].map(f => (
              <button
                key={f}
                className={`btn ${activeFilter === f ? 'btn-primary' : ''}`}
                style={{ 
                  borderRadius: '10px', padding: '0.5rem 1.25rem', border: 'none', fontSize: '0.85rem', fontWeight: '600',
                  background: activeFilter === f ? 'var(--accent-primary)' : 'transparent',
                  color: activeFilter === f ? 'white' : 'var(--text-secondary)'
                }}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', flex: 1, maxWidth: '350px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search investor or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '0.85rem 1rem 0.85rem 3rem', borderRadius: '14px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'white', outline: 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* Unified Table */}
      <div className="premium-table-container">
        <table className="premium-table">
          <thead>
            <tr>
              <th>Investor & Reference</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Created At</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '5rem' }}><div className="spinner"></div></td></tr>
            ) : filteredStream.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
                  <Clock size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                  <p>The confirmation queue is currently empty.</p>
                </td>
              </tr>
            ) : (
              filteredStream.map((item) => {
                const isDeposit = item._type === 'deposit';
                const u = isDeposit ? item.invoice?.user : item.userId;
                return (
                  <tr key={item._id} onClick={() => openDrawer(item, item._type)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div className="type-indicator">
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: isDeposit ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: isDeposit ? '#10b981' : '#f59e0b',
                          border: `1.5px solid ${isDeposit ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`
                        }}>
                          {capitalize(u?.firstName)?.[0] || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                            {capitalize(u?.firstName)} {capitalize(u?.lastName)}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Ref: {item._id.slice(-8)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px',
                        color: isDeposit ? '#10b981' : '#f59e0b',
                        display: 'flex', alignItems: 'center', gap: '5px'
                      }}>
                        {isDeposit ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                        {item._type}
                      </span>
                    </td>
                    <td style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                      ${Number(item.amount || item.invoice?.amount || 0).toLocaleString()}
                    </td>
                    <td>
                      <span className="status-badge pending">
                        <Clock size={12} /> Pending
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn-table glass" style={{ padding: '0.4rem', borderRadius: '8px' }}>
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .SectionLabel {
          margin-bottom: 1rem;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

function SectionLabel({ children, icon }) {
  return (
    <div style={{ 
      display: 'flex', alignItems: 'center', gap: '8px', 
      fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', 
      textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.85rem' 
    }}>
      {icon}
      {children}
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}

export default PendingConfirmations;
