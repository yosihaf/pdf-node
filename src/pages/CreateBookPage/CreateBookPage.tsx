// src/pages/CreateBookPage.tsx - מתוקן עם כל התוכן
import React, { useState } from 'react';
import BookSettings from '../../components/BookSettings';
import UrlInput from '../../components/UrlInput';
import PagePreview from '../../components/PagePreview';
import PdfViewer from '../../components/PdfViewer';
import { createBookFromPages } from '../../services/apiService';
import { BookSettingsType, UrlDataType, BookResponse } from '../../types';

const CreateBookPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [taskStatus, setTaskStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [bookSettings, setBookSettings] = useState<BookSettingsType>({
    title: 'הספר שלי',
    subtitle: 'אוסף דפים מהאתר',
    author: '',
  });
  const [urlsList, setUrlsList] = useState<any[]>([]);
  const [bookResponse, setBookResponse] = useState<BookResponse | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const handleSettingsChange = (newSettings: Partial<BookSettingsType>): void => {
    setBookSettings({ ...bookSettings, ...newSettings });
  };

  const createBook = async (urls: UrlDataType[]): Promise<void> => {
    setLoading(true);
    setError(null);
    setBookResponse(null);
    setLoadingMessage('שולח בקשה לשרת...');
    setTaskStatus('');

    try {
      setLoadingMessage('יוצר את הספר... זה יכול לקחת כמה דקות');

      const response = await createBookFromPages(urls, bookSettings, (status, message) => {
        setTaskStatus(status || '');
        if (message) setLoadingMessage(message);
      });

      setBookResponse(response);
      setUrlsList(urls);
      setLoadingMessage('');
      setTaskStatus('completed');
    } catch (error) {
      console.error('שגיאה ביצירת הספר:', error);
      setError('אירעה שגיאה ביצירת הספר. אנא נסה שוב מאוחר יותר.');
      setLoadingMessage('');
      setTaskStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const updateBook = async (): Promise<void> => {
    if (!bookResponse) return;

    setLoading(true);
    setError(null);
    setLoadingMessage('מעדכן את הספר...');

    try {
      const response = await createBookFromPages(urlsList, bookSettings);
      setBookResponse(response);
      setIsEditing(false);
      setLoadingMessage('');
    } catch (error) {
      console.error('שגיאה בעדכון הספר:', error);
      setError('אירעה שגיאה בעדכון הספר. אנא נסה שוב מאוחר יותר.');
      setLoadingMessage('');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBook = (): void => {
    setIsEditing(true);
  };

  const handleCancelEdit = (): void => {
    setIsEditing(false);
  };

  const createNewBook = (): void => {
    setBookResponse(null);
    setUrlsList([]);
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="create-book-page">
      <div className="page-title">
        <h1>יצירת ספר PDF חדש</h1>
        <p>צור ספר PDF מותאם אישית מדפי האינטרנט</p>
      </div>

      {!bookResponse ? (
        // מצב יצירת ספר חדש
        <>
          <BookSettings
            settings={bookSettings}
            onSettingsChange={handleSettingsChange}
          />

          <UrlInput
            onSubmit={createBook}
            isLoading={loading}
          />
        </>
      ) : (
        // מצב תצוגת הספר שנוצר
        <>
          {isEditing ? (
            // מצב עריכה
            <>
              <div className="edit-mode-header">
                <h2>עריכת הספר</h2>
                <div className="edit-buttons">
                  <button onClick={updateBook} disabled={loading} className="save-button">
                    {loading ? 'שומר...' : 'שמור שינויים'}
                  </button>
                  <button onClick={handleCancelEdit} className="cancel-button">
                    ביטול
                  </button>
                </div>
              </div>

              <BookSettings
                settings={bookSettings}
                onSettingsChange={handleSettingsChange}
              />

              <PagePreview pages={urlsList} />
            </>
          ) : (
            // מצב תצוגה
            <>
              <div className="book-actions">
                <button onClick={handleEditBook} className="edit-button">
                  ערוך ספר
                </button>
                <button onClick={createNewBook} className="new-book-button">
                  צור ספר חדש
                </button>
              </div>

              <div className="book-info">
                <h2>{bookSettings.title}</h2>
                <p>{bookSettings.subtitle}</p>
                {bookSettings.author && <p>מאת: {bookSettings.author}</p>}
                <p>מספר דפים: {urlsList.length}</p>
              </div>

              <PdfViewer bookResponse={bookResponse} />
            </>
          )}
        </>
      )}

      {loading && (
        <div className="loading-indicator">
          <div className="loading-content">
            <div className="spinner"></div>
            <h3>יוצר את הספר</h3>
            <p className="loading-message">
              {loadingMessage || 'מעבד את הבקשה...'}
            </p>
            {taskStatus && (
              <div className="status-indicator">
                <span className={`status-badge status-${taskStatus}`}>
                  {taskStatus === 'processing' && '⏳ מעבד'}
                  {taskStatus === 'downloading' && '⬇️ מוריד תוכן'}
                  {taskStatus === 'generating' && '📄 יוצר PDF'}
                  {taskStatus === 'completed' && '✅ הושלם'}
                  {taskStatus === 'failed' && '❌ נכשל'}
                  {taskStatus === 'error' && '⚠️ שגיאה'}
                </span>
              </div>
            )}
            <p className="loading-note">
              יצירת ספר יכולה לקחת מספר דקות בהתאם למספר הדפים
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default CreateBookPage;