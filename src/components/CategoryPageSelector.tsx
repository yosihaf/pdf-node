// src/components/CategoryPageSelector.tsx
import React, { useState, useEffect } from 'react';
import { UrlDataType } from '../types';
import '../styles/CategoryPageSelector.css';

interface CategoryPage {
  pageid: number;
  title: string;
  snippet?: string;
  timestamp?: string;
  selected: boolean;
}

interface CategoryPageSelectorProps {
  baseApiUrl: string;
  onPagesSelected: (pages: UrlDataType[]) => void;
  disabled?: boolean;
}

const CategoryPageSelector: React.FC<CategoryPageSelectorProps> = ({
  baseApiUrl,
  onPagesSelected,
  disabled = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categoryPages, setCategoryPages] = useState<CategoryPage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState<boolean>(false);

  // חיפוש קטגוריות
  const searchCategories = async (query: string): Promise<string[]> => {
    if (!query.trim() || query.length < 2) return [];

    try {
      const searchUrl = new URL(baseApiUrl);
      searchUrl.searchParams.set('action', 'query');
      searchUrl.searchParams.set('format', 'json');
      searchUrl.searchParams.set('list', 'allcategories');
      searchUrl.searchParams.set('acprefix', query);
      searchUrl.searchParams.set('aclimit', '10');
      searchUrl.searchParams.set('origin', '*');

      const response = await fetch(searchUrl.toString());
      const data = await response.json();

      if (data.query?.allcategories) {
        return data.query.allcategories.map((cat: any) => cat['*']);
      }
      return [];
    } catch (error) {
      console.error('שגיאה בחיפוש קטגוריות:', error);
      return [];
    }
  };

  // טעינת כל הדפים מקטגוריה
  const loadCategoryPages = async (categoryName: string): Promise<CategoryPage[]> => {
    if (!categoryName.trim()) return [];

    try {
      setIsLoading(true);
      setError(null);

      const pages: CategoryPage[] = [];
      let continueToken: string | undefined;

      // טוען את כל הדפים (עם pagination)
      do {
        const apiUrl = new URL(baseApiUrl);
        apiUrl.searchParams.set('action', 'query');
        apiUrl.searchParams.set('format', 'json');
        apiUrl.searchParams.set('list', 'categorymembers');
        apiUrl.searchParams.set('cmtitle', `קטגוריה:${categoryName}`);
        apiUrl.searchParams.set('cmlimit', '50');
        apiUrl.searchParams.set('cmprop', 'ids|title|timestamp');
        apiUrl.searchParams.set('cmtype', 'page'); // רק דפים, לא תת-קטגוריות
        apiUrl.searchParams.set('origin', '*');

        if (continueToken) {
          apiUrl.searchParams.set('cmcontinue', continueToken);
        }

        console.log('טוען דפים מקטגוריה:', apiUrl.toString());

        const response = await fetch(apiUrl.toString());
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.query?.categorymembers) {
          const categoryMembers = data.query.categorymembers.map((page: any) => ({
            pageid: page.pageid,
            title: page.title,
            timestamp: page.timestamp,
            selected: false // ברירת מחדל - לא נבחר
          }));

          pages.push(...categoryMembers);
        }

        // בדיקה אם יש עוד דפים
        continueToken = data.continue?.cmcontinue;

      } while (continueToken);

      console.log(`נטענו ${pages.length} דפים מהקטגוריה "${categoryName}"`);
      return pages;

    } catch (error) {
      console.error('שגיאה בטעינת דפי קטגוריה:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // טיפול בבחירת קטגוריה
  const handleCategorySelect = async (categoryName: string) => {
    setSelectedCategory(categoryName);
    setShowCategorySuggestions(false);

    try {
      const pages = await loadCategoryPages(categoryName);
      setCategoryPages(pages);
    } catch (error) {
      setError(`שגיאה בטעינת דפי הקטגוריה: ${error}`);
      setCategoryPages([]);
    }
  };

  // טיפול בשינוי בשדה החיפוש
  const handleCategorySearchChange = async (value: string) => {
    setSearchTerm(value);
    
    if (value.length >= 2) {
      const categories = await searchCategories(value);
      setAvailableCategories(categories);
      setShowCategorySuggestions(true);
    } else {
      setAvailableCategories([]);
      setShowCategorySuggestions(false);
    }
  };

  // טיפול בסימון/ביטול סימון דף בודד
  const togglePageSelection = (pageId: number) => {
    setCategoryPages(prev => 
      prev.map(page => 
        page.pageid === pageId 
          ? { ...page, selected: !page.selected }
          : page
      )
    );
  };

  // בחירת כל הדפים
  const selectAllPages = () => {
    setCategoryPages(prev => 
      prev.map(page => ({ ...page, selected: true }))
    );
  };

  // ביטול בחירת כל הדפים
  const deselectAllPages = () => {
    setCategoryPages(prev => 
      prev.map(page => ({ ...page, selected: false }))
    );
  };

  // שליחת הדפים הנבחרים
  const handleSubmitSelectedPages = () => {
    const selectedPages: UrlDataType[] = categoryPages
      .filter(page => page.selected)
      .map(page => ({
        url: page.title,
        title: page.title
      }));

    onPagesSelected(selectedPages);
  };

  // סינון דפים לפי חיפוש
  const filteredPages = categoryPages.filter(page =>
    page.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCount = categoryPages.filter(page => page.selected).length;

  return (
    <div className="category-page-selector">
      <h3>בחירת דפים מקטגוריה</h3>
      
      {/* בחירת קטגוריה */}
      <div className="category-search-container">
        <label htmlFor="category-search">חפש קטגוריה:</label>
        <div className="category-input-wrapper">
          <input
            id="category-search"
            type="text"
            value={searchTerm}
            onChange={(e) => handleCategorySearchChange(e.target.value)}
            placeholder="הקלד שם קטגוריה..."
            disabled={disabled}
            className="category-search-input"
          />
          
          {showCategorySuggestions && availableCategories.length > 0 && (
            <div className="category-suggestions">
              {availableCategories.map((category, index) => (
                <button
                  key={index}
                  type="button"
                  className="category-suggestion"
                  onClick={() => handleCategorySelect(category)}
                  disabled={disabled}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* הצגת קטגוריה נבחרת */}
      {selectedCategory && (
        <div className="selected-category-info">
          <h4>קטגוריה נבחרת: {selectedCategory}</h4>
          <p>נמצאו {categoryPages.length} דפים</p>
        </div>
      )}

      {/* טעינה */}
      {isLoading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>טוען דפים מהקטגוריה...</p>
        </div>
      )}

      {/* שגיאה */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {/* רשימת דפים */}
      {categoryPages.length > 0 && (
        <div className="pages-list-container">
          {/* כפתורי פעולה */}
          <div className="pages-actions">
            <div className="selection-info">
              נבחרו {selectedCount} מתוך {categoryPages.length} דפים
            </div>
            <div className="action-buttons">
              <button
                type="button"
                onClick={selectAllPages}
                disabled={disabled}
                className="select-all-btn"
              >
                בחר הכל
              </button>
              <button
                type="button"
                onClick={deselectAllPages}
                disabled={disabled}
                className="deselect-all-btn"
              >
                בטל הכל
              </button>
            </div>
          </div>

          {/* חיפוש בתוך הדפים */}
          <div className="pages-filter">
            <input
              type="text"
              placeholder="חפש בתוך הדפים..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={disabled}
              className="pages-filter-input"
            />
          </div>

          {/* רשימת הדפים */}
          <div className="pages-list">
            {filteredPages.map((page) => (
              <div key={page.pageid} className="page-item">
                <label className="page-checkbox-label">
                  <input
                    type="checkbox"
                    checked={page.selected}
                    onChange={() => togglePageSelection(page.pageid)}
                    disabled={disabled}
                    className="page-checkbox"
                  />
                  <span className="page-title">{page.title}</span>
                  {page.timestamp && (
                    <span className="page-timestamp">
                      ({new Date(page.timestamp).toLocaleDateString('he-IL')})
                    </span>
                  )}
                </label>
              </div>
            ))}
          </div>

          {/* כפתור שליחה */}
          <div className="submit-section">
            <button
              type="button"
              onClick={handleSubmitSelectedPages}
              disabled={disabled || selectedCount === 0}
              className="submit-selected-btn"
            >
              הוסף {selectedCount} דפים נבחרים לספר
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryPageSelector;