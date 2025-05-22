// types.ts - הגדרות טיפוסים לפרויקט

/**
 * טיפוס להגדרות ספר
 */
export interface BookSettingsType {
    title: string;
    subtitle: string;
    author: string;
}

/**
 * טיפוס לדף בספר
 */
export interface PageType {
    title: string;
    content: string;
    url: string;
}

/**
 * טיפוס לנתוני URL
 */
export interface UrlDataType {
    url: string;
    title: string;
}

/**
 * טיפוס לתוכן דף מעובד
 */
export interface PageContentType {
    title: string;
    content: any;
}