import React, { useContext, useState, useEffect } from 'react';
import { Wallet, Clock, Activity, ArrowDownLeft, ArrowUpRight, Plus, TrendingUp, Users, ShieldAlert, ChevronRight } from 'lucide-react';
import { authAPI, pendingConfirmationAPI, investmentAPI, planAPI, invoiceAPI, withdrawalAPI, walletAPI } from '../services/api';
import { AdminContext } from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/dashboard/StatCard';
import DashboardChart from '../components/dashboard/DashboardChart';
import InvestmentModal from '../components/dashboard/InvestmentModal';
import '../styles/dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const { isAdmin } = useContext(AdminContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingActions, setPendingActions] = useState([]);
  const [loadingActions, setLoadingActions] = useState(true);
  
  // Quick Investment Form State
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [investAmount, setInvestAmount] = useState('');
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });
  const [chartData, setChartData] = useState([]);
  const [realStats, setRealStats] = useState({
    walletBalance: 0, totalProfit: 0,
    pendingCredits: 0, pendingWithdrawals: 0,
    totalUsers: 0, totalInvestments: 0, totalRevenue: 0, // Admin stats
  });

  useEffect(() => {
    fetchData();
  }, [isAdmin, user?._id]);

  const fetchData = async () => {
    try {
      setLoadingActions(true);
      const [creditsRes, withdrawalsRes, plansRes] = await Promise.all([
        (isAdmin ? pendingConfirmationAPI.viewAllPendingCredit() : pendingConfirmationAPI.viewUserPendingCredit()).catch(() => ({ data: { message: [] } })),
        (isAdmin ? pendingConfirmationAPI.viewAllPendingWithdrawal() : pendingConfirmationAPI.viewUserPendingWithdrawal(user?._id)).catch(() => ({ data: { message: [] } })),
        planAPI.viewAllPlans().catch(() => ({ data: { message: [] } }))
      ]);

      const creditsDataRaw = creditsRes.data?.message || creditsRes.data?.pendingConfirmations || [];
      const creditsData = Array.isArray(creditsDataRaw) ? creditsDataRaw : [];
      const credits = creditsData.map(c => ({
        id: c._id,
        actionId: c.invoice?._id || c.invoice,
        type: 'deposit',
        desc: isAdmin ? `User Credit Ref: ${c._id?.slice(-6)}` : `Wallet Funding (Pending)`,
        user: c.invoice?.user?.firstName || c.userId?.firstName || 'Unknown',
        amount: `$${c.invoice?.amount || c.amount || 0}`,
        time: new Date(c.createdAt).toLocaleDateString(),
        status: 'Pending'
      }));

      const withdrawalsDataRaw = withdrawalsRes.data?.message || withdrawalsRes.data?.pendingWithdrawals || [];
      const withdrawalsData = Array.isArray(withdrawalsDataRaw) ? withdrawalsDataRaw : [];
      const withdrawals = withdrawalsData.map(w => ({
        id: w._id,
        actionId: w.withdrawals?._id || w.withdrawals,
        type: 'withdrawal',
        desc: isAdmin ? `Withdrawal Request: ${w._id?.slice(-6)}` : `Withdrawal Process (Pending)`,
        user: w.withdrawals?.user?.firstName || w.userId?.firstName || 'Unknown',
        amount: `$${w.withdrawals?.amount || w.amount || 0}`,
        time: new Date(w.createdAt).toLocaleDateString(),
        status: 'Pending'
      }));

      setPendingActions([...credits, ...withdrawals]);
      const fetchedPlans = plansRes.data?.message || [];
      setPlans(fetchedPlans);
      if (fetchedPlans.length > 0) setSelectedPlan(fetchedPlans[0].name);

      // Fetch real stats
      if (isAdmin) {
        try {
          const [usersRes, investmentsRes] = await Promise.all([
            authAPI.getAllUsers().catch(() => ({ data: { users: [] } })),
            investmentAPI.viewAllInvestments().catch(() => ({ data: { message: [] } })),
          ]);
          const usersList = usersRes.data?.users || [];
          const investmentsList = investmentsRes.data?.message || [];
          const totalRev = investmentsList.reduce((sum, inv) => {
            const amt = parseFloat(inv.pendingConfirmation?.invoice?.amount || inv.amount || 0);
            return sum + amt;
          }, 0);

          setRealStats(prev => ({
            ...prev,
            totalUsers: usersList.length,
            totalInvestments: investmentsList.length,
            totalRevenue: totalRev,
            pendingCredits: credits.length,
            pendingWithdrawals: withdrawals.length,
          }));
        } catch (e) {
          console.error('Admin stats error:', e);
        }
      } else if (user?._id) {
        try {
          const [walletRes, investRes] = await Promise.all([
            walletAPI.getUserWallet(user._id).catch(() => null),
            investmentAPI.viewUserInvestments().catch(() => null),
          ]);
          const walletAmount = parseFloat(walletRes?.data?.wallet?.currencyAmount || 0);
          const totalProfit = investRes?.data?.totalProfit || 0;
          setRealStats(prev => ({
            ...prev,
            walletBalance: walletAmount,
            totalProfit,
            pendingCredits: credits.length,
            pendingWithdrawals: withdrawals.length,
          }));
        } catch (e) {
          console.error('User stats error:', e);
        }
      }

      // Fetch chart data separately to ensure main stats load even if chart fails
      try {
        const historyRes = await pendingConfirmationAPI.getGrowthData();
        if (historyRes.data?.chartData) {
          setChartData(historyRes.data.chartData);
        }
      } catch (err) {
        console.error('History fetch error:', err);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoadingActions(false);
    }
  };

  const handleApprove = async (actionId, type) => {
    try {
      setLoadingActions(true);
      if (type === 'deposit') {
        await pendingConfirmationAPI.confirmPendingTransaction(actionId);
      } else {
        await withdrawalAPI.confirmWithdrawal(actionId);
      }
      // Re-fetch all data to update balance, user counts, revenue, etc.
      await fetchData();
    } catch (error) {
      console.error('Error approving action:', error);
      alert('Failed to approve action.');
      setLoadingActions(false);
    }
  };

  const handleReject = async (actionId, type) => {
    try {
      setLoadingActions(true);
      if (type === 'deposit') {
        await invoiceAPI.cancelInvoice(actionId);
      } else {
        await withdrawalAPI.declineWithdrawal(actionId);
      }
      // Re-fetch all data to update everything
      await fetchData();
    } catch (error) {
      console.error('Error rejecting action:', error);
      alert('Failed to reject action.');
      setLoadingActions(false);
    }
  };

  const handleQuickInvest = (e) => {
    e.preventDefault();
    setFormMessage({ type: '', text: '' });
    if (!investAmount || parseFloat(investAmount) <= 0) {
      setFormMessage({ type: 'error', text: 'Please enter a valid amount.' });
      return;
    }
    const plan = plans.find(p => p.name === selectedPlan);
    if (plan) {
      const amt = parseFloat(investAmount);
      if (amt < plan.minimum) {
        setFormMessage({ type: 'error', text: `Minimum for ${plan.name} is $${plan.minimum}.` });
        return;
      }
      if (amt > plan.maximum) {
        setFormMessage({ type: 'error', text: `Maximum for ${plan.name} is $${plan.maximum}.` });
        return;
      }
    }
    setIsModalOpen(true); // Open the full modal for the 2-step confirmation as requested before
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const fmt = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val);

  // Real stats for regular users — show $0 for new accounts
  const stats = isAdmin ? [
    { title: "Total Platform Revenue", value: fmt(realStats.totalRevenue), icon: Activity, trend: null, colorClass: "icon-purple" },
    { title: "Portfolio Assets", value: String(realStats.totalInvestments), icon: TrendingUp, trend: null, colorClass: "icon-orange" },
    { title: "Pending Approvals", value: String(realStats.pendingCredits), icon: Clock, trend: null, colorClass: "icon-green" },
    { title: "Total Platform Users", value: String(realStats.totalUsers), icon: Users, trend: null, colorClass: "icon-blue" },
  ] : [
    { title: "Wallet Balance", value: fmt(realStats.walletBalance), icon: Wallet, trend: null, colorClass: "icon-blue" },
    { title: "Total Investment Profit", value: fmt(realStats.totalProfit), icon: Activity, trend: null, colorClass: "icon-purple" },
    { title: "Pending Approvals", value: String(realStats.pendingCredits), icon: Clock, trend: null, colorClass: "icon-orange" },
    { title: "Pending Withdrawals", value: String(realStats.pendingWithdrawals), icon: ArrowUpRight, trend: null, colorClass: "icon-green" },
  ];

  const recentActivity = isAdmin ? [
    { id: 1, type: 'withdrawal', user: 'John Doe', amount: '$4,500', time: '10 mins ago', status: 'Pending' },
    { id: 2, type: 'deposit', user: 'Sarah Smith', amount: '$12,000', time: '1 hour ago', status: 'Approved' },
    { id: 3, type: 'withdrawal', user: 'Mike Johnson', amount: '$850', time: '3 hours ago', status: 'Pending' },
  ] : [
    { id: 1, type: 'deposit', desc: 'Investment in Gold Plan', amount: '$5,000', time: '2 days ago', status: 'Active' },
    { id: 2, type: 'withdrawal', desc: 'Wallet Withdrawal', amount: '$1,200', time: '5 days ago', status: 'Pending' },
    { id: 3, type: 'profit', desc: 'Weekly Profit Distribution', amount: '$350', time: '1 week ago', status: 'Completed' },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>{getGreeting()}, {user?.firstName ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1).toLowerCase() : (isAdmin ? 'Admin' : 'Investor')}!</h1>
          <p>Here is an overview of your portfolio</p>
        </div>
        <button 
          className="btn btn-primary glass" 
          style={{ marginTop: '-0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={20} /> New Investment
        </button>
      </div>

      <div className="stats-grid">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {user && !user.isTwoFactorEnabled && (
        <div style={{ marginBottom: '2rem', padding: '1rem 1.5rem', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', animation: 'fadeIn 0.5s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '0.6rem', borderRadius: '50%', color: '#f59e0b', display: 'flex' }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.2rem', color: 'var(--text-primary)', fontSize: '0.95rem' }}>Protect Your Account</h4>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Set up Two-Factor Authentication (2FA) for elite security.</p>
            </div>
          </div>
          <a href="/profile?tab=security" style={{ background: 'var(--accent-gradient)', padding: '0.6rem 1.25rem', borderRadius: '8px', color: 'white', textDecoration: 'none', fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
            Set Up Now <ChevronRight size={14} />
          </a>
        </div>
      )}

      <div className="dashboard-content-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2 className="panel-title">{isAdmin ? 'Platform Revenue Growth' : 'Portfolio Growth'}</h2>
            <button className="icon-btn"><Activity size={18} /></button>
          </div>
          <DashboardChart isAdmin={isAdmin} chartData={chartData} />
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <h2 className="panel-title">{isAdmin ? 'Pending Actions' : 'My Active Requests'}</h2>
            {pendingActions.length > 0 && <a href="/pending-confirmations" className="nav-label" style={{ padding: 0, textTransform: 'none', color: 'var(--accent-primary)', textDecoration: 'none' }}>View all</a>}
          </div>
          
          <div className="activity-list">
            {loadingActions ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner"></div></div>
            ) : pendingActions.length > 0 ? (
              pendingActions.map(item => (
                <div className="activity-item" key={item.id}>
                  <div className={`activity-icon ${item.type === 'withdrawal' ? 'icon-orange' : 'icon-green'}`}>
                    {item.type === 'withdrawal' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                  </div>
                  <div className="activity-details">
                    <h4 className="activity-title">{isAdmin ? `${item.user} - ${item.amount}` : item.desc}</h4>
                    <p className="activity-time">{item.time} • <span className="text-warning">{item.amount}</span></p>
                  </div>
                  <div className={`activity-status ${item.status === 'Pending' ? 'text-warning' : 'text-success'}`}>
                    {item.status}
                  </div>
                </div>
              ))
            ) : (
              // Inline Investment Form when empty
              <div style={{ padding: '0.5rem' }}>
                <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                  <TrendingUp size={32} className="text-accent" style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No pending actions. Ready to grow your wealth?</p>
                </div>
                <form onSubmit={handleQuickInvest}>
                  {formMessage.text && (
                    <div style={{ padding: '0.6rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '0.8rem', marginBottom: '1rem', textAlign: 'center' }}>
                      {formMessage.text}
                    </div>
                  )}
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select Plan</label>
                    <select 
                      className="glass"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', color: 'white' }}
                      value={selectedPlan}
                      onChange={(e) => setSelectedPlan(e.target.value)}
                    >
                      {plans.map((p, i) => <option key={i} value={p.name} style={{ background: '#0f172a' }}>{p.name} ({p.dividend}% {p.duration})</option>)}
                      {plans.length === 0 && <option>No plans available</option>}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Amount ($)</label>
                    <input 
                      type="number" 
                      placeholder="Enter amount e.g. 5000"
                      className="glass"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', color: 'white' }}
                      value={investAmount}
                      onChange={(e) => setInvestAmount(e.target.value)}
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', background: 'var(--accent-gradient)', border: 'none', color: 'white', fontWeight: 'bold' }}
                  >
                    Start Investment
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom full-width panel: pending table for admin, chart for everyone when no pending */}
      <div className="dashboard-panel" style={{ marginTop: '2rem' }}>
        <div className="panel-header">
          <h2 className="panel-title">{pendingActions.length > 0 ? 'Pending Confirmations' : 'Live Crypto Market'}</h2>
          {isAdmin && pendingActions.length > 0 && (
            <a href="/pending-confirmations" className="nav-label" style={{ padding: 0, textTransform: 'none', color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '0.85rem' }}>
              View all
            </a>
          )}
        </div>

        {pendingActions.length > 0 ? (
          <div className="premium-table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Type</th>
                  {isAdmin && <th>User</th>}
                  {!isAdmin && <th>Description</th>}
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {pendingActions.map((action, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="type-indicator">
                        <i>{action.type === 'deposit' ? <ArrowDownLeft size={16} className="text-success" /> : <ArrowUpRight size={16} className="text-warning" />}</i>
                        <span>{action.type === 'deposit' ? 'Credit' : 'Withdrawal'}</span>
                      </div>
                    </td>
                    {isAdmin && <td style={{ color: 'var(--text-primary)' }}>{action.user}</td>}
                    {!isAdmin && <td style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{action.desc}</td>}
                    <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{action.amount}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{action.time}</td>
                    <td>
                      <span className={`status-badge ${action.status === 'Pending' ? 'pending' : (action.status === 'Approved' ? 'approved' : 'cancelled')}`}>
                        <Clock size={12} /> {action.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-table btn-table-approve"
                            onClick={() => handleApprove(action.actionId, action.type)}
                            disabled={loadingActions}
                          >
                            Approve
                          </button>
                          <button
                            className="btn-table btn-table-reject"
                            onClick={() => handleReject(action.actionId, action.type)}
                            disabled={loadingActions}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Chart: shown to ALL users when there are no pending actions (or always for non-admins) */
          <div style={{ height: '420px', borderRadius: '12px', overflow: 'hidden' }}>
            <iframe
              src="https://s.tradingview.com/widgetembed/?frameElementId=tradingview_1&symbol=BINANCE%3ABTCUSDT&interval=D&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=&utm_medium=widget&utm_campaign=chart&utm_term=BINANCE%3ABTCUSDT"
              width="100%"
              height="100%"
              frameBorder="0" 
              allowtransparency="true" 
              allowFullScreen={true}
              scrolling="no"
              title="crypto-chart"
              style={{ borderRadius: '12px', display: 'block' }}
            />
          </div>
        )}
      </div>


      <style>{`
        .text-accent { color: var(--accent-primary); }
      `}</style>
      {isModalOpen && <InvestmentModal onClose={() => setIsModalOpen(false)} onSuccess={fetchData} preselectedPlanName={selectedPlan} preselectedAmount={investAmount} />}
    </div>
  );
};

export default Dashboard;
