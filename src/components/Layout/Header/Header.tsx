import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

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
      </div>
    </header>
  );
};

export default Header;