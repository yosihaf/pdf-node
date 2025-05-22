import React, { useState, useEffect } from 'react';
import { BookResponse } from '../types';
import '../styles/PdfViewer.css';

interface PdfViewerProps {
  bookResponse: BookResponse;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ bookResponse }) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');

  useEffect(() => {
    // בדיקה איזה URL להשתמש בו
    const url = bookResponse.downloadUrl;

    console.log('PDF URLs זמינים:', {
      viewUrl: bookResponse.viewUrl,
      pdfUrl: bookResponse.viewUrl,
      downloadUrl: bookResponse.downloadUrl,
      selectedUrl: url
    });

    if (url) {
      // אם זה לא PDF URL ישיר, נוסיף #view=FitH לתצוגה טובה יותר
      const finalUrl = url.endsWith('.pdf') ? `${url}#view=FitH` : url;
      setPdfUrl(finalUrl.replace('download','view'));
      console.log('URL סופי לתצוגה:', finalUrl);
    } else {
      setError('לא נמצא URL לתצוגת הספר');
      setLoading(false);
    }
  }, [bookResponse]);

  const handleDownload = (): void => {
    const downloadUrl = bookResponse.downloadUrl;
    if (downloadUrl) {
      console.log('מוריד קובץ מ:', downloadUrl);
      // יצירת קישור זמני להורדה
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

  // אם אין URL, הצג הודעת שגיאה
  if (!pdfUrl && !loading) {
    return (
      <div className="pdf-viewer-error">
        <h3>אין תצוגה זמינה</h3>
        <p>לא נמצא קישור לתצוגת הספר</p>
        {bookResponse.downloadUrl && (
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
  console.log(pdfUrl)
  return (
    <div className={`pdf-viewer ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="pdf-controls">
        <h3>תצוגת הספר</h3>
        <div className="control-buttons">
          <button onClick={handleFullscreen} className="fullscreen-button">
            {isFullscreen ? 'יציאה ממסך מלא' : 'מסך מלא'}
          </button>

          {(bookResponse.downloadUrl) && (
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
            >
              פתח בטאב חדש
            </a>
          )}
        </div>
      </div>

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
            {bookResponse.downloadUrl && (
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
          />
        )}
      </div>

      {isFullscreen && (
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