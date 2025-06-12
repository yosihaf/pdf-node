// src/pages/SettingsPage/SettingsPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { changePassword } from '../../services/apiService';
import './SettingsPage.css';

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'he' | 'en';
  notifications: {
    email: boolean;
    browser: boolean;
    bookCreated: boolean;
    bookShared: boolean;
  };
  privacy: {
    profilePublic: boolean;
    showEmail: boolean;
    allowPublicBooks: boolean;
  };
  pdfSettings: {
    defaultFontSize: number;
    defaultMargins: number;
    defaultOrientation: 'portrait' | 'landscape';
    includeTOC: boolean;
    includePageNumbers: boolean;
  };
}

const SettingsPage: React.FC = () => {
  const { logout } = useAuth(); // הסרתי 'user' כי לא משתמשים בו
  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'privacy' | 'pdf' | 'advanced'>('account');

  // טופס שינוי סיסמה
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // הגדרות האפליקציה
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    language: 'he',
    notifications: {
      email: true,
      browser: true,
      bookCreated: true,
      bookShared: false
    },
    privacy: {
      profilePublic: false,
      showEmail: false,
      allowPublicBooks: true
    },
    pdfSettings: {
      defaultFontSize: 12,
      defaultMargins: 20,
      defaultOrientation: 'portrait',
      includeTOC: true,
      includePageNumbers: true
    }
  });

  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  // טיפול בשינוי סיסמה
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));

    if (passwordError) setPasswordError(null);
    if (passwordSuccess) setPasswordSuccess(null);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // בדיקות תקינות
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('אנא מלא את כל השדות');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('הסיסמה החדשה חייבת להכיל לפחות 6 תווים');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('הסיסמאות החדשות אינן תואמות');
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordError(null);

      await changePassword({
        current_password: passwordForm.currentPassword,  // ← שים לב לקו התחתון
        new_password: passwordForm.newPassword,          // ← שים לב לקו התחתון
        confirm_password: passwordForm.confirmPassword  // ← הוסף גם את זה
      });

      setPasswordSuccess('הסיסמה שונתה בהצלחה');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'שגיאה בשינוי הסיסמה');
    } finally {
      setPasswordLoading(false);
    }
  };

  // טיפול בהגדרות האפליקציה
  const handleSettingChange = (section: keyof AppSettings, key: string, value: any) => {
    setSettings(prev => {
      const sectionValue = prev[section];

      // בדיקה שזה object ולא null
      if (typeof sectionValue === 'object' && sectionValue !== null && !Array.isArray(sectionValue)) {
        return {
          ...prev,
          [section]: {
            ...(sectionValue as Record<string, any>),
            [key]: value
          }
        };
      } else {
        // אם זה לא object, נחליף את כל הערך
        return {
          ...prev,
          [section]: value
        };
      }
    });
  };

  const saveSettings = async () => {
    try {
      setSettingsLoading(true);
      setSettingsError(null);

      // כאן תהיה קריאה ל-API לשמירת ההגדרות
      // await updateUserSettings(settings);

      // סימולציה של שמירה
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSettingsSuccess('ההגדרות נשמרו בהצלחה');

    } catch (error) {
      setSettingsError('שגיאה בשמירת ההגדרות');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'האם אתה בטוח שברצונך למחוק את החשבון? פעולה זו אינה הפיכה ותמחק את כל הנתונים שלך.'
    );

    if (confirmed) {
      const doubleConfirmed = window.confirm(
        'זוהי פעולה בלתי הפיכה! כל הספרים והנתונים שלך יימחקו לצמיתות. האם אתה בטוח לחלוטין?'
      );

      if (doubleConfirmed) {
        try {
          // כאן תהיה קריאה ל-API למחיקת החשבון
          // await deleteUserAccount();

          alert('החשבון נמחק בהצלחה');
          logout();
        } catch (error) {
          alert('שגיאה במחיקת החשבון');
        }
      }
    }
  };

  const tabs = [
    { id: 'account', label: 'חשבון', icon: '👤' },
    { id: 'notifications', label: 'התראות', icon: '🔔' },
    { id: 'privacy', label: 'פרטיות', icon: '🔒' },
    { id: 'pdf', label: 'הגדרות PDF', icon: '📄' },
    { id: 'advanced', label: 'מתקדם', icon: '⚙️' }
  ] as const;

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1>הגדרות</h1>
          <p>נהל את הגדרות החשבון והאפליקציה שלך</p>
        </div>

        <div className="settings-content">
          <div className="settings-sidebar">
            <nav className="settings-nav">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id as any)}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="settings-main">
            {/* הודעות כלליות */}
            {settingsError && (
              <div className="message error-message">
                <span className="message-icon">⚠️</span>
                {settingsError}
              </div>
            )}

            {settingsSuccess && (
              <div className="message success-message">
                <span className="message-icon">✅</span>
                {settingsSuccess}
              </div>
            )}

            {/* טאב חשבון */}
            {activeTab === 'account' && (
              <div className="settings-section">
                <h2>הגדרות חשבון</h2>

                <div className="setting-group">
                  <h3>שינוי סיסמה</h3>

                  {passwordError && (
                    <div className="message error-message">
                      <span className="message-icon">⚠️</span>
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="message success-message">
                      <span className="message-icon">✅</span>
                      {passwordSuccess}
                    </div>
                  )}

                  <form onSubmit={handlePasswordSubmit} className="password-form">
                    <div className="form-group">
                      <label htmlFor="currentPassword">סיסמה נוכחית</label>
                      <div className="password-input-container">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          id="currentPassword"
                          name="currentPassword"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordChange}
                          disabled={passwordLoading}
                          dir="ltr"
                        />
                        <button
                          type="button"
                          className="toggle-password"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        >
                          {showPasswords.current ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="newPassword">סיסמה חדשה</label>
                      <div className="password-input-container">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          id="newPassword"
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordChange}
                          disabled={passwordLoading}
                          dir="ltr"
                        />
                        <button
                          type="button"
                          className="toggle-password"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        >
                          {showPasswords.new ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmPassword">אישור סיסמה חדשה</label>
                      <div className="password-input-container">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordChange}
                          disabled={passwordLoading}
                          dir="ltr"
                        />
                        <button
                          type="button"
                          className="toggle-password"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        >
                          {showPasswords.confirm ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="submit-button"
                      disabled={passwordLoading}
                    >
                      {passwordLoading ? (
                        <>
                          <span className="spinner"></span>
                          משנה סיסמה...
                        </>
                      ) : (
                        'שנה סיסמה'
                      )}
                    </button>
                  </form>
                </div>

                <div className="setting-group danger-zone">
                  <h3>אזור מסוכן</h3>
                  <p>פעולות אלה אינן הפיכות ויגרמו לאובדן נתונים</p>

                  <button
                    className="danger-button"
                    onClick={handleDeleteAccount}
                  >
                    🗑️ מחק חשבון לצמיתות
                  </button>
                </div>
              </div>
            )}

            {/* טאב התראות */}
            {activeTab === 'notifications' && (
              <div className="settings-section">
                <h2>הגדרות התראות</h2>

                <div className="setting-group">
                  <h3>סוגי התראות</h3>

                  <div className="toggle-setting">
                    <label>
                      <input
                        type="checkbox"
                        checked={settings.notifications.email}
                        onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                      />
                      <span className="toggle-label">התראות באימייל</span>
                    </label>
                  </div>

                  <div className="toggle-setting">
                    <label>
                      <input
                        type="checkbox"
                        checked={settings.notifications.browser}
                        onChange={(e) => handleSettingChange('notifications', 'browser', e.target.checked)}
                      />
                      <span className="toggle-label">התראות בדפדפן</span>
                    </label>
                  </div>

                  <div className="toggle-setting">
                    <label>
                      <input
                        type="checkbox"
                        checked={settings.notifications.bookCreated}
                        onChange={(e) => handleSettingChange('notifications', 'bookCreated', e.target.checked)}
                      />
                      <span className="toggle-label">הודעה כשספר מוכן</span>
                    </label>
                  </div>

                  <div className="toggle-setting">
                    <label>
                      <input
                        type="checkbox"
                        checked={settings.notifications.bookShared}
                        onChange={(e) => handleSettingChange('notifications', 'bookShared', e.target.checked)}
                      />
                      <span className="toggle-label">הודעה כשמישהו משתף ספר איתי</span>
                    </label>
                  </div>
                </div>

                <button onClick={saveSettings} className="save-settings-button" disabled={settingsLoading}>
                  {settingsLoading ? 'שומר...' : 'שמור הגדרות'}
                </button>
              </div>
            )}

            {/* טאב פרטיות */}
            {activeTab === 'privacy' && (
              <div className="settings-section">
                <h2>הגדרות פרטיות</h2>

                <div className="setting-group">
                  <h3>נראות פרופיל</h3>

                  <div className="toggle-setting">
                    <label>
                      <input
                        type="checkbox"
                        checked={settings.privacy.profilePublic}
                        onChange={(e) => handleSettingChange('privacy', 'profilePublic', e.target.checked)}
                      />
                      <span className="toggle-label">פרופיל ציבורי</span>
                    </label>
                    <p className="setting-description">משתמשים אחרים יוכלו לראות את הפרופיל שלך</p>
                  </div>

                  <div className="toggle-setting">
                    <label>
                      <input
                        type="checkbox"
                        checked={settings.privacy.showEmail}
                        onChange={(e) => handleSettingChange('privacy', 'showEmail', e.target.checked)}
                      />
                      <span className="toggle-label">הצג כתובת אימייל</span>
                    </label>
                    <p className="setting-description">כתובת האימייל תהיה גלויה בפרופיל הציבורי</p>
                  </div>

                  <div className="toggle-setting">
                    <label>
                      <input
                        type="checkbox"
                        checked={settings.privacy.allowPublicBooks}
                        onChange={(e) => handleSettingChange('privacy', 'allowPublicBooks', e.target.checked)}
                      />
                      <span className="toggle-label">אפשר שיתוף ספרים כציבוריים</span>
                    </label>
                    <p className="setting-description">תוכל לשתף ספרים עם כל המשתמשים</p>
                  </div>
                </div>

                <button onClick={saveSettings} className="save-settings-button" disabled={settingsLoading}>
                  {settingsLoading ? 'שומר...' : 'שמור הגדרות'}
                </button>
              </div>
            )}

            {/* טאב הגדרות PDF */}
            {activeTab === 'pdf' && (
              <div className="settings-section">
                <h2>הגדרות ברירת מחדל ל-PDF</h2>

                <div className="setting-group">
                  <h3>עיצוב וחיתוך</h3>

                  <div className="form-group">
                    <label htmlFor="fontSize">גודל פונט ברירת מחדל</label>
                    <input
                      type="number"
                      id="fontSize"
                      min="8"
                      max="24"
                      value={settings.pdfSettings.defaultFontSize}
                      onChange={(e) => handleSettingChange('pdfSettings', 'defaultFontSize', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="margins">שוליים (מ"מ)</label>
                    <input
                      type="number"
                      id="margins"
                      min="5"
                      max="50"
                      value={settings.pdfSettings.defaultMargins}
                      onChange={(e) => handleSettingChange('pdfSettings', 'defaultMargins', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="orientation">כיוון דף</label>
                    <select
                      id="orientation"
                      value={settings.pdfSettings.defaultOrientation}
                      onChange={(e) => handleSettingChange('pdfSettings', 'defaultOrientation', e.target.value)}
                    >
                      <option value="portrait">אנכי</option>
                      <option value="landscape">אופקי</option>
                    </select>
                  </div>

                  <div className="toggle-setting">
                    <label>
                      <input
                        type="checkbox"
                        checked={settings.pdfSettings.includeTOC}
                        onChange={(e) => handleSettingChange('pdfSettings', 'includeTOC', e.target.checked)}
                      />
                      <span className="toggle-label">כלול תוכן עניינים</span>
                    </label>
                  </div>

                  <div className="toggle-setting">
                    <label>
                      <input
                        type="checkbox"
                        checked={settings.pdfSettings.includePageNumbers}
                        onChange={(e) => handleSettingChange('pdfSettings', 'includePageNumbers', e.target.checked)}
                      />
                      <span className="toggle-label">כלול מספרי עמודים</span>
                    </label>
                  </div>
                </div>

                <button onClick={saveSettings} className="save-settings-button" disabled={settingsLoading}>
                  {settingsLoading ? 'שומר...' : 'שמור הגדרות'}
                </button>
              </div>
            )}

            {/* טאב מתקדם */}
            {activeTab === 'advanced' && (
              <div className="settings-section">
                <h2>הגדרות מתקדמות</h2>

                <div className="setting-group">
                  <h3>מראה</h3>

                  <div className="form-group">
                    <label htmlFor="theme">עיצוב</label>
                    <select
                      id="theme"
                      value={settings.theme}
                      onChange={(e) => handleSettingChange('theme', '', e.target.value)}
                    >
                      <option value="light">בהיר</option>
                      <option value="dark">כהה</option>
                      <option value="auto">אוטומטי</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="language">שפה</label>
                    <select
                      id="language"
                      value={settings.language}
                      onChange={(e) => handleSettingChange('language', '', e.target.value)}
                    >
                      <option value="he">עברית</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>

                <div className="setting-group">
                  <h3>נתונים</h3>

                  <button className="utility-button">
                    📥 ייצא את הנתונים שלי
                  </button>

                  <button className="utility-button">
                    🗑️ נקה cache
                  </button>
                </div>

                <button onClick={saveSettings} className="save-settings-button" disabled={settingsLoading}>
                  {settingsLoading ? 'שומר...' : 'שמור הגדרות'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;