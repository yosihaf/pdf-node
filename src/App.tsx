import React, { useState } from 'react';
import BookSettings from './components/BookSettings';
import UrlInput from './components/UrlInput';
import PagePreview from './components/PagePreview';
import PdfDownload from './components/PdfDownload';
import { fetchPageContent } from './services/hamichlolService';
import './App.css';
import { BookSettingsType, PageType, UrlDataType } from './types';

const App: React.FC = () => {
  const [pages, setPages] = useState<PageType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [bookSettings, setBookSettings] = useState<BookSettingsType>({
    title: 'הספר שלי',
    subtitle: 'אוסף דפים מהאתר',
    author: '',
  });
  const [isReady, setIsReady] = useState<boolean>(false);

  const handleSettingsChange = (newSettings: Partial<BookSettingsType>): void => {
    setBookSettings({ ...bookSettings, ...newSettings });
  };

  const addAllPages = async (urlsList: UrlDataType[]): Promise<void> => {
    setLoading(true);
    setError(null);
    setPages([]);
    const results: PageType[] = [];

    try {
      for (const urlData of urlsList) {
        try {


          const pageContent = await fetchPageContent(urlData.url);

          console.log(pageContent);
          results.push({
            title: urlData.title || pageContent.title,
            content: pageContent.content[0].innerHTML,
            url: urlData.url
          });
        } catch (error) {
          console.error(`שגיאה בטעינת ${urlData.url}:`, error);
          // ממשיך לדף הבא למרות השגיאה
        }
      }

      if (results.length === 0) {
        setError('לא הצלחנו לטעון אף דף. בדוק את הכתובות וודא שיש לך גישה לאינטרנט.');
      } else {
        setPages(results);
        setIsReady(true);
      }
    } catch (error) {
      console.error('שגיאה בטעינת הדפים:', error);
      setError('אירעה שגיאה בתהליך טעינת הדפים. אנא נסה שוב מאוחר יותר.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="website-book-container">
      <header>
        <h1>יצירת ספר PDF מדפי האתר</h1>
        <p className="subtitle">כולל תמיכה מיוחדת באתר המיכלול!</p>
      </header>

      <main>
        <BookSettings
          settings={bookSettings}
          onSettingsChange={handleSettingsChange}
        />

        <UrlInput
          onSubmit={addAllPages}
          isLoading={loading}
        />

        {loading && (
          <div className="loading-indicator">
            <p>טוען דפים... אנא המתן</p>
            <div className="spinner"></div>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {pages.length > 0 && (
          <PagePreview pages={pages} />
        )}

        {isReady && pages.length > 0 && (
          <PdfDownload
            pages={pages}
            bookSettings={bookSettings}
          />
        )}
      </main>

      <footer>
        <p>טיפ: עבור דפים מהמיכלול, אפשר להשתמש ישירות בכתובת הדף, לדוגמה: https://www.hamichlol.org.il/הר</p>
      </footer>
    </div>
  );
};

export default App;