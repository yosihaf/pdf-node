// src/components/PdfViewer/PdfViewer.tsx - עם פתרונות CORS
import React, { useState, useEffect } from 'react';
import { BookResponse } from '../../types';
import './PdfViewer.css';

interface PdfViewerProps {
  bookResponse: BookResponse;
  allowDownload?: boolean;
  allowPrint?: boolean;
  allowFullscreen?: boolean;
  showControls?: boolean;
  watermark?: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ 
  bookResponse,
  allowDownload = true,
  allowPrint = true,
  allowFullscreen = true,
  showControls = true,
  watermark
}) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [useEmbedFallback, setUseEmbedFallback] = useState<boolean>(false);

  useEffect(() => {
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    const baseUrl = API_BASE_URL.replace('/api', '');
    
    let viewUrl = bookResponse.view_url || bookResponse.download_url;
    
    if (viewUrl) {
      if (viewUrl.startsWith('/')) {
        viewUrl = `${baseUrl}${viewUrl}`;
      }
      
      // הוספת headers ופרמטרים לתצוגה טובה יותר
      let finalUrl = viewUrl;
      
      if (viewUrl.includes('.pdf')) {
        finalUrl = `${viewUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`;
      }
      
      setPdfUrl(finalUrl);
    } else {
      setError('לא נמצא URL לתצוגת הספר');
      setLoading(false);
    }
  }, [bookResponse]);

  // פונקציה לטיפול בשגיאות iframe
  const handleIframeError = (): void => {
    console.error('שגיאה בטעינת iframe');
    setLoading(false);
    setError('שגיאה בטעינת תצוגת ה-PDF');
    // ניסיון עם embed כ-fallback
    setUseEmbedFallback(true);
  };

  const handleIframeLoad = (): void => {
    setLoading(false);
    setError(null);
  };

  const handleDownload = (): void => {
    if (!allowDownload) {
      alert('הורדת הקובץ אינה מותרת');
      return;
    }

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    const baseUrl = API_BASE_URL.replace('/api', '');
    
    let download_url = bookResponse.download_url;
    
    if (download_url) {
      if (download_url.startsWith('/')) {
        download_url = `${baseUrl}${download_url}`;
      }
      
      // פתיחה בטאב חדש במקום הורדה אוטומטית
      window.open(download_url, '_blank');
    } else {
      alert('לא ניתן להוריד את הקובץ - URL לא זמין');
    }
  };

  const handleOpenNewTab = (): void => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const handleFullscreen = (): void => {
    if (!allowFullscreen) {
      alert('מסך מלא אינו מותר');
      return;
    }
    setIsFullscreen(!isFullscreen);
  };

  if (!pdfUrl && !loading) {
    return (
      <div className="pdf-viewer-error">
        <h3>אין תצוגה זמינה</h3>
        <p>לא נמצא קישור לתצוגת הספר</p>
        <div className="error-actions">
          {allowDownload && bookResponse.download_url && (
            <button onClick={handleDownload} className="download-button">
              הורד PDF במקום
            </button>
          )}
          <div className="debug-info">
            <details>
              <summary>מידע טכני</summary>
              <pre>{JSON.stringify(bookResponse, null, 2)}</pre>
            </details>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`pdf-viewer ${isFullscreen ? 'fullscreen' : ''} ${!allowDownload ? 'restricted' : ''}`}
      tabIndex={0}
    >
      {watermark && (
        <div className="watermark">
          {watermark}
        </div>
      )}

      {showControls && (
        <div className="pdf-controls">
          <h3>תצוגת הספר: {bookResponse.title}</h3>
          <div className="control-buttons">
            {allowFullscreen && (
              <button onClick={handleFullscreen} className="fullscreen-button">
                {isFullscreen ? 'יציאה ממסך מלא' : 'מסך מלא'}
              </button>
            )}

            <button onClick={handleOpenNewTab} className="open-tab-button">
              פתח בטאב חדש
            </button>

            {allowDownload && bookResponse.download_url && (
              <button onClick={handleDownload} className="download-button">
                הורד PDF
              </button>
            )}
          </div>
        </div>
      )}

      <div className="pdf-container">
        {loading && (
          <div className="pdf-loading">
            <div className="spinner"></div>
            <p>טוען את תצוגת הספר...</p>
            <p className="loading-url">URL: {pdfUrl}</p>
            <p className="loading-note">אם הטעינה נתקעת, נסה את כפתור "פתח בטאב חדש"</p>
          </div>
        )}

        {error && (
          <div className="pdf-error">
            <h3>שגיאה בתצוגה</h3>
            <p>{error}</p>
            <div className="error-actions">
              <button onClick={() => window.location.reload()} className="retry-button">
                נסה שוב
              </button>
              <button onClick={handleOpenNewTab} className="open-tab-button">
                פתח בטאב חדש
              </button>
              {allowDownload && bookResponse.download_url && (
                <button onClick={handleDownload} className="download-button">
                  הורד PDF במקום
                </button>
              )}
            </div>
            <div className="debug-info">
              <details>
                <summary>פרטים טכניים</summary>
                <p>URL שנוסה לטעון: {pdfUrl}</p>
                <p>Status: {error}</p>
                <pre>{JSON.stringify(bookResponse, null, 2)}</pre>
              </details>
            </div>
          </div>
        )}

        {pdfUrl && !error && (
          <>
            {/* ניסיון ראשון - iframe רגיל */}
            {!useEmbedFallback ? (
              <iframe
                src={pdfUrl}
                title="תצוגת הספר"
                className="pdf-iframe"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                style={{ display: loading ? 'none' : 'block' }}
                sandbox="allow-same-origin allow-scripts allow-popups allow-downloads"
                allow="fullscreen"
              />
            ) : (
              /* fallback - embed tag */
              <embed
                src={pdfUrl}
                type="application/pdf"
                width="100%"
                height="100%"
                style={{ display: loading ? 'none' : 'block' }}
                title="תצוגת הספר"
                onLoad={handleIframeLoad}
                onError={() => {
                  setError('לא ניתן להציג את הקובץ בדפדפן זה');
                  setLoading(false);
                }}
              />
            )}
          </>
        )}
      </div>

      {!allowDownload && (
        <div className="restriction-notice">
          <p>🔒 תצוגה מוגבלת - הורדה והדפסה חסומות</p>
        </div>
      )}

      {isFullscreen && allowFullscreen && (
        <button
          onClick={handleFullscreen}
          className="close-fullscreen"
          aria-label="סגור מסך מלא"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default PdfViewer;