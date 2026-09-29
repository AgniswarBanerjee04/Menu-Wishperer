import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FloatingInput } from '../components/common/FloatingInput';

describe('FloatingInput', () => {
  it('renders label and triggers onChange', () => {
    const handleChange = vi.fn();
    render(
      <FloatingInput
        id="test-input"
        label="Email Address"
        value=""
        onChange={handleChange}
      />
    );

    expect(screen.getByText('Email Address')).toBeInTheDocument();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'user@test.com' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('toggles password visibility when showPasswordToggle is true', () => {
    render(
      <FloatingInput
        id="pwd"
        label="Password"
        type="password"
        value="secret123"
        onChange={() => {}}
        showPasswordToggle={true}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /Show password/i });
    expect(toggleBtn).toBeInTheDocument();

    const input = document.getElementById('pwd') as HTMLInputElement;
    expect(input.type).toBe('password');

    fireEvent.click(toggleBtn);
    expect(input.type).toBe('text');
  });

  it('renders valid checkmark when isValid is true', () => {
    render(
      <FloatingInput
        id="valid-field"
        label="Valid Field"
        value="Valid value"
        isValid={true}
        onChange={() => {}}
      />
    );

    expect(screen.getByLabelText('Valid input')).toBeInTheDocument();
  });

  it('displays error message when provided', () => {
    render(
      <FloatingInput
        id="err-field"
        label="Field"
        value=""
        error="Field is required"
        onChange={() => {}}
      />
    );

    expect(screen.getByText('Field is required')).toBeInTheDocument();
  });
});
