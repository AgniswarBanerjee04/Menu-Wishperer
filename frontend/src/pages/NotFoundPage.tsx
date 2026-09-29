import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Home } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/30 text-gold-500 flex items-center justify-center mb-4 shadow-sm">
        <UtensilsCrossed className="w-8 h-8" />
      </div>
      <h1 className="font-serif-display text-5xl font-bold text-[#1A1715] dark:text-[#F5F2EB] mb-2">404</h1>
      <p className="text-[#635A52] dark:text-[#A89F95] max-w-sm mb-6 text-sm">
        Oops! This dish isn't on our royal menu. The page you are looking for doesn't exist.
      </p>
      <Link to="/">
        <Button
          icon={<Home className="w-4 h-4" />}
          className="bg-gradient-to-r from-[#C5A880] to-[#B89565] text-[#1A1715] font-bold border border-gold-300/40 hover:brightness-105 shadow-sm"
        >
          Back to Menu Whisperer
        </Button>
      </Link>
    </div>
  );
};
