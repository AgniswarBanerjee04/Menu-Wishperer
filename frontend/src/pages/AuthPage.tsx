import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UtensilsCrossed,
  Sparkles,
  Lock,
  Mail,
  User as UserIcon,
  AlertCircle,
  ShieldCheck,
  Award,
  Clock,
  Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FloatingInput } from '../components/common/FloatingInput';
import { PasswordStrengthMeter } from '../components/common/PasswordStrengthMeter';
import { getDiningGreeting } from '../utils/greeting';
import { cleanIndianPhoneDigits, formatIndianMobile, isValidIndianMobile, capitalizeName } from '../utils/phoneUtils';

interface AuthPageProps {
  initialMode?: 'signin' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'signin' }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useAuth();

  // Dynamic Time Greeting
  const [greeting, setGreeting] = useState(getDiningGreeting());

  useEffect(() => {
    setGreeting(getDiningGreeting());
  }, []);

  // Sync mode with route if user arrived via /register vs /login
  useEffect(() => {
    if (location.pathname === '/register' || location.pathname === '/signup') {
      setMode('signup');
    } else if (location.pathname === '/login') {
      setMode('signin');
    }
  }, [location.pathname]);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI States
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  // Validation Checks
  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const emailValid = isValidEmail(email);
  const nameValid = fullName.trim().length >= 2;
  const mobileValid = isValidIndianMobile(mobileNumber);
  const passwordMatch = confirmPassword.length > 0 && password === confirmPassword;

  // Handle Mobile input with Indian formatting
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cleaned = cleanIndianPhoneDigits(raw);
    const formatted = formatIndianMobile(cleaned, false);
    setMobileNumber(formatted);
  };

  // Capitalize full name on blur
  const handleNameBlur = () => {
    if (fullName) {
      setFullName(capitalizeName(fullName));
    }
  };

  const handleTabSwitch = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'signin') {
      if (!emailValid) {
        setError('Please provide a valid dining email address.');
        return;
      }
      if (!password) {
        setError('Please enter your account password.');
        return;
      }

      setIsLoading(true);
      try {
        await login({ email, password });
        navigate(from, { replace: true });
      } catch (err: any) {
        setError(err.message || 'Incorrect credentials. Please verify your email and password.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Sign Up validation
      if (!nameValid) {
        setError('Please enter your full name for your table reservation.');
        return;
      }
      if (!emailValid) {
        setError('Please enter a valid email address.');
        return;
      }
      if (mobileNumber && !mobileValid) {
        setError('Please enter a valid 10-digit Indian mobile number.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter.');
        return;
      }

      setIsLoading(true);
      try {
        const cleanedDigits = cleanIndianPhoneDigits(mobileNumber);
        const formattedMobile = cleanedDigits ? `+91 ${cleanedDigits}` : undefined;

        await register({
          email,
          password,
          full_name: fullName.trim(),
          mobile_number: formattedMobile,
        });
        navigate('/onboarding');
      } catch (err: any) {
        setError(err.message || 'Failed to create your taste profile.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@menuwhisperer.com');
    setPassword('Password123!');
    setError(null);
    setIsLoading(true);

    try {
      await login({ email: 'demo@menuwhisperer.com', password: 'Password123!' });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Demo account not initialized yet. Register or check seed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 px-4 sm:px-6">
      <div className="w-full max-w-4xl ambient-glow-wrapper relative">
        {/* Main Card Container */}
        <div className="relative z-10 rounded-3xl border border-stone-200 dark:border-[#242938] bg-white/95 dark:bg-[#131620]/95 backdrop-blur-xl shadow-luxe-light dark:shadow-2xl dark:shadow-black/60 overflow-hidden transition-all duration-300">
          
          {/* Subtle Top Gold Accent Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#D4AF37] via-[#E6C387] to-[#D4AF37] opacity-90" />

          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
            
            {/* Left Luxury Concierge Brand Showcase (Desktop only) */}
            <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 bg-gradient-to-b from-[#FAF7F2] to-[#F2EDE2] dark:from-[#131620] dark:to-[#090A0F] border-r border-[#E8E2D8] dark:border-[#242938] relative overflow-hidden">
              
              {/* Background Mandala & Watermark */}
              <div className="absolute inset-0 bg-mandala-pattern opacity-60 pointer-events-none" />
              <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-[#E6C387]/10 blur-3xl pointer-events-none" />

              <div className="relative z-10">
                {/* Brand Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E6C387] to-[#D4AF37] flex items-center justify-center text-[#090A0F] shadow-md shadow-[#E6C387]/20 border border-[#E6C387]/60">
                    <UtensilsCrossed className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <h2 className="font-heritage font-bold text-lg text-[#1A1715] dark:text-[#F4F4F5] tracking-wider flex items-center gap-1.5">
                      Menu Whisperer
                      <Sparkles className="w-3.5 h-3.5 text-[#E6C387] fill-[#E6C387]" />
                    </h2>
                    <p className="text-[10px] text-[#635A52] dark:text-[#A1A1AA] tracking-widest uppercase font-semibold">
                      AI Dining Concierge
                    </p>
                  </div>
                </div>

                {/* Fine Dining Quote */}
                <div className="mt-8 p-5 rounded-2xl bg-white/70 dark:bg-[#0E111A] border border-[#E6C387]/20 dark:border-[#242938] shadow-sm">
                  <p className="font-serif-display text-sm italic text-[#1A1715] dark:text-[#F4F4F5] leading-relaxed">
                    “Dining is not merely sustenance; it is theatre, memory, and personal taste elevated to art.”
                  </p>
                  <p className="mt-3 text-[11px] font-semibold tracking-wider text-[#E6C387] uppercase">
                    — Executive Chef’s Table
                  </p>
                </div>

                {/* Feature Highlights */}
                <div className="mt-8 space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-[#E6C387]/10 text-[#E6C387] shrink-0 mt-0.5">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1A1715] dark:text-[#F4F4F5]">Desi Palate Decoding</h4>
                      <p className="text-[11px] text-[#635A52] dark:text-[#A1A1AA]">
                        Instant analysis of any restaurant menu aligned with your spice & regional preferences.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-[#E6C387]/10 text-[#E6C387] shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1A1715] dark:text-[#F4F4F5]">Dietary Vigilance</h4>
                      <p className="text-[11px] text-[#635A52] dark:text-[#A1A1AA]">
                        Pure Veg, Jain, Halal, or allergy filters ensure total peace of mind at any table.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-[#E6C387]/10 text-[#E6C387] shrink-0 mt-0.5">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1A1715] dark:text-[#F4F4F5]">Zero Decision Paralysis</h4>
                      <p className="text-[11px] text-[#635A52] dark:text-[#A1A1AA]">
                        Handpicked signature dishes tailored to your hunger level and party budget.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Status Badge */}
              <div className="relative z-10 pt-6 mt-6 border-t border-[#E8E2D8] dark:border-[#242938] flex items-center justify-between text-[11px] text-[#635A52] dark:text-[#A1A1AA]">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#E6C387]" />
                  {greeting.timeContext}
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Sommelier Active
                </span>
              </div>
            </div>

            {/* Right Interactive Form Panel */}
            <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
              
              <div>
                {/* Mobile Brand Bar */}
                <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E6C387] to-[#D4AF37] flex items-center justify-center text-[#090A0F] shadow-sm">
                    <UtensilsCrossed className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <span className="font-heritage font-bold text-base text-[#1A1715] dark:text-[#F4F4F5]">
                    Menu Whisperer
                  </span>
                </div>

                {/* Dynamic Time-of-Day Greeting Header */}
                <div className="text-center lg:text-left mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6C387]/10 text-[#E6C387] border border-[#E6C387]/20 text-[11px] font-semibold mb-2.5">
                    <Sparkles className="w-3 h-3 text-[#E6C387]" />
                    <span>{greeting.title}</span>
                  </div>
                  <h1 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#1A1715] dark:text-[#F4F4F5] tracking-tight">
                    {mode === 'signin' ? 'Welcome Back to Your Table' : 'Reserve Your Culinary Palate'}
                  </h1>
                  <p className="text-xs text-[#635A52] dark:text-[#A1A1AA] mt-1.5">
                    {mode === 'signin'
                      ? greeting.subtitle
                      : 'Create your fine-dining profile and decode any restaurant menu effortlessly.'}
                  </p>
                </div>

                {/* Fluid Pill Tab Switcher */}
                <div className="p-1 rounded-2xl bg-[#F4EFE6] dark:bg-[#0E111A] border border-[#E8E2D8] dark:border-[#242938] flex relative mb-6">
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('signin')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 relative z-10 ${
                      mode === 'signin'
                        ? 'bg-[#E6C387] text-[#090A0F] shadow-lg shadow-[#E6C387]/10'
                        : 'text-[#635A52] dark:text-[#A1A1AA] hover:text-[#1A1715] dark:hover:text-[#F4F4F5]'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('signup')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 relative z-10 ${
                      mode === 'signup'
                        ? 'bg-[#E6C387] text-[#090A0F] shadow-lg shadow-[#E6C387]/10'
                        : 'text-[#635A52] dark:text-[#A1A1AA] hover:text-[#1A1715] dark:hover:text-[#F4F4F5]'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-burgundy-50 dark:bg-burgundy-950/40 border border-burgundy-200 dark:border-burgundy-900/80 flex items-start gap-2.5 text-burgundy-800 dark:text-rose-300 text-xs animate-in fade-in duration-200">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-burgundy-600 dark:text-rose-400" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                {/* Dynamic Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'signup' && (
                    <FloatingInput
                      id="auth-fullname"
                      label="Full Name"
                      type="text"
                      autoComplete="name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onBlur={handleNameBlur}
                      icon={<UserIcon />}
                      isValid={nameValid}
                    />
                  )}

                  <FloatingInput
                    id="auth-email"
                    label="Email Address"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail />}
                    isValid={emailValid}
                  />

                  {mode === 'signup' && (
                    <FloatingInput
                      id="auth-mobile"
                      label="Mobile Number (Optional)"
                      type="tel"
                      autoComplete="tel-national"
                      prefixBadge="+91"
                      placeholder="98765 43210"
                      maxLength={11}
                      value={mobileNumber}
                      onChange={handleMobileChange}
                      isValid={mobileValid}
                      hint="10-digit number for concierge updates & table reservations"
                    />
                  )}

                  <FloatingInput
                    id="auth-password"
                    label={mode === 'signin' ? 'Password' : 'Create Password'}
                    type="password"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock />}
                    showPasswordToggle={true}
                  />

                  {/* Password Strength Indicator for Account Creation */}
                  {mode === 'signup' && <PasswordStrengthMeter password={password} />}

                  {mode === 'signup' && (
                    <FloatingInput
                      id="auth-confirm-password"
                      label="Confirm Password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      icon={<Lock />}
                      showPasswordToggle={true}
                      isValid={passwordMatch}
                      error={confirmPassword && !passwordMatch ? 'Passwords do not match' : null}
                    />
                  )}

                  {/* Submit Button with Gold Accent & Circular Pulse Loader */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 px-6 rounded-2xl bg-[#E6C387] hover:bg-[#D4AF37] text-[#090A0F] font-semibold text-sm shadow-lg shadow-[#E6C387]/10 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-[#090A0F] border-t-transparent rounded-full animate-spin pulse-loader-ring" />
                          <span>Setting Your Table...</span>
                        </div>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 fill-[#090A0F] text-[#090A0F]" />
                          <span>
                            {mode === 'signin' ? 'Enter Dining Room' : 'Claim Your Palate Profile'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Bottom Quick Actions & Demo Shortcut */}
              <div className="mt-6 pt-4 border-t border-[#E8E2D8] dark:border-[#242938]">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold border border-[#E6C387]/30 text-[#E6C387] bg-[#E6C387]/10 hover:bg-[#E6C387]/20 transition-colors flex items-center justify-center gap-2 group"
                >
                  <span className="group-hover:scale-110 transition-transform">⚡</span>
                  <span>Instant Demo Access (demo@menuwhisperer.com)</span>
                </button>

                <p className="mt-3 text-center text-xs text-[#635A52] dark:text-[#A1A1AA]">
                  {mode === 'signin' ? (
                    <>
                      New guest?{' '}
                      <button
                        type="button"
                        onClick={() => handleTabSwitch('signup')}
                        className="font-bold text-[#E6C387] hover:underline underline-offset-2"
                      >
                        Reserve a Taste Profile
                      </button>
                    </>
                  ) : (
                    <>
                      Already registered?{' '}
                      <button
                        type="button"
                        onClick={() => handleTabSwitch('signin')}
                        className="font-bold text-[#E6C387] hover:underline underline-offset-2"
                      >
                        Sign in to your table
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
