import DOMPurify from 'dompurify';
import { marked } from 'marked';
import axios from 'axios';
import { PageContentType } from '../types';

// פונקציה לניקוי וסידור התוכן HTML
export const cleanContent = (htmlContent: string): string => {
    // ניקוי ה-HTML מקוד זדוני
    const cleanHtml = DOMPurify.sanitize(htmlContent);

    // המרה מ-HTML לטקסט מעוצב (תומך בעיצוב בסיסי כמו כותרות ופסקאות)
    // שים לב: כאן השתמשנו בmarked.parse במקום marked ישירות כדי להבטיח שהתוצאה היא string
    const textContent = marked.parse(cleanHtml) as string;

    return textContent;
};

// פונקציה להורדת תוכן דף
export const fetchPageContent = async (url: string): Promise<PageContentType> => {

    try {

        // נשתמש ב-CORS proxy אם יש בעיות גישה ישירות לאתר
        const corsProxy = '';
        const response = await axios.get(`${corsProxy}${url}`);

        // ניקח רק את החלק הרלוונטי מהדף
        const parser = new DOMParser();
        const doc = parser.parseFromString(response.data, 'text/html');

        // כדוגמה, נניח שהתוכן הרלוונטי נמצא בתוך תגית main או article
        const mainContent = doc.querySelector('main') || doc.querySelector('article') || doc.querySelector('body');

        if (mainContent) {
            // שים לב: cleanContent מחזיר string ולא Promise<string>
            const cleanedContent = cleanContent(mainContent.innerHTML);

            return {
                title: doc.title,
                content: cleanedContent
            };
        }

        throw new Error('לא ניתן למצוא תוכן רלוונטי בדף');
    } catch (error) {
        
        console.error(`שגיאה בטעינת ${url}:`, error);
        throw error;
    }
};