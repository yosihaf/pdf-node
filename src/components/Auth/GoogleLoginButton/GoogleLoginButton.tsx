// src/components/Auth/GoogleLoginButton/GoogleLoginButton.tsx
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

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onFailure,
  disabled = false,
  loading = false,
  text = "התחבר עם Google"
}) => {
  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    console.log('הצלחה באימות Google:', credentialResponse);
    
    if (credentialResponse.credential) {
      onSuccess(credentialResponse.credential);
    } else {
      onFailure({ error: 'לא התקבל credential מ-Google' });
    }
  };

  const handleGoogleError = () => {
    console.error('שגיאה באימות Google');
    onFailure({ error: 'שגיאה באימות Google' });
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
      />
    </div>
  );
};

export default GoogleLoginButton;