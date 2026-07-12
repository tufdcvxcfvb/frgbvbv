import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import { AdminView } from './components/AdminView';
import { useDevToolsDetector } from './hooks/useDevToolsDetector';
import { seedDatabase } from './utils/seed';
import toast from 'react-hot-toast';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  // Activate DevTools Detection Security loop when student is logged in
  useDevToolsDetector(user);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05060b]">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
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

const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (user.role !== 'admin') {
        toast.error('Access Denied. Administrator privileges required.');
        navigate('/home', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05060b]">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return null; // Empty page while redirecting via useEffect
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05060b]">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
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

          {/* Protected Admin Portal route */}
          <Route path="/admin" element={<AdminProtectedRoute><AdminView /></AdminProtectedRoute>} />

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
