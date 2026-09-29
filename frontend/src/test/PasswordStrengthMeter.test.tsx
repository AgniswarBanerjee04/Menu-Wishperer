import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PasswordStrengthMeter, computePasswordScore } from '../components/common/PasswordStrengthMeter';

describe('PasswordStrengthMeter', () => {
  it('computes scores correctly', () => {
    expect(computePasswordScore('').score).toBe(0);
    expect(computePasswordScore('123').score).toBe(1);
    expect(computePasswordScore('secret1').score).toBe(2);
    expect(computePasswordScore('secret12').score).toBe(3);
    expect(computePasswordScore('Secret12!').score).toBe(4);
  });

  it('renders strength meter when password is provided', () => {
    const { container } = render(<PasswordStrengthMeter password="Password123!" />);
    expect(screen.getByText(/Passcode Strength:/i)).toBeInTheDocument();
    expect(container.querySelectorAll('.rounded-full')).toHaveLength(4);
  });

  it('does not render when password is empty', () => {
    const { container } = render(<PasswordStrengthMeter password="" />);
    expect(container.firstChild).toBeNull();
  });
});
