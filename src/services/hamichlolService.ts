// src/services/hamichlolService.ts
import axios from 'axios';
import DOMPurify from 'dompurify';
import { PageContentType } from '../types';

/**
 * פונקציה לגרידת תוכן מהמכלול באמצעות ה-API שלו
 * @param pageName שם הדף במיכלול (לדוגמה: "הר" או "ישראל")
 * @returns הבטחה המכילה את תוכן הדף מעובד ומנוקה
 */
export const fetchHamichlolPage = async (pageName: string): Promise<PageContentType> => {
    try {
        //  `https://www.hamichlol.org.il/w/rest.php/v1/page/encodeURIComponent(pageName)/html`
        // URL ל-API של המכלול, מוגדר לפי הפרמטרים הנכונים
        const apiUrl = `https://dev.hamichlol.org.il/w/rest.php/v1/page/${encodeURIComponent(pageName)}/html?origin=*`;

        console.log(`שולח בקשה ל-API של המכלול: ${apiUrl}`);

        // שליחת הבקשה ל-API
        const response = await axios.get(apiUrl);

        // בדיקה אם ה-API החזיר שגיאה
        if (response.data.error) {
            throw new Error(`שגיאת API של המכלול: ${response.data.error.info}`);
        }

        // בדיקה אם התשובה מכילה את הנתונים הצפויים
        if (!response.data.parse || !response.data.parse.text || !response.data.parse.text['*']) {
            throw new Error('מבנה תשובה לא צפוי מ-API של המכלול');
        }

        // חילוץ הHTML מהתשובה
        const htmlContent = response.data.parse.text['*'];

        // עיבוד התוכן - בחירת הטקסט הרלוונטי וניקויו
        const cleanedContent = cleanHamichlolContent(htmlContent);

        // החזרת התוכן המעובד ושם הדף
        return {
            title: response.data.parse.title || pageName,
            content: cleanedContent
        };
    } catch (error) {
        console.error(`שגיאה בטעינת הדף '${pageName}' מהמכלול:`, error);
        throw error;
    }
};

/**
 * פונקציה לניקוי ועיבוד התוכן מה-API של המכלול
 * @param htmlContent תוכן HTML מקורי
 * @returns טקסט מעובד ומנוקה
 */
const cleanHamichlolContent = (htmlContent: string): string => {
    // ניקוי ה-HTML מקוד זדוני
    const cleanHtml = DOMPurify.sanitize(htmlContent);

    // יצירת DOM פנימי כדי שנוכל לעבוד עם האלמנטים
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanHtml, 'text/html');

    // מחיקת אלמנטים שאנחנו לא צריכים (תפריטים, כותרות משנה, עריכה וכדומה)
    removeUnwantedElements(doc);

    // חילוץ רק הטקסט הרלוונטי מהדף
    const contentElement = doc.querySelector('.mw-parser-output');

    if (!contentElement) {
        return 'לא נמצא תוכן בדף';
    }

    // אפשרות 1: החזרת התוכן כ-HTML מנוקה
    return contentElement.innerHTML;

    // אפשרות 2: החזרת רק הטקסט (ללא תגיות HTML)
    // return contentElement.textContent || 'לא נמצא תוכן בדף';
};

/**
 * פונקציה המסירה אלמנטים מיותרים מה-DOM
 * @param doc אובייקט DOM שממנו נרצה להסיר אלמנטים
 */
const removeUnwantedElements = (doc: Document): void => {
    // רשימת בוררי CSS לאלמנטים שנרצה להסיר
    const selectorsToRemove = [
        '.mw-editsection',      // קישורי עריכה
        '.dablink',             // קישורי פירושונים
        '.sistersitebox',       // קישורים לאתרי אחות
        '#toc',                 // תוכן עניינים
        '.toccolours',          // נושאים צבעוניים
        '.metadata',            // מטא-נתונים
        '.plainlinks',          // קישורים פשוטים
        '.thumb',               // תמונות ממוזערות
        'script',               // סקריפטים
        'style',                // סגנונות CSS
        '.gallery',             // גלריות
        '.noprint',             // אלמנטים שלא מודפסים
        '.error',               // הודעות שגיאה
        '.mw-empty-elt',        // אלמנטים ריקים
        '.aspaklarya-edit-full-locked', // אלמנטים נעולים לעריכה
        '.mw-headline + .mw-editsection', // כותרות עם קישורי עריכה
    ];

    // הסרת כל האלמנטים הלא רצויים
    selectorsToRemove.forEach(selector => {
        const elements = doc.querySelectorAll(selector);
        elements.forEach(element => {
            element.parentNode?.removeChild(element);
        });
    });
};

/**
 * פונקציה לחילוץ שם דף מתוך URL של המכלול
 * @param url כתובת URL של דף במיכלול
 * @returns שם הדף
 */
export const extractHamichlolPageName = (url: string): string | null => {

    if (!url.includes('hamichlol')) {
        return decodeURIComponent(url);
    }
    // ניסיון לחלץ את שם הדף מה-URL
    const regex = /hamichlol\.org\.il\/([^?&#/]+)/;
    const match = url.match(regex);
    if (match && match[1]) {
        // החזרת שם הדף (יש לבצע decode לתווים מיוחדים)
        return decodeURIComponent(match[1]);
    }

    return null;
};

/**
 * פונקציה שבודקת אם URL הוא של המכלול
 * @param url כתובת URL לבדיקה
 * @returns האם ה-URL שייך למיכלול
 */
export const isHamichlolUrl = (url: string): boolean => {
    return url.includes('hamichlol.org.il');
};

// עדכון לפונקציה הכללית fetchPageContent שתשתמש בשירות של המכלול


export const fetchPageContent = async (url: string): Promise<PageContentType> => {
    try {
        // בדיקה אם זהו URL של המכלול
        if (isHamichlolUrl(url)) {
            console.log(url);
            // חילוץ שם הדף מה-URL
            const pageName = extractHamichlolPageName(url);




            if (pageName) {
                // אם זה אכן דף מהמכלול, השתמש בשירות המכלול
                return await fetchHamichlolPage(pageName);
            }
        }

        // אם זה לא URL של המכלול, השתמש בשיטה הכללית לגרידת דפי אינטרנט
        return await fetchRegularWebPage(url);
    } catch (error) {
        console.error(`שגיאה בטעינת ${url}:`, error);
        throw error;
    }
};

/**
 * פונקציה לגרידת דף אינטרנט רגיל (לא מהמכלול)
 * @param url כתובת URL של דף אינטרנט
 * @returns תוכן הדף
 */
const fetchRegularWebPage = async (url: string): Promise<PageContentType> => {
    // יש להשתמש בפרוקסי CORS במידת הצורך
    const corsProxy = 'https://corsproxy.io/?';

    try {
        if (!url.includes('hamichlol')) {
            url = `https://www.hamichlol.org.il/w/rest.php/v1/page/${encodeURIComponent(url)}/html?origin=*`;
        }
        // ניסיון ראשון - ישירות ללא פרוקסי
        const response = await axios.get(url);

        const parser = new DOMParser();
        const doc = parser.parseFromString(response.data && response.data.parse.text['*'], 'text/html');


        const mainContent = doc.querySelector('main') || doc.querySelector('article') || doc.querySelector('body');
        console.log(mainContent);
        /*if (mainContent) {
            // ניקוי התוכן
            const cleanHtml = DOMPurify.sanitize(mainContent.innerHTML);

            return {
                title: doc.title,
                content: cleanHtml
            };
        }*/
    } catch (error) {
        console.log('ניסיון ישיר נכשל, מנסה עם פרוקסי CORS...');

        // ניסיון שני - עם פרוקסי
        const response = await axios.get(`${corsProxy}${encodeURIComponent(url)}`);

        const parser = new DOMParser();
        const doc = parser.parseFromString(response.data, 'text/html');
        const mainContent: HTMLElement | null = doc.querySelector('main') || doc.querySelector('article') || doc.querySelector('body');
        console.log(mainContent);

        if (mainContent) { // חובה לוודא ש-mainContent אינו null
            const sections = mainContent.querySelectorAll('section[data-mw-section-id]');

            console.log(`נמצאו ${sections.length} סקציות לעיבוד.`, sections);

            // ה- sections הוא אוסף של אלמנטים. נעבור על כל אחד מהם:
            sections.forEach((singleSectionElement, index) => {
                // בתוך הלולאה הזו, 'singleSectionElement' הוא אלמנט <section> אחד בכל פעם.
                // 'index' הוא המיקום שלו ברשימה (0, 1, 2...)

                const sectionId = singleSectionElement.id || `section-באינדקס-${index}`;
              //  console.log(`--- מעבד סקציה: ${sectionId} ---`);

                try {
                    // 1. קח את ה-HTML הפנימי של הסקציה הנוכחית
                    const originalHtmlOfSection = singleSectionElement.innerHTML;

                    // 2. בצע סניטציה ל-HTML של הסקציה הזו בלבד
                    //    זו הפעולה המקבילה למה שעשית עם mainContent.innerHTML,
                    //    אבל עכשיו ספציפית ל-singleSectionElement.innerHTML
                    const cleanHtmlOfSection = DOMPurify.sanitize(originalHtmlOfSection);

                    // 3. החלף את התוכן המקורי של הסקציה בתוכן הנקי
                    //    זה ישנה את ה-DOM בפועל עבור הסקציה הזו.
                    singleSectionElement.innerHTML = cleanHtmlOfSection;

                    // (אופציונלי) בדיקה אם התוכן השתנה
                    if (originalHtmlOfSection !== cleanHtmlOfSection) {
                        console.log(`   התוכן של סקציה ${sectionId} עבר שינוי לאחר סניטציה.`,originalHtmlOfSection);
                        console.log(`   התוכן של סקציה ${sectionId} עבר שינוי לאחר סניטציה.`,cleanHtmlOfSection);
                        // להצצה בשינוי (להסיר בסביבת פרודקשן אם לא צריך):
                        // console.log("   HTML מקורי (קטע):", originalHtmlOfSection.substring(0, 100) + "...");
                        // console.log("   HTML נקי (קטע):", cleanHtmlOfSection.substring(0, 100) + "...");
                    } else {
                        console.log(`   התוכן של סקציה ${sectionId} לא השתנה (כבר היה נקי או ש-DOMPurify לא מצא מה לשנות).`);
                    }

                } catch (error) {
                    console.error(`   אירעה שגיאה בעת סניטציה של סקציה ${sectionId}:`, error);
                    // אתה יכול להחליט מה לעשות כאן - אולי להמשיך לסקציה הבאה,
                    // או לעצור את כל התהליך. הלולאה תמשיך כברירת מחדל.
                }
            });

            if (sections.length > 0) {
                console.log("--- סיום עיבוד כל הסקציות ---", sections);
            }
            return {
                title: doc.title,
                content: sections
            };
        } else {
            console.error("שגיאה: mainContent הוא null. לא ניתן להמשיך בעיבוד הסקציות.");
        }

        /*if (mainContent) {
                   // ניקוי התוכן
                   const cleanHtml = DOMPurify.sanitize(mainContent.innerHTML);
       
                   return {
                       title: doc.title,
                       content: cleanHtml
                   };
               }*/
    }

    throw new Error('לא ניתן למצוא תוכן רלוונטי בדף');
};