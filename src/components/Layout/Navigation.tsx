import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, User, LogOut, Plus, Settings, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';
import { motion, AnimatePresence } from 'framer-motion';

export function Navigation() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Get display name from user metadata or fallback to email
  const displayName = user?.user_metadata?.name || user?.email || 'User';

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    closeMobileMenu();
    await signOut();
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
              <Heart className="h-8 w-8 text-purple-400" />
              <span className="text-xl font-bold text-white">Our Love Story</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/') 
                    ? 'text-purple-400 bg-purple-400/20' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Timeline
              </Link>

              {user ? (
                <>
                  <Link
                    to="/add-memory"
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/add-memory') 
                        ? 'text-purple-400 bg-purple-400/20' 
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Memory</span>
                  </Link>

                  <Link
                    to="/settings"
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/settings') 
                        ? 'text-purple-400 bg-purple-400/20' 
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>

                  {/* Notification Bell */}
                  <NotificationDropdown />

                  <div className="flex items-center space-x-2 px-3 py-2 rounded-md bg-white/10">
                    <User className="h-4 w-4 text-gray-300" />
                    <span className="text-sm text-gray-300 max-w-32 truncate">
                      {displayName}
                    </span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={signOut}
                    className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </motion.button>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile Controls */}
            <div className="flex items-center space-x-2 lg:hidden">
              {/* Notification Bell for Mobile */}
              {user && <NotificationDropdown />}

              {/* Hamburger Menu Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleMobileMenu}
                className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={closeMobileMenu}
            />

            {/* Mobile Menu Panel */}
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-80 max-w-sm bg-black/95 backdrop-blur-md border-l border-white/20 lg:hidden"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/20">
                  <div className="flex items-center space-x-3">
                    <Heart className="h-8 w-8 text-purple-400" />
                    <span className="text-xl font-bold text-white">Our Love Story</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={closeMobileMenu}
                    className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </motion.button>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 p-6 space-y-2">
                  <Link
                    to="/"
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                      isActive('/') 
                        ? 'text-purple-400 bg-purple-400/20' 
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Heart className="h-5 w-5" />
                    <span>Timeline</span>
                  </Link>

                  {user ? (
                    <>
                      <Link
                        to="/add-memory"
                        onClick={closeMobileMenu}
                        className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                          isActive('/add-memory') 
                            ? 'text-purple-400 bg-purple-400/20' 
                            : 'text-gray-300 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Plus className="h-5 w-5" />
                        <span>Add Memory</span>
                      </Link>

                      <Link
                        to="/settings"
                        onClick={closeMobileMenu}
                        className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                          isActive('/settings') 
                            ? 'text-purple-400 bg-purple-400/20' 
                            : 'text-gray-300 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Settings className="h-5 w-5" />
                        <span>Settings</span>
                      </Link>
                    </>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={closeMobileMenu}
                      className="flex items-center space-x-3 w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                    >
                      <User className="h-5 w-5" />
                      <span>Sign In</span>
                    </Link>
                  )}
                </div>

                {/* User Info & Sign Out */}
                {user && (
                  <div className="p-6 border-t border-white/20 space-y-4">
                    {/* User Info */}
                    <div className="flex items-center space-x-3 px-4 py-3 bg-white/10 rounded-lg">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* Sign Out Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSignOut}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="font-medium">Sign Out</span>
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}