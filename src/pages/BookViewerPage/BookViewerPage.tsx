// src/pages/BookViewerPage/BookViewerPage.tsx - קובץ נקי ותקין
import React, { useState, useEffect } from 'react';
import { useLocation, Link, matchPath } from 'react-router-dom';
import PdfViewer from '../../components/PdfViewer';
import { BookResponse } from '../../types';
import './BookViewerPage.css';

const BookViewerPage: React.FC = () => {
  const location = useLocation();
  const [book, setBook] = useState<BookResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // פונקציה לחילוץ נתונים מהנתיב באמצעות matchPath
  const extractDataFromPath = (pathname: string): { pdfPath: string; title: string } | null => {

    const match = matchPath({ path: "/book/:pdfPath/:title" }, pathname);

    if (match && match.params) {
      const { pdfPath, title } = match.params as { pdfPath: string; title: string };

      return {
        pdfPath,
        title: decodeURIComponent(title)
      };
    }

    console.log('❌ לא ניתן לחלץ נתונים מהנתיב עם matchPath');
    return null;
  };

  // פונקציה לבניית URL של הקובץ בשרת
  const buildServerUrl = (pdfPath: string, title: string): string => {
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    const baseUrl = API_BASE_URL.replace('/api', ''); // הסרת /api מהבסיס

    // בניית URL מלא לשרת
    const serverUrl = `${baseUrl}/api/pdf/view/${pdfPath}/${encodeURIComponent(title)}`;

    console.log('🌐 פירוט בניית URL:');
    console.log('   API_BASE_URL:', API_BASE_URL);
    console.log('   baseUrl:', baseUrl);
    console.log('   pdfPath:', pdfPath);
    console.log('   title:', title);
    console.log('   URL סופי:', serverUrl);

    return serverUrl;
  };

  useEffect(() => {
    console.log('🔥 BookViewerPage useEffect התחיל');
    console.log('📍 pathname:', location.pathname);

    const pathData = extractDataFromPath(location.pathname);
    console.log(pathData);

    if (pathData) {
      const { pdfPath, title } = pathData;
      console.log('🚀 יש נתונים תקינים, בונה ספר');

      // בניית URL של הקובץ בשרת
      const serverUrl = buildServerUrl(pdfPath, title);

      // יצירת אובייקט BookResponse סינתטי
      const syntheticBook: BookResponse = {
        task_id: pdfPath,
        status: 'completed',
        title: title.replace('.pdf', ''),
        download_url: serverUrl,
        view_url: serverUrl
      };

      console.log('📖 ספר סינתטי נוצר:', syntheticBook);
      setBook(syntheticBook);
      setLoading(false);
    } else {
      console.log('❌ חסרים נתונים מהנתיב!');
      setError(`נתיב הספר לא תקין. הנתיב הנוכחי: ${location.pathname}. צריך להיות בפורמט: /view/{pdfPath}/{title}`);
      setLoading(false);
    }
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="book-viewer-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>טוען את הספר...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="book-viewer-page">
        <div className="error-container">
          <h2>שגיאה</h2>
          <p>{error}</p>
          <div className="error-actions">
            <Link to="/my-books" className="back-button">
              חזור לרשימת הספרים
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="book-viewer-page">
        <div className="error-container">
          <h2>הספר לא נמצא</h2>
          <p>לא ניתן למצוא את הספר המבוקש</p>
          <Link to="/my-books" className="back-button">
            חזור לרשימת הספרים
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="book-viewer-page">
      <div className="book-header">
        <Link to="/my-books" className="back-button">
          ← חזור לרשימת הספרים
        </Link>
        <div className="book-meta">
          <h2>{book.title || 'ספר ללא כותרת'}</h2>
          <p>סטטוס: {book.status}</p>
          <p>Task ID: {book.task_id}</p>
        </div>
        <div className="book-actions">
          {book.download_url && (
            <a
              href={book.download_url}
              className="download-button"
              target="_blank"
              rel="noopener noreferrer"
              download
            >
              📥 הורד PDF
            </a>
          )}
        </div>
      </div>

      {book.status === 'completed' ? (
        <PdfViewer
          bookResponse={book}
          allowDownload={true}
          allowPrint={true}
          allowFullscreen={true}
          showControls={true}
        />
      ) : (
        <div className="book-status-info">
          <h3>הספר עדיין לא מוכן</h3>
          <p>סטטוס נוכחי: {book.status}</p>
          <p>אנא נסה שוב מאוחר יותר</p>
        </div>
      )}

      {/* מידע debug - הסר בפרודקשן */}
      <div className="debug-section" style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '0.5rem' }}>
        <details>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>מידע טכני לפיתוח</summary>
          <div style={{ marginTop: '1rem' }}>
            <h4>נתוני הספר:</h4>
            <pre style={{ background: '#fff', padding: '1rem', borderRadius: '0.25rem', overflow: 'auto' }}>
              {JSON.stringify(book, null, 2)}
            </pre>
            <h4>פרמטרים מה-URL:</h4>
            <p>pathname: {location.pathname}</p>
            <p>extracted data: {JSON.stringify(extractDataFromPath(location.pathname))}</p>
            <p>current href: {window.location.href}</p>
          </div>
        </details>
      </div>
    </div>
  );
};

export default BookViewerPage;