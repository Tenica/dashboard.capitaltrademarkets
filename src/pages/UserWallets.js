import React, { useState, useEffect, useContext } from 'react';
import { walletAPI, investmentAPI } from '../services/api';
import Pagination from '../components/common/Pagination';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AdminContext } from '../components/layout/Layout';
import { Activity, Wallet, TrendingUp, Users, Search, CheckCircle, Clock, Plus, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import InvestmentModal from '../components/dashboard/InvestmentModal';
import '../styles/dashboard.css';

function UserWallets() {
  const { user } = useAuth();
  const { isAdmin } = useContext(AdminContext);
  const navigate = useNavigate();
  
  const [wallets, setWallets] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Pagination State
  const [regPage, setRegPage] = useState(1);
  const [histPage, setHistPage] = useState(1);
  const itemsPerPage = 8;

  // For Admin traceability
  const queryParams = new URLSearchParams(window.location.search);
  const filterUserId = queryParams.get('userId');

  useEffect(() => {
    fetchData();
  }, [isAdmin, user?._id, filterUserId]); // Refetch when view toggles or filter changes

  useEffect(() => {
    if (filterUserId && !loading) {
      // If we have a filter, set the search term to the user's name if possible
      const targetWallet = wallets.find(w => (w.owner?._id || w.userId) === filterUserId);
      if (targetWallet) {
        setSearchTerm(`${targetWallet.owner?.firstName || ''} ${targetWallet.owner?.lastName || ''}`);
      }
    }
  }, [filterUserId, loading, wallets]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Wallets
      let fetchedWallets = [];
      try {
        if (isAdmin) {
          const wRes = await walletAPI.getAllWallets();
          fetchedWallets = wRes.data?.wallets || wRes.data?.message || [];
        } else {
          const wRes = await walletAPI.getUserWallet(user?._id);
          const singleWallet = wRes.data?.wallet;
          fetchedWallets = singleWallet ? [singleWallet] : [];
        }
      } catch (e) {
        console.error("Wallet fetch error", e);
      }
      
      // Fetch Investments
      let fetchedInvestments = [];
      try {
        const iRes = await (isAdmin ? investmentAPI.viewAllInvestments() : investmentAPI.viewUserInvestments());
        let allI = iRes.data?.investments || iRes.data?.message || [];
        // Note: viewUserInvestments already returns specific investments, 
        // but for safety/consistency we keep the array handle.
        fetchedInvestments = Array.isArray(allI) ? allI : [];
      } catch (e) {
         console.error("Investment fetch error", e);
      }

      setWallets(fetchedWallets);
      setInvestments(fetchedInvestments);
      
    } catch (error) {
      setMessage({ type: 'error', text: 'Critical error loading dashboard data.' });
    } finally {
      setLoading(false);
    }
  };

  // Derived Admin Metrics
  const totalSystemBalance = wallets.reduce((sum, w) => sum + parseFloat(w.currencyAmount || 0), 0);
  const totalActiveInvestmentsAmount = investments.reduce((sum, i) => sum + parseFloat(i.pendingConfirmation?.invoice?.amount || i.amount || 0), 0);
  const activeUsersCount = new Set(wallets.map(w => w.owner?._id || w.userId)).size;

  // Derived User Metrics
  const myWalletBalance = wallets.reduce((sum, w) => sum + parseFloat(w.currencyAmount || 0), 0);
  const myInvestedAmount = investments.reduce((sum, i) => sum + parseFloat(i.pendingConfirmation?.invoice?.amount || i.amount || 0), 0);
  const myTotalProfit = investments.reduce((sum, i) => sum + parseFloat(i.totalProfit || i.profit || 0), 0);

  // Calculate Next Checkout Countdown
  const getNextPayoutInfo = () => {
    const activeInvs = investments.filter(inv => !inv.completed);
    if (activeInvs.length === 0) return { text: 'No active payouts', trend: 'flat' };

    // Find soonest payout
    const soonest = new Date(Math.min(...activeInvs.map(inv => new Date(inv.nextPayDate))));
    const diffMs = soonest - new Date();
    
    if (diffMs <= 0) return { text: 'Processing...', trend: 'flat' };
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    // Get general trend from soonest or overall
    const trend = activeInvs[0]?.profitTrend || 'flat';
    
    return { 
      text: `${hours}h ${mins}m`, 
      trend 
    };
  };

  const payoutInfo = getNextPayoutInfo();

  const getFilteredAdminView = () => {
    let list = wallets;
    if (filterUserId && isAdmin) {
      list = wallets.filter(w => (w.owner?._id || w.userId) === filterUserId);
    }

    return list.filter(w => {
      const search = searchTerm.toLowerCase();
      const name = `${w.owner?.firstName || ''} ${w.owner?.lastName || ''}`.toLowerCase();
      const email = w.owner?.email?.toLowerCase() || '';
      return name.includes(search) || email.includes(search);
    }).map(wallet => {
      const userId = wallet.owner?._id || wallet.userId;
      const userInv = investments.filter(i => {
        const iUserId = i.pendingConfirmation?.invoice?.user?._id || i.userId || i.user?._id;
        return iUserId === userId;
      });
      
      const investedSum = userInv.reduce((sum, i) => sum + parseFloat(i.pendingConfirmation?.invoice?.amount || i.amount || 0), 0);
      const activeCount = userInv.filter(i => i.status?.toLowerCase() === 'active' || !i.completed).length;

      return {
        ...wallet,
        investedSum,
        activeCount,
        totalInvCount: userInv.length
      };
    });
  };

  const getFilteredUserInvestments = () => {
    let list = investments;
    if (filterUserId && isAdmin) {
       list = investments.filter(i => (i.pendingConfirmation?.invoice?.user?._id || i.userId || i.user?._id) === filterUserId);
    }

    return list.filter(i => 
      (i.pendingConfirmation?.invoice?.plan?.name || i.planName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.status || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Pagination Logic
  const getPaginatedList = (fullList, page) => {
    const indexOfLastItem = page * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return fullList.slice(indexOfFirstItem, indexOfLastItem);
  };

  const handleRegPageChange = (page) => setRegPage(page);
  const handleHistPageChange = (page) => setHistPage(page);

  if (loading) {
    return (
      <div className="dashboard-page" style={{display:'flex', justifyContent:'center', alignItems:'center', minHeight:'50vh'}}>
        <div className="spinner" style={{borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)'}}></div>
      </div>
    );
  }

  const formatMoney = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  const StatCard = ({ title, value, icon, color, subtext, trend }) => (
    <div className="stat-card glass" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="stat-icon" style={{ backgroundColor: `${color}15`, color: color }}>
        {icon}
      </div>
      <div className="stat-content">
        <h3 className="stat-label">{title}</h3>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <p className="stat-value">{value}</p>
          {trend && (
             <div style={{ color: trend === 'gain' ? '#10b981' : trend === 'loss' ? '#ef4444' : '#94a3b8' }}>
               {trend === 'gain' ? <ArrowUpRight size={18} /> : trend === 'loss' ? <ArrowDownRight size={18} /> : <Minus size={18} />}
             </div>
          )}
        </div>
        {subtext && <p className="stat-subtext" style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.2rem' }}>{subtext}</p>}
      </div>
    </div>
  );

  return (
    <div className="dashboard-page overflow-hidden">
      <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>{isAdmin ? 'Portfolio Registry' : 'Investment Portfolio'}</h1>
          <p>{isAdmin ? 'Master view of all user wallets and their detailed investment portfolios.' : 'Track your active plans and system wallet balance.'}</p>
        </div>
        {!isAdmin && (
          <button 
            className="btn btn-primary glass" 
            style={{ marginTop: '-0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', fontWeight: 'bold' }}
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={20} /> New Investment
          </button>
        )}
      </div>

      {message.text && (
        <div className={message.type === 'error' ? 'error-message' : 'success-message'} style={{marginBottom: '2rem', borderRadius: '12px'}}>
          {message.text}
        </div>
      )}

      {/* Metric Cards Banner */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem', marginBottom: '2rem', maxWidth: '1400px', margin: '0 auto 2rem' }}>
        {isAdmin ? (
          <>
            <div className="stat-card-new glass" style={{ flex: '1 1 250px', maxWidth: '350px', margin: 0 }}>
              <div className="stat-icon-wrapper icon-blue"><Wallet size={24} /></div>
              <p className="stat-title">Total Wallets Balance</p>
              <h3 className="stat-value">{formatMoney(totalSystemBalance)}</h3>
            </div>
            <div className="stat-card-new glass" style={{ flex: '1 1 250px', maxWidth: '350px', margin: 0 }}>
              <div className="stat-icon-wrapper icon-purple"><Activity size={24} /></div>
              <p className="stat-title">System Invested Volume</p>
              <h3 className="stat-value">{formatMoney(totalActiveInvestmentsAmount)}</h3>
            </div>
            <div className="stat-card-new glass" style={{ flex: '1 1 250px', maxWidth: '350px', margin: 0 }}>
              <div className="stat-icon-wrapper icon-orange"><Users size={24} /></div>
              <p className="stat-title">Total Active Portfolios</p>
              <h3 className="stat-value">{activeUsersCount} Users</h3>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card-new glass" style={{ flex: '1 1 250px', maxWidth: '280px', margin: 0 }}>
              <div className="stat-icon-wrapper icon-blue"><Wallet size={24} /></div>
              <p className="stat-title">Wallet Balance</p>
              <h3 className="stat-value">{formatMoney(myWalletBalance)}</h3>
            </div>
            <div className="stat-card-new glass" style={{ flex: '1 1 250px', maxWidth: '280px', margin: 0 }}>
              <div className="stat-icon-wrapper icon-purple"><Clock size={24} /></div>
              <p className="stat-title">Next Payout In</p>
              <h3 className="stat-value">{payoutInfo.text}</h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Estimated ROI schedule</p>
            </div>
            <div className="stat-card-new glass" style={{ flex: '1 1 250px', maxWidth: '280px', margin: 0 }}>
              <div className="stat-icon-wrapper icon-green"><TrendingUp size={24} /></div>
              <p className="stat-title">Life-time Profit</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 className="stat-value" style={{ margin: 0 }}>{formatMoney(myTotalProfit)}</h3>
                <div style={{ color: payoutInfo.trend === 'gain' ? '#10b981' : payoutInfo.trend === 'loss' ? '#ef4444' : '#94a3b8' }}>
                  {payoutInfo.trend === 'gain' ? <ArrowUpRight size={20} /> : payoutInfo.trend === 'loss' ? <ArrowDownRight size={20} /> : <Minus size={20} />}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Data Table Panel */}
      <div className="dashboard-panel glass" style={{ padding: '0', overflow: 'hidden', marginBottom: '2rem' }}>
        <div className="panel-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
           <h2 className="panel-title" style={{ margin: 0 }}>{isAdmin ? 'User Registry & Balances' : 'My Active Subscriptions'}</h2>
           
           <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
             <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
             <input
                type="text"
                placeholder={isAdmin ? "Search by name or email..." : "Filter your plans..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
                  borderRadius: '20px', border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                  outline: 'none', transition: 'border-color 0.3s'
                }}
             />
           </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="premium-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            {isAdmin ? (
              // ADMIN TEMPLATE - USER REGISTRY
              getFilteredAdminView().length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan="5" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                      <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Data Available</h3>
                      <p style={{ margin: 0 }}>Try adjusting your search or filter.</p>
                    </td>
                  </tr>
                </tbody>
              ) : (
                <>
                  <thead>
                    <tr style={{ background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Investor</th>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Contact</th>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Wallet Balance</th>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Active Plans</th>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Total Vol.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPaginatedList(getFilteredAdminView(), regPage).map((row) => (
                      <tr 
                        key={row._id} 
                        style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s', cursor: 'pointer' }} 
                        onClick={() => navigate(`/user-wallets?userId=${row.owner?._id || row.userId}`)}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.05)'} 
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}>
                            {row.owner?.firstName?.[0] || 'U'}
                          </div>
                          {row.owner?.firstName} {row.owner?.lastName}
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          {row.owner?.email || 'N/A'}
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-primary)', fontWeight: '700', fontSize: '1rem' }}>
                           <span style={{ color: parseFloat(row.currencyAmount) > 0 ? 'var(--success)' : 'inherit' }}>
                             {formatMoney(row.currencyAmount)}
                           </span>
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem' }}>
                          <span className={`status-badge ${row.activeCount > 0 ? 'active' : 'pending'}`} style={{fontSize: '0.75rem'}}>
                            {row.activeCount} Active
                          </span>
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                           {formatMoney(row.investedSum)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )
            ) : (
              // INVESTOR TEMPLATE
              getFilteredUserInvestments().length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan="5" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      <Activity size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                      <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Active Plans</h3>
                      <p style={{ margin: '0 0 1.5rem 0' }}>Launch your first investment today.</p>
                      <button className="btn btn-primary" onClick={() => navigate('/plans')}>
                        Browse Plans
                      </button>
                    </td>
                  </tr>
                </tbody>
              ) : (
                <>
                  <thead>
                    <tr style={{ background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Capital Plan</th>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Principal</th>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Profit Earned</th>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Start Date</th>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPaginatedList(getFilteredUserInvestments(), regPage).map((inv) => (
                      <tr key={inv._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                          {inv.pendingConfirmation?.invoice?.plan?.name || inv.planName || 'Active Plan'}
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                           {formatMoney(inv.pendingConfirmation?.invoice?.amount || inv.amount)}
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: '600' }}>
                            +{formatMoney(inv.totalProfit || inv.profit)}
                            <div style={{ color: inv.profitTrend === 'gain' ? '#10b981' : inv.profitTrend === 'loss' ? '#ef4444' : '#94a3b8' }}>
                              {inv.profitTrend === 'gain' ? <ArrowUpRight size={16} /> : inv.profitTrend === 'loss' ? <ArrowDownRight size={16} /> : <Minus size={16} />}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          {new Date(inv.investmentDate || inv.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem' }}>
                          <span className={`status-badge ${(!inv.completed) ? 'active' : 'completed'}`} style={{fontSize: '0.75rem'}}>
                            {(!inv.completed) ? <CheckCircle size={12} /> : <Clock size={12} />}
                            {(!inv.completed) ? 'Active' : 'Completed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )
            )}
          </table>
        </div>
        <Pagination 
          currentPage={regPage}
          totalItems={isAdmin ? getFilteredAdminView().length : getFilteredUserInvestments().length}
          itemsPerPage={itemsPerPage}
          onPageChange={handleRegPageChange}
        />
      </div>

      {/* NEW SECTION: INVESTMENT HISTORY */}
      <div className="dashboard-panel glass" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="panel-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
           <h2 className="panel-title" style={{ margin: 0 }}>Comprehensive Credit History</h2>
           <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
             {isAdmin && !filterUserId ? 'Global audit logs for all funding and investment approvals.' : 'A full ledger of your funding and investment approvals.'}
           </p>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="premium-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            {getFilteredUserInvestments().length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={isAdmin && !filterUserId ? "7" : "6"} style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No transaction history found for this view.
                  </td>
                </tr>
              </tbody>
            ) : (
              <>
                <thead>
                  <tr style={{ background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                    {isAdmin && !filterUserId && <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Investor</th>}
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Action Date</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Principal</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Duration</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>ROI Range</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Next Pay Date</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedList(getFilteredUserInvestments(), histPage).map((inv) => {
                    const pConf = inv.pendingConfirmation;
                    const invoice = pConf?.invoice;
                    const plan = invoice?.plan;
                    const owner = invoice?.user || inv.user || inv.owner;

                    const nextPay = new Date();
                    nextPay.setDate(nextPay.getDate() + 1);
                    
                    return (
                      <tr key={inv._id + '_hist'} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        {isAdmin && !filterUserId && (
                          <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                            {owner?.firstName} {owner?.lastName}
                          </td>
                        )}
                        <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {new Date(pConf?.updatedAt || inv.updatedAt).toLocaleDateString()}
                          </div>
                          <div style={{ fontSize: '0.7rem' }}>Approved</div>
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                          {formatMoney(invoice?.amount || inv.amount)}
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>
                           {plan?.endDate || 'Unlimited'} Days
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem' }}>
                          <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                            {plan ? `${plan.dailyProfitMin}% - ${plan.dailyProfitMax}%` : 'Standard'}
                          </span>
                          <div style={{fontSize: '0.72rem', color: 'var(--text-secondary)'}}>Daily Accrual</div>
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontWeight: '600' }}>
                            <Clock size={14} />
                            {nextPay.toLocaleDateString()}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Estimated</div>
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                          {inv._id?.slice(-8).toUpperCase()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </>
            )}
          </table>
        </div>
        <Pagination 
          currentPage={histPage}
          totalItems={getFilteredUserInvestments().length}
          itemsPerPage={itemsPerPage}
          onPageChange={handleHistPageChange}
        />
      </div>

      {isModalOpen && <InvestmentModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

export default UserWallets;
