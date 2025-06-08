import axios from 'axios';
import { BookSettingsType, UrlDataType, BookResponse } from '../types';

// כתובת ה-API שלך - עדכן לפי הצורך
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://pdf.test.hamichlol.org.il/api';
const urlRestHamichlol = process.env.REACT_APP_API_REST_URL_HAMICHLOL || 'https://dev.hamichlol.org.il/w/rest.php/v1/page';

console.log('🔧 API Configuration:', {
  API_BASE_URL,
  urlRestHamichlol
});

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
      "wiki_pages": urlsList.map(item => item.url).join(',').split(','),
      "book_title": bookSettings.title,
      "base_url": urlRestHamichlol
    };

    console.log('📤 שולח בקשה ליצירת ספר:', requestData);

    const response = await axios.post(`${API_BASE_URL}/pdf/generate`, requestData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000 // timeout של דקה - כי יצירת PDF יכולה לקחת זמן
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
      if (error.response) {
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
 * קבלת מידע על ספר קיים לפי מזהה
 */
export const getBookInfo = async (bookId: string): Promise<BookResponse> => {
  try {
    console.log('📖 מבקש מידע על ספר:', bookId);
    
    const response = await axios.get(`${API_BASE_URL}/book/${bookId}`);

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
 * קבלת מידע על PDF לפי נתיב
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
    
    const response = await axios.get(`${API_BASE_URL}/pdf/metadata/${encodeURIComponent(pdfPath)}`);
    
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
 * בדיקה שה-PDF קיים וזמין
 */
export const checkPdfAvailability = async (pdfPath: string): Promise<boolean> => {
  try {
    console.log('🔍 בודק זמינות PDF:', pdfPath);
    
    const fullUrl = `${API_BASE_URL}/pdf/view/${pdfPath}`;
    const response = await axios.head(fullUrl);
    
    return response.status === 200;
  } catch (error) {
    console.error('❌ PDF לא זמין:', error);
    return false;
  }
};

/**
 * מחיקת ספר
 */
export const deleteBook = async (bookId: string): Promise<void> => {
  try {
    console.log('🗑️ מוחק ספר:', bookId);
    
    const response = await axios.delete(`${API_BASE_URL}/book/${bookId}`);

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
 * קבלת רשימת ספרים של המשתמש
 */
export const getUserBooks = async (): Promise<BookResponse[]> => {
  try {
    console.log('📚 מבקש רשימת ספרים של המשתמש');
    
    const response = await axios.get(`${API_BASE_URL}/books`);
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
 * המתנה לסיום המשימה
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

      const statusResponse = await axios.get(`${API_BASE_URL}/pdf/status/${taskId}`);
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
        console.log(`⏳ ממתין ${intervalMs/1000} שניות לניסיון הבא...`);
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
      console.log(`⏳ ממתין ${intervalMs/1000} שניות לפני ניסיון נוסף...`);
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error('יצירת הספר לוקחת זמן רב מהצפוי. אנא נסה שוב מאוחר יותר.');
};