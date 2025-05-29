// src/components/MediaWikiSearch.tsx
import React, { useState, useEffect, useRef } from 'react';
import { UrlDataType } from '../../types';
import './MediaWikiSearch.css';

interface MediaWikiSearchProps {
  onPageSelect: (page: UrlDataType) => void;
  baseApiUrl: string; // URL לAPI של המדיה ויקי שלך
  placeholder?: string;
  disabled?: boolean;
  enableCategoryFilter?: boolean; // האם להציג סינון קטגוריות
  defaultCategory?: string; // קטגוריה ברירת מחדל
  excludeCategories?: string[]; // קטגוריות לא לכלול בחיפוש
  restrictToCategories?: string[]; // רק קטגוריות אלה מותרות (אם מוגדר)
}

interface SearchResult {
  pageid: number;
  title: string;
  snippet?: string;
  categoryinfo?: {
    categories?: string[];
  };
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  pageimage?: string;
}

interface CategoryResult {
  category: string;
  pages: number;
}

interface SearchResponse {
  query?: {
    search?: SearchResult[];
    categorymembers?: Array<{
      pageid: number;
      title: string;
    }>;
  };
}

const MediaWikiSearch: React.FC<MediaWikiSearchProps> = ({
  onPageSelect,
  baseApiUrl,
  placeholder = "חפש דפים במדיה ויקי...",
  disabled = false,
  enableCategoryFilter = true,
  defaultCategory = "",
  excludeCategories = [],
  restrictToCategories = []
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [error, setError] = useState<string | null>(null);

  // מצב סינון קטגוריות
  const [selectedCategory, setSelectedCategory] = useState<string>(defaultCategory);
  const [availableCategories, setAvailableCategories] = useState<CategoryResult[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<boolean>(false);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // פונקציה לקבלת תמונות עבור תוצאות חיפוש
  const getPageImages = async (pageIds: number[]): Promise<Record<number, any>> => {
    if (pageIds.length === 0) return {};

    try {
      const imageUrl = new URL(baseApiUrl);
      imageUrl.searchParams.set('action', 'query');
      imageUrl.searchParams.set('format', 'json');
      imageUrl.searchParams.set('pageids', pageIds.join('|'));
      imageUrl.searchParams.set('prop', 'pageimages|pageterms');
      imageUrl.searchParams.set('piprop', 'thumbnail');
      imageUrl.searchParams.set('pithumbsize', '150');
      imageUrl.searchParams.set('pilimit', pageIds.length.toString());
      imageUrl.searchParams.set('wbptterms', 'description');
      imageUrl.searchParams.set('origin', '*');

      console.log('🖼️ מבקש תמונות:', imageUrl.toString());

      const response = await fetch(imageUrl.toString());
      if (!response.ok) return {};

      const data = await response.json();
      return data.query?.pages || {};
    } catch (error) {
      console.error('שגיאה בקבלת תמונות:', error);
      return {};
    }
  };

  // פונקציה ליצירת URL לפתיחת דף בהמיכלול
  const getPageUrl = (pageTitle: string): string => {
    const baseUrl = baseApiUrl.replace('/w/api.php', '');
    return `${baseUrl}/${encodeURIComponent(pageTitle)}`;
  };
  const getPageCategories = async (pageTitle: string): Promise<string[]> => {
    try {
      const categoryUrl = new URL(baseApiUrl);
      categoryUrl.searchParams.set('action', 'query');
      categoryUrl.searchParams.set('format', 'json');
      categoryUrl.searchParams.set('titles', pageTitle);
      categoryUrl.searchParams.set('prop', 'categories');
      categoryUrl.searchParams.set('cllimit', '50');
      categoryUrl.searchParams.set('origin', '*');

      const response = await fetch(categoryUrl.toString());
      if (!response.ok) return [];

      const data = await response.json();
      const pages = data.query?.pages;

      if (!pages) return [];

      const pageData = Object.values(pages)[0] as any;
      if (!pageData?.categories) return [];

      return pageData.categories.map((cat: any) =>
        cat.title.replace('קטגוריה:', '').trim()
      );
    } catch (error) {
      console.error('שגיאה בקבלת קטגוריות עבור דף:', pageTitle, error);
      return [];
    }
  };

  // פונקציה לסינון תוצאות לפי קטגוריות
  const filterResultsByCategories = async (results: SearchResult[]): Promise<SearchResult[]> => {
    if (excludeCategories.length === 0 && restrictToCategories.length === 0) {
      return results; // אין סינון נדרש
    }

    const filteredResults: SearchResult[] = [];

    for (const result of results) {
      const pageCategories = await getPageCategories(result.title);

      // בדיקת קטגוריות אסורות
      const hasExcludedCategory = excludeCategories.some(excludeCat =>
        pageCategories.some(pageCat =>
          pageCat.toLowerCase().includes(excludeCat.toLowerCase()) ||
          excludeCat.toLowerCase().includes(pageCat.toLowerCase())
        )
      );

      if (hasExcludedCategory) {
        console.log(`דף "${result.title}" נחסם בגלל קטגוריה אסורה:`, pageCategories);
        continue; // דלג על דף זה
      }

      // בדיקת הגבלה לקטגוריות מסוימות
      if (restrictToCategories.length > 0) {
        const hasAllowedCategory = restrictToCategories.some(allowedCat =>
          pageCategories.some(pageCat =>
            pageCat.toLowerCase().includes(allowedCat.toLowerCase()) ||
            allowedCat.toLowerCase().includes(pageCat.toLowerCase())
          )
        );

        if (!hasAllowedCategory) {
          console.log(`דף "${result.title}" נחסם כי אין לו קטגוריה מותרת:`, pageCategories);
          continue; // דלג על דף זה
        }
      }

      filteredResults.push(result);
    }

    return filteredResults;
  };
  const searchCategories = async (query: string): Promise<CategoryResult[]> => {
    if (!query.trim()) return [];

    try {
      const searchUrl = new URL(baseApiUrl);
      searchUrl.searchParams.set('action', 'query');
      searchUrl.searchParams.set('format', 'json');
      searchUrl.searchParams.set('list', 'allcategories');
      searchUrl.searchParams.set('acprefix', query);
      searchUrl.searchParams.set('aclimit', '10');
      searchUrl.searchParams.set('acprop', 'size');
      searchUrl.searchParams.set('origin', '*');

      const response = await fetch(searchUrl.toString());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.query?.allcategories) {
        return data.query.allcategories.map((cat: any) => ({
          category: cat.category?.replace('קטגוריה:', '') || cat['*'],
          pages: cat.pages || 0
        }));
      }

      return [];
    } catch (error) {
      console.error('שגיאה בחיפוש קטגוריות:', error);
      return [];
    }
  };

  // פונקציה לחיפוש דפים במדיה ויקי עם סינון קטגוריה
  const searchPages = async (query: string, category?: string): Promise<SearchResult[]> => {
    if (!query.trim()) return [];

    try {
      let searchUrl = new URL(baseApiUrl);
      let results: SearchResult[] = [];

      if (category && category.trim()) {
        // חיפוש בקטגוריה ספציפית
        searchUrl.searchParams.set('action', 'query');
        searchUrl.searchParams.set('format', 'json');
        searchUrl.searchParams.set('list', 'categorymembers');
        searchUrl.searchParams.set('cmtitle', `קטגוריה:${category}`);
        searchUrl.searchParams.set('cmlimit', '20');
        searchUrl.searchParams.set('cmsort', 'timestamp');
        searchUrl.searchParams.set('cmdir', 'desc');
        searchUrl.searchParams.set('origin', '*');

        // הוספת חיפוש טקסט בתוך הקטגוריה
        if (query.trim()) {
          searchUrl.searchParams.set('cmprefix', query);
        }
      } else {
        // חיפוש רגיל
        searchUrl.searchParams.set('action', 'query');
        searchUrl.searchParams.set('format', 'json');
        searchUrl.searchParams.set('list', 'search');
        searchUrl.searchParams.set('srsearch', query);
        searchUrl.searchParams.set('srlimit', '15'); // מגדילים כי נסנן אחר כך
        searchUrl.searchParams.set('srprop', 'snippet');
        searchUrl.searchParams.set('origin', '*');
      }

      console.log('חיפוש במדיה ויקי:', searchUrl.toString());

      const response = await fetch(searchUrl.toString());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SearchResponse = await response.json();

      if (category && data.query?.categorymembers) {
        // המרת תוצאות קטגוריה לפורמט אחיד
        results = data.query.categorymembers
          .filter(page => page.title.toLowerCase().includes(query.toLowerCase()))
          .map(page => ({
            pageid: page.pageid,
            title: page.title,
            snippet: `דף בקטגוריה: ${category}`
          }));
      } else {
        results = data.query?.search || [];
      }

      // סינון לפי קטגוריות אסורות/מותרות
      if (excludeCategories.length > 0 || restrictToCategories.length > 0) {
        console.log('מסנן תוצאות לפי קטגוריות...', {
          exclude: excludeCategories,
          restrict: restrictToCategories,
          originalCount: results.length
        });

        results = await filterResultsByCategories(results);

        console.log(`נותרו ${results.length} תוצאות אחרי סינון`);
      }

      return results;
    } catch (error) {
      console.error('שגיאה בחיפוש במדיה ויקי:', error);
      setError('שגיאה בחיפוש. אנא נסה שוב.');
      return [];
    }
  };

  // טיפול בשינוי בשדה החיפוש
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedIndex(-1);
    setError(null);

    // ביטול חיפוש קודם
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // חיפוש עם debounce
    debounceRef.current = setTimeout(() => {
      if (value.trim().length >= 2) {
        performSearch(value.trim());
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);
  };

  // ביצוע החיפוש
  const performSearch = async (query: string) => {
    setIsLoading(true);
    setShowResults(true);

    try {
      const results = await searchPages(query, selectedCategory);
      setSearchResults(results);
    } catch (error) {
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // טיפול בשינוי קטגוריה
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setShowCategoryDropdown(false);

    // אם יש טקסט חיפוש, חפש מחדש עם הקטגוריה החדשה
    if (searchTerm.trim()) {
      performSearch(searchTerm.trim());
    }
  };

  // חיפוש קטגוריות כשהמשתמש מתחיל לטפס
  const searchCategoriesDebounced = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setAvailableCategories([]);
      return;
    }

    setLoadingCategories(true);
    try {
      const categories = await searchCategories(query);
      setAvailableCategories(categories);
    } catch (error) {
      setAvailableCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // טיפול בבחירת דף
  const handlePageSelect = (result: SearchResult) => {
    const selectedPage: UrlDataType = {
      url: result.title, // נשלח את שם הדף כ-URL
      title: result.title
    };

    onPageSelect(selectedPage);
    setSearchTerm(result.title);
    setShowResults(false);
    setSelectedIndex(-1);
  };

  // טיפול במקלדת (חצים ו-Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showResults || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          handlePageSelect(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // סגירת התוצאות בלחיצה מחוץ לקומפוננטה
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        resultsRef.current &&
        !resultsRef.current.contains(target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(target) &&
        categoryRef.current &&
        !categoryRef.current.contains(target)
      ) {
        setShowResults(false);
        setShowCategoryDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ניקוי debounce בביטול הקומפוננטה
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="mediawiki-search">
      {/* סינון קטגוריות */}
      {enableCategoryFilter && (
        <div className="category-filter" ref={categoryRef}>
          <label htmlFor="category-select">סינון לפי קטגוריה:</label>
          <div className="category-selector">
            <button
              type="button"
              className="category-button"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              disabled={disabled}
            >
              {selectedCategory || 'כל הקטגוריות'}
              <span className="dropdown-arrow">▼</span>
            </button>

            {showCategoryDropdown && (
              <div className="category-dropdown">
                <input
                  type="text"
                  placeholder="חפש קטגוריה..."
                  className="category-search"
                  onChange={(e) => searchCategoriesDebounced(e.target.value)}
                  disabled={disabled}
                />

                <div className="category-options">
                  <button
                    type="button"
                    className={`category-option ${!selectedCategory ? 'selected' : ''}`}
                    onClick={() => handleCategoryChange('')}
                  >
                    כל הקטגוריות
                  </button>

                  {loadingCategories && (
                    <div className="category-loading">
                      <span>טוען קטגוריות...</span>
                    </div>
                  )}

                  {availableCategories.map((cat, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`category-option ${selectedCategory === cat.category ? 'selected' : ''}`}
                      onClick={() => handleCategoryChange(cat.category)}
                    >
                      {cat.category}
                      {cat.pages > 0 && (
                        <span className="category-count">({cat.pages})</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="search-input-container">
        <input
          ref={searchInputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchResults.length > 0) {
              setShowResults(true);
            }
          }}
          placeholder={selectedCategory
            ? `${placeholder} בקטגוריה: ${selectedCategory}`
            : placeholder
          }
          disabled={disabled}
          className="search-input"
        />

        {isLoading && (
          <div className="search-spinner">
            <div className="spinner-small"></div>
          </div>
        )}
      </div>

      {/* הצגת הקטגוריה הנבחרת */}
      {selectedCategory && (
        <div className="selected-category-indicator">
          <span>מחפש בקטגוריה: <strong>{selectedCategory}</strong></span>
          <button
            type="button"
            className="clear-category"
            onClick={() => handleCategoryChange('')}
            disabled={disabled}
          >
            ✕
          </button>
        </div>
      )}

 

      {showResults && (
        <div ref={resultsRef} className="search-results">
          {error && (
            <div className="search-error">
              <span>{error}</span>
            </div>
          )}

          {!error && searchResults.length === 0 && !isLoading && (
            <div className="no-results">
              <div className="no-results-content">
                <h4>לא נמצאו תוצאות עבור "{searchTerm}"</h4>
                {selectedCategory && <p>בקטגוריה "{selectedCategory}"</p>}

                <div className="search-suggestions">
                  <h5>הצעות לשיפור החיפוש:</h5>
                  <ul>
                    <li>בדוק איות וכתיב המילים</li>
                    <li>נסה מילים כלליות יותר</li>
                    <li>הסר את סינון הקטגוריה</li>
                    <li>חפש באנגלית אם השם המקורי באנגלית</li>
                  </ul>
                </div>

                <div className="search-examples">
                  <h5>דוגמאות לחיפוש:</h5>
                  <div className="example-buttons">
                    {['ישראל', 'מדע', 'היסטוריה', 'ירושלים', 'תרבות'].map(example => (
                      <button
                        key={example}
                        type="button"
                        className="example-search-btn"
                        onClick={() => {
                          setSearchTerm(example);
                          performSearch(example);
                        }}
                        disabled={isLoading}
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!error && searchResults.map((result, index) => (
            <div
              key={result.pageid}
              className={`search-result-item ${index === selectedIndex ? 'selected' : ''
                }`}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="result-content">
                <div className="result-image-container">
                  {result.thumbnail ? (
                    <img
                      src={result.thumbnail.source}
                      alt={result.title}
                      className="result-image"
                      loading="lazy"
                    />
                  ) : (
                    <div className="result-image-placeholder">
                      <span className="placeholder-icon">📄</span>
                    </div>
                  )}
                </div>

                <div className="result-text">
                  <div className="result-title">{result.title}</div>
                  {result.snippet && (
                    <div
                      className="result-snippet"
                      dangerouslySetInnerHTML={{
                        __html: result.snippet.replace(/<[^>]*>/g, '')
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="result-actions">
                <button
                  type="button"
                  className="action-btn add-btn"
                  onClick={() => handlePageSelect(result)}
                  title="הוסף לספר"
                >
                  ➕
                </button>
                <a
                  href={getPageUrl(result.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="action-btn view-btn"
                  title="פתח בהמיכלול"
                  onClick={(e) => e.stopPropagation()}
                >
                  🔗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaWikiSearch;