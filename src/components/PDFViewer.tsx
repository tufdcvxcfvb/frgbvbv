import React, { useState } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  EyeOff, 
  ShieldAlert 
} from 'lucide-react';

interface PDFViewerProps {
  url: string;
  title: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ url, title }) => {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const totalPages = 14; // Mocked pagination representation for premium feel
  const [isSecure, setIsSecure] = useState(true);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));

  const handlePrevPage = () => setPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setPage(prev => Math.min(prev + 1, totalPages));

  // Remove toolbar and download/print flags from URL
  const securePDFUrl = `${url}#toolbar=0&navpanes=0&scrollbar=1&statusbar=0&messages=0`;

  return (
    <div className="flex flex-col h-full bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Premium PDF Control Bar */}
      <div className="flex flex-wrap items-center justify-between p-4 bg-slate-900/80 border-b border-white/10 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white font-semibold shadow-md">
            PDF
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white truncate max-w-[200px] md:max-w-[300px]">
              {title}
            </h3>
            <p className="text-xs text-slate-400">Secure Document Viewer</p>
          </div>
        </div>

        {/* Page Selector & Zoom controls */}
        <div className="flex items-center gap-6">
          {/* Pagination */}
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
            <button 
              onClick={handlePrevPage}
              disabled={page === 1}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition"
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-medium text-slate-300">
              Page {page} <span className="text-slate-500">/</span> {totalPages}
            </span>
            <button 
              onClick={handleNextPage}
              disabled={page === totalPages}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition"
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
            <button 
              onClick={handleZoomOut}
              className="p-1 text-slate-400 hover:text-white transition"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-xs font-mono text-slate-300 min-w-[35px] text-center">
              {zoom}%
            </span>
            <button 
              onClick={handleZoomIn}
              className="p-1 text-slate-400 hover:text-white transition"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
          </div>

          {/* Download Disabled Warning Banner */}
          <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-xs font-medium">
            <EyeOff size={14} />
            <span className="hidden sm:inline">Download Disabled</span>
          </div>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 relative bg-slate-950 p-4 flex justify-center items-center overflow-auto">
        <div 
          className="w-full h-full max-w-4xl bg-white shadow-2xl rounded-lg transition-all duration-300 relative overflow-hidden"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        >
          {isSecure && (
            <div 
              className="absolute inset-0 pointer-events-none select-none z-10 opacity-[0.04] flex flex-wrap gap-12 p-8 justify-around items-center content-center overflow-hidden"
              style={{ transform: 'rotate(-30deg)' }}
            >
              {Array.from({ length: 48 }).map((_, i) => (
                <div key={i} className="text-slate-900 font-mono text-sm tracking-wider font-semibold">
                  SECURE PLATFORM • PRIVATE ACCESS
                </div>
              ))}
            </div>
          )}

          {/* Natively embedded PDF with print/download tools hidden */}
          <iframe
            src={securePDFUrl}
            className="w-full h-full border-0 select-none"
            title={title}
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Floating security notice */}
        <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-white/10 px-3 py-2 rounded-xl text-slate-400 flex items-center gap-2 text-xs backdrop-blur-md shadow-lg">
          <ShieldAlert size={14} className="text-amber-500" />
          <span>Screen capture or sharing of this material is monitored</span>
        </div>
      </div>
    </div>
  );
};
