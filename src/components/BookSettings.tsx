import React, { ChangeEvent } from 'react';
import { BookSettingsType } from '../types';
import '../styles/BookSettings.css';

interface BookSettingsProps {
  settings: BookSettingsType;
  onSettingsChange: (settings: Partial<BookSettingsType>) => void;
}

const BookSettings: React.FC<BookSettingsProps> = ({ settings, onSettingsChange }) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    onSettingsChange({ [name as keyof BookSettingsType]: value });
  };

  return (
    <div className="book-settings">
      <h2>הגדרות הספר</h2>
      
      <div className="settings-grid">
        <div className="setting-group">
          <label htmlFor="title">כותרת הספר</label>
          <input 
            type="text" 
            id="title"
            name="title"
            value={settings.title} 
            onChange={handleChange}
          />
        </div>
        
        <div className="setting-group">
          <label htmlFor="subtitle">כותרת משנה</label>
          <input 
            type="text" 
            id="subtitle"
            name="subtitle"
            value={settings.subtitle} 
            onChange={handleChange}
          />
        </div>
      </div>
      
      <div className="setting-group">
        <label htmlFor="author">שם המחבר</label>
        <input 
          type="text" 
          id="author"
          name="author"
          value={settings.author} 
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default BookSettings;