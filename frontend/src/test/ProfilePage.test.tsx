import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProfilePage } from '../pages/ProfilePage';
import { AuthProvider } from '../context/AuthContext';
import * as preferencesApiModule from '../api/preferences';
import * as ordersApiModule from '../api/orders';

vi.spyOn(preferencesApiModule.preferencesApi, 'getPreferences').mockResolvedValue({
  id: 1,
  user_id: 1,
  dietary_restrictions: ['Vegetarian (Pure Veg)'],
  spice_tolerance: 'medium',
  cuisines_liked: ['North Indian', 'Mughlai'],
  cuisines_disliked: [],
  default_budget_min: 150,
  default_budget_max: 600,
  currency: 'INR',
});

vi.spyOn(ordersApiModule.ordersApi, 'getInsights').mockResolvedValue({
  total_orders: 12,
  average_rating: 4.8,
  average_spend: 540,
  favorite_cuisines: ['North Indian', 'Mughlai'],
  highest_rated_dishes: [{ name: 'Dal Bukhara', restaurant: 'Dum Pukht', rating: 5 }],
  rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 10 },
});

const renderProfile = () => {
  return render(
    <AuthProvider>
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    </AuthProvider>
  );
};

describe('ProfilePage component', () => {
  it('renders dining stats, user details, and edit profile button', async () => {
    renderProfile();

    // Wait for data load
    await waitFor(() => {
      expect(screen.getByText(/Total Meals Logged/i)).toBeInTheDocument();
    });

    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('₹540')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Edit Profile/i })).toBeInTheDocument();
  });

  it('enters edit mode and allows toggling quick dietary tags and canceling', async () => {
    renderProfile();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit Profile/i })).toBeInTheDocument();
    });

    const editBtn = screen.getByRole('button', { name: /Edit Profile/i });
    fireEvent.click(editBtn);

    // Edit controls appear
    expect(screen.getByText(/Editing Account Details & Taste Settings/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();

    // Dietary quick select tags are present
    expect(screen.getByRole('button', { name: /Pure Veg/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Non-Veg/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Jain/i })).toBeInTheDocument();

    // Click Cancel
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    // Should return to read-only view
    expect(screen.getByRole('button', { name: /Edit Profile/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Save Changes/i })).not.toBeInTheDocument();
  });
});
