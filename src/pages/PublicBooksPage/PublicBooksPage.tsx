import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './PublicBooksPage.css';

interface PublicBook {
  id: string;
  title: string;
  author: string;
  createdAt: string;
  downloads: number;
  rating: number;
}

const PublicBooksPage: React.FC = () => {
  const [books] = useState<PublicBook[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'rating'>('newest');

  useEffect(() => {
    loadPublicBooks();
  }, []);

  const loadPublicBooks = async () => {
    // כאן תהיה קריאה ל-API לטעינת ספרים ציבוריים
    setLoading(false);
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );
  console.log(filteredBooks);

  return (
    <div className="public-books-page">
      <div className="page-header">
        <h2>ספרים ציבוריים</h2>
        <div className="search-and-sort">
          <input
            type="text"
            placeholder="חפש ספרים..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="sort-select"
          >
            <option value="newest">החדשים ביותר</option>
            <option value="popular">הפופולריים ביותר</option>
            <option value="rating">הכי מדורגים</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>טוען ספרים ציבוריים...</p>
        </div>
      ) : (
        <div className="books-grid">
          {filteredBooks.map((book) => (
            <div key={book.id} className="public-book-card">
              <div className="book-cover">
                <div className="book-icon">📖</div>
              </div>
              <div className="book-info">
                <h3 className="book-title">{book.title}</h3>
                <p className="book-author">מאת: {book.author}</p>
                <div className="book-stats">
                  <span>⭐ {book.rating}</span>
                  <span>📥 {book.downloads}</span>
                </div>
                <div className="book-actions">
                  <Link
                    to={`/book/${book.id}`}
                    className="view-book-button"
                  >
                    צפה בספר
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicBooksPage;