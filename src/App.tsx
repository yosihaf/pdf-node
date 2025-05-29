import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Layout/Header';
import HomePage from './pages/HomePage';
import CreateBookPage from './pages/CreateBookPage/CreateBookPage';
import MyBooksPage from './pages/MyBooksPage';
import PublicBooksPage from './pages/PublicBooksPage/PublicBooksPage';
import BookViewerPage from './pages/BookViewerPage';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <div className="website-book-container">
        <Header />
        
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create" element={<CreateBookPage />} />
            <Route path="/my-books" element={<MyBooksPage />} />
            <Route path="/public-books" element={<PublicBooksPage />} />
            <Route path="/book/:bookId" element={<BookViewerPage />} />
          </Routes>
        </main>
        
        <footer>
          <p>טיפ: עבור דפים מהמיכלול, אפשר להשתמש ישירות בכתובת הדף, לדוגמה: https://www.hamichlol.org.il/הר</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;