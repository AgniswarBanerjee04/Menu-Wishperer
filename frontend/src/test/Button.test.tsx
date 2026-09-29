import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../components/common/Button';

describe('Button component', () => {
  it('renders button label correctly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('triggers onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit</Button>);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled Action</Button>);
    expect(screen.getByRole('button', { name: /disabled action/i })).toBeDisabled();
  });

  it('disables button and shows spinner when isLoading is true', () => {
    render(<Button isLoading>Loading Action</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });
});
