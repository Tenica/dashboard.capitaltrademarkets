import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../context/AuthContext';
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
          <main className="content-area">
            {children}
          </main>
        </div>
      </div>
    </AdminContext.Provider>
  );
};

export default Layout;
