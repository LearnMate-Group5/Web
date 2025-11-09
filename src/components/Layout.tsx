import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const isAdmin = user?.roles.includes('Admin');
  const isStaff = user?.roles.includes('Staff');

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>LearnMate</h2>
        </div>
        
        <div className="sidebar-menu">
          {isAdmin && (
            <>
              <Link 
                to="/admin/users" 
                className={`menu-item ${location.pathname === '/admin/users' ? 'active' : ''}`}
              >
                👥 Quản lý người dùng
              </Link>
              <Link 
                to="/admin/staff" 
                className={`menu-item ${location.pathname === '/admin/staff' ? 'active' : ''}`}
              >
                👔 Quản lý nhân viên
              </Link>
            </>
          )}
          
          {isStaff && (
            <Link 
              to="/staff" 
              className={`menu-item ${location.pathname === '/staff' ? 'active' : ''}`}
            >
              📚 Quản lý sách
            </Link>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <p className="user-name">{user?.name}</p>
            <p className="user-email">{user?.email}</p>
            <p className="user-role">{user?.roles.join(', ')}</p>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            🚪 Đăng xuất
          </button>
        </div>
      </nav>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
