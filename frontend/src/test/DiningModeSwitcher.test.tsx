import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DiningModeSwitcher } from '../components/common/DiningModeSwitcher';
import { DiningModeProvider } from '../context/DiningModeContext';

describe('DiningModeSwitcher component', () => {
  it('renders both Personal Dining and Group & Guests modes', () => {
    render(
      <DiningModeProvider>
        <DiningModeSwitcher showDescriptions />
      </DiningModeProvider>
    );

    expect(screen.getByText('Personal Dining')).toBeInTheDocument();
    expect(screen.getByText('Group & Guests')).toBeInTheDocument();
    expect(screen.getByText(/my taste log & history/i)).toBeInTheDocument();
  });

  it('switches modes when clicked and invokes callback', () => {
    const handleChange = vi.fn();
    render(
      <DiningModeProvider>
        <DiningModeSwitcher onChange={handleChange} />
      </DiningModeProvider>
    );

    const groupTab = screen.getByRole('tab', { name: /group & guests/i });
    fireEvent.click(groupTab);

    expect(handleChange).toHaveBeenCalledWith('custom');

    const personalTab = screen.getByRole('tab', { name: /personal dining/i });
    fireEvent.click(personalTab);

    expect(handleChange).toHaveBeenCalledWith('personal');
  });
});
