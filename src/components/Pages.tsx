import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  updateDoc 
} from 'firebase/firestore';
import { 
  Play, 
  FileText, 
  User, 
  Mail, 
  Lock, 
  CheckCircle, 
  BookOpen, 
  FolderPlus, 
  ArrowLeft, 
  Layers, 
  File, 
  Eye, 
  Activity, 
  Cpu, 
  Monitor, 
  Clock, 
  Globe, 
  AlertTriangle,
  RefreshCw,
  Search,
  LockKeyhole,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { Course, Subject, Lecture, UserProfile } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { PDFViewer } from './PDFViewer';
import toast from 'react-hot-toast';

// SKELETON LOADER
export const SkeletonCard: React.FC = () => (
  <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 animate-pulse">
    <div className="w-full aspect-video bg-white/5 rounded-xl" />
    <div className="h-4 bg-white/5 rounded w-3/4" />
    <div className="h-3 bg-white/5 rounded w-1/2" />
    <div className="flex justify-between items-center mt-2">
      <div className="h-3 bg-white/5 rounded w-1/4" />
      <div className="h-6 bg-white/5 rounded w-1/4" />
    </div>
  </div>
);

// EMPTY STATE ILLUSTRATION
export const EmptyState: React.FC<{ title: string; desc: string }> = ({ title, desc }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/30 border border-white/10 rounded-2xl backdrop-blur-md">
    <div className="p-4 bg-indigo-500/10 rounded-full text-indigo-400 mb-4">
      <BookOpen size={32} />
    </div>
    <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
    <p className="text-xs text-slate-400 max-w-sm">{desc}</p>
  </div>
);

// ================= AUTHENTICATION =================

// LOGIN VIEW
export const LoginView: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.blocked) {
        navigate('/account-blocked');
      } else {
        navigate('/home');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter all credentials');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Welcome back to Aura Academy');
      navigate('/home');
    } catch (err: any) {
      toast.error(err.message || 'Invalid email or password credentials');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#05060b]">
      {/* Background circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-[32px] shadow-2xl backdrop-blur-2xl relative z-10 flex flex-col gap-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-2xl shadow-lg mb-3">
            A
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white font-display">Login to Aura Academy</h2>
          <p className="text-xs text-white/40 mt-1">Authorized Student Workspace Access Only</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 text-white/30" size={16} />
              <input
                type="email"
                placeholder="student@aura.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 text-white/30" size={16} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3 rounded-xl hover:shadow-lg active:scale-98 transition text-xs flex justify-center items-center gap-2 mt-2 disabled:opacity-50"
          >
            {submitting ? 'Authenticating Workspace...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-white/40">
          Don't have an account yet?{' '}
          <Link to="/signup" className="text-indigo-400 font-semibold hover:underline">
            Register Account
          </Link>
        </p>
      </div>
    </div>
  );
};

// SIGN UP VIEW
export const SignupView: React.FC = () => {
  const { signup, user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all registration fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      await signup(name, email, password);
      toast.success('Student registration completed successfully');
      navigate('/home');
    } catch (err: any) {
      toast.error(err.message || 'Error occurred during registration');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#05060b]">
      {/* Background circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-[32px] shadow-2xl backdrop-blur-2xl relative z-10 flex flex-col gap-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-2xl shadow-lg mb-3">
            A
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white font-display">Create Student Account</h2>
          <p className="text-xs text-white/40 mt-1">Enroll as a verified student on Aura Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Full Name</label>
            <div className="relative flex items-center">
              <User className="absolute left-3 text-white/30" size={16} />
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 text-white/30" size={16} />
              <input
                type="email"
                placeholder="student@aura.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 text-white/30" size={16} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3 rounded-xl hover:shadow-lg active:scale-98 transition text-xs flex justify-center items-center gap-2 mt-2 disabled:opacity-50"
          >
            {submitting ? 'Registering...' : 'Enroll Account'}
          </button>
        </form>

        <p className="text-center text-xs text-white/40">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 font-semibold hover:underline">
            Sign In Here
          </Link>
        </p>
      </div>
    </div>
  );
};

// BLOCKED DEVICE / USER PAGE
export const BlockedView: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/20 via-slate-950 to-slate-950 -z-10" />

      <div className="w-full max-w-md bg-slate-900/80 border border-red-500/30 p-8 rounded-3xl shadow-2xl backdrop-blur-xl relative z-10 flex flex-col items-center text-center gap-6">
        <div className="p-4 bg-red-500/10 rounded-full text-red-500 border border-red-500/20">
          <LockKeyhole size={40} className="animate-bounce" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white uppercase">Access Revoked</h2>
          <p className="text-xs text-red-400 font-medium mt-1">Your account has been blocked by administrator.</p>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Due to multiple security policy violations or developer tools interference warnings, the platform's automated guard system has suspended your student credentials.
        </p>
        <div className="w-full p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-2 text-left">
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-400 font-semibold">SECURITY ACTION:</span>
            <span className="text-red-400 font-bold font-mono">DENIED_ACCESS</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-400 font-semibold">TIMESTAMP:</span>
            <span className="text-slate-300 font-mono">{new Date().toISOString()}</span>
          </div>
        </div>
        <button 
          onClick={() => window.location.href = '/login'}
          className="w-full bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-bold py-2.5 rounded-xl transition text-xs"
        >
          Return to Login
        </button>
      </div>
    </div>
  );
};


// ================= DASHBOARD INTERNAL VIEWS =================

// HOME PAGE
export const HomeView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ courses: 0, subjects: 0, lectures: 0 });

  useEffect(() => {
    const loadCoursesAndCounts = async () => {
      try {
        const [cSnap, sSnap, lSnap] = await Promise.all([
          getDocs(collection(db, 'courses')),
          getDocs(collection(db, 'subjects')),
          getDocs(collection(db, 'lectures'))
        ]);
        
        const coursesList = cSnap.docs.map(d => d.data() as Course);
        setCourses(coursesList);
        setCounts({
          courses: coursesList.length,
          subjects: sSnap.size,
          lectures: lSnap.size
        });
      } catch (err) {
        console.error('Error load courses and counts:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCoursesAndCounts();
  }, []);

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Welcome Banner Card */}
      <div className="relative overflow-hidden rounded-[32px] p-6 md:p-8 bg-gradient-to-br from-white/10 to-transparent border border-white/10 backdrop-blur-xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-2 max-w-lg z-10">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Enrollment Verified</span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">
            Welcome to Aura, {user?.name || 'Student'}!
          </h1>
          <p className="text-xs text-white/70 leading-relaxed">
            Unleash production-ready software engineering concepts. Learn TypeScript structures, advanced container virtualization, and Multi-Modal Gemini SDK patterns.
          </p>
        </div>
        <div className="flex gap-4 z-10 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="flex flex-col text-center">
            <span className="text-xl font-black text-white">{counts.courses}</span>
            <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">Courses</span>
          </div>
          <div className="w-px bg-white/10" />
          <div className="flex flex-col text-center">
            <span className="text-xl font-black text-white">{counts.subjects}</span>
            <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">Subjects</span>
          </div>
          <div className="w-px bg-white/10" />
          <div className="flex flex-col text-center">
            <span className="text-xl font-black text-white">{counts.lectures}</span>
            <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">Lectures</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recommended courses */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-1">
          <div>
            <h3 className="text-base font-extrabold text-white font-display">Premium Curriculums</h3>
            <p className="text-xs text-white/40">Dynamically compiled from secure cloud indices</p>
          </div>
          <button 
            onClick={() => navigate('/courses')}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
          >
            See all curriculums &rarr;
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : courses.length === 0 ? (
          <EmptyState title="No courses available." desc="Please wait for the administrator to add courses." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.slice(0, 3).map(c => (
              <div 
                key={c.courseId}
                onClick={() => navigate(`/course/${c.courseId}`)}
                className="group relative p-[1px] rounded-[32px] bg-gradient-to-br from-indigo-500/40 via-white/10 to-purple-500/40 cursor-pointer transition-all duration-300 hover:scale-102 active:scale-98"
              >
                <div className="bg-[#0a0c12]/95 backdrop-blur-3xl rounded-[31px] p-5 flex flex-col justify-between h-full overflow-hidden border border-white/5">
                  <div>
                    <div className="aspect-video relative overflow-hidden rounded-2xl mb-4">
                      <img 
                        src={c.thumbnail} 
                        alt={c.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80" />
                      <span className="absolute bottom-3 left-3 text-[10px] bg-indigo-600/90 text-white font-bold px-2.5 py-1 rounded-lg">
                        PLATINUM
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition truncate">{c.title}</h4>
                      <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">{c.description}</p>
                    </div>
                  </div>

                  <div className="pt-4 mt-6 border-t border-white/5 flex justify-between items-center text-[10px] text-white/40">
                    <span>Self-paced academic path</span>
                    <span className="text-indigo-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition duration-200">
                      Open Syllabus &rarr;
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student stats diagnostics dashboard preview */}
      <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-[32px] p-6 backdrop-blur-xl flex flex-col gap-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 font-display">
          <Activity size={16} className="text-indigo-400 animate-pulse" />
          Interactive Diagnostics Preview
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
            <span className="text-[10px] font-bold text-white/40 uppercase block mb-1">Heartbeat Link</span>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>SYNCED</span>
            </div>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
            <span className="text-[10px] font-bold text-white/40 uppercase block mb-1">Local IP Identifier</span>
            <span className="text-xs text-white font-bold font-mono">127.0.0.1</span>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
            <span className="text-[10px] font-bold text-white/40 uppercase block mb-1">Active Device ID</span>
            <span className="text-xs text-slate-300 font-bold font-mono truncate block">{localStorage.getItem('learn_platform_device_id')?.substring(0, 10)}...</span>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
            <span className="text-[10px] font-bold text-white/40 uppercase block mb-1">DevTools Guard</span>
            <span className="text-xs text-indigo-400 font-bold font-mono">STANDBY_SECURE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// COURSES PAGE
export const CoursesView: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllCourses = async () => {
      try {
        const cSnap = await getDocs(collection(db, 'courses'));
        setCourses(cSnap.docs.map(d => d.data() as Course));
      } catch (err) {
        console.error('Error loading catalog:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAllCourses();
  }, []);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-extrabold text-white font-display">Platform Curriculums</h2>
        <p className="text-xs text-white/40">Launch a premium structured course track</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : courses.length === 0 ? (
        <EmptyState title="No courses available." desc="Please wait for the administrator to add courses." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(c => (
            <div 
              key={c.courseId}
              onClick={() => navigate(`/course/${c.courseId}`)}
              className="group relative p-[1px] rounded-[32px] bg-gradient-to-br from-indigo-500/40 via-white/10 to-purple-500/40 cursor-pointer transition-all duration-300 hover:scale-102 active:scale-98"
            >
              <div className="bg-[#0a0c12]/95 backdrop-blur-3xl rounded-[31px] p-5 flex flex-col justify-between h-full overflow-hidden border border-white/5">
                <div>
                  <div className="aspect-video relative overflow-hidden rounded-2xl mb-4">
                    <img 
                      src={c.thumbnail} 
                      alt={c.title} 
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80" />
                  </div>
                  <div className="p-4 flex flex-col gap-1.5">
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition truncate">{c.title}</h4>
                    <p className="text-xs text-white/50 line-clamp-3 leading-relaxed">{c.description}</p>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-white/5 flex justify-between items-center text-[10px] text-white/40">
                  <span>Dynamic syllabus indexing</span>
                  <span className="text-indigo-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition duration-200">
                    Open Syllabus &rarr;
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// COURSE PAGE (SUBJECTS GRID)
export const CourseOverview: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourseDetails = async () => {
      if (!courseId) return;
      try {
        const cSnap = await getDoc(doc(db, 'courses', courseId));
        if (cSnap.exists()) {
          setCourse(cSnap.data() as Course);
        }

        // Get subjects of this course
        const sSnap = await getDocs(query(collection(db, 'subjects'), where('courseId', '==', courseId)));
        setSubjects(sSnap.docs.map(d => d.data() as Subject));
      } catch (err) {
        console.error('Error load course subjects:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCourseDetails();
  }, [courseId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!course) {
    return <EmptyState title="Course Not Found" desc="We couldn't locate the requested course index." />;
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Back button */}
      <button 
        onClick={() => navigate('/courses')}
        className="flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition w-fit"
      >
        <ArrowLeft size={14} /> Back to Courses
      </button>

      {/* Header Info */}
      <div className="p-6 bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-[32px] backdrop-blur-xl flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
          <BookOpen size={12} />
          Syllabus Tracks
        </div>
        <h2 className="text-xl font-bold text-white font-display">{course.title}</h2>
        <p className="text-xs text-white/70 leading-relaxed max-w-3xl">{course.description}</p>
      </div>

      {/* Subjects Grid */}
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">Course Subjects</h3>
          <p className="text-xs text-white/40">Choose a subject block to access secure video files and PDFs</p>
        </div>

        {subjects.length === 0 ? (
          <EmptyState title="No Subjects Registered" desc="This syllabus path currently has no registered subject blocks." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map(s => (
              <div
                key={s.subjectId}
                onClick={() => navigate(`/subject/${s.subjectId}`)}
                className="group relative p-[1px] rounded-[32px] bg-gradient-to-br from-purple-500/40 via-white/10 to-cyan-500/40 cursor-pointer transition-all duration-300 hover:scale-102 active:scale-98"
              >
                <div className="bg-[#0a0c12]/95 backdrop-blur-3xl rounded-[31px] p-5 flex flex-col justify-between h-full overflow-hidden border border-white/5">
                  <div>
                    <div className="aspect-video relative overflow-hidden rounded-2xl mb-4">
                      <img 
                        src={s.thumbnail} 
                        alt={s.title} 
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg text-xs font-bold w-fit flex items-center gap-1">
                        <Layers size={12} /> Subject Block
                      </span>
                      <h4 className="text-xs font-bold text-white group-hover:text-purple-400 transition truncate">{s.title}</h4>
                    </div>
                  </div>

                  <div className="pt-4 mt-6 border-t border-white/5 flex justify-between items-center text-[10px] text-white/40">
                    <span>Standard verification path</span>
                    <span className="text-purple-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition duration-200">
                      Open Lectures &rarr;
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// SUBJECT PAGE (LECTURES LIST)
export const SubjectView: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSubjectLectures = async () => {
      if (!subjectId) return;
      try {
        const sSnap = await getDoc(doc(db, 'subjects', subjectId));
        if (sSnap.exists()) {
          setSubject(sSnap.data() as Subject);
        }

        // Get lectures of this subject
        const lSnap = await getDocs(query(collection(db, 'lectures'), where('subjectId', '==', subjectId)));
        setLectures(lSnap.docs.map(d => d.data() as Lecture));
      } catch (err) {
        console.error('Error loading subject lectures:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSubjectLectures();
  }, [subjectId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!subject) {
    return <EmptyState title="Subject Not Found" desc="We couldn't locate the requested subject folder." />;
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <button 
        onClick={() => navigate(`/course/${subject.courseId}`)}
        className="flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition w-fit"
      >
        <ArrowLeft size={14} /> Back to Course Syllabus
      </button>

      {/* Header Info */}
      <div className="p-6 bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-[32px] backdrop-blur-xl flex flex-col gap-3">
        <span className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg text-[10px] font-bold w-fit flex items-center gap-1 uppercase tracking-wider">
          <Layers size={12} /> Active Subject
        </span>
        <h2 className="text-xl font-bold text-white font-display">{subject.title}</h2>
        <p className="text-xs text-white/40">Contains secured academic content and companion PDF files.</p>
      </div>

      {/* Lectures Grid */}
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">Lectures & Media</h3>
          <p className="text-xs text-white/40">Launch video in secure player. Companion PDFs support zoom controls.</p>
        </div>

        {lectures.length === 0 ? (
          <EmptyState title="No lectures available." desc="Please wait for the administrator to upload lectures." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lectures.map(l => (
              <div
                key={l.lectureId}
                className="group relative p-[1px] rounded-[32px] bg-gradient-to-br from-indigo-500/40 via-white/10 to-cyan-500/40 transition-all duration-300 hover:scale-102"
              >
                <div className="bg-[#0a0c12]/95 backdrop-blur-3xl rounded-[31px] p-5 flex flex-col justify-between h-full overflow-hidden border border-white/5">
                  <div>
                    <div className="aspect-video relative overflow-hidden bg-slate-950 rounded-2xl mb-4">
                      <img 
                        src={l.thumbnail} 
                        alt={l.title} 
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-85"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                        <button 
                          onClick={() => navigate(`/lecture/${l.lectureId}`)}
                          className="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white transform active:scale-95 transition shadow-lg"
                        >
                          <Play size={20} fill="currentColor" className="ml-0.5" />
                        </button>
                      </div>
                      <span className="absolute bottom-2 right-2 text-[10px] bg-slate-950/90 text-slate-300 font-mono px-2 py-0.5 rounded border border-white/10">
                        {l.duration}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5 mb-4">
                      <h4 className="text-xs font-bold text-white line-clamp-2">{l.title}</h4>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex gap-2">
                    <button
                      onClick={() => navigate(`/lecture/${l.lectureId}`)}
                      className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition flex justify-center items-center gap-1"
                    >
                      <Play size={12} fill="currentColor" />
                      Play Video
                    </button>
                    {l.pdfUrl && (
                      <button
                        onClick={() => navigate(`/lecture/${l.lectureId}?tab=pdf`)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-semibold rounded-lg text-xs border border-white/10 transition flex items-center justify-center gap-1"
                        title="Open Secured PDF"
                      >
                        <FileText size={12} />
                        PDF
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// LECTURE VIEW (SECURE PLAYER & SECURE PDF TABBED)
export const LecturePlayView: React.FC = () => {
  const { lectureId } = useParams<{ lectureId: string }>();
  const navigate = useNavigate();
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'video' | 'pdf'>('video');
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [syllabusLectures, setSyllabusLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  // Check initial search tab param
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam === 'pdf') {
      setActiveTab('pdf');
    } else {
      setActiveTab('video');
    }
  }, [lectureId]);

  useEffect(() => {
    const loadLectureDetails = async () => {
      if (!lectureId) return;
      setLoading(true);
      try {
        const lSnap = await getDoc(doc(db, 'lectures', lectureId));
        if (lSnap.exists()) {
          const lData = lSnap.data() as Lecture;
          setLecture(lData);

          // Get surrounding lectures in same subject folder
          const sSnap = await getDocs(query(collection(db, 'lectures'), where('subjectId', '==', lData.subjectId)));
          setSyllabusLectures(sSnap.docs.map(d => d.data() as Lecture));
        }
      } catch (err) {
        console.error('Error load lecture video page:', err);
      } finally {
        setLoading(false);
      }
    };
    loadLectureDetails();
  }, [lectureId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="w-full aspect-video bg-white/5 rounded-2xl" />
        <div className="h-6 bg-white/5 rounded w-1/2" />
        <div className="h-4 bg-white/5 rounded w-1/4" />
      </div>
    );
  }

  if (!lecture) {
    return <EmptyState title="Lecture Not Found" desc="We couldn't load the specified lecture media files." />;
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Back to syllabus directory */}
      <button 
        onClick={() => navigate(`/subject/${lecture.subjectId}`)}
        className="flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition w-fit"
      >
        <ArrowLeft size={14} /> Back to Subject Syllabus
      </button>

      {/* Tabs Switch bar */}
      <div className="flex justify-between items-center bg-white/5 border border-white/10 p-2 rounded-2xl backdrop-blur-md gap-4 flex-wrap">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('video')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'video'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-white/40 hover:text-white'
            }`}
          >
            <Play size={14} fill="currentColor" /> Secure Video Player
          </button>
          {lecture.pdfUrl && (
            <button
              onClick={() => setActiveTab('pdf')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'pdf'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <FileText size={14} /> Secured PDF Companion
            </button>
          )}
        </div>

        <div className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-1.5 rounded-xl border border-indigo-500/10">
          SECURE CHANNEL SYNC
        </div>
      </div>

      {/* Content View split container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main interactive media block */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {activeTab === 'video' ? (
            <div className="flex flex-col gap-4">
              <VideoPlayer 
                url={lecture.videoUrl} 
                lectureId={lecture.lectureId} 
                title={lecture.title} 
              />
              <div className="p-5 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl backdrop-blur-md flex flex-col gap-2">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Lecture File Info</span>
                <h3 className="text-sm font-bold text-white font-display">{lecture.title}</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Aura secure stream player enforces local telemetry logging. Use Spacebar for Play/Pause. Arrow keys seek video timing and volume adjustment. Press 'F' for full screen mode.
                </p>
              </div>
            </div>
          ) : (
            lecture.pdfUrl && <PDFViewer url={lecture.pdfUrl} title={`${lecture.title} - Companion Notes`} />
          )}
        </div>

        {/* Side Panel: Subject Playlist syllabus */}
        <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-5 rounded-2xl flex flex-col gap-4 backdrop-blur-md h-fit">
          <div className="border-b border-white/5 pb-2">
            <h4 className="text-xs font-extrabold text-white tracking-wide uppercase font-display">Subject Curriculums</h4>
            <p className="text-[10px] text-white/40">Playlist of secure subject items</p>
          </div>

          <div className="flex flex-col gap-2">
            {syllabusLectures.map(s => (
              <button
                key={s.lectureId}
                onClick={() => navigate(`/lecture/${s.lectureId}`)}
                className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition border ${
                  s.lectureId === lecture.lectureId
                    ? 'bg-indigo-600/15 border-indigo-500/30 text-white'
                    : 'bg-white/2 hover:bg-white/5 border-transparent text-white/60 hover:text-white'
                }`}
              >
                <div className="w-12 aspect-video rounded-md overflow-hidden relative bg-slate-950 flex-shrink-0">
                  <img src={s.thumbnail} alt={s.title} className="w-full h-full object-cover opacity-85" />
                  {s.lectureId === lecture.lectureId && (
                    <div className="absolute inset-0 bg-indigo-950/70 flex items-center justify-center">
                      <Play size={10} fill="currentColor" className="text-indigo-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className={`text-[10px] font-bold truncate ${s.lectureId === lecture.lectureId ? 'text-indigo-300' : 'text-slate-300'}`}>
                    {s.title}
                  </h5>
                  <span className="text-[8px] text-white/40 block font-mono mt-0.5">Duration: {s.duration}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

// DOWNLOADS EMPTY VIEW (ILLUSTRATION CAPABLE)
export const DownloadsView: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      <div className="max-w-md w-full bg-white/5 border border-white/10 p-8 rounded-[32px] backdrop-blur-xl text-center flex flex-col items-center gap-6 shadow-2xl">
        <div className="p-4 bg-indigo-500/10 rounded-full text-indigo-400 border border-white/10">
          <Download size={36} className="animate-pulse" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">Downloads Secure Vault</h2>
          <p className="text-xs text-white/40 mt-1">Platform assets are locked to prevent content piracy.</p>
        </div>
        <p className="text-xs text-white/60 leading-relaxed">
          To ensure strict copyright compliance, download access to high-fidelity videos and reference PDFs has been disabled on client browsers. Please utilize the secure embedded media engine.
        </p>
        <div className="w-full flex justify-between items-center p-3.5 bg-white/5 border border-white/10 rounded-xl text-[10px]">
          <span className="text-white/40 font-bold">ENCRYPTION ENGINE:</span>
          <span className="text-indigo-400 font-bold font-mono">CLIENT_ONLY_SANDBOX</span>
        </div>
      </div>
    </div>
  );
};

// USER PROFILE VIEW (STUDENT IDENTITY)
export const ProfileView: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhotoURL(user.photoURL || '');
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      toast.error('Student Name cannot be left blank');
      return;
    }

    setUpdating(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name,
        photoURL,
        lastSeen: new Date().toISOString()
      });
      toast.success('Student profile updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Error occurred while updating profile.');
    } finally {
      setUpdating(false);
    }
  };

  if (!user) {
    return <EmptyState title="Not Authenticated" desc="You must sign in to view your profile settings." />;
  }

  // Calculate diagnostic times
  const displayTotalTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      
      {/* Student Details and Photo form */}
      <div className="lg:col-span-1 bg-gradient-to-br from-white/10 to-transparent border border-white/10 p-6 rounded-[32px] backdrop-blur-xl flex flex-col gap-6 shadow-xl">
        <div className="flex flex-col items-center text-center gap-3">
          <img 
            src={user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}`} 
            alt={user.name} 
            className="w-24 h-24 rounded-full border-2 border-indigo-500 object-cover p-1 shadow-md"
          />
          <div>
            <h3 className="text-base font-extrabold text-white font-display">{user.name}</h3>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/15 px-2.5 py-1 rounded-full border border-indigo-500/10 uppercase tracking-widest mt-1 inline-block">
              {user.role}
            </span>
          </div>
          <p className="text-[10px] text-white/30 font-mono">UID: {user.uid}</p>
        </div>

        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Student Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Profile Avatar Image Link</label>
            <input
              type="text"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              placeholder="https://api.dicebear.com/..."
              className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={updating}
            className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
          >
            {updating ? 'Saving Profile...' : 'Save Profile Details'}
          </button>
        </form>
      </div>

      {/* Security Telemetry & System logs */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Live Device and diagnostics summary */}
        <div className="bg-gradient-to-br from-white/10 to-transparent border border-white/10 p-6 rounded-[32px] backdrop-blur-xl shadow-xl flex flex-col gap-4">
          <h4 className="text-sm font-extrabold text-white flex items-center gap-2 font-display">
            <Monitor size={16} className="text-indigo-400" />
            STUDENT WORKSPACE METRICS
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex gap-3 items-center backdrop-blur-md">
              <Cpu className="text-indigo-400" size={18} />
              <div>
                <span className="text-[10px] text-white/40 uppercase block font-semibold">Operating System</span>
                <span className="text-xs text-white font-bold">{user.os || 'Unknown OS'}</span>
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex gap-3 items-center backdrop-blur-md">
              <Globe className="text-purple-400" size={18} />
              <div>
                <span className="text-[10px] text-white/40 uppercase block font-semibold">Web Browser Client</span>
                <span className="text-xs text-white font-bold">{user.browser || 'Unknown Browser'}</span>
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex gap-3 items-center backdrop-blur-md">
              <Activity className="text-emerald-400" size={18} />
              <div>
                <span className="text-[10px] text-white/40 uppercase block font-semibold">Diagnostic IP Registry</span>
                <span className="text-xs text-white font-bold font-mono">127.0.0.1 (Verified IP)</span>
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex gap-3 items-center backdrop-blur-md">
              <Clock className="text-amber-400" size={18} />
              <div>
                <span className="text-[10px] text-white/40 uppercase block font-semibold">Student Account Created</span>
                <span className="text-xs text-white font-mono">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECURITY ALERTS AND DEVTOOLS INTERFERENCE TELEMETRY */}
        <div className="bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 p-6 rounded-[32px] backdrop-blur-xl shadow-xl flex flex-col gap-4">
          <h4 className="text-sm font-extrabold text-red-400 flex items-center gap-2 font-display">
            <AlertTriangle size={16} />
            DEVTOOLS INTERFERENCE & GUARD TELEMETRY
          </h4>
          <p className="text-xs text-white/50 leading-relaxed">
            The student platform leverages deep client-side DevTools inspections to guarantee examination and syllabus integrity. If DevTools is opened, an active logging session begins immediately.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/10 flex flex-col gap-1 backdrop-blur-md">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wide">DevTools Open Incidents</span>
              <span className="text-2xl font-black text-white">{user.devToolOpenCount || 0} times</span>
              <p className="text-[9px] text-white/30">Events logged to security log collection.</p>
            </div>

            <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/10 flex flex-col gap-1 backdrop-blur-md">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wide">Total Inspected Duration</span>
              <span className="text-2xl font-black text-white">{displayTotalTime(user.devToolTotalTime || 0)}</span>
              <p className="text-[9px] text-white/30">Cumulative active debugging time.</p>
            </div>
          </div>

          <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-[9px] text-white/30 flex items-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            <span>Automated 30s diagnostics loop running continuously. Keep console panel closed.</span>
          </div>
        </div>

      </div>
    </div>
  );
};
