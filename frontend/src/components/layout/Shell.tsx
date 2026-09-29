import React from 'react';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';

export const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EE] dark:bg-[#121110] text-[#1A1715] dark:text-[#F5F2EB] bg-mandala-pattern relative selection:bg-gold-400/30 selection:text-gold-900 pb-20 md:pb-8 transition-colors duration-250">
      {/* Subtle regal atmospheric glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-72 bg-gradient-to-b from-gold-400/15 via-gold-500/5 to-transparent pointer-events-none -z-0 blur-3xl" />
      <Navbar />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 relative z-10">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};
