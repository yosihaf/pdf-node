// src/components/MediaWikiSearch.tsx - עם תיקון לחיפוש קטגוריות
import React, { useState, useEffect, useRef } from 'react';
import { UrlDataType } from '../../types';
import './MediaWikiSearch.css';

interface MediaWikiSearchProps {
  onPageSelect: (page: UrlDataType) => void;
  baseApiUrl: string;
  placeholder?: string;
  disabled?: boolean;
  enableCategoryFilter?: boolean;
  defaultCategory?: string;
  excludeCategories?: string[];
  restrictToCategories?: string[];
}

interface SearchResult {
  id: number;
  key: string;
  title: string;
  excerpt?: string;
  matched_title?: string;
  description?: string;
  thumbnail?: {
    mimetype: string;
    size: number;
    width: number;
    height: number;
    duration?: number;
    url: string;
  };
}

interface CategoryResult {
  category: string;
  pages: number;
}

interface SearchResponse {
  pages?: SearchResult[];
}

// פתרונות CORS פשוטים
const CORS_PROXIES = [
  '', // ישיר
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
];

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


  // פונקציה ליצירת URL לפתיחת דף בהמיכלול
  const getPageUrl = (pageTitle: string): string => {
    return `https://www.hamichlol.org.il/${encodeURIComponent(pageTitle)}`;
  };

  // פונקציה לבקשה עם ניסיונות CORS שונים
  const fetchWithCorsHandling = async (url: string): Promise<any> => {
    let lastError: Error | null = null;

    for (const proxy of CORS_PROXIES) {
      try {
        const finalUrl = proxy ? `${proxy}${encodeURIComponent(url)}` : url;
        console.log(`🔄 מנסה עם ${proxy ? 'proxy' : 'direct'}:`, finalUrl);

        const response = await fetch(finalUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          mode: 'cors',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ הצלחה עם ${proxy ? 'proxy' : 'direct'}`);
        return data;

      } catch (error) {
        console.warn(`❌ נכשל עם ${proxy ? 'proxy' : 'direct'}:`, error);
        lastError = error as Error;
        continue;
      }
    }

    throw lastError || new Error('כל ניסיונות ה-CORS נכשלו');
  };

  // חיפוש קטגוריות - תיקון מיוחד
  const searchCategories = async (query: string): Promise<CategoryResult[]> => {
    if (!query.trim() || query.length < 2) return [];

    try {
      console.log(`🏷️ מחפש קטגוריות: "${query}"`);
      
      // URL מתוקן לחיפוש קטגוריות במיכלול
      const categoryApiUrl = 'https://www.hamichlol.org.il/w/api.php';
      const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        list: 'allcategories',
        acprefix: query.trim(),
        aclimit: '10',
        acprop: 'size',
        origin: '*'
      });

      const fullUrl = `${categoryApiUrl}?${params.toString()}`;
      console.log('🔍 URL חיפוש קטגוריות:', fullUrl);

      const data = await fetchWithCorsHandling(fullUrl);
      console.log('📋 תשובת חיפוש קטגוריות:', data);

      if (data.query?.allcategories) {
        const categories = data.query.allcategories.map((cat: any) => ({
          category: cat['*'] || cat.category || cat.title || '',
          pages: cat.pages || cat.size || 0
        }));
        
        console.log(`✅ נמצאו ${categories.length} קטגוריות:`, categories);
        return categories;
      }

      console.log('⚠️ לא נמצאו קטגוריות בתשובה');
      return [];

    } catch (error) {
      console.error('❌ שגיאה בחיפוש קטגוריות:', error);
      return [];
    }
  };

  // פונקציה לקבלת דפים מקטגוריה - מתוקנת
  const getCategoryPages = async (
    categoryName: string,
    searchTerm?: string,
    limit: number = 20
  ): Promise<SearchResult[]> => {
    try {
      console.log(`📂 מחפש דפים בקטגוריה "${categoryName}"${searchTerm ? ` עם מונח "${searchTerm}"` : ''}`);
      
      const categoryApiUrl = 'https://www.hamichlol.org.il/w/api.php';
      const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        list: 'categorymembers',
        cmtitle: `קטגוריה:${categoryName}`,
        cmlimit: limit.toString(),
        cmprop: 'ids|title|timestamp',
        cmtype: 'page',
        cmsort: 'timestamp',
        cmdir: 'desc',
        origin: '*'
      });

      // אם יש חיפוש ספציפי
      if (searchTerm && searchTerm.trim()) {
        params.set('cmprefix', searchTerm.trim());
      }

      const fullUrl = `${categoryApiUrl}?${params.toString()}`;
      console.log('🔍 URL חיפוש בקטגוריה:', fullUrl);

      const data = await fetchWithCorsHandling(fullUrl);
      console.log('📋 תשובת חיפוש בקטגוריה:', data);

      if (data.query?.categorymembers) {
        let pages = data.query.categorymembers;

        // סינון נוסף אם יש מונח חיפוש
        if (searchTerm && searchTerm.trim()) {
          pages = pages.filter((page: any) => 
            page.title.toLowerCase().includes(searchTerm.trim().toLowerCase())
          );
        }

        const results = pages.map((page: any) => ({
          id: page.pageid || Math.random(),
          key: page.title,
          title: page.title,
          excerpt: `דף בקטגוריה: ${categoryName}`
        }));

        console.log(`✅ נמצאו ${results.length} דפים בקטגוריה`);
        return results;
      }

      console.log('⚠️ לא נמצאו דפים בקטגוריה');
      return [];

    } catch (error) {
      console.error('❌ שגיאה בקבלת דפי קטגוריה:', error);
      return [];
    }
  };

  // פונקציה לחיפוש דפים רגיל
  const searchPagesRegular = async (query: string): Promise<SearchResult[]> => {
    try {
      console.log(`🔍 חיפוש רגיל עבור "${query}"`);
      
      const searchUrl = baseApiUrl;
      const params = new URLSearchParams({
        q: query.trim(),
        limit: '10'
      });

      const fullUrl = `${searchUrl}?${params.toString()}`;
      console.log('🔍 URL חיפוש רגיל:', fullUrl);

      const data: SearchResponse = await fetchWithCorsHandling(fullUrl);
      console.log('📋 תשובת חיפוש רגיל:', data);

      return data.pages || [];

    } catch (error) {
      console.error('❌ שגיאה בחיפוש רגיל:', error);
      throw error;
    }
  };

  // פונקציה ראשית לחיפוש
  const searchPages = async (query: string, category?: string): Promise<SearchResult[]> => {
    if (!query.trim()) return [];

    try {
      let results: SearchResult[] = [];

      if (category && category.trim()) {
        // חיפוש בקטגוריה ספציפית
        results = await getCategoryPages(category, query);
      } else {
        // חיפוש רגיל
        results = await searchPagesRegular(query);
      }

      return results;
    } catch (error) {
      console.error('❌ שגיאה בחיפוש:', error);
      throw error;
    }
  };

  // טיפול בשינוי בשדה החיפוש
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedIndex(-1);
    setError(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

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
    setError(null);

    try {
      const results = await searchPages(query, selectedCategory);
      setSearchResults(results);
      
      if (results.length === 0) {
        setError(`לא נמצאו תוצאות עבור "${query}"${selectedCategory ? ` בקטגוריה "${selectedCategory}"` : ''}`);
      }
    } catch (error) {
      console.error('❌ שגיאה בחיפוש:', error);
      setSearchResults([]);
      setError(`שגיאה בחיפוש: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // טיפול בשינוי קטגוריה
  const handleCategoryChange = (category: string) => {
    console.log(`🏷️ שינוי קטגוריה ל: "${category}"`);
    setSelectedCategory(category);
    setShowCategoryDropdown(false);

    if (searchTerm.trim()) {
      performSearch(searchTerm.trim());
    }
  };

  // חיפוש קטגוריות עם debounce
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
      console.error('❌ שגיאה בחיפוש קטגוריות:', error);
      setAvailableCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // טיפול בבחירת דף
  const handlePageSelect = (result: SearchResult) => {
    const selectedPage: UrlDataType = {
      url: result.title,
      title: result.title
    };

    onPageSelect(selectedPage);
    setSearchTerm(result.title);
    setShowResults(false);
    setSelectedIndex(-1);
  };

  // טיפול במקלדת
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

  // סגירת תוצאות בלחיצה מחוץ
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

  // ניקוי debounce
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

                  {!loadingCategories && availableCategories.length === 0 && (
                    <div className="category-loading">
                      <span>לא נמצאו קטגוריות</span>
                    </div>
                  )}
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
              key={result.id || index}
              className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="result-content">
                <div className="result-image-container">
                  {result.thumbnail?.url ? (
                    <img
                      src={result.thumbnail.url}
                      alt={result.title}
                      className="result-image"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const placeholder = target.nextElementSibling as HTMLElement;
                        if (placeholder) {
                          placeholder.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    className="result-image-placeholder"
                    style={{ display: result.thumbnail?.url ? 'none' : 'flex' }}
                  >
                    <span className="placeholder-icon">📄</span>
                  </div>
                </div>

                <div className="result-text">
                  <div className="result-title">{result.title}</div>
                  {result.excerpt && (
                    <div
                      className="result-snippet"
                      dangerouslySetInnerHTML={{
                        __html: result.excerpt.replace(/<[^>]*>/g, '')
                      }}
                    />
                  )}
                  {result.description && (
                    <div className="result-snippet">
                      {result.description}
                    </div>
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
                  title="פתח בהמכלול"
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