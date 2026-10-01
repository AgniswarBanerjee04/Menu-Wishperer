import React from 'react';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';

export const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EE] dark:bg-[#090A0F] text-[#1A1715] dark:text-[#F4F4F5] bg-mandala-pattern relative selection:bg-[#E6C387]/30 selection:text-white pb-20 md:pb-8 transition-colors duration-250">
      {/* Subtle regal champagne atmospheric glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-72 bg-gradient-to-b from-[#E6C387]/15 via-[#E6C387]/5 to-transparent pointer-events-none -z-0 blur-3xl" />
      <Navbar />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 relative z-10">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};
