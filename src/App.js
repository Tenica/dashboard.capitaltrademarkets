import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/layout/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import Withdrawals from './pages/Withdrawals';
import PendingConfirmations from './pages/PendingConfirmations';
import CreatePlan from './pages/CreatePlan';
import Plans from './pages/Plans';
import UserWallets from './pages/UserWallets';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';
import CreateInvestment from './pages/CreateInvestment';
import Transactions from './pages/Transactions';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Terms from './pages/Terms';
import './styles/App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          {/* Protected Area Wrapped in Layout */}
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/invoices" element={<Invoices />} />
                    <Route path="/withdrawals" element={<Withdrawals />} />
                    <Route path="/pending-confirmations" element={<PendingConfirmations />} />
                    <Route path="/create-plan" element={<CreatePlan />} />
                    <Route path="/plans" element={<Plans />} />
                    <Route path="/user-wallets" element={<UserWallets />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/user-management" element={<UserManagement />} />
                    <Route path="/create-investment" element={<CreateInvestment />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
