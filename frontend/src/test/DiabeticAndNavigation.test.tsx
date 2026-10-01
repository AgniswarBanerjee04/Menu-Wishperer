import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { OnboardingQuizPage } from '../pages/OnboardingQuizPage';
import { DiningPersonaSelection } from '../components/wizard/DiningPersonaSelection';
import { Step3Recommendations } from '../components/wizard/Step3Recommendations';
import { isDiabeticProfile, setDiabeticProfile, checkDishSugar } from '../utils/diabetic';
import { AuthContext, type AuthContextType } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { DiningModeProvider } from '../context/DiningModeContext';
import type { DishRecommendation } from '../types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockAuthContextValue: AuthContextType = {
  user: {
    id: 1,
    email: 'test@example.com',
    full_name: 'Agniswar Gourmet',
    is_active: true,
    has_preferences: true,
    is_diabetic: false,
    created_at: new Date().toISOString(),
  },
  isLoading: false,
  isAuthenticated: true,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
  updateUser: vi.fn(),
  updateProfile: vi.fn(),
};

describe('Logo Navigation & Brand Link', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();
  });

  it('renders Menu Whisperer brand header with Link to "/" and calls navigate upon click', () => {
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <ThemeProvider>
          <AuthContext.Provider value={mockAuthContextValue}>
            <Navbar />
          </AuthContext.Provider>
        </ThemeProvider>
      </MemoryRouter>
    );

    const brandLink = screen.getByTestId('brand-logo-link');
    expect(brandLink).toBeInTheDocument();
    expect(brandLink.getAttribute('href')).toBe('/');
    expect(screen.getByText('Menu Whisperer')).toBeInTheDocument();

    fireEvent.click(brandLink);
    expect(mockNavigate).toHaveBeenCalledWith('/');
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});

describe('Diabetic / Low-Sugar Health Intelligence', () => {
  beforeEach(() => {
    localStorage.clear();
    setDiabeticProfile(false);
  });

  it('correctly inspects dishes for sweet and high-glycemic ingredients', () => {
    const sweetDish = checkDishSugar('Gulab Jamun with Rabri', 'Warm dumplings in sugar syrup', 'Dessert');
    expect(sweetDish.isSugarHeavy).toBe(true);
    expect(sweetDish.reason).toContain('⚠️ High Sugar Alert');

    const sweetMakhani = checkDishSugar('Sweet Makhani Paneer', 'Paneer in sweet makhani gravy with jaggery');
    expect(sweetMakhani.isSugarHeavy).toBe(true);
    expect(sweetMakhani.reason).toContain('⚠️ High Sugar Alert');

    const savoryDish = checkDishSugar('Murgh Malai Tikka', 'Tender chicken with garlic and mild cream', 'Appetizer');
    expect(savoryDish.isSugarHeavy).toBe(false);
    expect(savoryDish.reason).toContain('Zero added sugar');
  });

  it('persists diabetic preference in localStorage', () => {
    expect(isDiabeticProfile()).toBe(false);
    setDiabeticProfile(true);
    expect(isDiabeticProfile()).toBe(true);
    expect(localStorage.getItem('is_diabetic')).toBe('true');

    setDiabeticProfile(false);
    expect(isDiabeticProfile()).toBe(false);
    expect(localStorage.getItem('is_diabetic')).toBe('false');
  });

  it('renders "Diabetic Safe / Zero Added Sugar" with subtitle in OnboardingQuizPage', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuthContextValue}>
          <OnboardingQuizPage />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText('Diabetic Safe / Zero Added Sugar')).toBeInTheDocument();
    expect(
      screen.getByText('Flag dishes with added sugar, jaggery, sweet gravies, or heavy desserts')
    ).toBeInTheDocument();
  });

  it('renders dedicated diabetic toggle in DiningPersonaSelection and updates profile', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuthContextValue}>
          <DiningModeProvider>
            <DiningPersonaSelection
              selectedMode="personal"
              onSelectMode={vi.fn()}
              onFinalizePersona={vi.fn()}
            />
          </DiningModeProvider>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText('Diabetic Safe / Zero Added Sugar')).toBeInTheDocument();
    expect(
      screen.getByText('Flag dishes with added sugar, jaggery, sweet gravies, or heavy desserts')
    ).toBeInTheDocument();

    const toggleBtn = screen.getByTestId('diabetic-safe-toggle');
    expect(toggleBtn).toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(isDiabeticProfile()).toBe(true);
  });

  it('displays Diabetic Safe and Sugar Alert badges on recommendations cards', () => {
    setDiabeticProfile(true);

    const testRecommendations: DishRecommendation[] = [
      {
        dish_name: 'Murgh Malai Tikka',
        description: 'Savory roasted chicken with zero added sugar',
        price: 420,
        currency: 'INR',
        category: 'Appetizers',
        dietary: 'non-veg',
        spice_level: 'mild',
        match_score: 95,
        reasoning: 'High protein, low-glycemic dish.',
        is_diabetic_safe: true,
        has_sugar_alert: false,
      },
      {
        dish_name: 'Gulab Jamun with Rabri',
        description: 'Milk dumplings soaked in cardamom sugar syrup',
        price: 140,
        currency: 'INR',
        category: 'Dessert',
        dietary: 'veg',
        spice_level: 'mild',
        match_score: 60,
        reasoning: 'Dessert finish.',
        warnings: '⚠️ High Sugar Alert: Contains added sugar and condensed milk rabri.',
        is_diabetic_safe: false,
        has_sugar_alert: true,
      },
    ];

    render(
      <MemoryRouter>
        <DiningModeProvider>
          <Step3Recommendations
            restaurantName="Royal Dawat"
            mood="healthy"
            recommendations={testRecommendations}
            disclaimer="AI advisory only."
            onOrderDish={vi.fn()}
            onStartOver={vi.fn()}
          />
        </DiningModeProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('diabetic-safe-banner')).toBeInTheDocument();
    expect(screen.getAllByTestId('dish-diabetic-safe-badge').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTestId('dish-sugar-alert-badge').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/⚠️ High Sugar Alert/i)).toBeInTheDocument();
  });
});
