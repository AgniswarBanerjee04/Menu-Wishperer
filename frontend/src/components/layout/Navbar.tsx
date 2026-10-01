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

  const handleBrandClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-stone-200/80 dark:border-[#242938] bg-[#F7F4EE]/90 dark:bg-[#090A0F]/90 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo & Home Navigation */}
        <Link
          to="/"
          data-testid="brand-logo-link"
          onClick={handleBrandClick}
          className="flex items-center gap-2.5 group cursor-pointer"
          title="Return to Menu Whisperer Dining Dashboard"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E6C387] to-[#D4AF37] flex items-center justify-center text-[#090A0F] shadow-sm shadow-[#E6C387]/20 group-hover:scale-105 transition-transform border border-[#E6C387]/40">
            <UtensilsCrossed className="w-5 h-5 text-[#090A0F] stroke-[2.5]" />
          </div>
          <div>
            <span className="font-heritage font-bold text-lg text-[#1A1715] dark:text-[#F4F4F5] flex items-center gap-1.5 tracking-wider">
              Menu Whisperer
              <Sparkles className="w-3.5 h-3.5 text-[#E6C387] fill-[#E6C387]" />
            </span>
            <p className="text-[10px] text-[#635A52] dark:text-[#A1A1AA] -mt-0.5 tracking-widest uppercase font-semibold hidden sm:block">
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
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#635A52] hover:text-[#1A1715] hover:bg-stone-200/50 dark:text-[#A1A1AA] dark:hover:text-[#F4F4F5] dark:hover:bg-[#131620] transition-colors"
              >
                Whisper
              </Link>

              <Link
                to="/history"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#635A52] hover:text-[#1A1715] hover:bg-stone-200/50 dark:text-[#A1A1AA] dark:hover:text-[#F4F4F5] dark:hover:bg-[#131620] transition-colors flex items-center gap-1.5"
              >
                <History className="w-3.5 h-3.5 text-[#E6C387]" />
                History
              </Link>
              <Link
                to="/profile"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#635A52] hover:text-[#1A1715] hover:bg-stone-200/50 dark:text-[#A1A1AA] dark:hover:text-[#F4F4F5] dark:hover:bg-[#131620] transition-colors flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-[#E6C387]" />
                Profile
              </Link>
            </div>
          )}

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Dark/Light Mode"
            className="w-9 h-9 rounded-xl border border-stone-300 dark:border-[#242938] bg-white/60 dark:bg-[#131620] flex items-center justify-center text-stone-700 dark:text-[#A1A1AA] hover:bg-stone-100 dark:hover:bg-[#242938] transition-colors shadow-sm"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-[#E6C387]" /> : <Moon className="w-4 h-4 text-[#1A1715]" />}
          </button>

          {/* User Status / Profile Menu */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-stone-200/50 dark:hover:bg-[#131620] transition-colors group"
                title="View & Edit Dining Profile"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#E6C387] to-[#D4AF37] flex items-center justify-center text-[#090A0F] font-bold text-xs shadow-sm border border-[#E6C387]/40 group-hover:scale-105 transition-transform">
                  {user?.full_name ? user.full_name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : 'G'}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="block text-xs font-bold text-[#1A1715] dark:text-[#F4F4F5] max-w-[130px] truncate leading-tight">
                    {user?.full_name || 'Desi Gourmet'}
                  </span>
                  <span className="block text-[10px] text-[#E6C387] font-medium">
                    Table Profile
                  </span>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                aria-label="Log Out"
                title="Log Out"
                className="w-9 h-9 rounded-xl border border-stone-300 dark:border-[#242938] bg-white/60 dark:bg-[#131620] flex items-center justify-center text-burgundy-700 dark:text-rose-400 hover:bg-burgundy-50 dark:hover:bg-rose-950/30 transition-colors shadow-sm"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-semibold text-[#1A1715] dark:text-[#F4F4F5] px-3 py-2 rounded-xl hover:bg-stone-200/50 dark:hover:bg-[#131620]"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold bg-[#E6C387] hover:bg-[#D4AF37] text-[#090A0F] px-3.5 py-2 rounded-xl shadow-lg shadow-[#E6C387]/10 transition-all duration-200"
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
