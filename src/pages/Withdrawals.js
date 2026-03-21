import React, { useState, useEffect, useContext } from 'react';
import { withdrawalAPI, investmentAPI, walletAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AdminContext } from '../components/layout/Layout';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowUpRight, CheckCircle, Clock, XCircle, Wallet, 
  Lock, Unlock, ShieldAlert, ChevronRight, Filter, 
  Search, ShieldCheck, Zap, AlertCircle, TrendingUp, History, Inbox
} from 'lucide-react';
import '../styles/dashboard.css';
import EmptyState from '../components/common/EmptyState';

const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

function Withdrawals() {
  const { user } = useAuth();
  const { isAdmin } = useContext(AdminContext);
  const navigate = useNavigate();
  
  const [withdrawals, setWithdrawals] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    walletBalance: 0,
    lockedAssets: 0,
    withdrawableAssets: 0,
    isEligible: false
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [showForm, setShowForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({ amount: '', walletAddress: '' });

  useEffect(() => {
    fetchData();
  }, [isAdmin, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const wRes = await withdrawalAPI.viewAllWithdrawals();
      let wData = wRes.data?.withdrawals || wRes.data?.message || [];
      
      if (!Array.isArray(wData)) {
        wData = [];
      }
      
      if (!isAdmin) {
        wData = wData.filter(i => i.userId === user?._id || i.user === user?._id || i.email === user?.email);
        // Also fetch investments for eligibility
        fetchEligibility();
      }
      
      setWithdrawals(Array.isArray(wData) ? wData.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)) : []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibility = async () => {
    if (!user) return;
    setEligibilityLoading(true);
    try {
      const userId = user._id || user.id;
      const [invRes, walRes] = await Promise.all([
        investmentAPI.viewUserInvestments(),
        walletAPI.getUserWallet(userId)
      ]);
      
      const invs = invRes.data?.investments || invRes.data?.message || [];
      const wallet = walRes.data?.wallet || walRes.data || { amount: 0, balance: 0 };
      const currentBalance = parseFloat(wallet.balance || wallet.amount || 0);
      
      let locked = 0;
      let matured = 0;
      const now = new Date();

      const activeInvs = Array.isArray(invs) ? invs.filter(i => i.status?.toLowerCase() === 'active') : [];

      activeInvs.forEach(inv => {
        const start = new Date(inv.createdAt);
        const durationDays = parseInt(inv.plan?.endDate || inv.planId?.endDate || 30);
        const maturityDate = new Date(start.getTime() + (durationDays * 24 * 60 * 60 * 1000));
        
        const principal = parseFloat(inv.amount || 0);
        if (now >= maturityDate) {
          matured += principal;
        } else {
          locked += principal;
        }
      });

      setStats({
        walletBalance: currentBalance,
        lockedAssets: locked,
        withdrawableAssets: currentBalance + matured,
        isEligible: (currentBalance + matured) > 0 
      });
      setInvestments(invs);
    } catch (err) {
      console.error('Eligibility fetch error:', err);
    } finally {
      setEligibilityLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parseFloat(formData.amount) > stats.walletBalance) {
      setMessage({ type: 'error', text: 'Insufficient wallet balance.' });
      return;
    }
    
    setActionLoading(true);
    try {
      await withdrawalAPI.createWithdrawal(formData);
      setMessage({ type: 'success', text: 'Liquidation request submitted for verification.' });
      setFormData({ amount: '', walletAddress: '' });
      setShowForm(false);
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Submission failed.' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const handleAdminAction = async (id, action) => {
    if (!window.confirm(`Confirm individual ${action} for this request?`)) return;
    setActionLoading(true);
    try {
      if (action === 'approve') {
        await withdrawalAPI.confirmWithdrawal(id);
      } else {
        await withdrawalAPI.declineWithdrawal(id);
      }
      setMessage({ type: 'success', text: `Transaction successfully ${action}ed.` });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to ${action} transaction.` });
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page flex-center-center" style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const formatMoney = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  const pendingWithdrawals = withdrawals.filter(w => w.status?.toLowerCase() === 'pending');
  const historyWithdrawals = withdrawals.filter(w => w.status?.toLowerCase() !== 'pending');

  const renderTableRows = (data, isHistory = false) => {
    return data.map((w) => (
      <tr 
        key={w._id} 
        style={{ 
          borderBottom: '1px solid var(--border-color)', 
          cursor: isAdmin && isHistory ? 'pointer' : 'default',
          transition: 'background-color 0.2s',
          backgroundColor: 'transparent'
        }}
        onClick={() => {
          if (isAdmin && isHistory) {
             const uId = w.userId?._id || w.user?._id || w.userId || w.user;
             if (uId) navigate(`/user-wallets?userId=${uId}`);
          }
        }}
        onMouseEnter={(e) => { if(isAdmin && isHistory) e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.05)'; }}
        onMouseLeave={(e) => { if(isAdmin && isHistory) e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        <td data-label={isAdmin ? 'Investor' : 'Reference'} style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)'
            }}>
              <ArrowUpRight size={14} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                {isAdmin ? (capitalize(w.userId?.firstName || w.user?.firstName || 'Investor')) : `#${w._id.slice(-8).toUpperCase()}`}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ID: {w._id.slice(-6).toUpperCase()}</div>
            </div>
          </div>
        </td>
        <td data-label="Destination" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
            {w.walletAddress ? `${w.walletAddress.slice(0, 12)}...` : 'N/A'}
          </div>
        </td>
        <td data-label="Amount" style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>
          {formatMoney(w.amount)}
        </td>
        <td data-label="Status" style={{ padding: '1.25rem 1.5rem' }}>
          <StatusBadge status={w.status} />
        </td>
        <td data-label={isHistory ? 'Processed On' : 'Submitted'} style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {new Date(w.createdAt).toLocaleDateString()}
        </td>
        <td data-label="Actions" style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
          {isAdmin && w.status?.toLowerCase() === 'pending' ? (
            <div className="table-actions" style={{ justifyContent: 'flex-end', position: 'relative', zIndex: 2 }}>
              <button 
                title="Deny" 
                onClick={(e) => { e.stopPropagation(); handleAdminAction(w._id, 'deny'); }} 
                style={{ padding: '0.4rem', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer' }}
              >
                <XCircle size={16} />
              </button>
              <button 
                title="Approve" 
                onClick={(e) => { e.stopPropagation(); handleAdminAction(w._id, 'approve'); }} 
                style={{ padding: '0.4rem', borderRadius: '6px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', cursor: 'pointer' }}
              >
                <CheckCircle size={16} />
              </button>
            </div>
          ) : (
            <button className="btn-table glass" style={{ opacity: 0.3 }} disabled><ChevronRight size={16} /></button>
          )}
        </td>
      </tr>
    ));
  };

  return (
    <div className="dashboard-page overflow-hidden">
      {/* Portfolio Registry Style Header */}
      <div className="dashboard-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2.2rem', fontWeight: '800' }}>
            <Wallet size={32} className="text-accent" /> Withdrawals
            <span style={{ 
              width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', 
              boxShadow: '0 0 12px #10b981', marginLeft: '4px',
              animation: 'pulse 2s infinite'
            }}></span>
          </h1>
          <p className="text-secondary" style={{ fontSize: '1.05rem' }}>
            {isAdmin ? 'System-wide capital flow and liquidation oversight.' : 'Monitor your liquid assets and maturity-based withdrawals.'}
          </p>
        </div>
        
        {!isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {!stats.isEligible ? (
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.25rem', 
                borderRadius: '12px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
                fontSize: '0.9rem', fontWeight: '700', border: '1px solid rgba(245,158,11,0.2)'
              }}>
                <Lock size={16} /> Awaiting Maturity
              </div>
            ) : (
              <button 
                className="btn btn-primary"
                style={{ 
                  padding: '0.85rem 1.75rem', borderRadius: '12px', fontWeight: '800', 
                  background: 'var(--accent-gradient)', border: 'none', display: 'flex', alignItems: 'center', gap: '8px'
                }}
                onClick={() => setShowForm(!showForm)}
              >
                <ArrowUpRight size={20} /> {showForm ? 'Cancel Request' : 'Liquidate Assets'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Metric Cards Banner - Exact Mirror of Portfolio Registry */}
      {!isAdmin && (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem', marginBottom: '2.5rem', maxWidth: '1400px', margin: '0 auto 2.5rem' }}>
          <div className="stat-card-new glass" style={{ flex: '1 1 250px', maxWidth: '280px', margin: 0 }}>
            <div className="stat-icon-wrapper icon-blue"><Wallet size={24} /></div>
            <p className="stat-title">Liquid Balance</p>
            <h3 className="stat-value">{formatMoney(stats.walletBalance)}</h3>
          </div>
          <div className="stat-card-new glass" style={{ flex: '1 1 250px', maxWidth: '280px', margin: 0 }}>
            <div className="stat-icon-wrapper icon-orange"><Lock size={24} /></div>
            <p className="stat-title">Locked Assets</p>
            <h3 className="stat-value">{formatMoney(stats.lockedAssets)}</h3>
          </div>
          <div className="stat-card-new glass" style={{ flex: '1 1 250px', maxWidth: '280px', margin: 0 }}>
            <div className="stat-icon-wrapper icon-green"><TrendingUp size={24} /></div>
            <p className="stat-title">Total Withdrawable</p>
            <h3 className="stat-value">{formatMoney(stats.withdrawableAssets)}</h3>
          </div>
        </div>
      )}

      {/* Withdrawal Form */}
      {!isAdmin && showForm && stats.isEligible && (
        <div className="dashboard-panel glass" style={{ marginBottom: '3rem', animation: 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div className="panel-header" style={{ marginBottom: '2rem' }}>
            <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ArrowUpRight className="text-accent" size={24} /> New Liquidation Request
            </h2>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'block', fontWeight: '600' }}>Amount in USD</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: '700' }}>$</span>
                  <input 
                    type="number" 
                    placeholder="Min $10.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    required
                    style={{ 
                      width: '100%', padding: '1rem 1rem 1rem 2.5rem', borderRadius: '14px', 
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                      color: 'white', fontSize: '1.1rem', fontWeight: '600', outline: 'none'
                    }}
                  />
                  <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: '800' }}>MAX</div>
                </div>
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'block', fontWeight: '600' }}>Destination BTC Address</label>
                <input 
                  type="text" 
                  placeholder="bc1q..."
                  value={formData.walletAddress}
                  onChange={(e) => setFormData({...formData, walletAddress: e.target.value})}
                  required
                  style={{ 
                    width: '100%', padding: '1rem', borderRadius: '14px', 
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white', fontSize: '1rem', fontFamily: 'monospace', outline: 'none'
                  }}
                />
              </div>
            </div>
            <button 
              disabled={actionLoading}
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '1.25rem', borderRadius: '16px', fontWeight: '800', fontSize: '1.1rem', background: 'var(--accent-gradient)', border: 'none' }}
            >
              {actionLoading ? <div className="spinner" style={{ width: '20px', height: '20px' }}></div> : 'Initiate Fast-Clear Liquidation'}
            </button>
          </form>
        </div>
      )}

      {/* Pending Requests Ledger */}
      <div className="dashboard-panel glass" style={{ marginBottom: '2rem', padding: '0', overflow: 'hidden' }}>
        <div className="panel-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Clock className="text-accent" size={24} />
          <h2 className="panel-title" style={{ fontSize: '1.2rem', margin: 0 }}>{isAdmin ? 'Global Withdrawal Requests' : 'My Withdrawal Requests'}</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {pendingWithdrawals.length > 0 ? (
            <table className="premium-table" style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>{isAdmin ? 'Investor' : 'Reference'}</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Destination</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Amount</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Submitted</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {renderTableRows(pendingWithdrawals, false)}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '2rem' }}>
              <EmptyState 
                icon={Inbox} 
                title="No Pending Requests" 
                message={isAdmin ? "No system-wide withdrawal requests awaiting approval." : "You don't have any pending withdrawal requests."} 
              />
            </div>
          )}
        </div>
      </div>

      {/* History Ledger */}
      <div className="dashboard-panel glass" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="panel-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <History className="text-secondary" size={24} />
          <h2 className="panel-title" style={{ fontSize: '1.2rem', margin: 0 }}>{isAdmin ? 'Global Withdrawal History' : 'My Withdrawal History'}</h2>
          <p style={{ margin: '0 0 0 auto', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
             {isAdmin ? 'Click row for User Context' : 'Past Success'}
          </p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {historyWithdrawals.length > 0 ? (
            <table className="premium-table" style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>{isAdmin ? 'Investor' : 'Reference'}</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Destination</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Amount</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Processed On</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {renderTableRows(historyWithdrawals, true)}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '2rem' }}>
              <EmptyState 
                icon={History} 
                title="No History Found" 
                message={isAdmin ? "No historical records of withdrawals in the system." : "Your completed withdrawal history will appear here."} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = status?.toLowerCase();
  const isPending = s === 'pending';
  const isApproved = s === 'approved' || s === 'confirmed' || s === 'completed';
  const isRejected = s === 'rejected' || s === 'cancelled' || s === 'denied';

  const icon = isPending ? <Clock size={12} /> : isApproved ? <CheckCircle size={12} /> : <XCircle size={12} />;
  const colorClass = isPending ? 'pending' : isApproved ? 'success' : 'danger';

  return (
    <span className={`status-badge ${colorClass}`} style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
      {icon} {status || 'Pending'}
    </span>
  );
}

export default Withdrawals;
