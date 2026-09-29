import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from '../components/common/Badge';

describe('Badge component', () => {
  it('renders badge content correctly', () => {
    render(<Badge variant="amber">Vegetarian</Badge>);
    expect(screen.getByText('Vegetarian')).toBeInTheDocument();
  });

  it('applies emerald variant classes for healthy indicators', () => {
    const { container } = render(<Badge variant="emerald">Gluten-Free</Badge>);
    expect(container.firstChild).toHaveClass('bg-emerald-100');
  });
});
