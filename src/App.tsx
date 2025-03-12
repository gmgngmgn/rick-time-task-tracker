import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { ForgotPassword } from './pages/ForgotPassword';
import { TaskList } from './pages/TaskList';
import { Dashboard } from './pages/Dashboard';
import { supabase } from './lib/supabase';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setIsAuthenticated(!!session);
        });

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Auth error:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />
        
        <div className="container mx-auto px-4 pt-20">
          <Routes>
            <Route 
              path="/signin" 
              element={isAuthenticated ? <Navigate to="/tasks" replace /> : <SignIn />} 
            />
            <Route 
              path="/signup" 
              element={isAuthenticated ? <Navigate to="/tasks" replace /> : <SignUp />} 
            />
            <Route 
              path="/forgot-password" 
              element={isAuthenticated ? <Navigate to="/tasks" replace /> : <ForgotPassword />} 
            />
            <Route 
              path="/tasks" 
              element={isAuthenticated ? <TaskList /> : <Navigate to="/signin" replace />} 
            />
            <Route 
              path="/dashboard" 
              element={isAuthenticated ? <Dashboard /> : <Navigate to="/signin" replace />} 
            />
            <Route 
              path="/" 
              element={<Navigate to={isAuthenticated ? "/tasks" : "/signin"} replace />} 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;