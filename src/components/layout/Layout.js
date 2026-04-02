import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../context/AuthContext';
import GoogleTranslate from '../GoogleTranslate';
import '../../styles/layout.css';

export const AdminContext = React.createContext();

const Layout = ({ children }) => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(!!user?.isAdmin);

  useEffect(() => {
    // Apply dark theme globally — dashboard is built for dark mode
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  useEffect(() => {
    setIsAdmin(!!user?.isAdmin);
  }, [user]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <AdminContext.Provider value={{ isAdmin }}>
      <div className="app-layout">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} isAdmin={isAdmin} />
        <div className="main-wrapper">
          <Topbar toggleSidebar={toggleSidebar} isAdmin={isAdmin} setIsAdmin={setIsAdmin} />

          <main className="content-area" style={{ position: 'relative', minHeight: '85vh', paddingBottom: '4rem' }}>
            {children}
            <div style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.8)', padding: '0.4rem 1rem', borderRadius: '12px', backdropFilter: 'blur(8px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
              <GoogleTranslate />
            </div>
          </main>
        </div>
      </div>
    </AdminContext.Provider>
  );
};

export default Layout;
