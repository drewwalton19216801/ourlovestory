import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navigation } from './components/Layout/Navigation';
import { Timeline } from './pages/Timeline';
import { AddMemory } from './pages/AddMemory';
import { EditMemory } from './pages/EditMemory';
import { Settings } from './pages/Settings';
import { Auth } from './pages/Auth';
import { SingleMemory } from './pages/SingleMemory';
import { Profile } from './pages/Profile';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400"></div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/auth" />;
}

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 overflow-hidden px-6 py-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 overflow-x-hidden">
      <Navigation />
      <main className="pt-28 pb-16 px-6 sm:px-8 lg:px-12 max-w-full">
        <div className="mx-auto max-w-7xl">
          <Routes>
            <Route path="/" element={<Timeline />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/memory/:id" element={<SingleMemory />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route
              path="/add-memory"
              element={
                <ProtectedRoute>
                  <AddMemory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-memory/:id"
              element={
                <ProtectedRoute>
                  <EditMemory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;