import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Step2MoodBudget } from '../components/wizard/Step2MoodBudget';
import { DiningModeProvider } from '../context/DiningModeContext';

describe('Step2MoodBudget component', () => {
  it('renders mood options and allows selecting a mood in personal mode', () => {
    const handleRecommend = vi.fn();
    const handleBack = vi.fn();

    render(
      <DiningModeProvider>
        <Step2MoodBudget
          onGetRecommendations={handleRecommend}
          onBack={handleBack}
          isLoading={false}
        />
      </DiningModeProvider>
    );

    expect(screen.getByText('Desi Comfort')).toBeInTheDocument();
    expect(screen.getByText('Light & Fresh')).toBeInTheDocument();
    expect(screen.getByText('Bold & Spicy')).toBeInTheDocument();

    // Select Bold & Spicy (adventurous)
    fireEvent.click(screen.getByText('Bold & Spicy'));

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /whisper my picks/i });
    fireEvent.submit(submitBtn.closest('form')!);
    expect(handleRecommend).toHaveBeenCalledWith(
      expect.objectContaining({
        mood: 'adventurous',
        mode: 'personal',
      })
    );
  });

  it('allows switching to Group & Guests mode and renders guest configuration', () => {
    const handleRecommend = vi.fn();
    const handleBack = vi.fn();

    render(
      <DiningModeProvider>
        <Step2MoodBudget
          onGetRecommendations={handleRecommend}
          onBack={handleBack}
          isLoading={false}
        />
      </DiningModeProvider>
    );

    // Switch to Group mode
    fireEvent.click(screen.getByRole('tab', { name: /group & guests/i }));

    // Verify "Who is dining today?" appears
    expect(screen.getByText(/who is dining today\?/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add person/i })).toBeInTheDocument();

    // Submit group form
    const submitBtn = screen.getByRole('button', { name: /whisper group feast/i });
    fireEvent.submit(submitBtn.closest('form')!);
    expect(handleRecommend).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'custom',
        guests: expect.any(Array),
      })
    );
  });
});
