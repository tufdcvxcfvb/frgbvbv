import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardLayout } from './components/DashboardLayout';
import { 
  LoginView, 
  SignupView, 
  BlockedView, 
  HomeView, 
  CoursesView, 
  CourseOverview, 
  SubjectView, 
  LecturePlayView, 
  DownloadsView, 
  ProfileView 
} from './components/Pages';
import { useDevToolsDetector } from './hooks/useDevToolsDetector';
import { seedDatabase } from './utils/seed';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  // Activate DevTools Detection Security loop when student is logged in
  useDevToolsDetector(user);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05060b] flex-col gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl animate-pulse">
          A
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs text-slate-300 font-bold tracking-wide animate-pulse">Loading secure academic node...</p>
          <p className="text-[10px] text-slate-500 font-mono">Verifying student identity token</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.blocked) {
    return <Navigate to="/account-blocked" replace />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05060b] flex-col gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl animate-pulse">
          A
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs text-slate-300 font-bold tracking-wide animate-pulse">Synchronizing auth details...</p>
          <p className="text-[10px] text-slate-500 font-mono">Securing gateway tunnel</p>
        </div>
      </div>
    );
  }

  if (user) {
    if (user.blocked) {
      return <Navigate to="/account-blocked" replace />;
    }
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  // Automatically seed the Firestore database with premium syllabuses on launch
  useEffect(() => {
    seedDatabase();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication routes */}
          <Route path="/login" element={<PublicRoute><LoginView /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignupView /></PublicRoute>} />
          <Route path="/account-blocked" element={<BlockedView />} />
          
          {/* Protected Student Portal routes */}
          <Route path="/home" element={<ProtectedRoute><DashboardLayout><HomeView /></DashboardLayout></ProtectedRoute>} />
          <Route path="/courses" element={<ProtectedRoute><DashboardLayout><CoursesView /></DashboardLayout></ProtectedRoute>} />
          <Route path="/course/:courseId" element={<ProtectedRoute><DashboardLayout><CourseOverview /></DashboardLayout></ProtectedRoute>} />
          <Route path="/subject/:subjectId" element={<ProtectedRoute><DashboardLayout><SubjectView /></DashboardLayout></ProtectedRoute>} />
          <Route path="/lecture/:lectureId" element={<ProtectedRoute><DashboardLayout><LecturePlayView /></DashboardLayout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><DashboardLayout><ProfileView /></DashboardLayout></ProtectedRoute>} />
          <Route path="/downloads" element={<ProtectedRoute><DashboardLayout><DownloadsView /></DashboardLayout></ProtectedRoute>} />

          {/* Catch-all redirect to home */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
        
        {/* Toast Notifier configuration */}
        <Toaster 
          position="top-right" 
          toastOptions={{ 
            style: { 
              background: 'rgba(10, 12, 18, 0.85)', 
              color: '#f8fafc', 
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              backdropFilter: 'blur(20px)',
              boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
            } 
          }} 
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
