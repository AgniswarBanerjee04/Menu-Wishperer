import React from 'react';

interface DietaryBadgeProps {
  dietary?: 'veg' | 'non-veg' | 'unknown' | string;
  showLabel?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const DietaryBadge: React.FC<DietaryBadgeProps> = ({
  dietary = 'unknown',
  showLabel = false,
  className = '',
  size = 'md',
}) => {
  const isVeg = dietary === 'veg';
  const isNonVeg = dietary === 'non-veg';

  const sizeClasses = {
    sm: { box: 'w-3 h-3 p-0.5 border', dot: 'w-1.5 h-1.5', text: 'text-[10px]' },
    md: { box: 'w-3.5 h-3.5 p-0.5 border', dot: 'w-2 h-2', text: 'text-xs' },
    lg: { box: 'w-4 h-4 p-0.5 border-[1.5px]', dot: 'w-2.5 h-2.5', text: 'text-sm' },
  }[size];

  if (isVeg) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`} title="Vegetarian (Pure Veg)">
        <span
          className={`shrink-0 rounded-[3px] border-emerald-600 bg-emerald-950/20 flex items-center justify-center ${sizeClasses.box}`}
        >
          <span className={`rounded-full bg-emerald-500 shadow-sm ${sizeClasses.dot}`} />
        </span>
        {showLabel && <span className={`font-medium text-emerald-400 ${sizeClasses.text}`}>Veg</span>}
      </span>
    );
  }

  if (isNonVeg) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`} title="Non-Vegetarian">
        <span
          className={`shrink-0 rounded-[3px] border-rose-600 bg-rose-950/20 flex items-center justify-center ${sizeClasses.box}`}
        >
          <span className={`rounded-full bg-rose-500 shadow-sm ${sizeClasses.dot}`} />
        </span>
        {showLabel && <span className={`font-medium text-rose-400 ${sizeClasses.text}`}>Non-Veg</span>}
      </span>
    );
  }

  if (dietary === 'egg') {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`} title="Contains Egg (Eggitarian)">
        <span
          className={`shrink-0 rounded-[3px] border-amber-500 bg-amber-950/20 flex items-center justify-center ${sizeClasses.box}`}
        >
          <span className={`rounded-full bg-amber-400 shadow-sm ${sizeClasses.dot}`} />
        </span>
        {showLabel && <span className={`font-medium text-amber-400 ${sizeClasses.text}`}>Egg</span>}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} title="Dietary unknown">
      <span
        className={`shrink-0 rounded-[3px] border-stone-600 bg-stone-900 flex items-center justify-center ${sizeClasses.box}`}
      >
        <span className={`rounded-full bg-stone-500 ${sizeClasses.dot}`} />
      </span>
      {showLabel && <span className={`font-medium text-stone-400 ${sizeClasses.text}`}>All</span>}
    </span>
  );
};
