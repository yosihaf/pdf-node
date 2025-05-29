import React, { useState, useEffect } from 'react';
import { BookResponse } from '../../types';
import './PdfViewer.css';

interface PdfViewerProps {
  bookResponse: BookResponse;
  allowDownload?: boolean; // הגבלת הורדה
  allowPrint?: boolean; // הגבלת הדפסה
  allowFullscreen?: boolean; // הגבלת מסך מלא
  showControls?: boolean; // הצגת פקדים
  watermark?: string; // סימן מים
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

  useEffect(() => {
    const url = bookResponse.downloadUrl;

    console.log('PDF URLs זמינים:', {
      viewUrl: bookResponse.viewUrl,
      pdfUrl: bookResponse.viewUrl,
      downloadUrl: bookResponse.downloadUrl,
      selectedUrl: url
    });

    if (url) {
      // בניית URL עם הגבלות - מוסיף פרמטרים למניעת הורדה
      let finalUrl = url.endsWith('.pdf') ? `${url}#view=FitH` : url;
      
      // הוספת פרמטרים להגבלת פונקציונליות
      const restrictions = [];
      if (!allowDownload) restrictions.push('toolbar=0');
      if (!allowPrint) restrictions.push('navpanes=0');
      
      if (restrictions.length > 0) {
        finalUrl += (finalUrl.includes('#') ? '&' : '#') + restrictions.join('&');
      }
      
      setPdfUrl(finalUrl.replace('download','view'));
      console.log('URL סופי לתצוגה:', finalUrl);
    } else {
      setError('לא נמצא URL לתצוגת הספר');
      setLoading(false);
    }
  }, [bookResponse, allowDownload, allowPrint]);

  // הגבלת לחיצה ימנית
  const handleContextMenu = (e: React.MouseEvent) => {
    if (!allowDownload) {
      e.preventDefault();
      return false;
    }
  };

  // הגבלת מקשי קיצור
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!allowDownload) {
      // חסימת Ctrl+S, Ctrl+P, F12, וכו'
      if (
        (e.ctrlKey && (e.key === 's' || e.key === 'S')) || // Save
        (e.ctrlKey && (e.key === 'p' || e.key === 'P')) || // Print
        e.key === 'F12' || // Developer Tools
        (e.ctrlKey && e.shiftKey && e.key === 'I') // Dev Tools
      ) {
        e.preventDefault();
        return false;
      }
    }
  };

  const handleDownload = (): void => {
    if (!allowDownload) {
      alert('הורדת הקובץ אינה מותרת');
      return;
    }

    const downloadUrl = bookResponse.downloadUrl;
    if (downloadUrl) {
      console.log('מוריד קובץ מ:', downloadUrl);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${bookResponse.downloadUrl || 'book'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('לא ניתן להוריד את הקובץ - URL לא זמין');
    }
  };

  const handleFullscreen = (): void => {
    if (!allowFullscreen) {
      alert('מסך מלא אינו מותר');
      return;
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleIframeLoad = (): void => {
    console.log('iframe נטען בהצלחה');
    setLoading(false);
    setError(null);
  };

  const handleIframeError = (): void => {
    console.error('שגיאה בטעינת iframe');
    setLoading(false);
    setError('שגיאה בטעינת תצוגת ה-PDF');
  };

  if (!pdfUrl && !loading) {
    return (
      <div className="pdf-viewer-error">
        <h3>אין תצוגה זמינה</h3>
        <p>לא נמצא קישור לתצוגת הספר</p>
        {allowDownload && bookResponse.downloadUrl && (
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
    );
  }

  return (
    <div 
      className={`pdf-viewer ${isFullscreen ? 'fullscreen' : ''} ${!allowDownload ? 'restricted' : ''}`}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* סימן מים */}
      {watermark && (
        <div className="watermark">
          {watermark}
        </div>
      )}

      {showControls && (
        <div className="pdf-controls">
          <h3>תצוגת הספר</h3>
          <div className="control-buttons">
            {allowFullscreen && (
              <button onClick={handleFullscreen} className="fullscreen-button">
                {isFullscreen ? 'יציאה ממסך מלא' : 'מסך מלא'}
              </button>
            )}

            {allowDownload && bookResponse.downloadUrl && (
              <button onClick={handleDownload} className="download-button">
                הורד PDF
              </button>
            )}

            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="open-new-tab-button"
                style={{ display: allowDownload ? 'inline-block' : 'none' }}
              >
                פתח בטאב חדש
              </a>
            )}
          </div>
        </div>
      )}

      <div className="pdf-container">
        {loading && (
          <div className="pdf-loading">
            <div className="spinner"></div>
            <p>טוען את תצוגת הספר...</p>
            <p className="loading-url">מנסה לטעון: {pdfUrl}</p>
          </div>
        )}

        {error && (
          <div className="pdf-error">
            <h3>שגיאה בתצוגה</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>נסה שוב</button>
            {allowDownload && bookResponse.downloadUrl && (
              <button onClick={handleDownload} className="download-button">
                הורד PDF במקום
              </button>
            )}
            <div className="debug-info">
              <details>
                <summary>פרטים טכניים</summary>
                <p>URL שנוסה לטעון: {pdfUrl}</p>
                <pre>{JSON.stringify(bookResponse, null, 2)}</pre>
              </details>
            </div>
          </div>
        )}

        {pdfUrl && (
          <iframe
            src={pdfUrl}
            title="תצוגת הספר"
            className="pdf-iframe"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            style={{ display: loading || error ? 'none' : 'block' }}
            // הגבלות iframe
            sandbox={allowDownload ? 
              "allow-same-origin allow-scripts allow-popups allow-downloads" : 
              "allow-same-origin allow-scripts"
            }
          />
        )}
      </div>

      {/* הודעת הגבלה */}
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
