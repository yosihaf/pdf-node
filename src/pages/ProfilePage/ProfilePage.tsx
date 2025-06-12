// src/pages/ProfilePage/ProfilePage.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateUserProfile } from '../../services/apiService';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    username: user?.username || ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // איפוס הודעות
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      // בדיקות בסיסיות
      if (!formData.email) {
        setError('כתובת אימייל נדרשת');
        return;
      }

      // בדיקת פורמט אימייל
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('כתובת האימייל אינה תקינה');
        return;
      }

      // עדכון בשרת
      const updatedUser = await updateUserProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email
      });

      // עדכון בקונטקסט המקומי
      updateUser(updatedUser);
      
      setIsEditing(false);
      setSuccess('הפרטים עודכנו בהצלחה');

    } catch (error) {
      setError(error instanceof Error ? error.message : 'שגיאה בעדכון הפרטים');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // איפוס הטופס למצב המקורי
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      username: user?.username || ''
    });
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.username} />
            ) : (
              <div className="avatar-placeholder">
                {user?.firstName?.charAt(0) || user?.username?.charAt(0) || '👤'}
              </div>
            )}
          </div>
          <div className="profile-title">
            <h1>הפרופיל שלי</h1>
            <p>נהל את הפרטים האישיים שלך</p>
          </div>
        </div>

        {/* הודעות */}
        {error && (
          <div className="message error-message">
            <span className="message-icon">⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className="message success-message">
            <span className="message-icon">✅</span>
            {success}
          </div>
        )}

        <div className="profile-content">
          <div className="profile-section">
            <div className="section-header">
              <h2>פרטים אישיים</h2>
              {!isEditing && (
                <button 
                  className="edit-button"
                  onClick={() => setIsEditing(true)}
                  disabled={isLoading}
                >
                  ✏️ ערוך
                </button>
              )}
            </div>

            <div className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">שם פרטי</label>
                  {isEditing ? (
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="הכנס שם פרטי"
                      disabled={isLoading}
                    />
                  ) : (
                    <div className="form-value">
                      {formData.firstName || 'לא הוגדר'}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">שם משפחה</label>
                  {isEditing ? (
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="הכנס שם משפחה"
                      disabled={isLoading}
                    />
                  ) : (
                    <div className="form-value">
                      {formData.lastName || 'לא הוגדר'}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="username">שם משתמש</label>
                <div className="form-value readonly">
                  {formData.username}
                  <span className="readonly-note">לא ניתן לשינוי</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">כתובת אימייל</label>
                {isEditing ? (
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="הכנס כתובת אימייל"
                    disabled={isLoading}
                    dir="ltr"
                  />
                ) : (
                  <div className="form-value">
                    {formData.email}
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="form-actions">
                  <button 
                    className="save-button"
                    onClick={handleSave}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner"></span>
                        שומר...
                      </>
                    ) : (
                      'שמור שינויים'
                    )}
                  </button>
                  <button 
                    className="cancel-button"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    ביטול
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="profile-section">
            <h2>פרטי חשבון</h2>
            <div className="account-info">
              <div className="info-item">
                <span className="info-label">תאריך הצטרפות:</span>
                <span className="info-value">
                  {user?.createdAt ? formatDate(user.createdAt) : 'לא ידוע'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">מזהה משתמש:</span>
                <span className="info-value">{user?.id}</span>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h2>אבטחה</h2>
            <div className="security-actions">
              <button className="security-button">
                🔒 שנה סיסמה
              </button>
              <button className="security-button danger">
                🗑️ מחק חשבון
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;