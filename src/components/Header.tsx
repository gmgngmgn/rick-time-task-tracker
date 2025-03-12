import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun, Clock, Menu, LogOut, LayoutDashboard, ListTodo, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

export function Header({ darkMode, setDarkMode }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [firstName, setFirstName] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const isAuthPage = ['/signin', '/signup', '/forgot-password'].includes(location.pathname);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.first_name) {
          setFirstName(user.user_metadata.first_name);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (!isAuthPage) {
      fetchUserData();
    }
  }, [isAuthPage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/signin');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-sm z-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Task Time Tracker</h1>
          </div>
          <div className="flex items-center space-x-4">
            {!isAuthPage && firstName && (
              <div className="hidden md:flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                <User className="w-4 h-4" />
                <span>{firstName}</span>
              </div>
            )}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>
            {!isAuthPage && (
              <>
                {/* Desktop menu */}
                <div className="hidden md:block relative" ref={menuRef}>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Menu"
                  >
                    <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                  </button>
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 z-20">
                      <div className="py-1">
                        <Link
                          to="/tasks"
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center gap-2 px-4 py-2 text-sm ${
                            location.pathname === '/tasks'
                              ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                        >
                          <ListTodo className="w-4 h-4" />
                          Tasks
                        </Link>
                        <Link
                          to="/dashboard"
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center gap-2 px-4 py-2 text-sm ${
                            location.pathname === '/dashboard'
                              ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </Link>
                        <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            handleSignOut();
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Mobile menu button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Mobile Menu"
                >
                  <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {!isAuthPage && isMobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg"
        >
          <div className="py-2 px-4">
            {firstName && (
              <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 py-3 border-b border-gray-200 dark:border-gray-700">
                <User className="w-4 h-4" />
                <span>{firstName}</span>
              </div>
            )}
            <nav className="mt-3 space-y-1">
              <Link
                to="/tasks"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg ${
                  location.pathname === '/tasks'
                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <ListTodo className="w-5 h-5" />
                Tasks
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg ${
                  location.pathname === '/dashboard'
                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}