import React, { useState, useEffect } from 'react';
import { invoiceAPI, pendingConfirmationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/App.css';

function Invoices() {
  const { user } = useAuth();
  const [pendingItems, setPendingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchPendingConfirmations();
  }, [user]);

  const fetchPendingConfirmations = async () => {
    try {
      if (user?.isAdmin) {
        const response = await pendingConfirmationAPI.viewAllPendingCredit();
        const confirmations = response.data?.message;
        setPendingItems(Array.isArray(confirmations) ? confirmations : []);
      } else {
        const response = await pendingConfirmationAPI.viewUserPendingCredit();
        const pendingConfirmations = response.data?.message;
        setPendingItems(Array.isArray(pendingConfirmations) ? pendingConfirmations : []);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error fetching pending confirmations' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id) => {
    if (window.confirm('Are you sure you want to confirm this payment?')) {
      try {
        await pendingConfirmationAPI.confirmPendingTransaction(id);
        setMessage({ type: 'success', text: 'Payment confirmed successfully' });
        fetchPendingConfirmations();
      } catch (error) {
        setMessage({ type: 'error', text: 'Error confirming payment' });
      }
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this payment?')) {
      try {
        await invoiceAPI.cancelInvoice(id);
        setMessage({ type: 'success', text: 'Payment cancelled successfully' });
        fetchPendingConfirmations();
      } catch (error) {
        setMessage({ type: 'error', text: 'Error cancelling payment' });
      }
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Pending Credit Confirmation</h1>

      {message.text && (
        <div className={message.type === 'error' ? 'error-message' : 'success-message'}>
          {message.text}
        </div>
      )}

      <div className="card">
        <h2>Pending Credit Confirmation</h2>
        <div className="table-container">
          <table>
            {pendingItems.length > 0 && (
              <thead>
                <tr>
                  <th>Reference #</th>
                  <th>Amount</th>
                  <th>Crypto Amount</th>
                  <th>Transaction ID</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Date</th>
                  {user?.isAdmin && <th>Actions</th>}
                </tr>
              </thead>
            )}
            <tbody>
              {pendingItems.length === 0 ? (
                <tr>
                  <td colSpan={user?.isAdmin ? "8" : "7"} style={{ textAlign: 'center' }}>
                    No pending credit confirmations
                  </td>
                </tr>
              ) : (
                pendingItems.map((item) => {
                  const data = item.invoice || item;
                  return (
                    <tr key={item._id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {data.invoiceNumber || data._id?.slice(-8)}
                      </td>
                      <td style={{ fontWeight: '600' }}>
                        ${parseFloat(data.amount || 0).toLocaleString()}
                      </td>
                      <td style={{ fontSize: '0.875rem' }}>
                        {data.cryptoAmount || 'N/A'}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {data.transactionId || 'N/A'}
                      </td>
                      <td>{data.plan?.name || 'N/A'}</td>
                      <td>
                        <span className="status-badge status-pending">
                          Pending
                        </span>
                      </td>
                      <td>{new Date(data.createdAt).toLocaleDateString()}</td>
                      {user?.isAdmin && (
                        <td>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleConfirm(data._id)}
                            style={{ marginRight: '0.5rem' }}
                          >
                            Confirm
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleCancel(item._id)}
                          >
                            Cancel
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Invoices;
