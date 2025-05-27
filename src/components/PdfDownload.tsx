import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import WebsiteBookPdf from '../pdf/WebsiteBookPdf';
import '../styles/PdfDownload.css';
import { PageType, BookSettingsType } from '../types';
interface PdfDownloadProps {
    pages: PageType[];
    bookSettings: BookSettingsType;
}

function PdfDownload({ pages, bookSettings }: PdfDownloadProps) {
    return (
        <div className="pdf-download">
            <PDFDownloadLink
                document={
                    <WebsiteBookPdf
                        pages={pages}
                        title={bookSettings.title}
                        subtitle={bookSettings.subtitle}
                        author={bookSettings.author || 'אנונימי'}
                    />
                }
                fileName={`${bookSettings.title.replace(/\s+/g, '-')}.pdf`}
                className="download-button"
            >
                {/*({ blob, url, loading, error }) =>
                    loading ? 'מכין את קובץ ה-PDF...' : 'הורד ספר PDF'
                */}
            </PDFDownloadLink>
        </div>
    );
}

export default PdfDownload;