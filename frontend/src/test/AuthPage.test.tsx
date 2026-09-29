import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthPage } from '../pages/AuthPage';
import { AuthProvider } from '../context/AuthContext';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AuthProvider>
      <BrowserRouter>{ui}</BrowserRouter>
    </AuthProvider>
  );
};

describe('AuthPage component', () => {
  it('renders luxury branding, dynamic greeting, and Sign In tab by default', () => {
    renderWithProviders(<AuthPage initialMode="signin" />);

    expect(screen.getAllByText(/Menu Whisperer/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/AI Dining Concierge/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
    expect(screen.getByText(/Instant Demo Access/i)).toBeInTheDocument();
  });

  it('switches seamlessly to Create Account mode when pill tab is clicked', () => {
    renderWithProviders(<AuthPage initialMode="signin" />);

    const createAccountTab = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(createAccountTab);

    // Full name and mobile inputs should appear in sign up mode
    expect(screen.getByText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByText(/Mobile Number \(Optional\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Claim Your Palate Profile/i })).toBeInTheDocument();
  });

  it('shows password strength indicator when typing in create account mode', () => {
    renderWithProviders(<AuthPage initialMode="signup" />);

    const passwordInputs = screen.getAllByLabelText(/Password/i);
    // Find create password input
    const createPwdInput = passwordInputs[0];
    fireEvent.change(createPwdInput, { target: { value: 'Secret123!' } });

    expect(screen.getByText(/Passcode Strength:/i)).toBeInTheDocument();
  });
});
