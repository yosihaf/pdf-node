// src/components/Layout/Header/Header.tsx - עם תמיכה באימות
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  userInfo?: {
    email: string;
    name?: string;
    role?: string;
  } | null;
  onLogout?: () => void;
  onOpenAuth?: () => void;
}

const Header: React.FC<HeaderProps> = ({ userInfo, onLogout, onOpenAuth }) => {
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // חילוץ שם המשתמש מהמייל
  const getUserDisplayName = () => {
    if (userInfo?.name) {
      return userInfo.name;
    }
    if (userInfo?.email) {
      return userInfo.email.split('@')[0];
    }
    return 'משתמש';
  };

  // קבלת האותיות הראשונות לאווטר
  const getUserInitials = () => {
    const displayName = getUserDisplayName();
    return displayName.slice(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <Link to="/" className="logo">
          <h1>יצירת ספר PDF</h1>
          <p className="subtitle">כולל תמיכה מיוחדת באתר המכלול!</p>
        </Link>
        
        <nav className="main-navigation">
          <Link 
            to="/" 
            className={`nav-button ${isActive('/') ? 'active' : ''}`}
          >
            <span className="nav-icon">🏠</span>
            דף הבית
          </Link>
          
          <Link 
            to="/create" 
            className={`nav-button ${isActive('/create') ? 'active' : ''}`}
          >
            <span className="nav-icon">➕</span>
            יצירת ספר
          </Link>
          
          <Link 
            to="/my-books" 
            className={`nav-button ${isActive('/my-books') ? 'active' : ''}`}
          >
            <span className="nav-icon">📚</span>
            הספרים שלי
          </Link>
          
          <Link 
            to="/public-books" 
            className={`nav-button ${isActive('/public-books') ? 'active' : ''}`}
          >
            <span className="nav-icon">🌐</span>
            ספרים ציבוריים
          </Link>
        </nav>

        {/* פינת המשתמש */}
        <div className="user-section">
          {userInfo ? (
            <div className="user-menu">
              <button 
                className="user-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="user-avatar">
                  {getUserInitials()}
                </div>
                <div className="user-info">
                  <span className="user-name">{getUserDisplayName()}</span>
                  <span className="user-email">{userInfo.email}</span>
                </div>
                <span className="dropdown-arrow">▼</span>
              </button>

              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="user-dropdown-header">
                    <div className="user-avatar large">
                      {getUserInitials()}
                    </div>
                    <div>
                      <div className="user-name">{getUserDisplayName()}</div>
                      <div className="user-email">{userInfo.email}</div>
                      {userInfo.role && (
                        <div className="user-role">{userInfo.role}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="user-dropdown-divider"></div>
                  
                  <div className="user-dropdown-actions">
                    <Link 
                      to="/my-books" 
                      className="dropdown-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      📚 הספרים שלי
                    </Link>
                    
                    <button 
                      className="dropdown-item logout-item"
                      onClick={handleLogout}
                    >
                      🚪 התנתק
                    </button>
                  </div>
                </div>
              )}

              {/* רקע לסגירת התפריט */}
              {showUserMenu && (
                <div 
                  className="user-menu-backdrop"
                  onClick={() => setShowUserMenu(false)}
                />
              )}
            </div>
          ) : (
            // כפתור התחברות אם לא מחובר
            <button 
              className="auth-button"
              onClick={onOpenAuth}
            >
              🔐 התחבר
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;