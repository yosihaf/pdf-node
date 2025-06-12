// src/components/Auth/GoogleLoginButton/GoogleLoginButton.tsx - עם דיבוג מפורט
import React from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import './GoogleLoginButton.css';

interface GoogleLoginButtonProps {
  onSuccess: (credential: string) => void;
  onFailure: (error: any) => void;
  disabled?: boolean;
  loading?: boolean;
  text?: string;
}

// ✅ פונקציה לפענוח JWT token מגוגל (לראות מה יש בפנים)
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('❌ שגיאה בפענוח JWT:', error);
    return null;
  }
};

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onFailure,
  disabled = false,
  loading = false,
  text = "התחבר עם Google"
}) => {
  
  // ✅ פונקציה מפורטת לטיפול בהצלחה
  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    console.log('🎉 Google OAuth הצליח!');
    console.log('📦 מה שמגיע מגוגל:', {
      credential: credentialResponse.credential ? 'יש credential ✅' : 'אין credential ❌',
      clientId: credentialResponse.clientId,
      select_by: credentialResponse.select_by,
      credentialLength: credentialResponse.credential?.length
    });
    
    if (credentialResponse.credential) {
      // ✅ בואו נראה מה יש בפנים של הטוקן
      const decoded = decodeJWT(credentialResponse.credential);
      console.log('🔍 מה יש בפנים של הטוקן:', {
        email: decoded?.email,
        name: decoded?.name,
        picture: decoded?.picture,
        iss: decoded?.iss,
        aud: decoded?.aud,
        exp: decoded?.exp,
        iat: decoded?.iat
      });
      
      // ✅ בדיקה אם האימייל מהדומיין הנכון
      if (decoded?.email && !decoded.email.endsWith('@cti.org.il')) {
        console.warn('⚠️ האימייל לא מהדומיין הנכון:', decoded.email);
        onFailure({ 
          error: 'domain_not_allowed', 
          message: 'רק משתמשים עם כתובת מייל מדומיין @cti.org.il מורשים להתחבר',
          email: decoded.email
        });
        return;
      }
      
      // ✅ הכל תקין - שולח את הcredential הלאה
      console.log('✅ שולח credential לטיפול נוסף');
      onSuccess(credentialResponse.credential);
    } else {
      console.error('❌ לא התקבל credential מגוגל');
      onFailure({ 
        error: 'no_credential',
        message: 'לא התקבל credential מגוגל'
      });
    }
  };

  // ✅ פונקציה מפורטת לטיפול בשגיאות
  const handleGoogleError = () => {
    console.error('❌ שגיאה באימות Google');
    //console.log('🔍 פרטי השגיאה:', arguments);
    onFailure({ 
      error: 'google_auth_error',
      message: 'שגיאה באימות Google. אנא נסה שוב.'
    });
  };

  // אם disabled או loading, הצג כפתור מותאם אישית
  if (disabled || loading) {
    return (
      <div className="google-login-container">
        <button className="google-oauth-button" disabled>
          {loading && <div className="loading-spinner"></div>}
          <span>{loading ? 'מתחבר...' : 'התחבר עם Google'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="google-login-container">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        useOneTap={false}
        text="signin_with"
        shape="rectangular"
        theme="outline"
        size="large"
        locale="he"
        logo_alignment="left"
        auto_select={false}
        cancel_on_tap_outside={true}
        hosted_domain="cti.org.il"  // מגביל לדומיין שלך
        context="signin"
        ux_mode="popup"
      />
    </div>
  );
};

export default GoogleLoginButton;