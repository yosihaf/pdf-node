// src/config/config.ts - קובץ הגדרות מרכזי

export const config = {
  // הגדרות API
  api: {
    baseUrl: process.env.REACT_APP_API_URL || 'https://pdf.test.hamichlol.org.il/api',
    mediaWikiUrl: process.env.REACT_APP_API_URL_HAMICHLOL || 'https://www.hamichlol.org.il/w/api.php',
    hamichlolRestUrl: process.env.REACT_APP_HAMICHLOL_REST_URL || 'https://www.hamichlol.org.il/w/rest.php/v1/page',
  },
  
  // הגדרות מדיה ויקי
  mediaWiki: {
    // כתובת ה-API של המדיה ויקי שלך
    apiUrl: process.env.REACT_APP_API_URL_HAMICHLOL || 'https://www.hamichlol.org.il/w/api.php',
    
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
  console.log('🔧 Configuration loaded:', {
    apiBaseUrl: config.api.baseUrl,
    mediaWikiUrl: config.api.mediaWikiUrl,
    hamichlolRestUrl: config.api.hamichlolRestUrl,
    environment: process.env.NODE_ENV,
    
    // בדיקת משתני סביבה
    envVars: {
      REACT_APP_API_URL: process.env.REACT_APP_API_URL,
      REACT_APP_MEDIAWIKI_API_URL: process.env.REACT_APP_MEDIAWIKI_API_URL,
      REACT_APP_HAMICHLOL_REST_URL: process.env.REACT_APP_HAMICHLOL_REST_URL,
    }
  });
  
  if (!config.mediaWiki.apiUrl) {
    console.error('❌ MediaWiki API URL is not configured!');
    return false;
  }
  
  if (!config.api.baseUrl) {
    console.error('❌ API Base URL is not configured!');
    return false;
  }
  
  console.log('✅ Configuration is valid');
  return true;
};

// Export default config
export default config;