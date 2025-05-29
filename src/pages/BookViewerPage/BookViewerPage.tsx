import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PdfViewer from '../../components/PdfViewer';
import { getBookInfo } from '../../services/apiService';
import { BookResponse } from '../../types';
import './BookViewerPage.css';

const BookViewerPage: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<BookResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookId) {
      loadBook(bookId);
    }
  }, [bookId]);

  const loadBook = async (id: string) => {
    try {
      setLoading(true);
      const bookData = await getBookInfo(id);
      setBook(bookData);
    } catch (error) {
      setError('שגיאה בטעינת הספר');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>טוען את הספר...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="error-container">
        <h2>שגיאה</h2>
        <p>{error || 'הספר לא נמצא'}</p>
        <Link to="/my-books" className="back-button">
          חזור לרשימת הספרים
        </Link>
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
          <h2>{book.message || 'ספר ללא כותרת'}</h2>
          <p>סטטוס: {book.status}</p>
        </div>
      </div>

      {book.status === 'completed' && (
        <PdfViewer bookResponse={book} />
      )}
    </div>
  );
};

export default BookViewerPage;