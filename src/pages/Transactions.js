import React, { useState, useEffect } from 'react';
import { transactionAPI } from '../services/api';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, ArrowDownRight, ArrowUpRight, Search, Clock, CheckCircle, SearchX, History } from 'lucide-react';
import '../styles/dashboard.css';
import EmptyState from '../components/common/EmptyState';

function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const userId = user?._id || user?.id;
  const isAdmin = user?.isAdmin;

  useEffect(() => {
    if (userId) {
      fetchTransactions();
    } else {
      setLoading(false);
    }
  }, [userId, isAdmin]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let response;
      if (isAdmin) {
        response = await transactionAPI.getAllTransactions();
      } else {
        // Use the new viewUserTransactions endpoint specifically for ROI history
        response = await transactionAPI.viewUserTransactions(userId);
      }
      const data = response.data?.transactions || response.data?.message || [];
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error fetching transactions archive.' });
    } finally {
      setLoading(false);
    }
  };

  const filteredTxns = transactions.filter(txn => {
    const search = searchTerm.toLowerCase();
    const desc = (txn.description || '').toLowerCase();
    const type = (txn.type || '').toLowerCase();
    return desc.includes(search) || type.includes(search);
  });

  // Calculate Paginated List
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTxns.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="dashboard-page" style={{display:'flex', justifyContent:'center', alignItems:'center', minHeight:'50vh'}}>
        <div className="spinner" style={{borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)'}}></div>
      </div>
    );
  }

  const formatAmount = (amount, description) => {
    const isROI = description?.startsWith('Daily ROI');
    const prefix = isROI ? '+' : (amount < 0 ? '' : '');
    const color = isROI ? 'var(--success)' : (amount < 0 ? '#ef4444' : 'var(--text-primary)');
    
    return (
      <span style={{ color, fontWeight: '700', fontSize: '1rem' }}>
        {prefix}${Math.abs(parseFloat(amount || 0)).toFixed(2)}
      </span>
    );
  };

  return (
    <div className="dashboard-page overflow-hidden">
      <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>{isAdmin ? 'Financial Audit Trail' : 'Transaction History'}</h1>
          <p>{isAdmin ? 'Master ledger of all system-wide financial movements and ROI distributions.' : 'View your complete history of deposits, withdrawals, and daily earnings.'}</p>
        </div>
      </div>

      {message.text && (
        <div className={message.type === 'error' ? 'error-message' : 'success-message'} style={{marginBottom: '2rem', borderRadius: '12px'}}>
          {message.text}
        </div>
      )}

      <div className="dashboard-panel glass" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="panel-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
           <h2 className="panel-title" style={{ margin: 0 }}>Transaction Ledger</h2>
           
           <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
             <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
             <input
                type="text"
                placeholder="Search description or type..."
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
          {filteredTxns.length > 0 ? (
            <table className="premium-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                  {isAdmin && <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Investor</th>}
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Description</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Amount</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Label</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((txn) => {
                  const isROI = txn.description?.startsWith('Daily ROI');
                  
                  return (
                    <tr key={txn._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      {isAdmin && (
                        <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                          {txn.user ? `${txn.user.firstName} ${txn.user.lastName}` : 'System'}
                        </td>
                      )}
                      <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ 
                            padding: '0.4rem', borderRadius: '8px', 
                            background: isROI ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)',
                            color: isROI ? 'var(--success)' : 'var(--text-secondary)'
                          }}>
                            {isROI ? <TrendingUp size={16} /> : (txn.amount < 0 ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />)}
                          </div>
                          {txn.description}
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        {formatAmount(txn.amount, txn.description)}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <span className={`status-badge ${isROI ? 'active' : 'completed'}`} style={{ fontSize: '0.75rem', padding: '0.3rem 0.8rem' }}>
                          {isROI ? 'Profit' : (txn.type || 'Transaction')}
                        </span>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {new Date(txn.createdAt).toLocaleDateString()}
                        <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '3rem' }}>
              <EmptyState 
                icon={searchTerm ? SearchX : History} 
                title={searchTerm ? "No matching records" : "No history found"} 
                message={searchTerm ? `We couldn't find any transactions matching "${searchTerm}".` : "Your financial activity and ROI earnings will appear here."}
                action={searchTerm ? { label: 'Clear Search', onClick: () => setSearchTerm('') } : null}
              />
            </div>
          )}
        </div>
        <Pagination 
          currentPage={currentPage}
          totalItems={filteredTxns.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}

export default Transactions;
