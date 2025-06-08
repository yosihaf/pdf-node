// src/config/config.ts - קובץ הגדרות מרכזי

export const config = {
  // הגדרות API
  api: {
    baseUrl: process.env.REACT_APP_API_URL || 'https://pdf.test.hamichlol.org.il/api',
    mediaWikiUrl: process.env.REACT_APP_API_URL_HAMICHLOL || 'https://www.hamichlol.org.il/w/api.php',
    hamichlolRestUrl: process.env.REACT_APP_HAMICHLOL_REST_URL || 'https://www.hamichlol.org.il/w/rest.php/v1/page',
    hamichlolSearchUrl: process.env.REACT_APP_HAMICHLOL_SEARCH_URL || 'https://www.hamichlol.org.il/w/rest.php/v1/search/title',
  },
  
  // הגדרות מדיה ויקי
  mediaWiki: {
    // כתובת ה-API של המדיה ויקי שלך (למשתמשים כלליים)
    apiUrl: process.env.REACT_APP_API_URL_HAMICHLOL || 'https://www.hamichlol.org.il/w/api.php',
    // כתובת API החיפוש החדש של המיכלול
    searchApiUrl: process.env.REACT_APP_HAMICHLOL_SEARCH_URL || 'https://www.hamichlol.org.il/w/rest.php/v1/search/title',
    
    // הגדרות חיפוש
    searchLimit: 10,
    minSearchLength: 2,
    
    // מגבלות קטגוריות
    categoryRestrictions: {
      // קטגוריות לא לכלול בחיפוש
      excludeCategories: [
        'פורנוגרפיה',
        'אלימות',
        'גזענות',
        'תוכן לא הולם',
        'קטגוריות למחיקה',
        'דפים למחיקה מהירה',
        'ערכים שנויים במחלוקת'
      ],
      
      // רק קטגוריות אלה מותרות (אם מוגדר - משאיר ריק לכל הקטגוריות)
      restrictToCategories: [
        // 'היסטוריה',
        // 'מדע וטכנולוגיה',
        // 'תרבות',
        // 'ביוגרפיות',
        // 'גיאוגרפיה'
      ]
    }
  },
  
  // הגדרות כלליות
  app: {
    name: 'יצירת ספר PDF',
    version: '1.0.0',
  }
};

// פונקציה לבדיקת ההגדרות
export const validateConfig = (): boolean => {
  
  if (!config.mediaWiki.searchApiUrl) {
    return false;
  }
  
  if (!config.mediaWiki.apiUrl) {
    return false;
  }
  
  if (!config.api.baseUrl) {
    return false;
  }
  
  return true;
};

// Export default config
export default config;