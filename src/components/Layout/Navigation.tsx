import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, User, LogOut, Plus, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';
import { motion } from 'framer-motion';

export function Navigation() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Get display name from user metadata or fallback to email
  const displayName = user?.user_metadata?.name || user?.email || 'User';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-purple-400" />
            <span className="text-xl font-bold text-white">Our Love Story</span>
          </Link>

          <div className="flex items-center space-x-4">
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
        </div>
      </div>
    </nav>
  );
}