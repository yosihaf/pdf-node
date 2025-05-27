import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image, Link } from '@react-pdf/renderer';
import { PageType } from '../types';
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
  coverPage: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  coverTitle: {
    fontSize: 30,
    fontFamily: 'PFT_vilna Bold',
    marginBottom: 20,
    textAlign: 'center',
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
    fontFamily: 'PFT_vilna Bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  tocItem: {
    fontSize: 12,
    marginBottom: 10,
    flexDirection: 'row-reverse', // שינוי לתצוגה נכונה ב-RTL
    justifyContent: 'space-between',
  },
  tocPage: {
    marginRight: 10, // שינוי ל-RTL
  },
  chapterTitle: {
    fontSize: 20,
    fontFamily: 'PFT_vilna Bold',
    marginBottom: 15,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'PFT_vilna Bold',
    marginTop: 10,
    marginBottom: 8,
    textAlign: 'right',
  },
  paragraph: {
    fontSize: 11,
    marginBottom: 8,
    lineHeight: 1.5,
    textAlign: 'right',
  },
  contentContainer: {
    direction: 'rtl',
    textAlign: 'right',
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
    left: 50, // שינוי ל-RTL
    fontSize: 10,
    color: '#666',
  },
  image: {
    maxWidth: 300,
    maxHeight: 200,
    marginVertical: 10,
    alignSelf: 'center',
  },
  link: {
    color: '#1a0dab',
    textDecoration: 'none',
  }
});

interface WebsiteBookPdfProps {
  pages: PageType[];
  title: string;
  subtitle: string;
  author: string;
}

interface TOCItem {
  title: string;
  pageNumber: number;
}

// פונקציה מתקדמת יותר לניקוי HTML עם תמיכה בקישורים ותגיות בסיסיות
function processHtml(html: string): React.ReactNode[] {
  if (!html) return [<Text key="empty"></Text>];

  // צור אלמנט זמני להמרת HTML
  const div = document.createElement('div');
  div.innerHTML = html;

  // פונקציה רקורסיבית לעיבוד צמתי DOM
  const processNode = (node: Node, index: number): React.ReactNode => {
    // טקסט רגיל
    if (node.nodeType === Node.TEXT_NODE) {
      return <Text key={index}>{node.textContent}</Text>;
    }

    // אלמנט HTML
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const childrenNodes: React.ReactNode[] = [];

      // עבור על צמתי הילדים
      Array.from(element.childNodes).forEach((childNode, childIndex) => {
        childrenNodes.push(processNode(childNode, childIndex));
      });

      // טפל בתגיות שונות
      switch (element.tagName.toLowerCase()) {
        case 'p':
          return <Text key={index} style={styles.paragraph}>{childrenNodes}</Text>;
        case 'h1':
        case 'h2':
          return <Text key={index} style={styles.chapterTitle}>{childrenNodes}</Text>;
        case 'h3':
        case 'h4':
          return <Text key={index} style={styles.sectionTitle}>{childrenNodes}</Text>;
        case 'a':
          return (
            <Link
              key={index}
              style={styles.link}
              src={element.getAttribute('href') || '#'}
            >
              {childrenNodes}
            </Link>
          );
        case 'img':
          return (
            <Image
              key={index}
              style={styles.image}
              src={element.getAttribute('src') || ''}
            />
          );
        default:
          return <Text key={index}>{childrenNodes}</Text>;
      }
    }

    return null;
  };

  // עבד את כל הצמתים בשורש
  const result: React.ReactNode[] = [];
  Array.from(div.childNodes).forEach((node, index) => {
    const processed = processNode(node, index);
    if (processed) {
      result.push(processed);
    }
  });

  return result;
}

// פונקציה פשוטה לניקוי HTML אם processHtml לא עובד
function stripHtmlTags(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
}

const WebsiteBookPdf: React.FC<WebsiteBookPdfProps> = ({ pages, title, subtitle, author }) => {
  // בניית תוכן העניינים
  const tableOfContents: TOCItem[] = pages.map((page, index) => ({
    title: page.title,
    pageNumber: index + 3, // התחלה מדף 3 (אחרי כריכה ותוכן עניינים)
  }));

  // תאריך נוכחי - לשימוש בכמה מקומות
  const currentYear = new Date().getFullYear();

  return (
    <Document>
      {/* כריכה */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          <Text style={styles.coverTitle}>{title}</Text>
          <Text style={styles.coverSubtitle}>{subtitle}</Text>
          <Text style={styles.paragraph}>מאת: {author}</Text>
          <Text style={{ ...styles.paragraph, marginTop: 30 }}>
            {currentYear} © כל הזכויות שמורות
          </Text>
        </View>
      </Page>

      {/* תוכן עניינים */}
      <Page size="A4" style={styles.page}>
        <View style={styles.tableOfContents}>
          <Text style={styles.tocTitle}>תוכן עניינים</Text>
          {tableOfContents.map((item, index) => (
            <View key={index} style={styles.tocItem}>
              <Text>{item.title}</Text>
              <Text style={styles.tocPage}>{item.pageNumber}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.footer}>© {currentYear} {author}</Text>
      </Page>

      {/* דפי התוכן */}
      {pages.map((page, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          <Text style={styles.chapterTitle}>{page.title}</Text>

          {/* ניסיון לעבד את התוכן עם שמירה על עיצוב */}
          <View style={styles.contentContainer}>
            {/* קוד בטוח עם fallback למקרה של כישלון */}
            {(() => {
              try {
                // נסה להשתמש בעיבוד מתקדם
                return processHtml(page.content);
              } catch (error) {
                // במקרה של שגיאה, השתמש בשיטה הפשוטה
                console.error("Error processing HTML:", error);
                return (
                  <Text style={styles.paragraph}>
                    {stripHtmlTags(page.content)}
                  </Text>
                );
              }
            })()}
          </View>

          <Text style={styles.pageNumber}>{pageIndex + 3}</Text>
          <Text style={styles.footer}>© {currentYear} {author}</Text>
        </Page>
      ))}
    </Document>
  );
};

export default WebsiteBookPdf;