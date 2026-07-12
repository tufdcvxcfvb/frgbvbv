import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Film, Layers, X, CornerDownLeft } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Course, Subject, Lecture } from '../types';
import { useNavigate } from 'react-router-dom';

interface CommandSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandSearch: React.FC<CommandSearchProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(false);

  // Load datasets for instant local search
  useEffect(() => {
    if (!isOpen) return;

    const loadSearchData = async () => {
      setLoading(true);
      try {
        const [cSnap, sSnap, lSnap] = await Promise.all([
          getDocs(collection(db, 'courses')),
          getDocs(collection(db, 'subjects')),
          getDocs(collection(db, 'lectures'))
        ]);

        setCourses(cSnap.docs.map(d => d.data() as Course));
        setSubjects(sSnap.docs.map(d => d.data() as Subject));
        setLectures(lSnap.docs.map(d => d.data() as Lecture));
      } catch (err) {
        console.error('Error fetching search indices:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSearchData();
  }, [isOpen]);

  // Handle hotkey escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  // Filter items
  const filteredCourses = query.trim() === '' ? [] : courses.filter(c => 
    c.title.toLowerCase().includes(query.toLowerCase()) || 
    c.description.toLowerCase().includes(query.toLowerCase())
  );

  const filteredSubjects = query.trim() === '' ? [] : subjects.filter(s => 
    s.title.toLowerCase().includes(query.toLowerCase())
  );

  const filteredLectures = query.trim() === '' ? [] : lectures.filter(l => 
    l.title.toLowerCase().includes(query.toLowerCase())
  );

  const hasResults = filteredCourses.length > 0 || filteredSubjects.length > 0 || filteredLectures.length > 0;

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" 
      />

      {/* Main Modal Card */}
      <div className="relative w-full max-w-2xl bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[75vh] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Search Input bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3">
          <Search className="text-indigo-400" size={20} />
          <input
            type="text"
            placeholder="Search courses, subjects, or lectures..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 outline-none"
            autoFocus
          />
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition rounded-md hover:bg-white/5"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {loading ? (
            <div className="flex flex-col gap-2 p-4">
              <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-white/5 rounded animate-pulse" />
            </div>
          ) : query.trim() === '' ? (
            <div className="text-center py-12 flex flex-col items-center gap-2">
              <div className="p-3 bg-indigo-500/10 rounded-full text-indigo-400">
                <Search size={24} />
              </div>
              <p className="text-sm font-medium text-slate-300">Start typing to search the platform</p>
              <p className="text-xs text-slate-500">Search is synchronized in real-time across all academic items</p>
            </div>
          ) : !hasResults ? (
            <div className="text-center py-12 flex flex-col items-center gap-2">
              <div className="p-3 bg-red-500/10 rounded-full text-red-400">
                <X size={24} />
              </div>
              <p className="text-sm font-medium text-slate-300">No results found for "{query}"</p>
              <p className="text-xs text-slate-500">Check spelling or try a different tech topic</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Courses Matches */}
              {filteredCourses.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-indigo-400 tracking-wider uppercase mb-2 flex items-center gap-1.5 px-2">
                    <BookOpen size={12} />
                    Courses ({filteredCourses.length})
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    {filteredCourses.map(c => (
                      <button
                        key={c.courseId}
                        onClick={() => handleNavigate(`/course/${c.courseId}`)}
                        className="flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-white/5 transition group border border-transparent hover:border-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <img 
                            src={c.thumbnail} 
                            alt={c.title} 
                            className="w-10 h-10 rounded-lg object-cover border border-white/5"
                          />
                          <div>
                            <p className="text-xs font-semibold text-white group-hover:text-indigo-400 transition">{c.title}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[420px]">{c.description}</p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                          Open <CornerDownLeft size={8} />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Subjects Matches */}
              {filteredSubjects.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-purple-400 tracking-wider uppercase mb-2 flex items-center gap-1.5 px-2">
                    <Layers size={12} />
                    Subjects ({filteredSubjects.length})
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    {filteredSubjects.map(s => (
                      <button
                        key={s.subjectId}
                        onClick={() => handleNavigate(`/course/${s.courseId}`)}
                        className="flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-white/5 transition group border border-transparent hover:border-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <img 
                            src={s.thumbnail} 
                            alt={s.title} 
                            className="w-10 h-10 rounded-lg object-cover border border-white/5"
                          />
                          <div>
                            <p className="text-xs font-semibold text-white group-hover:text-purple-400 transition">{s.title}</p>
                            <p className="text-[10px] text-slate-400">Subject inside {s.courseId}</p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                          Open <CornerDownLeft size={8} />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Lectures Matches */}
              {filteredLectures.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-amber-400 tracking-wider uppercase mb-2 flex items-center gap-1.5 px-2">
                    <Film size={12} />
                    Lectures ({filteredLectures.length})
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    {filteredLectures.map(l => (
                      <button
                        key={l.lectureId}
                        onClick={() => handleNavigate(`/lecture/${l.lectureId}`)}
                        className="flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-white/5 transition group border border-transparent hover:border-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <img 
                            src={l.thumbnail} 
                            alt={l.title} 
                            className="w-10 h-10 rounded-lg object-cover border border-white/5"
                          />
                          <div>
                            <p className="text-xs font-semibold text-white group-hover:text-amber-400 transition">{l.title}</p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-2">
                              <span>Duration: {l.duration}</span>
                              {l.pdfUrl && <span className="bg-white/10 px-1.5 py-0.2 rounded text-[8px] text-slate-300">Secure PDF</span>}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                          Play <CornerDownLeft size={8} />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search Help footer */}
        <div className="px-4 py-2 bg-slate-950/60 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex gap-3">
            <span><kbd className="bg-white/5 px-1 rounded text-white border border-white/10">esc</kbd> close</span>
            <span><kbd className="bg-white/5 px-1 rounded text-white border border-white/10">↑↓</kbd> navigate</span>
          </div>
          <span>Secure Academic Directory Indexer</span>
        </div>
      </div>
    </div>
  );
};
