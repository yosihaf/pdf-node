// src/pages/PdfViewerPage/PdfViewerPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PdfViewerPage.css';

interface PdfMetadata {
  title: string;
  author?: string;
  createdAt?: string;
  pageCount?: number;
  size?: string;
}

const PdfViewerPage: React.FC = () => {
  const { pdfPath } = useParams<{ pdfPath: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [metadata, setMetadata] = useState<PdfMetadata | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    if (pdfPath) {
      loadPdfViewer(pdfPath);
    }
  }, [pdfPath]);

  const loadPdfViewer = async (path: string) => {
    try {
      setLoading(true);
      setError(null);

      // בניית URL המלא לתצוגת PDF
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://pdf.test.hamichlol.org.il/api';

      // הסרת קידוד כפול אם קיים
      const decodedPath = decodeURIComponent(path);
      const fullPdfUrl = `${API_BASE_URL}/pdf/view/${decodedPath}`;

      console.log('🔍 טוען PDF מ:', fullPdfUrl);

      // בדיקה שה-PDF קיים וזמין
      const response = await fetch(fullPdfUrl, { method: 'HEAD' });

      if (!response.ok) {
        throw new Error(`הקובץ לא נמצא או לא זמין (${response.status})`);
      }

      // קבלת מטא-דאטה אם זמינה
      try {
        const metadataUrl = `${API_BASE_URL}/pdf/metadata/${decodedPath}`;
        const metadataResponse = await fetch(metadataUrl);
        if (metadataResponse.ok) {
          const metadataData = await metadataResponse.json();
          setMetadata(metadataData);
        }
      } catch (metadataError) {
        console.log('לא ניתן לטעון מטא-דאטה:', metadataError);
        // חילוץ שם הקובץ מהנתיב
        const fileName = decodedPath.split('/').pop() || 'ספר PDF';
        setMetadata({ title: fileName.replace('.pdf', '') });
      }

      setPdfUrl(fullPdfUrl);
      setLoading(false);
    } catch (error) {
      console.error('שגיאה בטעינת PDF:', error);
      setError(error instanceof Error ? error.message : 'שגיאה לא ידועה');
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = metadata?.title || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, '_blank');
      printWindow?.addEventListener('load', () => {
        printWindow.print();
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: metadata?.title || 'ספר PDF',
          url: window.location.href
        });
      } catch (error) {
        console.log('שיתוף בוטל:', error);
      }
    } else {
      // fallback - העתקה לקליפבורד
      navigator.clipboard.writeText(window.location.href);
      alert('הקישור הועתק לקליפבורד!');
    }
  };

  if (loading) {
    return (
      <div className="pdf-viewer-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h3>טוען את הספר...</h3>
          <p>אנא המתן בזמן שאנו מכינים את התצוגה</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pdf-viewer-page">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h3>שגיאה בטעינת הספר</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={() => navigate(-1)} className="back-button">
              חזור אחורה
            </button>
            <button onClick={() => window.location.reload()} className="retry-button">
              נסה שוב
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`pdf-viewer-page ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* כותרת עליונה */}
      <div className="pdf-header">
        <div className="pdf-info">
          <button onClick={() => navigate(-1)} className="back-button">
            ← חזור
          </button>
          <div className="pdf-metadata">
            <h2>{metadata?.title || 'ספר PDF'}</h2>
            {metadata?.author && <p className="pdf-author">מאת: {metadata.author}</p>}
            <div className="pdf-details">
              {metadata?.pageCount && <span>📄 {metadata.pageCount} עמודים</span>}
              {metadata?.size && <span>📊 {metadata.size}</span>}
              {metadata?.createdAt && <span>📅 {new Date(metadata.createdAt).toLocaleDateString('he-IL')}</span>}
            </div>
          </div>
        </div>

        <div className="pdf-controls">
          <button onClick={handleDownload} className="control-btn download-btn" title="הורד PDF">
            ⬇️ הורד
          </button>
          <button onClick={handlePrint} className="control-btn print-btn" title="הדפס">
            🖨️ הדפס
          </button>
          <button onClick={handleShare} className="control-btn share-btn" title="שתף">
            📤 שתף
          </button>
          <button onClick={handleFullscreen} className="control-btn fullscreen-btn" title="מסך מלא">
            {isFullscreen ? '🔳 יציאה' : '🔲 מסך מלא'}
          </button>
        </div>
      </div>

      {/* תצוגת ה-PDF */}
      <div className="pdf-container">
        <iframe
          src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`}
          className="pdf-iframe"
          title={metadata?.title || 'PDF Viewer'}
          onLoad={() => setLoading(false)}
          onError={() => setError('שגיאה בטעינת תצוגת ה-PDF')}
        />
      </div>

      {/* כפתור יציאה ממסך מלא */}
      {isFullscreen && (
        <button onClick={handleFullscreen} className="exit-fullscreen-btn">
          ✕
        </button>
      )}
    </div>
  );
};

export default PdfViewerPage;