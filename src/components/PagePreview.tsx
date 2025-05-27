import React from 'react';
import { PageType } from '../types';
import '../styles/PagePreview.css';

// הגדרת ממשק לפרופס שהקומפוננטה מקבלת
interface PagePreviewProps {
  pages: PageType[]; // זה מגדיר שהקומפוננטה מקבלת פרופס בשם pages מסוג מערך של PageType
}

// הקומפוננטה מקבלת את הפרופס pages דרך destructuring
const PagePreview: React.FC<PagePreviewProps> = ({ pages }) => {
  return (
    <div className="page-preview">
      <h2>תצוגה מקדימה של הדפים שנטענו</h2>
      <p>מספר דפים שנטענו: {pages.length}</p>
      
      <ul>
        {pages.map((page, index) => (
          <li key={index}>
            <strong>{page.title}</strong> - 
            <a href={page.url} target="_blank" rel="noopener noreferrer">
              {page.url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PagePreview;