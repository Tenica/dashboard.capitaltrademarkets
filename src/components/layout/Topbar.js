import React, { useContext, useState, useRef, useEffect } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Sun, Moon, Bell, Menu, User, ShieldAlert, ChevronDown, LogOut, Settings, HelpCircle, Edit2 } from 'lucide-react';

const Topbar = ({ toggleSidebar, isAdmin, setIsAdmin }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="topbar glass">
      <div className="topbar-left">
        <button className="icon-btn d-mobile" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
      </div>

      <div className="topbar-right">
        {user?.isAdmin === true && (
          <button 
            className="icon-btn mock-role-btn" 
            onClick={() => setIsAdmin(!isAdmin)}
            title={`Switch to ${isAdmin ? 'User' : 'Admin'} View`}
          >
            {isAdmin ? <ShieldAlert size={18} className="text-danger" color="#ef4444" /> : <User size={18} />}
            <span className="role-text">{isAdmin ? 'Admin View' : 'View User'}</span>
          </button>
        )}

        <button className="icon-btn-circle" onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        
        <button className="icon-btn-circle notification-btn">
          <Bell size={18} />
          <span className="badge-dot"></span>
        </button>

        <div className="user-profile-wrapper" ref={dropdownRef}>
          <div className="user-profile-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <div className="avatar">
              {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
            </div>
            <div className="user-info-trigger d-desktop-only">
              <span className="user-name-trigger">
                {user?.firstName ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1) : 'Investor'}
              </span>
              <ChevronDown size={14} className={`chevron ${dropdownOpen ? 'rotate' : ''}`} />
            </div>
          </div>

          {dropdownOpen && (
            <div className="profile-dropdown glass dropdown-animate">
              <div className="dropdown-header">
                <p className="dropdown-name">{user?.firstName} {user?.lastName}</p>
                <p className="dropdown-email">{user?.email}</p>
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-menu">
                <a href="/profile" className="dropdown-item">
                  <User size={16} /> <span>View Profile</span>
                </a>
                <a href="/profile?tab=settings" className="dropdown-item">
                  <Settings size={16} /> <span>Account settings</span>
                </a>
                <a href="/support" className="dropdown-item">
                  <HelpCircle size={16} /> <span>Support</span>
                </a>
                <div className="dropdown-divider"></div>
                <button onClick={handleLogout} className="dropdown-item text-danger logout-btn">
                  <LogOut size={16} /> <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
