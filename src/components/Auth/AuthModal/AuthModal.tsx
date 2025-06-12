// src/components/Auth/AuthModal/AuthModal.tsx
import React, { useState } from 'react';
import GoogleLoginButton from '../GoogleLoginButton/GoogleLoginButton';
import { useAuth } from '../../../contexts/AuthContext';

import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (token: string) => void;
}

interface ValidationErrors {
  email?: string;
  password?: string;
  general?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const { loginWithGoogle } = useAuth();
  // הגבלת הדומיין המותר
  const ALLOWED_DOMAIN = 'cti.org.il';
  const MIN_PASSWORD_LENGTH = 8;

  // ולידציה של המייל
  const validateEmail = (email: string): string | null => {
    if (!email) {
      return 'נדרש כתובת מייל';
    }

    if (!email.includes('@')) {
      return 'כתובת מייל לא תקינה';
    }

    const domain = email.split('@')[1];
    if (domain !== ALLOWED_DOMAIN) {
      return `רק מיילים מדומיין ${ALLOWED_DOMAIN} מורשים להירשם`;
    }

    return null;
  };

  // ולידציה של הסיסמה
  const validatePassword = (password: string): string | null => {
    if (!password) {
      return 'נדרשת סיסמה';
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return `הסיסמה חייבת להכיל לפחות ${MIN_PASSWORD_LENGTH} תווים`;
    }

    return null;
  };

  // ולידציה של אישור סיסמה
  const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
    if (isRegistering && password !== confirmPassword) {
      return 'הסיסמאות לא זהות';
    }
    return null;
  };

  // ולידציה כללית של הטופס
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    if (isRegistering) {
      const confirmPasswordError = validateConfirmPassword(password, confirmPassword);
      if (confirmPasswordError) newErrors.password = confirmPasswordError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // טיפול בשליחת הטופס
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const endpoint = isRegistering ? '/auth/register' : '/auth/login';
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://pdf.test.hamichlol.org.il/api';

      const requestBody = isRegistering
        ? { email, password, confirm_password: confirmPassword }
        : { email, password };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok) {
        // התחברות/הרשמה הצליחה
        const token = data.access_token || data.token;
        if (token) {
          onLogin(token);
          onClose();
          resetForm();
        } else {
          setErrors({ general: 'לא התקבל טוקן אימות מהשרת' });
        }
      } else {
        // טיפול בשגיאות מהשרת
        handleServerErrors(data);
      }
    } catch (error) {
      console.error('שגיאה בבקשת אימות:', error);
      setErrors({ general: 'שגיאה בחיבור לשרת. אנא נסה שוב.' });
    } finally {
      setLoading(false);
    }
  };

  // טיפול בשגיאות מהשרת
  const handleServerErrors = (errorData: any) => {
    const newErrors: ValidationErrors = {};

    if (errorData.detail) {
      if (Array.isArray(errorData.detail)) {
        // שגיאות ולידציה מ-Pydantic
        errorData.detail.forEach((error: any) => {
          const field = error.loc?.[error.loc.length - 1];
          const message = error.msg;

          if (field === 'email') {
            newErrors.email = message;
          } else if (field === 'password') {
            newErrors.password = message;
          } else {
            newErrors.general = message;
          }
        });
      } else if (typeof errorData.detail === 'string') {
        newErrors.general = errorData.detail;
      }
    } else {
      newErrors.general = 'אירעה שגיאה בלתי צפויה';
    }

    setErrors(newErrors);
  };

  // איפוס הטופס
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  // מעבר בין מצבי התחברות והרשמה
  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setErrors({});
    setConfirmPassword('');
  };

  // סגירת המודל
  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleGoogleSuccess = async (credential: string) => {
    try {
      setLoading(true);
      setErrors({});

      await loginWithGoogle(credential);

      onClose();
      resetForm();

    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'שגיאה באימות Google'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleFailure = (error: any) => {
    console.error('שגיאה באימות Google:', error);
    setErrors({
      general: 'שגיאה באימות Google. אנא נסה שוב.'
    });
  };


  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={handleClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h2>{isRegistering ? 'הרשמה למערכת' : 'התחברות למערכת'}</h2>
          <button className="close-button" onClick={handleClose}>✕</button>
        </div>

        <div className="auth-modal-body">
          {/* הודעה על הגבלת הדומיין */}
          <div className="domain-notice">
            <p>
              <strong>שים לב:</strong> רק משתמשים עם כתובת מייל מדומיין{' '}
              <code>@{ALLOWED_DOMAIN}</code> יכולים להירשם למערכת.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {/* שדה מייל */}
            <div className="form-group">
              <label htmlFor="email">כתובת מייל</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`example@${ALLOWED_DOMAIN}`}
                className={errors.email ? 'error' : ''}
                disabled={loading}
                required
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            {/* שדה סיסמה */}
            <div className="form-group">
              <label htmlFor="password">סיסמה</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={`לפחות ${MIN_PASSWORD_LENGTH} תווים`}
                className={errors.password ? 'error' : ''}
                disabled={loading}
                required
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            {/* אישור סיסמה - רק בהרשמה */}
            {isRegistering && (
              <div className="form-group">
                <label htmlFor="confirmPassword">אישור סיסמה</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="הקלד את הסיסמה שוב"
                  disabled={loading}
                  required
                />
              </div>
            )}

            {/* הודעת שגיאה כללית */}
            {errors.general && (
              <div className="general-error">
                {errors.general}
              </div>
            )}

            {/* כפתור שליחה */}
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  {isRegistering ? 'נרשם...' : 'מתחבר...'}
                </>
              ) : (
                isRegistering ? 'הירשם' : 'התחבר'
              )}
            </button>
            <div className="social-login-section">
              <div className="divider">
                <span>או</span>
              </div>

              <GoogleLoginButton
                onSuccess={handleGoogleSuccess}
                onFailure={handleGoogleFailure}
                disabled={loading}
                loading={loading}
              />
            </div>
          </form>

          {/* מעבר בין מצבים */}
          <div className="mode-toggle">
            <button
              type="button"
              onClick={toggleMode}
              className="toggle-button"
              disabled={loading}
            >
              {isRegistering
                ? 'כבר יש לך חשבון? התחבר כאן'
                : 'אין לך חשבון? הירשם כאן'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;