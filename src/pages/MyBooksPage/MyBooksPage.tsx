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
      setBooks(userBooks);
    } catch (error) {
      setError('שגיאה בטעינת הספרים');
    } finally {
      setLoading(false);
    }
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
          {books.map((book) => (
            <div key={book.task_id} className="book-card">
              <div className="book-cover">
                <div className="book-icon">📖</div>
              </div>
              <div className="book-info">
                <h3 className="book-title">{book.message || 'ספר ללא כותרת'}</h3>
                <p className="book-status">סטטוס: {book.status}</p>
                <div className="book-actions">
                  {book.status === 'completed' && (
                    <>
                      <Link 
                        to={`/book/${book.task_id}`} 
                        className="view-book-button"
                      >
                        צפה בספר
                      </Link>
                      <a 
                        href={book.downloadUrl} 
                        className="download-button"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        הורד PDF
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBooksPage;