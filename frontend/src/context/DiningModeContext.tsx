import React, { createContext, useContext, useState } from 'react';
import type { GuestProfile, GroupPreset } from '../types';

interface DiningModeContextType {
  activeMode: 'personal' | 'custom';
  setActiveMode: (mode: 'personal' | 'custom') => void;
  guests: GuestProfile[];
  addGuest: (guest?: Partial<GuestProfile>) => void;
  updateGuest: (id: string, updates: Partial<GuestProfile>) => void;
  removeGuest: (id: string) => void;
  setGuests: (guests: GuestProfile[]) => void;
  savedPresets: GroupPreset[];
  saveCurrentAsPreset: (name: string, description?: string) => void;
  loadPreset: (presetId: string) => void;
  deletePreset: (presetId: string) => void;
}

const DEFAULT_GUESTS: GuestProfile[] = [
  {
    id: 'guest_dad',
    name: 'Dad',
    dietary: 'veg',
    spice_level: 'mild',
    max_budget: 450,
  },
  {
    id: 'guest_mom',
    name: 'Mom',
    dietary: 'veg',
    spice_level: 'medium',
    max_budget: 450,
  },
  {
    id: 'guest_kid',
    name: 'Kid',
    dietary: 'egg',
    spice_level: 'mild',
    max_budget: 350,
  },
];

const DEFAULT_PRESETS: GroupPreset[] = [
  {
    id: 'preset_family',
    name: 'Family Dinner',
    description: '3 diners · Pure Veg & Eggetarian · Mild-to-Medium',
    guests: [
      { id: 'p_fam_1', name: 'Dad', dietary: 'veg', spice_level: 'mild', max_budget: 450 },
      { id: 'p_fam_2', name: 'Mom', dietary: 'veg', spice_level: 'medium', max_budget: 450 },
      { id: 'p_fam_3', name: 'Kid', dietary: 'egg', spice_level: 'mild', max_budget: 300 },
    ],
  },
  {
    id: 'preset_office',
    name: 'Office Lunch',
    description: '3 colleagues · Non-Veg, Veg & Gluten-Free options',
    guests: [
      { id: 'p_off_1', name: 'Alex', dietary: 'non-veg', spice_level: 'medium', max_budget: 550 },
      { id: 'p_off_2', name: 'Priya', dietary: 'veg', spice_level: 'spicy', max_budget: 450 },
      { id: 'p_off_3', name: 'Rohan', dietary: 'gluten-free', spice_level: 'mild', max_budget: 500 },
    ],
  },
  {
    id: 'preset_date',
    name: 'Date Night',
    description: '2 diners · Gourmet Pure Veg & Non-Veg celebration',
    guests: [
      { id: 'p_date_1', name: 'You', dietary: 'veg', spice_level: 'medium', max_budget: 800 },
      { id: 'p_date_2', name: 'Date', dietary: 'non-veg', spice_level: 'spicy', max_budget: 800 },
    ],
  },
  {
    id: 'preset_friends',
    name: 'Friends Chaat & Chill',
    description: '3 friends · Casual street & dawat feast',
    guests: [
      { id: 'p_fr_1', name: 'Aman', dietary: 'non-veg', spice_level: 'spicy', max_budget: 350 },
      { id: 'p_fr_2', name: 'Simran', dietary: 'veg', spice_level: 'mild', max_budget: 300 },
      { id: 'p_fr_3', name: 'Kabir', dietary: 'jain', spice_level: 'mild', max_budget: 300 },
    ],
  },
];

const DiningModeContext = createContext<DiningModeContextType | undefined>(undefined);

export const DiningModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeMode, setActiveModeState] = useState<'personal' | 'custom'>(() => {
    const saved = localStorage.getItem('mw_dining_mode');
    return saved === 'custom' ? 'custom' : 'personal';
  });

  const [guests, setGuestsState] = useState<GuestProfile[]>(() => {
    try {
      const saved = localStorage.getItem('mw_custom_guests');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_GUESTS;
  });

  const [savedPresets, setSavedPresets] = useState<GroupPreset[]>(() => {
    try {
      const saved = localStorage.getItem('mw_group_presets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_PRESETS;
  });

  const setActiveMode = (mode: 'personal' | 'custom') => {
    setActiveModeState(mode);
    localStorage.setItem('mw_dining_mode', mode);
  };

  const setGuests = (newGuests: GuestProfile[]) => {
    setGuestsState(newGuests);
    localStorage.setItem('mw_custom_guests', JSON.stringify(newGuests));
  };

  const addGuest = (initial?: Partial<GuestProfile>) => {
    const guestNumber = guests.length + 1;
    const newGuest: GuestProfile = {
      id: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: initial?.name || `Guest ${guestNumber}`,
      dietary: initial?.dietary || 'veg',
      spice_level: initial?.spice_level || 'medium',
      max_budget: initial?.max_budget || 400,
    };
    const updated = [...guests, newGuest];
    setGuests(updated);
  };

  const updateGuest = (id: string, updates: Partial<GuestProfile>) => {
    const updated = guests.map(g => (g.id === id ? { ...g, ...updates } : g));
    setGuests(updated);
  };

  const removeGuest = (id: string) => {
    if (guests.length <= 1) return; // Keep at least one guest in custom mode
    const updated = guests.filter(g => g.id !== id);
    setGuests(updated);
  };

  const saveCurrentAsPreset = (name: string, description?: string) => {
    const newPreset: GroupPreset = {
      id: `preset_${Date.now()}`,
      name: name.trim() || 'Custom Group',
      description: description || `${guests.length} diners · Custom tastes`,
      guests: guests.map(g => ({ ...g })),
    };
    const updated = [newPreset, ...savedPresets];
    setSavedPresets(updated);
    localStorage.setItem('mw_group_presets', JSON.stringify(updated));
  };

  const loadPreset = (presetId: string) => {
    const found = savedPresets.find(p => p.id === presetId);
    if (found && found.guests.length > 0) {
      setGuests(found.guests.map(g => ({ ...g, id: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}` })));
      setActiveMode('custom');
    }
  };

  const deletePreset = (presetId: string) => {
    const updated = savedPresets.filter(p => p.id !== presetId);
    setSavedPresets(updated);
    localStorage.setItem('mw_group_presets', JSON.stringify(updated));
  };

  return (
    <DiningModeContext.Provider
      value={{
        activeMode,
        setActiveMode,
        guests,
        addGuest,
        updateGuest,
        removeGuest,
        setGuests,
        savedPresets,
        saveCurrentAsPreset,
        loadPreset,
        deletePreset,
      }}
    >
      {children}
    </DiningModeContext.Provider>
  );
};

export const useDiningMode = () => {
  const context = useContext(DiningModeContext);
  if (!context) {
    throw new Error('useDiningMode must be used within a DiningModeProvider');
  }
  return context;
};
