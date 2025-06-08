// HamichlolBookPdf.tsx - רכיב ליצירת PDF מתוכן המכלול

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { PageType } from '../types';
import DOMPurify from 'dompurify';
import PFT_vilna_Bold from '../fonts/new font/PFT_vilna Bold.ttf';
import PFT_vilna from '../fonts/new font/PFT_vilna.ttf';

// רישום גופנים (פונטים) עבריים
Font.register({
  family: 'PFT_vilna Bold',
  src: PFT_vilna_Bold,
});


Font.register({
  family: 'PFT_vilna',
  src: PFT_vilna,
});

// הגדרת הסגנונות עבור ה-PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 50,
    fontFamily: 'PFT_vilna',
  },
  rtl: {
    direction: 'rtl',
    textAlign: 'right',
  },
  coverPage: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  coverTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'PFT_vilna Bold',
  },
  coverSubtitle: {
    fontSize: 18,
    marginBottom: 50,
    color: '#666',
    textAlign: 'center',
  },
  tableOfContents: {
    marginTop: 30,
    marginBottom: 30,
  },
  tocTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'PFT_vilna Bold',
  },
  tocItem: {
    fontSize: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tocPage: {
    marginLeft: 10,
  },
  chapterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'right',
    fontFamily: 'PFT_vilna Bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 8,
    textAlign: 'right',
    fontFamily: 'PFT_vilna Bold',
  },
  paragraph: {
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 1.5,
    textAlign: 'right',
  },
  image: {
    maxWidth: '80%',
    marginHorizontal: 'auto',
    marginVertical: 10,
  },
  caption: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 10,
    color: '#666',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 50,
    fontSize: 10,
    color: '#666',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  bulletPoint: {
    width: 10,
    fontSize: 10,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 5,
  },
});

// ממשק הפרופס של הרכיב
interface HamichlolBookPdfProps {
  pages: PageType[];
  title: string;
  subtitle: string;
  author: string;
}

// ממשק פריט תוכן עניינים
interface TOCItem {
  title: string;
  pageNumber: number;
}

// פונקציה לעיבוד תוכן HTML כטקסט פשוט (מסיר תגים)
const stripHtml = (html: string): string => {
  // יצירת אובייקט DOM מהתוכן
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // החזרת הטקסט בלבד
  return doc.body.textContent || '';
};

// רכיב ליצירת PDF מתוכן המכלול
const HamichlolBookPdf: React.FC<HamichlolBookPdfProps> = ({ pages, title, subtitle, author }) => {
  // בניית תוכן העניינים
  const tableOfContents: TOCItem[] = pages.map((page, index) => ({
    title: page.title,
    pageNumber: index + 3, // התחלה מדף 3 (אחרי כריכה ותוכן עניינים)
  }));

  // המרת תוכן HTML לטקסט רגיל
  const renderContent = (content: string) => {
    const cleanText = stripHtml(content);

    // פיצול לפסקאות
    const paragraphs = cleanText.split('\n\n').filter(p => p.trim().length > 0);

    return paragraphs.map((paragraph, index) => (
      <Text key={index} style={styles.paragraph}>
        {paragraph}
      </Text>
    ));
  };

  return (
    <Document>
      {/* כריכה */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          <Text style={styles.coverTitle}>{title}</Text>
          <Text style={styles.coverSubtitle}>{subtitle}</Text>
          <Text style={styles.paragraph}>מאת: {author}</Text>
        </View>
      </Page>

      {/* תוכן עניינים */}
      <Page size="A4" style={styles.page}>
        <View style={styles.tableOfContents}>
          <Text style={styles.tocTitle}>תוכן עניינים</Text>
          {tableOfContents.map((item, index) => (
            <View key={index} style={styles.tocItem}>
              <Text style={styles.tocPage}>{item.pageNumber}</Text>
              <Text style={styles.rtl}>{item.title}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.footer}>© {new Date().getFullYear()} {author}</Text>
      </Page>

      {/* דפי התוכן */}
      {pages.map((page, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          <Text style={styles.chapterTitle}>{page.title}</Text>

          {/* עיבוד התוכן */}
          <View style={styles.rtl}>
            {renderContent(page.content)}
          </View>

          <Text style={styles.pageNumber}>{pageIndex + 3}</Text>
          <Text style={styles.footer}>© {new Date().getFullYear()} {author}</Text>
        </Page>
      ))}
    </Document>
  );
};

export default HamichlolBookPdf;

// פונקציה עזר לעיבוד נתוני JSON מהמכלול ושימוש ברכיב PDF
export function createPdfFromHamichlolJson(jsonContent: string, bookInfo: { title: string; subtitle: string; author: string }): React.ReactElement {
  // עיבוד התוכן מה-JSON
  try {
    const data = JSON.parse(jsonContent);

    // בדיקה שהתקבל מבנה תשובה תקין
    if (!data || !data.parse || !data.parse.text || !data.parse.text['*']) {
      throw new Error('מבנה JSON לא תקין');
    }

    // חילוץ כותרת ותוכן HTML
    const title = data.parse.title || '';
    const htmlContent = data.parse.text['*'] || '';

    // ניקוי בסיסי של HTML
    const cleanHtml = DOMPurify.sanitize(htmlContent);

    // יצירת מערך עם דף אחד מהתוכן המעובד
    const pages: PageType[] = [
      {
        title,
        content: cleanHtml,
        url: `https://www.hamichlol.org.il/${encodeURIComponent(title)}`
      }
    ];

    // החזרת רכיב ה-PDF עם התוכן המעובד
    return (
      <HamichlolBookPdf
        pages={pages}
        title={bookInfo.title || title}
        subtitle={bookInfo.subtitle || 'מתוך המכלול - האנציקלופדיה העברית החופשית'}
        author={bookInfo.author || 'המכלול'}
      />
    );
  } catch (error) {
    console.error('שגיאה בעיבוד JSON:', error);

    // במקרה של שגיאה, החזר PDF עם הודעת שגיאה
    const errorPages: PageType[] = [
      {
        title: 'שגיאה בעיבוד התוכן',
        content: 'אירעה שגיאה בעיבוד תוכן ה-JSON. אנא בדוק את הפורמט ונסה שוב.',
        url: ''
      }
    ];

    return (
      <HamichlolBookPdf
        pages={errorPages}
        title="שגיאה בעיבוד התוכן"
        subtitle="לא ניתן היה לעבד את ה-JSON שסופק"
        author={bookInfo.author || 'המכלול'}
      />
    );
  }
}