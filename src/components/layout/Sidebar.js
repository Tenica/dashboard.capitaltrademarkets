import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, ArrowDownToLine, ArrowUpRight, RefreshCw, Settings, X, Search, LogOut, ChevronDown, User, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar, isAdmin }) => {
  const { logout, user } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSettingsClick = (e) => {
    e.preventDefault();
    setIsSettingsOpen(!isSettingsOpen);
  };
  
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container" style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '1rem 0' }}>
            <a href="https://www.capitaltrademarkets.net/" style={{ display: 'block' }}>
              <img src="/logo.png" alt="CapitalTradeMarkets Logo" style={{ maxWidth: '180px', width: '100%', height: 'auto', objectFit: 'contain' }} />
            </a>
          </div>
          <button className="icon-btn d-mobile" onClick={toggleSidebar}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-label">Menu</div>
          <NavLink to="/dashboard" onClick={toggleSidebar} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/plans" onClick={toggleSidebar} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <Wallet size={20} />
            <span>Investment Plans</span>
          </NavLink>
          <NavLink to="/withdrawals" onClick={toggleSidebar} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <ArrowUpRight size={20} />
            <span>Withdrawals</span>
          </NavLink>
          <NavLink to="/user-wallets" onClick={toggleSidebar} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <ArrowDownToLine size={20} />
            <span>Portfolio Registry</span>
          </NavLink>

          {isAdmin && (
            <>
              <div className="nav-label mt-4">System</div>
              <NavLink to="/pending-confirmations" onClick={toggleSidebar} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
                <RefreshCw size={20} />
                <span>Confirmations</span>
              </NavLink>
            </>
          )}
          
          <div className="nav-item-dropdown">
            <button 
              className={`nav-item ${isSettingsOpen ? 'dropdown-active' : ''}`} 
              onClick={handleSettingsClick}
              style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', transition: 'all 0.2s', fontSize: '0.95rem' }}
            >
              <Settings size={20} />
              <span style={{ flex: 1, textAlign: 'left' }}>Settings</span>
              <ChevronDown size={16} style={{ transform: isSettingsOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }} />
            </button>
            
            <div style={{ 
              maxHeight: isSettingsOpen ? '200px' : '0', 
              overflow: 'hidden', 
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              background: 'rgba(0,0,0,0.05)',
              borderRadius: '8px',
              margin: '0 0.5rem'
            }}>
              <NavLink to="/profile" onClick={toggleSidebar} className={({isActive}) => isActive ? 'nav-item active sub-item' : 'nav-item sub-item'} style={{ paddingLeft: '2.5rem', fontSize: '0.9rem' }}>
                <User size={16} />
                <span>My Profile</span>
              </NavLink>
              {isAdmin && (
                <NavLink to="/user-management" onClick={toggleSidebar} className={({isActive}) => isActive ? 'nav-item active sub-item' : 'nav-item sub-item'} style={{ paddingLeft: '2.5rem', fontSize: '0.9rem' }}>
                  <Users size={16} />
                  <span>Users Management</span>
                </NavLink>
              )}
            </div>
          </div>
        </nav>
        
        <div style={{ 
          marginTop: 'auto', 
          padding: '1.25rem 1.5rem', 
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'rgba(0, 0, 0, 0.05)'
        }}>
          <button 
            onClick={logout} 
            className="nav-item sign-out-btn" 
            style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              fontWeight: '700',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <LogOut size={20} style={{ transition: 'transform 0.3s' }} className="logout-icon" />
            <span style={{ fontSize: '0.92rem', letterSpacing: '0.3px' }}>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
