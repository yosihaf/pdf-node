// src/App.tsx - גרסה מתוקנת עם AuthContext
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Layout/Header';
import HomePage from './pages/HomePage';
import CreateBookPage from './pages/CreateBookPage/CreateBookPage';
import MyBooksPage from './pages/MyBooksPage';
import PublicBooksPage from './pages/PublicBooksPage/PublicBooksPage';
import BookViewerPage from './pages/BookViewerPage';
import AuthModal from './components/Auth/AuthModal/AuthModal';
import './App.css';

// רכיב פנימי שמשתמש ב-AuthContext
const AppContent: React.FC = () => {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    logout 
  } = useAuth();
  const [showAuthModal, setShowAuthModal] = React.useState<boolean>(false);

  // מסך טעינה
  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-container">
          <div className="spinner"></div>
          <h2>טוען את המערכת...</h2>
          <p>אנא המתן בזמן שאנו מוודאים את פרטי ההתחברות</p>
        </div>
      </div>
    );
  }

  // מסך אימות - אם לא מחובר
  if (!isAuthenticated) {
    return (
      <div className="auth-required-screen">
        <div className="auth-container">
          <div className="auth-header">
            <h1>🔐 נדרשת התחברות</h1>
            <p>ברוכים הבאים למערכת יצירת ספרי PDF</p>
          </div>
          
          <div className="auth-content">
            <div className="auth-features">
              <h3>מה אתם יכולים לעשות במערכת:</h3>
              <ul>
                <li>📖 יצירת ספרי PDF מותאמים אישית</li>
                <li>🔍 חיפוש ובחירת דפים מהמכלול</li>
                <li>📚 ניהול ספרייה אישית</li>
                <li>🌐 גישה לספרים ציבוריים</li>
              </ul>
            </div>
            
            <div className="auth-actions">
              <button 
                onClick={() => setShowAuthModal(true)}
                className="auth-button primary"
              >
                התחבר למערכת
              </button>
              
              <div className="auth-info">
                <p>
                  <strong>שים לב:</strong> המערכת מיועדת לעובדי CTI בלבד.
                  <br />
                  נדרשת כתובת מייל מדומיין <code>@cti.org.il</code>
                </p>
              </div>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLogin={async (token: string) => {
            setShowAuthModal(false);
            // AuthContext יטפל באימות אוטומטית
          }}
        />
      </div>
    );
  }

  // האפליקציה הראשית - למשתמשים מחוברים
  return (
    <Router>
      <div className="website-book-container">
        <Header 
          userInfo={user} 
          onLogout={logout} 
          onOpenAuth={() => setShowAuthModal(true)}
        />
        
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create" element={<CreateBookPage />} />
            <Route path="/my-books" element={<MyBooksPage />} />
            <Route path="/public-books" element={<PublicBooksPage />} />
            
            {/* Routes לתצוגת ספרים */}
            <Route path="/view/:pdfPath/:title" element={<BookViewerPage />} />
            <Route path="/book/*" element={<BookViewerPage />} />
          </Routes>
        </main>
        
        <footer>
          <p>
            טיפ: עבור דפים מהמכלול, אפשר להשתמש ישירות בכתובת הדף, 
            לדוגמה: https://www.hamichlol.org.il/הר
          </p>
          <p>
            משתמש מחובר: {user?.email} | 
            <button onClick={logout} className="logout-link">
              התנתק
            </button>
          </p>
        </footer>

        {/* מודל אימות - זמין גם למשתמשים מחוברים למקרה הצורך */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLogin={async (token: string) => {
            setShowAuthModal(false);
            // AuthContext יטפל באימות אוטומטית
          }}
        />
      </div>
    </Router>
  );
};

// הרכיב הראשי עם AuthProvider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;