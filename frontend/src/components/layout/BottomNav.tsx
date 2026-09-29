import React from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles, History, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const BottomNav: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  const navItems = [
    { to: '/', label: 'Whisper', icon: Sparkles },
    { to: '/history', label: 'History', icon: History },
    { to: '/profile', label: 'Taste Profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-stone-200/80 dark:border-stone-800/80 bg-[#F7F4EE]/95 dark:bg-[#121110]/95 backdrop-blur-lg px-6 py-2 shadow-lg transition-colors duration-200">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-gold-600 dark:text-gold-400 font-bold scale-105'
                    : 'text-[#635A52] dark:text-[#A89F95] hover:text-[#1A1715] dark:hover:text-[#F5F2EB]'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
