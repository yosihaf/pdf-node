import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <section className="welcome-section">
        <h2>ברוכים הבאים למערכת יצירת ספרי PDF</h2>
        <p className="welcome-text">
          המערכת שלנו מאפשרת לכם ליצור ספרי PDF מותאמים אישית מתוכן אתרי האינטרנט,
          עם תמיכה מיוחדת באתר המיכלול - האנציקלופדיה העברית החופשית.
        </p>
      </section>

      <section className="features-section">
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">📖</div>
            <h3>יצירת ספרים</h3>
            <p>צרו ספרי PDF מותאמים אישית מתוכן אתרי האינטרנט</p>
            <Link to="/create" className="feature-button">
              התחל ליצור
            </Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>הספרים שלי</h3>
            <p>נהלו וצפו בכל הספרים שיצרתם</p>
            <Link to="/my-books" className="feature-button">
              צפה בספרים
            </Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🌐</div>
            <h3>ספרים ציבוריים</h3>
            <p>גלו ספרים שיצרו משתמשים אחרים</p>
            <Link to="/public-books" className="feature-button">
              עיין בספרים
            </Link>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h3>איך זה עובד?</h3>
        <div className="steps-grid">
          <div className="step">
            <div className="step-number">1</div>
            <h4>בחרו דפים</h4>
            <p>חפשו דפים במיכלול או הזינו כתובות URL</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h4>התאימו אישית</h4>
            <p>הגדירו כותרת, כותרת משנה ושם מחבר</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h4>הורידו PDF</h4>
            <p>קבלו ספר PDF מעוצב ומוכן להדפסה</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;