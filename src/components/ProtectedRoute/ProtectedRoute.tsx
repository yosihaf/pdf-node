// src/components/ProtectedRoute/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean; // אם false, הדף נגיש רק למשתמשים לא מחוברים (כמו login/register)
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // אם עדיין טוען את נתוני האימות, הצג מסך טעינה
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>טוען...</p>
      </div>
    );
  }

  // אם הדף דורש אימות והמשתמש לא מחובר
  if (requireAuth && !isAuthenticated) {
    // שמור את הדף הנוכחי כדי לחזור אליו לאחר ההתחברות
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // אם הדף לא דורש אימות (כמו login/register) והמשתמש כבר מחובר
  if (!requireAuth && isAuthenticated) {
    // הפנה לדף הבית
    return <Navigate to="/" replace />;
  }

  // המשתמש מורשה לצפות בדף
  return <>{children}</>;
};

export default ProtectedRoute;