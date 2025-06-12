// src/pages/RegisterPage/RegisterPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, RegisterData } from '../../contexts/AuthContext';
import './RegisterPage.css';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // איפוס שגיאה כשהמשתמש מתחיל להקליד
    if (error) setError(null);
  };

  const validateForm = (): string | null => {
    // בדיקות בסיסיות
    if (!formData.username || !formData.email || !formData.password) {
      return 'אנא מלא את כל השדות הנדרשים';
    }

    // בדיקת אימייל
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'כתובת האימייל אינה תקינה';
    }

    // בדיקת שם משתמש
    if (formData.username.length < 3) {
      return 'שם המשתמש חייב להכיל לפחות 3 תווים';
    }

    // בדיקת סיסמה
    if (formData.password.length < 6) {
      return 'הסיסמה חייבת להכיל לפחות 6 תווים';
    }

    // בדיקת התאמת סיסמאות
    if (formData.password !== confirmPassword) {
      return 'הסיסמאות אינן תואמות';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // בדיקת תקינות הטופס
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await register(formData);
      
      // הפנייה לדף הבית לאחר הרשמה מוצלחת
      navigate('/', { replace: true });
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'שגיאה בהרשמה');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h1>הרשמה</h1>
          <p>צור חשבון חדש כדי להתחיל ליצור ספרים</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">שם פרטי</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="שם פרטי (אופציונלי)"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">שם משפחה</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="שם משפחה (אופציונלי)"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="username">שם משתמש <span className="required">*</span></label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="בחר שם משתמש (לפחות 3 תווים)"
              disabled={isLoading}
              required
              dir="ltr"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">כתובת אימייל <span className="required">*</span></label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="הכנס כתובת אימייל"
              disabled={isLoading}
              required
              dir="ltr"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">סיסמה <span className="required">*</span></label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="בחר סיסמה (לפחות 6 תווים)"
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

          <div className="form-group">
            <label htmlFor="confirmPassword">אישור סיסמה <span className="required">*</span></label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleInputChange}
                placeholder="הכנס שוב את הסיסמה"
                disabled={isLoading}
                required
                dir="ltr"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="register-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                נרשם...
              </>
            ) : (
              'הירשם'
            )}
          </button>
        </form>

        <div className="register-footer">
          <p>
            כבר יש לך חשבון?{' '}
            <Link to="/login" className="login-link">
              התחבר כאן
            </Link>
          </p>
        </div>

        <div className="terms-notice">
          <p>
            על ידי הרשמה, אתה מסכים ל
            <Link to="/terms" className="terms-link">תנאי השימוש</Link>
            {' '}ול<Link to="/privacy" className="privacy-link">מדיניות הפרטיות</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;