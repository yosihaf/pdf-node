// src/pages/LoginPage/LoginPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // קבלת הדף אליו רוצים לחזור לאחר ההתחברות
  const from = (location.state as any)?.from?.pathname || '/';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // איפוס שגיאה כשהמשתמש מתחיל להקליד
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      setError('אנא מלא את כל השדות');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await login(formData.username, formData.password);
      
      // הפנייה לדף המבוקש או לדף הבית
      navigate(from, { replace: true });
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'שגיאה בהתחברות');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>התחברות</h1>
          <p>התחבר לחשבון שלך כדי להמשיך</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">שם משתמש או אימייל</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="הכנס שם משתמש או אימייל"
              disabled={isLoading}
              required
              dir="ltr"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">סיסמה</label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="הכנס סיסמה"
                disabled={isLoading}
                required
                dir="ltr"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={isLoading || !formData.username || !formData.password}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                מתחבר...
              </>
            ) : (
              'התחבר'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            אין לך עדיין חשבון?{' '}
            <Link to="/register" className="register-link">
              הירשם כאן
            </Link>
          </p>
          
          <div className="forgot-password">
            <Link to="/forgot-password" className="forgot-link">
              שכחת את הסיסמה?
            </Link>
          </div>
        </div>

        <div className="demo-credentials">
          <h4>חשבון לדוגמה:</h4>
          <p>משתמש: demo</p>
          <p>סיסמה: demo123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;