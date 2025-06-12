// src/services/apiService.ts - עם תמיכה באימות
import axios from 'axios';
import { BookSettingsType, UrlDataType, BookResponse } from '../types';

// כתובת ה-API שלך
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://pdf.test.hamichlol.org.il/api';
const urlRestHamichlol = process.env.REACT_APP_API_REST_URL_HAMICHLOL || 'https://dev.hamichlol.org.il/w/rest.php/v1/page';

console.log('🔧 API Configuration:', {
  API_BASE_URL,
  urlRestHamichlol
});

// פונקציה לקבלת טוקן האימות
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// פונכיה לקבלת headers עם אימות
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// יירוט בקשות לטיפול באימות
axios.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// יירוט תגובות לטיפול בשגיאות אימות
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // טוקן לא תקף - מחיקה מהאחסון ורענון הדף
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');

      // הפניה לדף התחברות
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }

      return Promise.reject(new Error('נדרשת התחברות מחדש'));
    }
    return Promise.reject(error);
  }
);

/**
 * שליחת בקשה ליצירת ספר מרשימת דפים (עם אימות)
 */
export const createBookFromPages = async (
  urlsList: UrlDataType[],
  bookSettings: BookSettingsType,
  onStatusUpdate?: (status: string | null, message?: string | null) => void
): Promise<BookResponse> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('נדרש אימות למערכת');
    }

    const requestData = {
      "wiki_pages": urlsList.map(item => item.url).join(',').split(','),
      "book_title": bookSettings.title,
      "base_url": urlRestHamichlol
    };

    console.log('📤 שולח בקשה ליצירת ספר (עם אימות):', requestData);

    const response = await axios.post(`${API_BASE_URL}/pdf/generate`, requestData, {
      headers: getAuthHeaders(),
      timeout: 60000
    });

    console.log('📥 תשובת שרת:', response.data);

    const TaskCompletion = await waitForTaskCompletion(response.data.task_id, bookSettings.title, onStatusUpdate);
    console.log('✅ משימה הושלמה:', TaskCompletion);

    if (TaskCompletion.status === "completed") {
      return {
        task_id: TaskCompletion.task_id,
        status: TaskCompletion.status,
        title: TaskCompletion.title,
        download_url: TaskCompletion.download_url,
        view_url: TaskCompletion.view_url
      };
    } else {
      throw new Error(TaskCompletion.title || 'שגיאה לא ידועה ביצירת הספר');
    }
  } catch (error) {
    console.error('❌ שגיאה בקריאה ל-API:', error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('נדרשת התחברות למערכת');
      } else if (error.response?.status === 403) {
        throw new Error('אין לך הרשאה לבצע פעולה זו');
      } else if (error.response) {
        const errorMessage = error.response.data?.message || `שגיאת שרת: ${error.response.status}`;
        throw new Error(errorMessage);
      } else if (error.request) {
        throw new Error('לא ניתן להתחבר לשרת. אנא בדוק את החיבור לאינטרנט.');
      }
    }

    throw new Error('אירעה שגיאה בלתי צפויה ביצירת הספר.');
  }
};

/**
 * קבלת מידע על ספר קיים לפי מזהה (עם אימות)
 */
export const getBookInfo = async (bookId: string): Promise<BookResponse> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('נדרש אימות למערכת');
    }

    console.log('📖 מבקש מידע על ספר:', bookId);

    const response = await axios.get(`${API_BASE_URL}/book/${bookId}`, {
      headers: getAuthHeaders()
    });

    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'לא ניתן למצוא את הספר');
    }
  } catch (error) {
    console.error('❌ שגיאה בקבלת מידע על הספר:', error);
    throw error;
  }
};

/**
 * קבלת רשימת ספרים של המשתמש (עם אימות)
 */
export const getUserBooks = async (): Promise<BookResponse[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('נדרש אימות למערכת');
    }

    console.log('📚 מבקש רשימת ספרים של המשתמש');

    const response = await axios.get(`${API_BASE_URL}/books`, {
      headers: getAuthHeaders()
    });

    console.log('📥 תשובת רשימת ספרים:', response.data);

    if (response.data.status === 'success') {
      return response.data.books;
    } else {
      throw new Error(response.data.message || 'שגיאה בקבלת רשימת הספרים');
    }
  } catch (error) {
    console.error('❌ שגיאה בקבלת רשימת הספרים:', error);
    throw error;
  }
};

/**
 * מחיקת ספר (עם אימות)
 */
export const deleteBook = async (bookId: string): Promise<void> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('נדרש אימות למערכת');
    }

    console.log('🗑️ מוחק ספר:', bookId);

    const response = await axios.delete(`${API_BASE_URL}/book/${bookId}`, {
      headers: getAuthHeaders()
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'שגיאה במחיקת הספר');
    }

    console.log('✅ ספר נמחק בהצלחה');
  } catch (error) {
    console.error('❌ שגיאה במחיקת הספר:', error);
    throw error;
  }
};

/**
 * קבלת מידע על PDF לפי נתיב (עם אימות)
 */
export const getPdfInfo = async (pdfPath: string): Promise<{
  title: string;
  author?: string;
  createdAt?: string;
  pageCount?: number;
  size?: string;
}> => {
  try {
    console.log('📄 מבקש מידע על PDF:', pdfPath);

    const response = await axios.get(`${API_BASE_URL}/pdf/metadata/${encodeURIComponent(pdfPath)}`, {
      headers: getAuthHeaders()
    });

    if (response.data.success) {
      return response.data.metadata;
    } else {
      throw new Error(response.data.message || 'לא ניתן לקבל מידע על הקובץ');
    }
  } catch (error) {
    console.error('❌ שגיאה בקבלת מידע על PDF:', error);
    // במקום לזרוק שגיאה, נחזיר מידע בסיסי
    const fileName = pdfPath.split('/').pop() || 'ספר PDF';
    return {
      title: fileName.replace('.pdf', ''),
      author: 'לא ידוע',
      createdAt: new Date().toISOString()
    };
  }
};

/**
 * בדיקה שה-PDF קיים וזמין (עם אימות)
 */
export const checkPdfAvailability = async (pdfPath: string): Promise<boolean> => {
  try {
    console.log('🔍 בודק זמינות PDF:', pdfPath);

    const fullUrl = `${API_BASE_URL}/pdf/view/${pdfPath}`;
    const response = await axios.head(fullUrl, {
      headers: getAuthHeaders()
    });

    return response.status === 200;
  } catch (error) {
    console.error('❌ PDF לא זמין:', error);
    return false;
  }
};

/**
 * המתנה לסיום המשימה (עם אימות)
 */
export const waitForTaskCompletion = async (
  taskId: string,
  bookTitle: string,
  onStatusUpdate?: (status: string | null, message?: string | null) => void
): Promise<BookResponse> => {
  const maxAttempts = 30; // מקסימום 30 ניסיונות (5 דקות)
  const intervalMs = 10000; // בדיקה כל 10 שניות

  console.log(`⏱️ מתחיל להמתין למשימה ${taskId} (מקסימום ${maxAttempts} ניסיונות)`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔄 בודק סטטוס משימה ${taskId} - ניסיון ${attempt}/${maxAttempts}`);

      const statusResponse = await axios.get(`${API_BASE_URL}/pdf/status/${taskId}`, {
        headers: getAuthHeaders()
      });

      console.log('📊 תשובת סטטוס:', statusResponse.data);

      const status = statusResponse.data.status;
      const task_id = statusResponse.data.task_id;
      const download_url = statusResponse.data.download_url;
      const view_url = statusResponse.data.view_url;
      const message = statusResponse.data.message || '';

      console.log(`📍 סטטוס נוכחי: ${status}`, message ? `- ${message}` : '');

      // עדכון הסטטוס באפליקציה
      if (onStatusUpdate) {
        const statusMessages = {
          'processing': `מעבד דף ${attempt}... (${message})`,
          'downloading': 'מוריד תוכן מהמכלול...',
          'generating': 'יוצר את קובץ ה-PDF...',
          'completed': 'הספר הושלם בהצלחה!',
          'failed': 'יצירת הספר נכשלה',
          'error': 'אירעה שגיאה',
          'null': null
        };

        const displayMessage = statusMessages[status as keyof typeof statusMessages];
        onStatusUpdate(status, displayMessage);
      }

      if (status === "completed") {
        console.log('🎉 המשימה הושלמה בהצלחה!');
        return {
          task_id: task_id,
          status: status,
          title: message,
          download_url: download_url,
          view_url: view_url
        };
      }

      if (status === "failed" || status === "error") {
        console.error('💥 המשימה נכשלה:', message);
        if (onStatusUpdate) onStatusUpdate(status, message || 'יצירת הספר נכשלה');
        throw new Error(message || 'יצירת הספר נכשלה');
      }

      // אם עדיין בתהליך, ממתין לניסיון הבא
      if (status === "processing" && attempt < maxAttempts) {
        console.log(`⏳ ממתין ${intervalMs / 1000} שניות לניסיון הבא...`);
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        continue;
      }

    } catch (error) {
      console.error(`❌ שגיאה בבדיקת סטטוס - ניסיון ${attempt}:`, error);

      if (onStatusUpdate) {
        onStatusUpdate('error', `שגיאה בבדיקת סטטוס (ניסיון ${attempt}/${maxAttempts})`);
      }

      if (attempt === maxAttempts) {
        throw new Error('לא ניתן היה לקבל את סטטוס יצירת הספר');
      }

      // ממתין לניסיון הבא
      console.log(`⏳ ממתין ${intervalMs / 1000} שניות לפני ניסיון נוסף...`);
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error('יצירת הספר לוקחת זמן רב מהצפוי. אנא נסה שוב מאוחר יותר.');
};

/**
 * פונקציות אימות חדשות
 */

// התחברות למערכת
export const loginUser = async (email: string, password: string): Promise<{
  access_token: string;
  user: any;
}> => {
  try {
    console.log('🔐 מנסה להתחבר למערכת:', email);

    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('✅ התחברות הצליחה');
    return response.data;
  } catch (error) {
    console.error('❌ שגיאה בהתחברות:', error);
    throw error;
  }
};

// הרשמה למערכת
export const registerUser = async (email: string, password: string, confirmPassword: string): Promise<{
  access_token: string;
  user: any;
}> => {
  try {
    console.log('📝 מנסה להירשם למערכת:', email);

    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      email,
      password,
      confirm_password: confirmPassword
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('✅ הרשמה הצליחה');
    return response.data;
  } catch (error) {
    console.error('❌ שגיאה בהרשמה:', error);
    throw error;
  }
};

// ווידוא טוקן
export const validateToken = async (token: string): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/validate`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.status === 200;
  } catch (error) {
    console.error('❌ טוקן לא תקף:', error);
    return false;
  }
};

// קבלת מידע על המשתמש הנוכחי
export const getCurrentUser = async (): Promise<any> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('אין טוקן אימות');
    }

    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });

    return response.data;
  } catch (error) {
    console.error('❌ שגיאה בקבלת מידע משתמש:', error);
    throw error;
  }
};

// התנתקות (אופציונלי - לרוב רק מחיקה מהזיכרון)
export const logoutUser = async (): Promise<void> => {
  try {
    const token = getAuthToken();
    if (token) {
      // שליחת בקשת התנתקות לשרת (אופציונלי)
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
        headers: getAuthHeaders()
      });
    }
  } catch (error) {
    console.error('❌ שגיאה בהתנתקות מהשרت:', error);
    // לא נזרוק שגיאה כי התנתקות מקומית עדיין צריכה לעבוד
  } finally {
    // מחיקה מקומית של נתוני האימות
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
  }
};

// עדכון פרופיל משתמש
export const updateUserProfile = async (profileData: {
  name?: string;
  email?: string;
  bio?: string;
  avatar?: string;
  firstName?: string;  // ← הוסף את זה
  lastName?: string;   // ← והוסף את זה
}): Promise<any> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('נדרש אימות למערכת');
    }

    console.log('👤 מעדכן פרופיל משתמש:', profileData);

    const response = await axios.put(`${API_BASE_URL}/auth/profile`, profileData, {
      headers: getAuthHeaders()
    });

    console.log('✅ פרופיל עודכן בהצלחה');

    // עדכון המידע המקומי
    const updatedUserInfo = response.data.user || response.data;
    localStorage.setItem('user_info', JSON.stringify(updatedUserInfo));

    return updatedUserInfo;
  } catch (error) {
    console.error('❌ שגיאה בעדכון פרופיל:', error);
    throw error;
  }
};

// שינוי סיסמה
export const changePassword = async (passwordData: {
  current_password: string;
  new_password: string;
  confirm_password: string;
}): Promise<void> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('נדרש אימות למערכת');
    }

    console.log('🔑 משנה סיסמה למשתמש');

    const response = await axios.put(`${API_BASE_URL}/auth/change-password`, passwordData, {
      headers: getAuthHeaders()
    });

    console.log('✅ סיסמה שונתה בהצלחה');
    return response.data;
  } catch (error) {
    console.error('❌ שגיאה בשינוי סיסמה:', error);
    throw error;
  }
};

// קבלת היסטוריית פעילות משתמש
export const getUserActivity = async (limit: number = 10): Promise<any[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('נדרש אימות למערכת');
    }

    console.log('📊 מבקש היסטוריית פעילות משתמש');

    const response = await axios.get(`${API_BASE_URL}/auth/activity?limit=${limit}`, {
      headers: getAuthHeaders()
    });

    return response.data.activities || response.data;
  } catch (error) {
    console.error('❌ שגיאה בקבלת היסטוריית פעילות:', error);
    throw error;
  }
};

// העלאת תמונת פרופיל
export const uploadProfileImage = async (imageFile: File): Promise<string> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('נדרש אימות למערכת');
    }

    console.log('📸 מעלה תמונת פרופיל');

    const formData = new FormData();
    formData.append('avatar', imageFile);

    const response = await axios.post(`${API_BASE_URL}/auth/upload-avatar`, formData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log('✅ תמונת פרופיל עודכנה בהצלחה');
    return response.data.avatar_url || response.data.url;
  } catch (error) {
    console.error('❌ שגיאה בהעלאת תמונת פרופיל:', error);
    throw error;
  }
};

// מחיקת חשבון משתמש
export const deleteUserAccount = async (password: string): Promise<void> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('נדרש אימות למערכת');
    }

    console.log('🗑️ מוחק חשבון משתמש');

    const response = await axios.delete(`${API_BASE_URL}/auth/delete-account`, {
      headers: getAuthHeaders(),
      data: { password }
    });

    console.log('✅ חשבון נמחק בהצלחה');

    // מחיקה מקומית של נתוני האימות
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');

    return response.data;
  } catch (error) {
    console.error('❌ שגיאה במחיקת חשבון:', error);
    throw error;
  }
};

// בקשת איפוס סיסמה
export const requestPasswordReset = async (email: string): Promise<void> => {
  try {
    console.log('📧 שולח בקשת איפוס סיסמה למייל:', email);

    const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
      email
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('✅ בקשת איפוס סיסמה נשלחה');
    return response.data;
  } catch (error) {
    console.error('❌ שגיאה בבקשת איפוס סיסמה:', error);
    throw error;
  }
};

// איפוס סיסמה עם טוקן
export const resetPassword = async (token: string, newPassword: string, confirmPassword: string): Promise<void> => {
  try {
    console.log('🔑 מאפס סיסמה עם טוקן');

    const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
      token,
      new_password: newPassword,
      confirm_password: confirmPassword
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('✅ סיסמה אופסה בהצלחה');
    return response.data;
  } catch (error) {
    console.error('❌ שגיאה באיפוס סיסמה:', error);
    throw error;
  }
};