// src/pages/MyBooksPage/MyBooksPage.tsx - מתוקן
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserBooks } from '../../services/apiService';
import { BookResponse } from '../../types';
import './MyBooksPage.css';

const MyBooksPage: React.FC = () => {
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserBooks();
  }, []);

  const loadUserBooks = async () => {
    try {
      setLoading(true);
      const userBooks = await getUserBooks();
      console.log('ספרים שנטענו:', userBooks);
      setBooks(userBooks);
    } catch (error) {
      console.error('שגיאה בטעינת ספרים:', error);
      setError('שגיאה בטעינת הספרים');
    } finally {
      setLoading(false);
    }
  };

  // פונקציה לחילוץ task_id מה-view_url או download_url
  const extractTaskId = (book: BookResponse): string => {
    // אם יש task_id ישירות - השתמש בו
    if (book.task_id) {
      return book.task_id;
    }
    
    // נסה לחלץ מה-view_url
    if (book.view_url) {
      // רגקס מתקדם יותר לחילוץ UUID
      const match = book.view_url.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
      if (match) return match[1];
    }
    
    // נסה לחלץ מה-download_url
    if (book.download_url) {
      const match = book.download_url.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
      if (match) return match[1];
    }
    
    console.warn('לא ניתן לחלץ task_id עבור ספר:', book);
    return '';
  };

  // פונקציה לבניית URL להורדה מלא
  const getFullDownloadUrl = (book: BookResponse): string => {
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    const baseUrl = API_BASE_URL.replace('/api', '');
    
    if (book.download_url) {
      if (book.download_url.startsWith('http')) {
        return book.download_url;
      } else {
        return `${baseUrl}${book.download_url}`;
      }
    }
    
    return '';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>טוען את הספרים שלך...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>שגיאה</h2>
        <p>{error}</p>
        <button onClick={loadUserBooks}>נסה שוב</button>
      </div>
    );
  }

  return (
    <div className="my-books-page">
      <div className="page-header">
        <h2>הספרים שלי</h2>
        <Link to="/create" className="create-new-button">
          ➕ צור ספר חדש
        </Link>
      </div>

      {books.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>אין לך ספרים עדיין</h3>
          <p>התחל ליצור את הספר הראשון שלך!</p>
          <Link to="/create" className="start-creating-button">
            התחל ליצור
          </Link>
        </div>
      ) : (
        <div className="books-grid">
          {books.map((book, index) => {
            const taskId = extractTaskId(book);
            const downloadUrl = getFullDownloadUrl(book);
            
            console.log('מעבד ספר:', {
              originalBook: book,
              extractedTaskId: taskId,
              fullDownloadUrl: downloadUrl
            });

            return (
              <div key={book.task_id || index} className="book-card">
                <div className="book-cover">
                  <div className="book-icon">📖</div>
                </div>
                <div className="book-info">
                  <h3 className="book-title">{book.title || 'ספר ללא כותרת'}</h3>
                  <p className="book-status">סטטוס: {book.status}</p>
                  
                  <div className="book-actions">
                    {taskId ? (
                      <Link
                        to={`/book/${taskId}`}
                        className="view-book-button"
                      >
                        צפה בספר
                      </Link>
                    ) : (
                      <span className="disabled-button">
                        לא ניתן לצפות
                      </span>
                    )}
                    
                    {downloadUrl ? (
                      <a
                        href={downloadUrl}
                        className="download-button"
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        הורד PDF
                      </a>
                    ) : (
                      <span className="disabled-button">
                        לא זמין להורדה
                      </span>
                    )}
                  </div>
                  
                  {/* מידע debug - הסר בפרודקשן */}
                  <div className="debug-info" style={{ fontSize: '10px', color: '#666', marginTop: '10px' }}>
                    <details>
                      <summary>מידע טכני</summary>
                      <pre>{JSON.stringify(book, null, 2)}</pre>
                    </details>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBooksPage;