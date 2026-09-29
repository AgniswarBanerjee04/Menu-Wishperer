import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Sun, Moon, LogOut, User, UtensilsCrossed, History } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-stone-200/80 dark:border-stone-800/80 bg-[#F7F4EE]/90 dark:bg-[#121110]/90 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#C5A880] to-[#A37F4F] flex items-center justify-center text-[#1A1715] shadow-sm shadow-gold-500/20 group-hover:scale-105 transition-transform border border-[#E8DBC5]/40">
            <UtensilsCrossed className="w-5 h-5 text-[#1A1715] stroke-[2.5]" />
          </div>
          <div>
            <span className="font-heritage font-bold text-lg text-[#1A1715] dark:text-[#F5F2EB] flex items-center gap-1.5 tracking-wider">
              Menu Whisperer
              <Sparkles className="w-3.5 h-3.5 text-gold-500 fill-gold-500" />
            </span>
            <p className="text-[10px] text-[#635A52] dark:text-[#A89F95] -mt-0.5 tracking-widest uppercase font-semibold hidden sm:block">
              Culinary Concierge
            </p>
          </div>
        </Link>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1 mr-2">
              <Link
                to="/"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#635A52] hover:text-[#1A1715] hover:bg-stone-200/50 dark:text-[#A89F95] dark:hover:text-[#F5F2EB] dark:hover:bg-stone-800/70 transition-colors"
              >
                Whisper
              </Link>

              <Link
                to="/history"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#635A52] hover:text-[#1A1715] hover:bg-stone-200/50 dark:text-[#A89F95] dark:hover:text-[#F5F2EB] dark:hover:bg-stone-800/70 transition-colors flex items-center gap-1.5"
              >
                <History className="w-3.5 h-3.5 text-gold-500" />
                History
              </Link>
              <Link
                to="/profile"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#635A52] hover:text-[#1A1715] hover:bg-stone-200/50 dark:text-[#A89F95] dark:hover:text-[#F5F2EB] dark:hover:bg-stone-800/70 transition-colors flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-gold-500" />
                Profile
              </Link>
            </div>
          )}

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Dark/Light Mode"
            className="w-9 h-9 rounded-xl border border-stone-300 dark:border-stone-700 bg-white/60 dark:bg-stone-900/60 flex items-center justify-center text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shadow-sm"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-gold-400" /> : <Moon className="w-4 h-4 text-[#1A1715]" />}
          </button>

          {/* User Status / Profile Menu */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-stone-200/50 dark:hover:bg-stone-800/60 transition-colors group"
                title="View & Edit Dining Profile"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#C5A880] to-[#B89565] flex items-center justify-center text-[#1A1715] font-bold text-xs shadow-sm border border-[#E8DBC5]/40 group-hover:scale-105 transition-transform">
                  {user?.full_name ? user.full_name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : 'G'}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="block text-xs font-bold text-[#1A1715] dark:text-[#F5F2EB] max-w-[130px] truncate leading-tight">
                    {user?.full_name || 'Desi Gourmet'}
                  </span>
                  <span className="block text-[10px] text-gold-700 dark:text-gold-400 font-medium">
                    Table Profile
                  </span>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                aria-label="Log Out"
                title="Log Out"
                className="w-9 h-9 rounded-xl border border-stone-300 dark:border-stone-700 bg-white/60 dark:bg-stone-900/60 flex items-center justify-center text-burgundy-700 dark:text-rose-400 hover:bg-burgundy-50 dark:hover:bg-rose-950/30 transition-colors shadow-sm"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-semibold text-[#1A1715] dark:text-[#F5F2EB] px-3 py-2 rounded-xl hover:bg-stone-200/50 dark:hover:bg-stone-800"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold bg-gradient-to-r from-[#C5A880] to-[#B89565] text-[#1A1715] px-3.5 py-2 rounded-xl shadow-sm border border-[#E8DBC5]/40"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
