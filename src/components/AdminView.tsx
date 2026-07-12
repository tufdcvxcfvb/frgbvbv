import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Users as UsersIcon, 
  BookOpen, 
  Layers, 
  Video, 
  Terminal, 
  AlertTriangle, 
  Ban, 
  TrendingUp, 
  Settings as SettingsIcon, 
  LogOut, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Sun, 
  Moon, 
  ShieldAlert, 
  Cpu, 
  Globe, 
  Play, 
  Activity,
  FileText
} from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Course, Subject, Lecture, UserProfile } from '../types';
import toast from 'react-hot-toast';

interface BlockedDevice {
  blockedId: string;
  deviceId: string;
  reason: string;
  blockedAt: string;
}

interface DeviceLog {
  logId: string;
  uid: string;
  deviceId: string;
  os: string;
  browser: string;
  openedAt: string;
  closedAt?: string;
  duration?: number;
  timestamp?: any;
}

export const AdminView: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Tabs State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [lightMode, setLightMode] = useState<boolean>(false);

  // Firestore Lists
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);
  const [lecturesList, setLecturesList] = useState<Lecture[]>([]);
  const [logsList, setLogsList] = useState<DeviceLog[]>([]);
  const [blockedList, setBlockedList] = useState<BlockedDevice[]>([]);

  // Search filter
  const [userSearch, setUserSearch] = useState<string>('');

  // Course Form
  const [showCourseForm, setShowCourseForm] = useState<boolean>(false);
  const [courseId, setCourseId] = useState<string>('');
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [courseIdKey, setCourseIdKey] = useState<string>('');
  const [courseThumbnail, setCourseThumbnail] = useState<string>('');
  const [courseDesc, setCourseDesc] = useState<string>('');

  // Subject Form
  const [showSubjectForm, setShowSubjectForm] = useState<boolean>(false);
  const [subjectId, setSubjectId] = useState<string>('');
  const [subjectTitle, setSubjectTitle] = useState<string>('');
  const [subjectIdKey, setSubjectIdKey] = useState<string>('');
  const [subjectCourse, setSubjectCourse] = useState<string>('');
  const [subjectThumbnail, setSubjectThumbnail] = useState<string>('');

  // Lecture Form
  const [showLectureForm, setShowLectureForm] = useState<boolean>(false);
  const [lectureId, setLectureId] = useState<string>('');
  const [lectureTitle, setLectureTitle] = useState<string>('');
  const [lectureIdKey, setLectureIdKey] = useState<string>('');
  const [lectureSubject, setLectureSubject] = useState<string>('');
  const [lectureDuration, setLectureDuration] = useState<string>('');
  const [lectureThumbnail, setLectureThumbnail] = useState<string>('');
  const [lectureVideoUrl, setLectureVideoUrl] = useState<string>('');
  const [lecturePdfUrl, setLecturePdfUrl] = useState<string>('');

  // Blocked Device Form
  const [showBlockForm, setShowBlockForm] = useState<boolean>(false);
  const [blockKey, setBlockKey] = useState<string>('');
  const [blockReason, setBlockReason] = useState<string>('');

  // Settings state (local for interface compatibility)
  const [devtoolsLockout, setDevtoolsLockout] = useState<boolean>(true);

  // Subscriptions setup
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsersList(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    }, err => console.error('Users listener error:', err));

    const unsubCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      setCoursesList(snapshot.docs.map(doc => ({ courseId: doc.id, ...doc.data() } as Course)));
    }, err => console.error('Courses listener error:', err));

    const unsubSubjects = onSnapshot(collection(db, 'subjects'), (snapshot) => {
      setSubjectsList(snapshot.docs.map(doc => ({ subjectId: doc.id, ...doc.data() } as Subject)));
    }, err => console.error('Subjects listener error:', err));

    const unsubLectures = onSnapshot(collection(db, 'lectures'), (snapshot) => {
      setLecturesList(snapshot.docs.map(doc => ({ lectureId: doc.id, ...doc.data() } as Lecture)));
    }, err => console.error('Lectures listener error:', err));

    const unsubLogs = onSnapshot(collection(db, 'deviceLogs'), (snapshot) => {
      setLogsList(snapshot.docs.map(doc => ({ logId: doc.id, ...doc.data() } as DeviceLog)));
    }, err => console.error('Logs listener error:', err));

    const unsubBlocked = onSnapshot(collection(db, 'blockedDevices'), (snapshot) => {
      setBlockedList(snapshot.docs.map(doc => ({ blockedId: doc.id, ...doc.data() } as BlockedDevice)));
    }, err => console.error('Blocked listener error:', err));

    return () => {
      unsubUsers();
      unsubCourses();
      unsubSubjects();
      unsubLectures();
      unsubLogs();
      unsubBlocked();
    };
  }, []);

  // Theme Sync effect
  useEffect(() => {
    if (lightMode) {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
    return () => {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    };
  }, [lightMode]);

  // Handle defaults in Course/Subject drop-downs
  useEffect(() => {
    if (coursesList.length > 0 && !subjectCourse) {
      setSubjectCourse(coursesList[0].courseId);
    }
  }, [coursesList, subjectCourse]);

  useEffect(() => {
    if (subjectsList.length > 0 && !lectureSubject) {
      setLectureSubject(subjectsList[0].subjectId);
    }
  }, [subjectsList, lectureSubject]);

  // Statistics Computations
  const stats = useMemo(() => {
    const totalUsers = usersList.length;
    const activeUsers = usersList.filter(u => u.status === 'active' && !u.blocked).length;
    const totalCourses = coursesList.length;
    const totalSubjects = subjectsList.length;
    const totalLectures = lecturesList.length;

    const now = Date.now();
    const onlineUsers = usersList.filter(u => {
      if (!u.lastSeen) return false;
      const diff = (now - new Date(u.lastSeen).getTime()) / 1000;
      return diff < 180; // 3 minutes seen
    }).length;

    const devtoolsAlerts = usersList.reduce((sum, u) => sum + (u.devToolOpenCount || 0), 0);
    const blockedCount = usersList.filter(u => u.blocked).length + blockedList.length;

    return {
      totalUsers,
      activeUsers,
      totalCourses,
      totalSubjects,
      totalLectures,
      onlineUsers,
      devtoolsAlerts,
      blockedCount
    };
  }, [usersList, coursesList, subjectsList, lecturesList, blockedList]);

  // Sorted list helper
  const sortedLogs = useMemo(() => {
    return [...logsList].sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
  }, [logsList]);

  const recentIncidents = useMemo(() => {
    return sortedLogs.slice(0, 5);
  }, [sortedLogs]);

  // User list searches
  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    if (!q) return usersList;
    return usersList.filter(u => 
      (u.name || '').toLowerCase().includes(q) || 
      (u.email || '').toLowerCase().includes(q) || 
      u.uid.toLowerCase().includes(q)
    );
  }, [usersList, userSearch]);

  // UTILS
  const formatTime = (isoStr?: string) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  // HANDLERS
  const handleToggleUserRole = async (u: UserProfile) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    try {
      await updateDoc(doc(db, 'users', u.uid), { role: newRole });
      toast.success(`Role changed to ${newRole} for ${u.name}`);
    } catch {
      toast.error('Failed to change user role');
    }
  };

  const handleToggleUserStatus = async (u: UserProfile) => {
    const newStatus = u.status === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, 'users', u.uid), { status: newStatus });
      toast.success(`User status changed to ${newStatus}`);
    } catch {
      toast.error('Failed to alter user status');
    }
  };

  const handleToggleUserBlock = async (u: UserProfile) => {
    const newBlocked = !u.blocked;
    try {
      await updateDoc(doc(db, 'users', u.uid), { blocked: newBlocked });
      toast.success(newBlocked ? 'User Suspended' : 'User Re-instated');
    } catch {
      toast.error('Failed to block/unblock user');
    }
  };

  // Course CRUD
  const handleOpenCourseForm = (c?: Course) => {
    if (c) {
      setCourseId(c.courseId);
      setCourseTitle(c.title);
      setCourseIdKey(c.courseId);
      setCourseThumbnail(c.thumbnail);
      setCourseDesc(c.description);
    } else {
      setCourseId('');
      setCourseTitle('');
      setCourseIdKey('');
      setCourseThumbnail('');
      setCourseDesc('');
    }
    setShowCourseForm(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = courseIdKey.trim().toLowerCase().replace(/\s+/g, '-');
    if (!cleanId) return;

    try {
      if (courseId) {
        // Update
        await updateDoc(doc(db, 'courses', courseId), {
          title: courseTitle.trim(),
          thumbnail: courseThumbnail.trim(),
          description: courseDesc.trim()
        });
        toast.success('Course syllabus modified');
      } else {
        // Create
        await setDoc(doc(db, 'courses', cleanId), {
          courseId: cleanId,
          title: courseTitle.trim(),
          thumbnail: courseThumbnail.trim(),
          description: courseDesc.trim(),
          createdAt: new Date().toISOString()
        });
        toast.success('Course syllabus initialized');
      }
      setShowCourseForm(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save course profile');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to delete this course syllabus? All child subjects and lectures will lose nesting references.')) return;
    try {
      await deleteDoc(doc(db, 'courses', id));
      toast.success('Course erased from database index');
    } catch {
      toast.error('Failed to delete course');
    }
  };

  // Subject CRUD
  const handleOpenSubjectForm = (s?: Subject) => {
    if (s) {
      setSubjectId(s.subjectId);
      setSubjectTitle(s.title);
      setSubjectIdKey(s.subjectId);
      setSubjectCourse(s.courseId);
      setSubjectThumbnail(s.thumbnail);
    } else {
      setSubjectId('');
      setSubjectTitle('');
      setSubjectIdKey('');
      setSubjectCourse(coursesList[0]?.courseId || '');
      setSubjectThumbnail('');
    }
    setShowSubjectForm(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = subjectIdKey.trim().toLowerCase().replace(/\s+/g, '-');
    if (!cleanId) return;

    try {
      if (subjectId) {
        await updateDoc(doc(db, 'subjects', subjectId), {
          title: subjectTitle.trim(),
          courseId: subjectCourse,
          thumbnail: subjectThumbnail.trim()
        });
        toast.success('Subject node modified');
      } else {
        await setDoc(doc(db, 'subjects', cleanId), {
          subjectId: cleanId,
          courseId: subjectCourse,
          title: subjectTitle.trim(),
          thumbnail: subjectThumbnail.trim(),
          createdAt: new Date().toISOString()
        });
        toast.success('Subject node initialized');
      }
      setShowSubjectForm(false);
    } catch {
      toast.error('Failed to save subject block');
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to delete this subject block?')) return;
    try {
      await deleteDoc(doc(db, 'subjects', id));
      toast.success('Subject removed');
    } catch {
      toast.error('Failed to delete subject');
    }
  };

  // Lecture CRUD
  const handleOpenLectureForm = (l?: Lecture) => {
    if (l) {
      setLectureId(l.lectureId);
      setLectureTitle(l.title);
      setLectureIdKey(l.lectureId);
      setLectureSubject(l.subjectId);
      setLectureDuration(l.duration);
      setLectureThumbnail(l.thumbnail);
      setLectureVideoUrl(l.videoUrl);
      setLecturePdfUrl(l.pdfUrl || '');
    } else {
      setLectureId('');
      setLectureTitle('');
      setLectureIdKey('');
      setLectureSubject(subjectsList[0]?.subjectId || '');
      setLectureDuration('');
      setLectureThumbnail('');
      setLectureVideoUrl('');
      setLecturePdfUrl('');
    }
    setShowLectureForm(true);
  };

  const handleSaveLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = lectureIdKey.trim().toLowerCase().replace(/\s+/g, '-');
    if (!cleanId) return;

    try {
      if (lectureId) {
        await updateDoc(doc(db, 'lectures', lectureId), {
          title: lectureTitle.trim(),
          subjectId: lectureSubject,
          duration: lectureDuration.trim(),
          thumbnail: lectureThumbnail.trim(),
          videoUrl: lectureVideoUrl.trim(),
          pdfUrl: lecturePdfUrl.trim() || null
        });
        toast.success('Lecture tracks updated');
      } else {
        await setDoc(doc(db, 'lectures', cleanId), {
          lectureId: cleanId,
          subjectId: lectureSubject,
          title: lectureTitle.trim(),
          duration: lectureDuration.trim(),
          thumbnail: lectureThumbnail.trim(),
          videoUrl: lectureVideoUrl.trim(),
          pdfUrl: lecturePdfUrl.trim() || null,
          createdAt: new Date().toISOString()
        });
        toast.success('Lecture tracks initialized');
      }
      setShowLectureForm(false);
    } catch {
      toast.error('Failed to save lecture details');
    }
  };

  const handleDeleteLecture = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to delete this secure video lecture?')) return;
    try {
      await deleteDoc(doc(db, 'lectures', id));
      toast.success('Lecture removed');
    } catch {
      toast.error('Failed to delete lecture');
    }
  };

  // Block Devices CRUD
  const handleSaveBlockDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetKey = blockKey.trim();
    if (!targetKey) return;

    try {
      await setDoc(doc(db, 'blockedDevices', targetKey), {
        deviceId: targetKey,
        reason: blockReason.trim(),
        blockedAt: new Date().toISOString()
      });
      toast.success('Device added to platform blacklist');
      setShowBlockForm(false);
      setBlockKey('');
      setBlockReason('');
    } catch {
      toast.error('Failed to blacklist target');
    }
  };

  const handleUnblockDevice = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'blockedDevices', id));
      toast.success('Device authorization reinstated');
    } catch {
      toast.error('Failed to authorize access');
    }
  };

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to purge all device telemetry logs from Firestore database?')) return;
    try {
      const promises = logsList.map(log => deleteDoc(doc(db, 'deviceLogs', log.logId)));
      await Promise.all(promises);
      toast.success('All device telemetry incidents cleared');
    } catch {
      toast.error('Failed to purge logs');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out of admin dashboard');
      navigate('/login');
    } catch {
      toast.error('Failed to logout');
    }
  };

  // Seed DB Action
  const handleSeedDatabase = async () => {
    if (coursesList.length > 0) {
      if (!confirm('The system already contains courses. Seeding additional demo curriculums might duplicate item entries. Continue?')) return;
    }

    try {
      const sampleCourses = [
        {
          courseId: 'ts-architecture',
          title: 'Advanced TypeScript Systems',
          thumbnail: 'https://images.unsplash.com/photo-1516116211223-5c359a36298a?q=80&w=1200&auto=format&fit=crop',
          description: 'Explore industrial grade architectural design patterns, type stripping mechanics, compiler configuration matrices, and safe runtime type assertions.'
        },
        {
          courseId: 'container-virtualization',
          title: 'Industrial Container Virtualization',
          thumbnail: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=1200&auto=format&fit=crop',
          description: 'Nail advanced Linux namespace operations, secure sandboxed virtual machines, multi-stage pipeline containers, and reverse proxy deployments.'
        }
      ];

      for (const c of sampleCourses) {
        await setDoc(doc(db, 'courses', c.courseId), {
          ...c,
          createdAt: new Date().toISOString()
        });
      }

      const sampleSubjects = [
        {
          subjectId: 'ts-decorators-meta',
          courseId: 'ts-architecture',
          title: 'Metadata Reflection & Decorators',
          thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop'
        },
        {
          subjectId: 'docker-networking',
          courseId: 'container-virtualization',
          title: 'Docker Subnetting & Bridge Networks',
          thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200&auto=format&fit=crop'
        }
      ];

      for (const s of sampleSubjects) {
        await setDoc(doc(db, 'subjects', s.subjectId), {
          ...s,
          createdAt: new Date().toISOString()
        });
      }

      const sampleLectures = [
        {
          lectureId: 'lecture-meta-reflection',
          subjectId: 'ts-decorators-meta',
          title: 'Implementing Safe Metadata Decorators at Class boundaries',
          thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop',
          videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          duration: '12:45'
        },
        {
          lectureId: 'lecture-docker-subnets',
          subjectId: 'docker-networking',
          title: 'Bridge Networks and Multi-Container DNS resolution',
          thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=1200&auto=format&fit=crop',
          videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          duration: '18:12'
        }
      ];

      for (const l of sampleLectures) {
        await setDoc(doc(db, 'lectures', l.lectureId), {
          ...l,
          createdAt: new Date().toISOString()
        });
      }

      toast.success('Database seeded successfully!');
    } catch {
      toast.error('Failed to seed catalog data');
    }
  };

  // Demographics computations
  const analyticsData = useMemo(() => {
    const browsers: Record<string, number> = {};
    const oses: Record<string, number> = {};

    usersList.forEach(u => {
      const b = u.browser || 'Unknown Browser';
      const o = u.os || 'Unknown OS';
      browsers[b] = (browsers[b] || 0) + 1;
      oses[o] = (oses[o] || 0) + 1;
    });

    const browserList = Object.entries(browsers).map(([name, count]) => {
      const pct = usersList.length > 0 ? Math.round((count / usersList.length) * 100) : 0;
      return { name, count, pct };
    });

    const osList = Object.entries(oses).map(([name, count]) => {
      const pct = usersList.length > 0 ? Math.round((count / usersList.length) * 100) : 0;
      return { name, count, pct };
    });

    return { browserList, osList };
  }, [usersList]);

  return (
    <div className={`min-h-screen flex flex-col md:flex-row relative bg-[#05060b] text-slate-100 font-sans transition-colors duration-300 ${lightMode ? 'light' : ''}`}>
      
      {/* Background circles */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] aspect-square rounded-full bg-indigo-500/10 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] aspect-square rounded-full bg-purple-500/10 blur-[120px] animate-pulse"></div>
      </div>

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-slate-900/30 border-r border-white/10 flex flex-col justify-between p-6 backdrop-blur-xl shrink-0 transition-transform md:translate-x-0 dark:bg-slate-950/20 light:bg-white light:border-slate-200">
        <div className="flex flex-col gap-8">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-md">
              A
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-tight text-white font-display light:text-slate-800">AURA ADMIN</h2>
              <span className="text-[9px] font-mono text-indigo-400 font-bold tracking-widest uppercase light:text-indigo-600">Console v1.2</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex flex-col gap-1.5">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} /> },
              { id: 'users', label: 'Users', icon: <UsersIcon size={14} /> },
              { id: 'courses', label: 'Courses', icon: <BookOpen size={14} /> },
              { id: 'subjects', label: 'Subjects', icon: <Layers size={14} /> },
              { id: 'lectures', label: 'Lectures', icon: <Video size={14} /> },
              { id: 'logs', label: 'Device Logs', icon: <Terminal size={14} /> },
              { id: 'devtools', label: 'DevTools Monitor', icon: <AlertTriangle size={14} /> },
              { id: 'blocked', label: 'Blocked Devices', icon: <Ban size={14} /> },
              { id: 'analytics', label: 'Analytics', icon: <TrendingUp size={14} /> },
              { id: 'settings', label: 'Settings', icon: <SettingsIcon size={14} /> }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-xs font-medium border border-transparent transition-all duration-200 cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-indigo-600/15 border-indigo-500/20 text-indigo-400 font-semibold shadow-[inset_0_0_12px_rgba(99,102,241,0.1)] light:bg-indigo-50 light:text-indigo-600'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 light:text-slate-600 light:hover:bg-slate-100'
                }`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="flex flex-col gap-4 border-t border-white/5 pt-4 mt-6 light:border-slate-200">
          
          {/* User Profile */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src={user?.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.name || 'admin'}`} 
                className="w-8 h-8 rounded-full border border-indigo-500 bg-slate-900 object-cover" 
                alt="Admin"
              />
              <div className="overflow-hidden max-w-[110px]">
                <p className="text-[11px] font-bold text-white truncate light:text-slate-800">{user?.name || 'Administrator'}</p>
                <span className="text-[8px] text-white/40 block uppercase tracking-widest font-bold light:text-slate-400">SUPER_ADMIN</span>
              </div>
            </div>

            {/* Theme Toggle */}
            <button 
              onClick={() => setLightMode(!lightMode)}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition light:bg-slate-100 light:border-slate-200 light:text-slate-600"
              title="Toggle Theme"
            >
              {lightMode ? <Moon size={14} /> : <Sun size={14} />}
            </button>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-600 text-red-400 hover:text-white font-bold rounded-xl transition text-xs flex justify-center items-center gap-1.5 light:bg-red-50 light:border-red-100"
          >
            <LogOut size={12} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN BODY VIEW CONTENT */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-h-screen">
        
        {/* Header Top Bar */}
        <header className="flex justify-between items-center pb-6 mb-6 border-b border-white/10 light:border-slate-200">
          <div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest light:text-indigo-600">Active System Monitor</span>
            <h1 className="text-xl font-extrabold tracking-tight text-white font-display uppercase light:text-slate-800">
              {activeTab === 'dashboard' ? 'System Overview' : `${activeTab} Management`}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] text-white/50 font-mono light:text-slate-400">Live Sync Connected</span>
          </div>
        </header>

        {/* ================== VIEW: DASHBOARD ================== */}
        {activeTab === 'dashboard' && (
          <section className="flex flex-col gap-8 animate-fade-in">
            
            {/* Dashboard Statistics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Total Users', value: stats.totalUsers, icon: '👥' },
                { title: 'Active Users', value: stats.activeUsers, icon: '🟢' },
                { title: 'Total Courses', value: stats.totalCourses, icon: '📚' },
                { title: 'Total Subjects', value: stats.totalSubjects, icon: '🧬' },
                { title: 'Total Lectures', value: stats.totalLectures, icon: '🎥' },
                { title: 'Online Users', value: stats.onlineUsers, icon: '⚡' },
                { title: 'DevTools Alerts', value: stats.devtoolsAlerts, icon: '🚨' },
                { title: 'Blocked Devices', value: stats.blockedCount, icon: '🚫' }
              ].map((stat, idx) => (
                <div 
                  key={idx}
                  className="p-5 rounded-3xl bg-white/3 border border-white/7 backdrop-blur-xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 light:bg-white light:border-slate-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="block text-[10px] font-bold text-white/40 uppercase tracking-wider light:text-slate-400">{stat.title}</span>
                      <span className="block text-2xl font-black font-display text-white mt-1 light:text-slate-800">{stat.value}</span>
                    </div>
                    <span className="text-lg p-2 rounded-xl bg-white/5 border border-white/5 light:bg-slate-100 light:border-slate-200">{stat.icon}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick actions & System log */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Incidents Table */}
              <div className="lg:col-span-2 bg-white/5 border border-white/10 p-6 rounded-[24px] backdrop-blur-xl light:bg-white light:border-slate-200">
                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider font-display light:text-slate-800">Recent Device Incidents</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr class="text-white/40 border-b border-white/5 uppercase tracking-wider text-[10px] light:text-slate-400 light:border-slate-100">
                        <th className="py-2.5">User</th>
                        <th className="py-2.5">Device ID</th>
                        <th className="py-2.5">OS/Browser</th>
                        <th className="py-2.5">Opened At</th>
                        <th className="py-2.5">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 light:divide-slate-100">
                      {recentIncidents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-white/30 text-xs light:text-slate-400">
                            No recent device incidents reported.
                          </td>
                        </tr>
                      ) : (
                        recentIncidents.map((log) => {
                          const matchedUser = usersList.find(u => u.uid === log.uid) || { name: 'Unknown User', email: '' };
                          return (
                            <tr key={log.logId} className="hover:bg-white/2 text-white/80 light:text-slate-700 light:hover:bg-slate-50">
                              <td className="py-3">
                                <p className="font-bold text-white light:text-slate-800">{matchedUser.name}</p>
                                <span className="text-[9px] text-white/40 block font-mono mt-0.5">{matchedUser.email}</span>
                              </td>
                              <td className="py-3 font-mono text-[10px] text-indigo-400 light:text-indigo-600">{log.deviceId || 'Unknown'}</td>
                              <td className="py-3 text-[10px]">{log.os} / {log.browser}</td>
                              <td className="py-3 font-mono text-[10px] text-white/40">{formatTime(log.openedAt)}</td>
                              <td className="py-3">
                                <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/10 rounded font-mono text-[9px] light:bg-amber-50">
                                  {log.duration ? `${log.duration}s` : 'Active'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Platform shortcuts operations */}
              <div className="bg-white/5 border border-white/10 p-6 rounded-[24px] backdrop-blur-xl flex flex-col gap-4 light:bg-white light:border-slate-200">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display light:text-slate-800">Platform Operations</h3>
                <p className="text-xs text-white/50 leading-relaxed light:text-slate-500">
                  Direct administrative shortcuts to populate secure Firestore collections or configurations.
                </p>
                
                <div className="flex flex-col gap-2 mt-2">
                  <button 
                    onClick={() => setActiveTab('courses')}
                    className="flex items-center gap-2 w-full p-3 rounded-xl bg-white/3 border border-white/5 text-xs font-semibold text-slate-300 hover:bg-indigo-600/10 hover:border-indigo-500/20 hover:text-white transition light:bg-slate-50 light:border-slate-200 light:text-slate-700"
                  >
                    📚 Manage Courses
                  </button>
                  <button 
                    onClick={() => setActiveTab('subjects')}
                    className="flex items-center gap-2 w-full p-3 rounded-xl bg-white/3 border border-white/5 text-xs font-semibold text-slate-300 hover:bg-indigo-600/10 hover:border-indigo-500/20 hover:text-white transition light:bg-slate-50 light:border-slate-200 light:text-slate-700"
                  >
                    🧬 Manage Subjects
                  </button>
                  <button 
                    onClick={() => setActiveTab('lectures')}
                    className="flex items-center gap-2 w-full p-3 rounded-xl bg-white/3 border border-white/5 text-xs font-semibold text-slate-300 hover:bg-indigo-600/10 hover:border-indigo-500/20 hover:text-white transition light:bg-slate-50 light:border-slate-200 light:text-slate-700"
                  >
                    🎥 Manage Lectures
                  </button>
                  <button 
                    onClick={handleSeedDatabase}
                    className="w-full py-2.5 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 light:bg-indigo-50 light:border-indigo-100"
                  >
                    ⚡ Seed Database Catalog
                  </button>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* ================== VIEW: USERS ================== */}
        {activeTab === 'users' && (
          <section className="flex flex-col gap-6 animate-fade-in">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <p className="text-xs text-white/50 light:text-slate-500">Manage student enrollment, roles, suspended accounts, and telemetry details.</p>
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-3.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search by name/email..." 
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs outline-none focus:border-indigo-500 transition w-60 light:bg-white light:border-slate-200 light:text-slate-800 light:placeholder-slate-400"
                />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[24px] overflow-hidden backdrop-blur-xl light:bg-white light:border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-white/40 border-b border-white/10 uppercase tracking-wider text-[10px] font-bold light:bg-slate-50 light:text-slate-400 light:border-slate-100">
                      <th className="p-4">User Details</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Telemetry Metrics</th>
                      <th className="p-4">Last Seen</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300 light:divide-slate-100 light:text-slate-700">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-white/30 light:text-slate-400">No users found match your query.</td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.uid} className="hover:bg-white/2 light:hover:bg-slate-50">
                          <td className="p-4 flex items-center gap-3">
                            <img 
                              src={u.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.name}`} 
                              className="w-10 h-10 rounded-full border border-white/10 bg-[#0a0c12] object-cover"
                              alt="Avatar"
                            />
                            <div>
                              <p className="font-bold text-white light:text-slate-800">{u.name}</p>
                              <span className="text-[10px] text-white/40 font-mono block mt-0.5">{u.email}</span>
                            </div>
                          </td>
                          <td className="p-4 uppercase font-mono text-[10px]">
                            <span className={`px-2 py-0.5 rounded-md font-bold ${
                              u.role === 'admin' 
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/15' 
                                : 'bg-white/5 text-white/40'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4 uppercase font-mono text-[10px]">
                            <span className={`px-2 py-0.5 rounded-md font-bold ${
                              u.blocked 
                                ? 'bg-red-500/10 text-red-400 border border-red-500/15' 
                                : u.status === 'active' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' 
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/15'
                            }`}>
                              {u.blocked ? 'BLOCKED' : u.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-[10px]">
                            <p className="text-white/80 light:text-slate-800">Count: <span className="font-bold text-amber-400">{u.devToolOpenCount || 0} alerts</span></p>
                            <span className="text-white/40 block mt-0.5">Time: {(u.devToolTotalTime || 0)}s</span>
                          </td>
                          <td className="p-4 font-mono text-[10px] text-white/50">{formatTime(u.lastSeen || u.lastLogin)}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-1.5 flex-wrap">
                              <button 
                                onClick={() => handleToggleUserRole(u)}
                                className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold transition light:bg-slate-100"
                              >
                                Toggle Role
                              </button>
                              <button 
                                onClick={() => handleToggleUserStatus(u)}
                                className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold transition light:bg-slate-100"
                              >
                                Toggle Status
                              </button>
                              <button 
                                onClick={() => handleToggleUserBlock(u)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition border ${
                                  u.blocked 
                                    ? 'bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border-emerald-500/10' 
                                    : 'bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border-red-500/10'
                                }`}
                              >
                                {u.blocked ? 'Authorize' : 'Suspend'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ================== VIEW: COURSES ================== */}
        {activeTab === 'courses' && (
          <section className="flex flex-col gap-6 animate-fade-in">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <p className="text-xs text-white/50 light:text-slate-500">Add, edit, or delete verified courses. All entries are synced instantly to the Cloud.</p>
              <button 
                onClick={() => handleOpenCourseForm()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1"
              >
                <Plus size={14} /> Add Course
              </button>
            </div>

            {/* Course Form Modal/Block */}
            {showCourseForm && (
              <div className="bg-white/5 border border-white/10 p-6 rounded-[24px] backdrop-blur-xl flex flex-col gap-4 animate-slide-in light:bg-white light:border-slate-200">
                <h3 className="text-sm font-bold text-white font-display light:text-slate-800">
                  {courseId ? 'Edit Course Syllabus' : 'Create Course Block'}
                </h3>
                <form onSubmit={handleSaveCourse} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider light:text-slate-400">Course Name/Title</label>
                    <input 
                      type="text" 
                      required 
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      placeholder="e.g. Full-Stack Web Architecture" 
                      className="form-input bg-[#0c0d13] border-white/10 text-white rounded-xl py-2.5 px-3.5 text-xs focus:border-indigo-500 focus:outline-none transition light:bg-slate-50 light:border-slate-200 light:text-slate-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider light:text-slate-400">Course ID (unique key)</label>
                    <input 
                      type="text" 
                      required 
                      disabled={!!courseId}
                      value={courseIdKey}
                      onChange={(e) => setCourseIdKey(e.target.value)}
                      placeholder="e.g. fullstack-web-architecture" 
                      className="form-input bg-[#0c0d13] border-white/10 text-white rounded-xl py-2.5 px-3.5 text-xs focus:border-indigo-500 focus:outline-none transition disabled:opacity-50 light:bg-slate-50 light:border-slate-200 light:text-slate-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider light:text-slate-400">Thumbnail Image Link</label>
                    <input 
                      type="text" 
                      required 
                      value={courseThumbnail}
                      onChange={(e) => setCourseThumbnail(e.target.value)}
                      placeholder="https://images.unsplash.com/..." 
                      className="form-input bg-[#0c0d13] border-white/10 text-white rounded-xl py-2.5 px-3.5 text-xs focus:border-indigo-500 focus:outline-none transition light:bg-slate-50 light:border-slate-200 light:text-slate-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider light:text-slate-400">Description</label>
                    <textarea 
                      required 
                      rows={3} 
                      value={courseDesc}
                      onChange={(e) => setCourseDesc(e.target.value)}
                      placeholder="Enter academic track curriculum descriptions..." 
                      className="form-input bg-[#0c0d13] border-white/10 text-white rounded-xl py-2.5 px-3.5 text-xs focus:border-indigo-500 focus:outline-none transition light:bg-slate-50 light:border-slate-200 light:text-slate-800"
                    />
                  </div>
                  <div className="flex gap-2 justify-end md:col-span-2 mt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowCourseForm(false)}
                      className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-bold transition light:bg-slate-100 light:text-slate-700"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow"
                    >
                      Save Course
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Grid of Course cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coursesList.length === 0 ? (
                <div className="col-span-full p-8 text-center text-white/30 light:text-slate-400">No courses defined. Generate database elements using 'Seed Database Catalog' helper.</div>
              ) : (
                coursesList.map((c) => (
                  <div 
                    key={c.courseId}
                    className="p-5 rounded-[32px] bg-slate-900/40 border border-white/5 backdrop-blur-3xl overflow-hidden flex flex-col justify-between h-full light:bg-white light:border-slate-200"
                  >
                    <div>
                      <div className="aspect-video relative overflow-hidden rounded-2xl mb-4">
                        <img src={c.thumbnail} className="w-full h-full object-cover" alt={c.title} />
                      </div>
                      <h4 className="text-sm font-bold text-white truncate light:text-slate-800">{c.title}</h4>
                      <p className="text-xs text-white/50 line-clamp-2 mt-1 leading-relaxed light:text-slate-500">{c.description}</p>
                      <span className="inline-block mt-2 font-mono text-[9px] text-indigo-400 font-bold light:text-indigo-600">{c.courseId}</span>
                    </div>
                    
                    <div className="flex gap-2 mt-6 pt-4 border-t border-white/5 light:border-slate-100">
                      <button 
                        onClick={() => handleOpenCourseForm(c)}
                        className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1 light:bg-slate-100 light:text-slate-700"
                      >
                        <Edit2 size={10} /> Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteCourse(c.courseId)}
                        className="py-1.5 px-3 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/10 rounded-xl text-[10px] font-bold transition flex items-center gap-1 light:bg-red-50 light:border-red-100"
                      >
                        <Trash2 size={10} /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* ================== VIEW: SUBJECTS ================== */}
        {activeTab === 'subjects' && (
          <section className="flex flex-col gap-6 animate-fade-in">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <p className="text-xs text-white/50 light:text-slate-500">Subjects structure curriculum inside the parent Courses.</p>
              <button 
                onClick={() => handleOpenSubjectForm()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1"
              >
                <Plus size={14} /> Add Subject Block
              </button>
            </div>

            {/* Subject Form Modal */}
            {showSubjectForm && (
              <div className="bg-white/5 border border-white/10 p-6 rounded-[24px] backdrop-blur-xl flex flex-col gap-4 animate-slide-in light:bg-white light:border-slate-200">
                <h3 className="text-sm font-bold text-white font-display light:text-slate-800">
                  {subjectId ? 'Edit Subject block' : 'Create Subject Block'}
                </h3>
                <form onSubmit={handleSaveSubject} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider light:text-slate-400">Subject Name/Title</label>
                    <input 
                      type="text" 
                      required 
                      value={subjectTitle}
                      onChange={(e) => setSubjectTitle(e.target.value)}
                      placeholder="e.g. Advanced Docker Containers" 
                      className="form-input bg-[#0c0d13] border-white/10 text-white rounded-xl py-2.5 px-3.5 text-xs focus:border-indigo-500 focus:outline-none transition light:bg-slate-50 light:border-slate-200 light:text-slate-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider light:text-slate-400">Subject ID (unique key)</label>
                    <input 
                      type="text" 
                      required 
                      disabled={!!subjectId}
                      value={subjectIdKey}
                      onChange={(e) => setSubjectIdKey(e.target.value)}
                      placeholder="e.g. docker-containers-advanced" 
                      className="form-input bg-[#0c0d13] border-white/10 text-white rounded-xl py-2.5 px-3.5 text-xs focus:border-indigo-500 focus:outline-none transition disabled:opacity-50 light:bg-slate-50 light:border-slate-200 light:text-slate-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider light:text-slate-400">Parent Course</label>
                    <select 
                      required 
                      value={subjectCourse}
                      onChange={(e) => setSubjectCourse(e.target.value)}
                      className="form-input bg-[#0c0d13] border-white/10 text-white rounded-xl py-2.5 px-3.5 text-xs focus:border-indigo-500 focus:outline-none transition light:bg-slate-50 light:border-slate-200 light:text-slate-800"
                    >
                      {coursesList.map(c => (
                        <option key={c.courseId} value={c.courseId}>{c.title} ({c.courseId})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider light:text-slate-400">Thumbnail Image Link</label>
                    <input 
                      type="text" 
                      required 
                      value={subjectThumbnail}
                      onChange={(e) => setSubjectThumbnail(e.target.value)}
                      placeholder="https://images.unsplash.com/..." 
                      className="form-input bg-[#0c0d13] border-white/10 text-white rounded-xl py-2.5 px-3.5 text-xs focus:border-indigo-500 focus:outline-none transition light:bg-slate-50 light:border-slate-200 light:text-slate-800"
                    />
                  </div>
                  <div className="flex gap-2 justify-end md:col-span-2 mt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowSubjectForm(false)}
                      className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-bold transition light:bg-slate-100 light:text-slate-700"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow"
                    >
                      Save Subject
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Subjects Table */}
            <div className="bg-white/5 border border-white/10 rounded-[24px] overflow-hidden backdrop-blur-xl light:bg-white light:border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-white/5 text-white/40 border-b border-white/10 uppercase tracking-wider text-[10px] font-bold light:bg-slate-50 light:text-slate-400 light:border-slate-100">
                    <th className="p-4">Thumbnail</th>
                    <th className="p-4">Subject Title</th>
                    <th className="p-4">Parent Course</th>
                    <th className="p-4">Created At</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300 light:divide-slate-100 light:text-slate-700">
                  {subjectsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-white/30 light:text-slate-400">No subjects configured. Use "Add Subject Block" above.</td>
                    </tr>
                  ) : (
                    subjectsList.map((s) => (
                      <tr key={s.subjectId} className="hover:bg-white/2 light:hover:bg-slate-50">
                        <td className="p-4">
                          <img src={s.thumbnail} className="w-12 h-8 rounded-lg object-cover border border-white/10" alt="SThumbnail" />
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-white light:text-slate-800">{s.title}</p>
                          <span className="text-[9px] text-white/40 font-mono block mt-0.5">{s.subjectId}</span>
                        </td>
                        <td className="p-4 font-mono text-[10px] text-indigo-400 light:text-indigo-600">{s.courseId}</td>
                        <td className="p-4 font-mono text-[10px] text-white/40">{formatTime(s.createdAt)}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button 
                              onClick={() => handleOpenSubjectForm(s)}
                              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] font-bold transition light:bg-slate-100 light:text-slate-700"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteSubject(s.subjectId)}
                              className="px-2.5 py-1 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-[10px] font-bold border border-red-500/10 transition light:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ================== VIEW: LECTURES ================== */}
        {activeTab === 'lectures' && (
          <section className="flex flex-col gap-6 animate-fade-in">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <p className="text-xs text-white/50 light:text-slate-500">Lectures anchor secure video HLS streams and companion PDF files.</p>
              <button 
                onClick={() => handleOpenLectureForm()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1"
              >
                <Plus size={14} /> Add Lecture
              </button>
            </div>

            {/* Lecture Form Modal */}
            {showLectureForm && (
              <div className="bg-white/5 border border-white/10 p-6 rounded-[24px] backdrop-blur-xl flex flex-col gap-4 animate-slide-in light:bg-white light:border-slate-200">
                <h3 className="text-sm font-bold text-white font-display light:text-slate-800">
                  {lectureId ? 'Edit Lecture Details' : 'Create Lecture Block'}
                </h3>
                <form onSubmit={handleSaveLecture} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider light:text-slate-400">Lecture Title</label>
                    <input 
                      type="text" 
                      required 
                      value={lectureTitle}
                      onChange={(e) => setLectureTitle(e.target.value)}
                      placeholder="e.g. Multi-stage Docker Builds" 
                      className="form-input bg-[#0c0d13] border-white/10 text-white rounded-xl py-2.5 px-3.5 text-xs focus:border-indigo-500 focus:outline-none transition light:bg-slate-50 light:border-slate-200 light:text-slate-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider light:text-slate-400">Lecture ID (unique key)</label>
                    <input 
                      type="text" 
                      required 
                      disabled={!!lectureId}
                      value={lectureIdKey}
                      onChange={(e) => setLectureIdKey(e.target.value)}
                      placeholder="e.g. docker-multistage-builds" 
                      className="form-input bg-[#0c0d13] border-white/10 text-white rounded-xl py-2.5 px-3.5 text-xs focus:border-indigo-500 focus:outline-none transition disabled:opacity-50 light:bg-slate-50 light:border-slate-200 light:text-slate-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider light:text-slate-400">Parent Subject</label>
                    <select 
                      required 
                      value={lectureSubject}
                      onChange={(e) => setLectureSubject(e.target.value)}
                      className="form-input bg-[#0c0d13] border-white/10 text-white rounded-xl py-2.5 px-3.5 text-xs focus:border-indigo-500 focus:outline-none transition light:bg-slate-50 light:border-slate-200 light:text-slate-800"
                    >
                      {subjectsList.map(s => (
                        <option key={s.subjectId} value={s.subjectId}>{s.title} ({s.subjectId})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider light:text-slate-400">Duration String</label>
                    <input 
                      type="text" 
                      required 
                      value={lectureDuration}
                      onChange={(e) => setLectureDuration(e.target.value)}
                      placeholder="e.g. 14:25" 
                      className="form-input bg-[#0c0d13] border-white/10 text-white rounded-xl py-2.5 px-3.5 text-xs focus:border-indigo-500 focus:outline-none transition light:bg-slate-50 light:border-slate-200 light:text-slate-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider light:text-slate-400">Thumbnail Image Link</label>
                    <input 
                      type="text" 
                      required 
                      value={lectureThumbnail}
                      onChange={(e) => setLectureThumbnail(e.target.value)}
                      placeholder="https://images.unsplash.com/..." 
                      className="form-input bg-[#0c0d13] border-white/10 text-white rounded-xl py-2.5 px-3.5 text-xs focus:border-indigo-500 focus:outline-none transition light:bg-slate-50 light:border-slate-200 light:text-slate-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider light:text-slate-400">Secure Video URL (HLS / MP4)</label>
                    <input 
                      type="text" 
                      required 
                      value={lectureVideoUrl}
                      onChange={(e) => setLectureVideoUrl(e.target.value)}
                      placeholder="https://test-streams.mux.dev/..." 
                      className="form-input bg-[#0c0d13] border-white/10 text-white rounded-xl py-2.5 px-3.5 text-xs focus:border-indigo-500 focus:outline-none transition light:bg-slate-50 light:border-slate-200 light:text-slate-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider light:text-slate-400">Companion PDF Link (Optional)</label>
                    <input 
                      type="text" 
                      value={lecturePdfUrl}
                      onChange={(e) => setLecturePdfUrl(e.target.value)}
                      placeholder="https://www.w3.org/..." 
                      className="form-input bg-[#0c0d13] border-white/10 text-white rounded-xl py-2.5 px-3.5 text-xs focus:border-indigo-500 focus:outline-none transition light:bg-slate-50 light:border-slate-200 light:text-slate-800"
                    />
                  </div>
                  <div className="flex gap-2 justify-end md:col-span-2 mt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowLectureForm(false)}
                      className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-bold transition light:bg-slate-100 light:text-slate-700"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow"
                    >
                      Save Lecture
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Lectures Table */}
            <div className="bg-white/5 border border-white/10 rounded-[24px] overflow-hidden backdrop-blur-xl light:bg-white light:border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-white/5 text-white/40 border-b border-white/10 uppercase tracking-wider text-[10px] font-bold light:bg-slate-50 light:text-slate-400 light:border-slate-100">
                    <th className="p-4">Thumbnail</th>
                    <th className="p-4">Lecture Title</th>
                    <th className="p-4">Parent Subject</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">PDF Asset</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300 light:divide-slate-100 light:text-slate-700">
                  {lecturesList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-white/30 light:text-slate-400">No lectures configured. Use "Add Lecture" above.</td>
                    </tr>
                  ) : (
                    lecturesList.map((l) => (
                      <tr key={l.lectureId} className="hover:bg-white/2 light:hover:bg-slate-50">
                        <td className="p-4">
                          <img src={l.thumbnail} className="w-12 h-8 rounded-lg object-cover border border-white/10" alt="LThumbnail" />
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-white light:text-slate-800">{l.title}</p>
                          <span className="text-[9px] text-white/40 font-mono block mt-0.5">{l.lectureId}</span>
                        </td>
                        <td className="p-4 font-mono text-[10px] text-purple-400 light:text-purple-600">{l.subjectId}</td>
                        <td className="p-4 font-mono text-[10px] text-slate-300 light:text-slate-700">{l.duration}</td>
                        <td className="p-4">
                          {l.pdfUrl ? (
                            <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[9px] font-bold border border-indigo-500/10 light:bg-indigo-50">PDF YES</span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-white/5 text-white/30 rounded text-[9px] light:bg-slate-100 light:text-slate-400">NONE</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button 
                              onClick={() => handleOpenLectureForm(l)}
                              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] font-bold transition light:bg-slate-100 light:text-slate-700"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteLecture(l.lectureId)}
                              className="px-2.5 py-1 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-[10px] font-bold border border-red-500/10 transition light:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ================== VIEW: DEVICE LOGS ================== */}
        {activeTab === 'logs' && (
          <section className="flex flex-col gap-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <p className="text-xs text-white/50 light:text-slate-500">Real-time system device telemetry log record.</p>
              <button 
                onClick={handleClearLogs}
                className="bg-red-500/10 border border-red-500/20 hover:bg-red-600 text-red-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl transition light:bg-red-50 light:border-red-100"
              >
                Clear Incident Logs
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[24px] overflow-hidden backdrop-blur-xl light:bg-white light:border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-white/40 border-b border-white/10 uppercase tracking-wider text-[10px] font-bold light:bg-slate-50 light:text-slate-400 light:border-slate-100">
                      <th className="p-4">Log ID</th>
                      <th className="p-4">User UID</th>
                      <th className="p-4">Device ID</th>
                      <th className="p-4">OS/Browser</th>
                      <th className="p-4">Opened At</th>
                      <th className="p-4">Closed At</th>
                      <th className="p-4">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300 font-mono text-[10px] light:divide-slate-100 light:text-slate-600">
                    {sortedLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-white/30 font-sans text-xs light:text-slate-400">No device access log incidents reported yet.</td>
                      </tr>
                    ) : (
                      sortedLogs.map((log) => (
                        <tr key={log.logId} className="hover:bg-white/2 light:hover:bg-slate-50">
                          <td className="p-4 text-white/40">{log.logId.substring(0, 8)}...</td>
                          <td className="p-4 text-indigo-400 font-bold light:text-indigo-600">{log.uid.substring(0, 8)}...</td>
                          <td className="p-4 text-purple-400 font-bold light:text-purple-600">{log.deviceId || 'Unknown'}</td>
                          <td className="p-4 text-slate-200 light:text-slate-700">{log.os} / {log.browser}</td>
                          <td className="p-4 text-white/50">{formatTime(log.openedAt)}</td>
                          <td className="p-4 text-white/50">
                            {log.closedAt ? formatTime(log.closedAt) : (
                              <span className="text-emerald-400 animate-pulse font-bold">Connected</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 rounded border border-indigo-500/15 light:bg-indigo-50">
                              {log.duration ? `${log.duration}s` : 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ================== VIEW: DEVTOOLS MONITOR ================== */}
        {activeTab === 'devtools' && (
          <section className="flex flex-col gap-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <p className="text-xs text-white/50 light:text-slate-500">Real-time inspections showing security triggers whenever developer console is loaded.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[24px] overflow-hidden backdrop-blur-xl light:bg-white light:border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-white/40 border-b border-white/10 uppercase tracking-wider text-[10px] font-bold light:bg-slate-50 light:text-slate-400 light:border-slate-100">
                      <th className="p-4">User Details</th>
                      <th className="p-4">Device OS/Browser</th>
                      <th className="p-4">Platform Type</th>
                      <th className="p-4">Screen Dimensions</th>
                      <th className="p-4">Total Incidents</th>
                      <th className="p-4">Total Debugging Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300 light:divide-slate-100 light:text-slate-700">
                    {usersList.filter(u => (u.devToolOpenCount || 0) > 0).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-white/30 light:text-slate-400">No active DevTools console triggers observed.</td>
                      </tr>
                    ) : (
                      usersList.filter(u => (u.devToolOpenCount || 0) > 0).map((u) => (
                        <tr key={u.uid} className="hover:bg-white/2 light:hover:bg-slate-50">
                          <td className="p-4">
                            <p className="font-bold text-white light:text-slate-800">{u.name || 'Aura Student'}</p>
                            <span className="text-[10px] text-white/40 font-mono block mt-0.5">{u.email}</span>
                          </td>
                          <td className="p-4 text-xs">{u.os || 'Unknown OS'} / {u.browser || 'Unknown'}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] font-bold text-indigo-300 light:bg-slate-100 light:text-indigo-600">
                              {u.platform || 'Desktop'}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-[10px] text-white/50">{u.screenSize || 'N/A'}</td>
                          <td className="p-4 font-mono text-xs font-extrabold text-amber-400">{u.devToolOpenCount || 0} times</td>
                          <td className="p-4 font-mono text-xs font-extrabold text-red-400">{u.devToolTotalTime || 0} seconds</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ================== VIEW: BLOCKED DEVICES ================== */}
        {activeTab === 'blocked' && (
          <section className="flex flex-col gap-6 animate-fade-in">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <p className="text-xs text-white/50 light:text-slate-500">Ban or authorize devices or user ids directly to enforce platform license rules.</p>
              <button 
                onClick={() => setShowBlockForm(true)}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1"
              >
                <Ban size={12} /> Block Device / UID
              </button>
            </div>

            {/* Block Device Form */}
            {showBlockForm && (
              <div className="bg-white/5 border border-white/10 p-6 rounded-[24px] backdrop-blur-xl flex flex-col gap-4 animate-slide-in light:bg-white light:border-slate-200">
                <h3 className="text-sm font-bold text-white font-display light:text-slate-800">Restrict Device access</h3>
                <form onSubmit={handleSaveBlockDevice} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider light:text-slate-400">Device ID or User ID</label>
                    <input 
                      type="text" 
                      required 
                      value={blockKey}
                      onChange={(e) => setBlockKey(e.target.value)}
                      placeholder="e.g. dev_..." 
                      className="form-input bg-[#0c0d13] border-white/10 text-white rounded-xl py-2.5 px-3.5 text-xs focus:border-indigo-500 focus:outline-none transition light:bg-slate-50 light:border-slate-200 light:text-slate-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider light:text-slate-400">Ban Reason</label>
                    <input 
                      type="text" 
                      required 
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      placeholder="e.g. Multiple DevTools triggers" 
                      className="form-input bg-[#0c0d13] border-white/10 text-white rounded-xl py-2.5 px-3.5 text-xs focus:border-indigo-500 focus:outline-none transition light:bg-slate-50 light:border-slate-200 light:text-slate-800"
                    />
                  </div>
                  <div className="flex gap-2 justify-end md:col-span-2 mt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowBlockForm(false)}
                      className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-bold transition light:bg-slate-100 light:text-slate-700"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition"
                    >
                      Block Device
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Block list Table */}
            <div className="bg-white/5 border border-white/10 rounded-[24px] overflow-hidden backdrop-blur-xl light:bg-white light:border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-white/5 text-white/40 border-b border-white/10 uppercase tracking-wider text-[10px] font-bold light:bg-slate-50 light:text-slate-400 light:border-slate-100">
                    <th className="p-4">Target Device ID / User UID</th>
                    <th className="p-4">Blocked Date</th>
                    <th className="p-4">Suspension Reason</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300 light:divide-slate-100 light:text-slate-700">
                  {blockedList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-white/30 light:text-slate-400">No explicit device ID blocks configured.</td>
                    </tr>
                  ) : (
                    blockedList.map((b) => (
                      <tr key={b.blockedId} className="hover:bg-white/2 light:hover:bg-slate-50">
                        <td className="p-4 font-mono text-[10px] text-red-400 font-bold light:text-red-600">{b.deviceId}</td>
                        <td className="p-4 font-mono text-[10px] text-white/40">{formatTime(b.blockedAt)}</td>
                        <td className="p-4 text-xs text-white/70 light:text-slate-600">{b.reason}</td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleUnblockDevice(b.blockedId)}
                            className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-[10px] font-bold border border-emerald-500/15 transition light:bg-emerald-50"
                          >
                            Authorize Access
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ================== VIEW: ANALYTICS ================== */}
        {activeTab === 'analytics' && (
          <section className="flex flex-col gap-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Browser Demographics Chart */}
              <div className="bg-white/5 border border-white/10 p-6 rounded-[24px] backdrop-blur-xl light:bg-white light:border-slate-200">
                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider font-display light:text-slate-800">Student Browser Demographics</h3>
                <div className="flex flex-col gap-4">
                  {analyticsData.browserList.length === 0 ? (
                    <p className="text-white/30 text-xs text-center p-8">No demographics data gathered yet.</p>
                  ) : (
                    analyticsData.browserList.map((item, idx) => (
                      <div key={idx} className="flex flex-col gap-1 text-xs">
                        <div className="flex justify-between font-medium">
                          <span className="light:text-slate-700">{item.name}</span>
                          <span className="text-slate-400">{item.count} ({item.pct}%)</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden light:bg-slate-100">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full" 
                            style={{ width: `${item.pct}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Operating System Demographics */}
              <div className="bg-white/5 border border-white/10 p-6 rounded-[24px] backdrop-blur-xl light:bg-white light:border-slate-200">
                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider font-display light:text-slate-800">Operating Systems</h3>
                <div className="flex flex-col gap-4">
                  {analyticsData.osList.length === 0 ? (
                    <p className="text-white/30 text-xs text-center p-8">No demographics data gathered yet.</p>
                  ) : (
                    analyticsData.osList.map((item, idx) => (
                      <div key={idx} className="flex flex-col gap-1 text-xs">
                        <div className="flex justify-between font-medium">
                          <span className="light:text-slate-700">{item.name}</span>
                          <span className="text-slate-400">{item.count} ({item.pct}%)</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden light:bg-slate-100">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" 
                            style={{ width: `${item.pct}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </section>
        )}

        {/* ================== VIEW: SETTINGS ================== */}
        {activeTab === 'settings' && (
          <section className="flex flex-col gap-6 animate-fade-in">
            <div className="bg-white/5 border border-white/10 p-6 rounded-[24px] backdrop-blur-xl max-w-xl flex flex-col gap-6 light:bg-white light:border-slate-200">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display border-b border-white/10 pb-2 light:text-slate-800 light:border-slate-100">Platform Controls</h3>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-3.5 bg-white/3 border border-white/5 rounded-xl light:bg-slate-50 light:border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-white light:text-slate-800">DevTools Lockout Trigger</p>
                    <span className="text-[10px] text-white/40 light:text-slate-400">Instantly suspend accounts if DevTools is opened more than 5 times.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={devtoolsLockout}
                    onChange={(e) => setDevtoolsLockout(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-[#0a0c12] border-white/10 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider light:text-slate-400">System License Key</label>
                  <input 
                    type="password" 
                    value="AURA_ACADEMY_ENTERPRISE_LICENSE_2026" 
                    readOnly 
                    className="form-input bg-[#0c0d13] border-white/10 text-white rounded-xl py-2.5 px-3.5 text-xs focus:outline-none transition font-mono select-all light:bg-slate-50 light:border-slate-200 light:text-slate-800"
                  />
                </div>

                <button 
                  onClick={() => toast.success('Platform configurations stored locally')}
                  className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow w-fit"
                >
                  Save Platform Config
                </button>
              </div>
            </div>
          </section>
        )}

      </main>

    </div>
  );
};
