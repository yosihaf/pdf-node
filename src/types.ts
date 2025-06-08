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

// טיפוסים עבור הגדרות הספר
export interface BookSettingsType {
    title: string;
    subtitle: string;
    author: string;
}

// טיפוס עבור נתוני URL
export interface UrlDataType {
    url: string;
    title: string;
}

// טיפוס עבור תוכן דף (לשימוש פנימי)
export interface PageContentType {
    title: string;
    content: any;
}

// טיפוס עבור דף בודד (לשימוש פנימי)
export interface PageType {
    title: string;
    content: string;
    url: string;
}

// טיפוס עבור תשובה מה-API
export interface BookResponse {
    task_id: string,
    status: string,
    title: string,
    download_url: string,
    view_url:string
}

// טיפוס עבור בקשה ל-API
export interface CreateBookRequest {
    pages: UrlDataType[];
    bookSettings: BookSettingsType;
}

// טיפוס עבור מידע על ספר (לשימוש עתידי)
export interface BookInfo {
    id: string;
    title: string;
    subtitle: string;
    author: string;
    createdAt: string;
    updatedAt: string;
    pageCount: number;
    status: 'creating' | 'ready' | 'error';
    pdfUrl?: string;
    download_url?: string;
    viewUrl?: string;
}