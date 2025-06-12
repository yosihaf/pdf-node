
// src/components/UrlInput.tsx - גרסה מלאה עם 3 מצבים
import React, { useState, ChangeEvent } from 'react';
import { UrlDataType } from '../../types';
import MediaWikiSearch from '../MediaWikiSearch';
import CategoryPageSelector from '../CategoryPageSelector';
import config, { validateConfig } from '../../config/config';
import './UrlInput.css';

interface UrlInputProps {
  onSubmit: (urlsList: UrlDataType[]) => void;
  isLoading: boolean;
}

const UrlInput: React.FC<UrlInputProps> = ({ onSubmit, isLoading }) => {
  const [urls, setUrls] = useState<string>('');
  const [selectedPages, setSelectedPages] = useState<UrlDataType[]>([]);
  const [inputMode, setInputMode] = useState<'search' | 'category' | 'manual'>('search');

  // בדיקת הגדרות
  React.useEffect(() => {
    validateConfig();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setUrls(e.target.value);
  };


  const handlePageSelect = (page: UrlDataType): void => {
    // בדיקה אם הדף כבר נוסף
    const isAlreadyAdded = selectedPages.some(p => p.url === page.url);
    
    if (!isAlreadyAdded) {
      setSelectedPages(prev => [...prev, page]);
    }
  };

  const handleCategoryPagesSelect = (pages: UrlDataType[]): void => {
    // הוספת דפים מקטגוריה (רק דפים שלא קיימים כבר)
    const uniquePages = pages.filter(newPage => 
      !selectedPages.some(existingPage => existingPage.url === newPage.url)
    );
    
    setSelectedPages(prev => [...prev, ...uniquePages]);
  };

  const handleRemovePage = (indexToRemove: number): void => {
    setSelectedPages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmitFromSearch = (): void => {
    if (selectedPages.length === 0) return;
    onSubmit(selectedPages);
  };

  const handleSubmitFromCategory = (): void => {
    if (selectedPages.length === 0) return;
    onSubmit(selectedPages);
  };

  const handleSubmitFromManual = (): void => {
    if (!urls.trim()) return;

    const urlsList: UrlDataType[] = urls.split('\n')
      .filter(url => url.trim())
      .map(url => {
        const parts = url.split('|');
        return {
          url: parts[0].trim(),
          title: parts.length > 1 ? parts[1].trim() : ''
        };
      });

    onSubmit(urlsList);
  };


  const handleSubmit = (): void => {
    if (inputMode === 'search' || inputMode === 'category') {
      if (inputMode === 'search') {
        handleSubmitFromSearch();
      } else {
        handleSubmitFromCategory();
      }
    } else {
      handleSubmitFromManual();
    }
  };

  const canSubmit = (inputMode === 'search' || inputMode === 'category')
    ? selectedPages.length > 0 
    : urls.trim() !== '';

  return (
    <div className="url-input">
      <h2>הוספת דפים לספר</h2>
      
      {/* בחירת מצב קלט */}
      <div className="input-mode-selector">
        <button
          type="button"
          className={`mode-button ${inputMode === 'search' ? 'active' : ''}`}
          onClick={() => setInputMode('search')}
          disabled={isLoading}
        >
          חיפוש דפים
        </button>
        <button
          type="button"
          className={`mode-button ${inputMode === 'category' ? 'active' : ''}`}
          onClick={() => setInputMode('category')}
          disabled={isLoading}
        >
          קטגוריה שלמה
        </button>
      </div>

      {inputMode === 'search' ? (
        /* מצב חיפוש */
        <div className="search-mode">
          <p className="mode-description">
            חפש והוסף דפים בודדים מהמדיה ויקי שלך. רק דפים קיימים יוצגו בתוצאות החיפוש.
          </p>
          
          <MediaWikiSearch
            onPageSelect={handlePageSelect}
            baseApiUrl={config.mediaWiki.searchApiUrl}
            placeholder="הקלד לחיפוש דפים..."
            disabled={isLoading}
            enableCategoryFilter={true}
            defaultCategory=""
            excludeCategories={config.mediaWiki.categoryRestrictions.excludeCategories}
            restrictToCategories={config.mediaWiki.categoryRestrictions.restrictToCategories}
          />

          {/* רשימת הדפים שנבחרו */}
          {selectedPages.length > 0 && (
            <div className="selected-pages">
              <h3>דפים שנבחרו ({selectedPages.length}):</h3>
              <div className="selected-pages-list">
                {selectedPages.map((page, index) => (
                  <div key={index} className="selected-page-item">
                    <span className="page-title">{page.title}</span>
                    <button
                      type="button"
                      className="remove-page-button"
                      onClick={() => handleRemovePage(index)}
                      disabled={isLoading}
                      aria-label={`הסר את הדף "${page.title}"`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : inputMode === 'category' ? (
        /* מצב קטגוריה שלמה */
        <div className="category-mode">
          <p className="mode-description">
            בחר קטגוריה שלמה וסמן/בטל סימון דפים מתוכה. מושלם ליצירת ספרים בנושא מסוים.
          </p>
          
          <CategoryPageSelector
            baseApiUrl={config.mediaWiki.apiUrl}
            onPagesSelected={handleCategoryPagesSelect}
            disabled={isLoading}
          />

          {/* רשימת הדפים שנבחרו */}
          {selectedPages.length > 0 && (
            <div className="selected-pages">
              <h3>דפים שנבחרו מקטגוריות ({selectedPages.length}):</h3>
              <div className="selected-pages-list">
                {selectedPages.map((page, index) => (
                  <div key={index} className="selected-page-item">
                    <span className="page-title">{page.title}</span>
                    <button
                      type="button"
                      className="remove-page-button"
                      onClick={() => handleRemovePage(index)}
                      disabled={isLoading}
                      aria-label={`הסר את הדף "${page.title}"`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* מצב הזנה ידנית */
        <div className="manual-mode">
          <p className="mode-description">
            הכנס כל כתובת URL בשורה נפרדת. אם תרצה להגדיר כותרת מותאמת לדף, הוסף | ואחריו את הכותרת.
            <br />
            לדוגמה: <code>https://example.com/page1 | הכותרת המותאמת לדף 1</code>
          </p>

          <textarea
            value={urls}
            onChange={handleChange}
            rows={10}
            placeholder="https://example.com/page1 | כותרת דף 1&#10;https://example.com/page2 | כותרת דף 2"
            dir="rtl"
            disabled={isLoading}
          />
        </div>
      )}

      {/* כפתור שליחה */}
      <button
        onClick={handleSubmit}
        disabled={isLoading || !canSubmit}
        className="submit-button"
      >
        {isLoading ? 'טוען דפים...' : 
         (inputMode === 'search' || inputMode === 'category')
           ? `צור ספר מ-${selectedPages.length} דפים` 
           : 'טען את כל הדפים'}
      </button>

      {/* הוראות שימוש */}
      <div className="usage-tips">
        <h4>טיפים לשימוש:</h4>
        <ul>
          <li>
            <strong>חיפוש דפים:</strong> הקלד לפחות 2 תווים כדי להתחיל לחפש. 
            השתמש בחצים למעלה/מטה ו-Enter לבחירה. מתאים לבחירת דפים ספציפיים.
          </li>
          <li>
            <strong>קטגוריה שלמה:</strong> בחר קטגוריה וקבל רשימה של כל הדפים בה. 
            אתה יכול לסמן/לבטל סימון דפים לפי צרכיך. מושלם ליצירת ספרים בנושא מסוים.
          </li>
          <li>
            <strong>הזנה ידנית:</strong> מתאים לכתובות URL חיצוניות או כאשר אתה יודע בדיוק את השמות.
          </li>
          <li>
            עבור דפים מהמכלול, אפשר להשתמש ישירות בשם הדף, לדוגמה: "הר" או "ישראל".
          </li>
        </ul>
      </div>
    </div>
  );
};

export default UrlInput;