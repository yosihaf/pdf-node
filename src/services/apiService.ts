import axios from 'axios';
import { BookSettingsType, UrlDataType, BookResponse } from '../types';

// כתובת ה-API שלך - עדכן לפי הצורך
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const urlRestHamichlol = process.env.REACT_APP_API_REST_URL_HAMICHLOL || 'https://dev.hamichlol.org.il/w/rest.php/v1/page';

console.log(urlRestHamichlol)
console.log(API_BASE_URL)

/**
 * שליחת בקשה ליצירת ספר מרשימת דפים
 */
export const createBookFromPages = async (
  urlsList: UrlDataType[],
  bookSettings: BookSettingsType,
  onStatusUpdate?: (status: string | null, message?: string | null) => void

): Promise<BookResponse> => {
  try {
    const requestData = {
      "wiki_pages":
        urlsList.map(item => item.url).join(',').split(',')
      ,
      "book_title": bookSettings.title,
      "base_url": urlRestHamichlol
    };

    console.log('שולח בקשה ליצירת ספר:', requestData);

    const response = await axios.post(`${API_BASE_URL}/pdf/generate`, requestData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000 // timeout של דקה - כי יצירת PDF יכולה לקחת זמן
    });

    const TaskCompletion = await waitForTaskCompletion(response.data.task_id, bookSettings.title, onStatusUpdate)
    console.log('תשובת TaskCompletion:', TaskCompletion)

    if (TaskCompletion.status === "completed") {
      // תיקון הבעיה - בניית ה-URLs הנכונים
      const baseApiUrl = API_BASE_URL.replace('/api', ''); // הסרת /api מהבסיס

      return {
        task_id: TaskCompletion.task_id,
        status: TaskCompletion.status,
        title: TaskCompletion.title,
        download_url: `${baseApiUrl}${TaskCompletion.download_url}`, // בניית URL מלא
        view_url: `${baseApiUrl}${TaskCompletion.view_url}` // בניית URL מלא
      }
    } else {
      throw new Error(TaskCompletion.title || 'שגיאה לא ידועה ביצירת הספר');
    }
  } catch (error) {
    console.error('שגיאה בקריאה ל-API:', error);

    if (axios.isAxiosError(error)) {
      if (error.response) {
        // השרת החזיר תשובה עם קוד שגיאה
        const errorMessage = error.response.data?.message || `שגיאת שרת: ${error.response.status}`;
        throw new Error(errorMessage);
      } else if (error.request) {
        // הבקשה נשלחה אבל לא התקבלה תשובה
        throw new Error('לא ניתן להתחבר לשרת. אנא בדוק את החיבור לאינטרנט.');
      }
    }

    throw new Error('אירעה שגיאה בלתי צפויה ביצירת הספר.');
  }
};

/**
 * קבלת מידע על ספר קיים
 */
export const getBookInfo = async (bookId: string): Promise<BookResponse> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/book/${bookId}`);

    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'לא ניתן למצוא את הספר');
    }
  } catch (error) {
    console.error('שגיאה בקבלת מידע על הספר:', error);
    throw error;
  }
};

/**
 * מחיקת ספר
 */
export const deleteBook = async (bookId: string): Promise<void> => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/book/${bookId}`);

    if (!response.data.success) {
      throw new Error(response.data.message || 'שגיאה במחיקת הספר');
    }
  } catch (error) {
    console.error('שגיאה במחיקת הספר:', error);
    throw error;
  }
};

/**
 * קבלת רשימת ספרים של המשתמש (לשימוש עתידי)
 */
export const getUserBooks = async (): Promise<BookResponse[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/books`);

    if (response.data.status === 'success') {      
      return response.data.books;
    } else {
      throw new Error(response.data.message || 'שגיאה בקבלת רשימת הספרים');
    }
  } catch (error) {
    console.error('שגיאה בקבלת רשימת הספרים:', error);
    throw error;
  }
};

/**
* המתנה לסיום המשימה
*/
export const waitForTaskCompletion = async (
  taskId: string,
  bookTitle: string,
  onStatusUpdate?: (status: string | null, message?: string | null) => void
): Promise<BookResponse> => {
  const maxAttempts = 30; // מקסימום 30 ניסיונות (5 דקות)
  const intervalMs = 10000; // בדיקה כל 10 שניות

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`בודק סטטוס משימה ${taskId} - ניסיון ${attempt}/${maxAttempts}`);

      const statusResponse = await axios.get(`${API_BASE_URL}/pdf/status/${taskId}`);
      console.log('תשובת שרת:', statusResponse.data);

      const status = statusResponse.data.status;
      const task_id = statusResponse.data.task_id;
      // תיקון: לקיחת הנתונים הנכונים מהתשובה
      const download_url = statusResponse.data.download_url;
      const view_url = statusResponse.data.view_url;
      const message = statusResponse.data.message || '';

      console.log(`סטטוס נוכחי: ${status}`, message ? `- ${message}` : '');

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
        // המשימה הושלמה - החזרת הנתונים הנכונים
        return {
          task_id: task_id,
          status: status,
          title: message,
          download_url: download_url, // החזרת הנתיב היחסי כפי שמגיע מהשרת
          view_url: view_url // החזרת הנתיב היחסי כפי שמגיע מהשרת
        }
      }

      if (status === "failed" || status === "error") {
        if (onStatusUpdate) onStatusUpdate(status, message || 'יצירת הספר נכשלה');
        throw new Error(message || 'יצירת הספר נכשלה');
      }

      // אם עדיין בתהליך, ממתין לניסיון הבא
      if (status === "processing" && attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        continue;
      }

    } catch (error) {
      console.error(`שגיאה בבדיקת סטטוס - ניסיון ${attempt}:`, error);

      if (onStatusUpdate) {
        onStatusUpdate('error', `שגיאה בבדיקת סטטוס (ניסיון ${attempt}/${maxAttempts})`);
      }

      if (attempt === maxAttempts) {
        throw new Error('לא ניתן היה לקבל את סטטוס יצירת הספר');
      }

      // ממתין לניסיון הבא
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error('יצירת הספר לוקחת זמן רב מהצפוי. אנא נסה שוב מאוחר יותר.');
};