import React, { useState, ChangeEvent } from 'react';
import { UrlDataType } from '../types';
import '../styles/UrlInput.css';

// שים לב: ממשק UrlInputProps לא כולל pages
interface UrlInputProps {
  onSubmit: (urlsList: UrlDataType[]) => void;
  isLoading: boolean;
}

// שים לב: destructuring לא כולל pages
const UrlInput: React.FC<UrlInputProps> = ({ onSubmit, isLoading }) => {
  const [urls, setUrls] = useState<string>('');

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setUrls(e.target.value);
  };

  const handleSubmit = (): void => {
    if (!urls.trim()) return;

    const urlsList: UrlDataType[] = urls.split('\n')
      .filter(url => url.trim())
      .map(url => {
        const parts = url.split('|');
        return {
          url: parts[0].trim(),
          title: parts.length > 1 ? parts[1].trim() : ''
        };
      });

    onSubmit(urlsList);
  };

  return (
    <div className="url-input">
      <h2>רשימת כתובות URL</h2>
      <p className="url-input-help">
        הכנס כל כתובת URL בשורה נפרדת. אם תרצה להגדיר כותרת מותאמת לדף, הוסף | ואחריו את הכותרת.
        <br />
        לדוגמה: <code>https://example.com/page1 | הכותרת המותאמת לדף 1</code>
      </p>

      <textarea
        value={urls}
        onChange={handleChange}
        rows={10}
        placeholder="https://example.com/page1 | כותרת דף 1&#10;https://example.com/page2 | כותרת דף 2"
        dir="rtl"
      />

      <button
        onClick={handleSubmit}
        disabled={isLoading || urls.trim() === ''}
      >
        {isLoading ? 'טוען דפים...' : 'טען את כל הדפים'}
      </button>
    </div>
  );
};

export default UrlInput;