import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://capitaltrademarket.vercel.app'; // Uses environment variable or falls back to production target

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Force redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (email, password) => api.post('/auth/login-user', { email, password }),
  createUser: (userData) => api.post('/auth/create-user', userData),
  logout: () => api.post('/auth/logout-user'),
  resetPassword: (email) => api.post('/auth/reset-password', { email }),
  changePassword: (token, password) => api.post(`/auth/change-password/${token}`, { password }),
  getAllUsers: () => api.get('/auth/view-all-users'),
  blockUser: (id) => api.post(`/auth/block-user/${id}`),
  unblockUser: (id) => api.post(`/auth/unblock-user/${id}`),
  adminCreateUser: (userData) => api.post('/auth/admin-create-user', userData),
  generate2FaSecret: () => api.post('/auth/generate-2fa'),
  enable2Fa: (token) => api.post('/auth/enable-2fa', { token }),
  verifyLogin2Fa: (userId, token) => api.post('/auth/verify-2fa', { userId, token }),
};

// Invoice APIs
export const invoiceAPI = {
  createInvoice: (invoiceData) => api.post('/invoice/create-invoice', invoiceData),
  confirmInvoice: (id) => api.post(`/invoice/confirm-invoice/${id}`),
  cancelInvoice: (id) => api.post(`/invoice/cancel-invoice/${id}`),
};

export const withdrawalAPI = {
  createWithdrawal: (withdrawalData) => api.post('/withdrawal/create-withdrawal-request', withdrawalData),
  viewAllWithdrawals: () => api.get('/withdrawal/view-all-withdrawal-request'),
  viewSingleWithdrawal: (id) => api.get(`/withdrawal/view-one-withdrawal-request/${id}`),
  confirmWithdrawal: (id) => api.post(`/withdrawal/confirm-withdrawal-request/${id}`),
  declineWithdrawal: (id) => api.post(`/withdrawal/decline-withdrawal-request/${id}`),
};

// Investment APIs
export const investmentAPI = {
  viewAllInvestments: () => api.get('/investment/view-all-investments'),
  viewUserInvestments: () => api.get('/investment/view-user-investments'),
  updateAllInvestments: () => api.get('/investment/update-investment'),
  updateUserInvestment: (userId) => api.get(`/investment/update-investment/${userId}`),
};

// Pending Confirmation APIs
export const pendingConfirmationAPI = {
  viewAllPendingCredit: () => api.get('/pending-confirmation/view-all-pending-confirmation'),
  viewSinglePending: (id) => api.get(`/pending-confirmation/view-one-pending-confirmation/${id}`),
  viewAllPendingWithdrawal: () => api.get('/pending-confirmation/view-all-pending-withdrawal'),
  viewUserPendingCredit: () => api.get('/pending-confirmation/view-all-user-pending-confirmation'),
  viewUserPendingWithdrawal: (id) => api.get(`/pending-confirmation/view-all-user-withdrawal-confirmation/${id}`),
  confirmPendingTransaction: (id) => api.post(`/pending-confirmation/confirm-pending-confirmation/${id}`),
};

// System Wallet APIs
export const systemWalletAPI = {
  createSystemWallet: (walletData) => api.post('/system-wallet/create-system-wallet', walletData),
  getSystemWallet: () => api.get('/system-wallet/get-system-wallet'),
  getAllSystemWallets: () => api.get('/system-wallet/get-all-system-wallets'),
  editSystemWallet: (id, walletData) => api.put(`/system-wallet/edit-system-wallet/${id}`, walletData),
  deleteSystemWallet: (id) => api.delete(`/system-wallet/delete-system-wallet/${id}`),
};

// Plan APIs
export const planAPI = {
  createPlan: (planData) => api.post('/plan/create-plan', planData),
  viewAllPlans: () => api.get('/plan/get-plan'),
  getMatchingPlans: (amount) => api.get(`/plan/get-matching-plans?amount=${amount}`),
  editPlan: (id, planData) => api.put(`/plan/edit-plan/${id}`, planData),
  deletePlan: (id) => api.delete(`/plan/delete-plan/${id}`),
};

// Wallet APIs
export const walletAPI = {
  getUserWallet: (userId) => api.get(`/wallet/view-user-wallet/${userId}`),
  getAdminUserWallet: (userId) => api.get(`/wallet/view-user-wallet-admin/${userId}`),
  getAllWallets: () => api.get('/wallet/view-all-wallets'),
};

// Transaction APIs
export const transactionAPI = {
  getUserTransactions: (userId) => api.get(`/transactions/transaction/${userId}`),
  viewUserTransactions: (userId) => api.get(`/transactions/view-transactions/${userId}`),
  getAllTransactions: () => api.get('/transactions/getAllTransaction'),
};

export default api;
