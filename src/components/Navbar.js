import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/App.css';

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="navbar">
      <h1>BTC Investment Admin</h1>
      <nav>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/create-investment">Create Investment</Link>
        <Link to="/invoices">Pending</Link>
        <Link to="/withdrawals">Withdrawals</Link>
        <Link to="/plans">Plans</Link>
        <Link to="/transactions">Transactions</Link>
        {user?.isAdmin && <Link to="/user-wallets">User Wallets</Link>}
        <Link to="/profile">Profile</Link>
        <button onClick={handleLogout}>Logout</button>
      </nav>
    </div>
  );
}

export default Navbar;
