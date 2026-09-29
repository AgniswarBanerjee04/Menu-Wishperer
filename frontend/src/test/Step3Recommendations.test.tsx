import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Step3Recommendations } from '../components/wizard/Step3Recommendations';
import { DiningModeProvider } from '../context/DiningModeContext';

describe('Step3Recommendations component', () => {
  const mockPersonalRecommendations = [
    {
      dish_name: 'Paneer Butter Masala',
      description: 'Rich cottage cheese in creamy tomato gravy',
      price: 340,
      currency: 'INR',
      category: 'Main Course',
      dietary: 'veg' as const,
      spice_level: 'mild' as const,
      match_score: 95,
      reasoning: 'Matches your comfort food craving with mild butter gravy',
    },
    {
      dish_name: 'Garlic Butter Naan',
      description: 'Clay oven bread with roasted garlic and butter',
      price: 90,
      currency: 'INR',
      category: 'Breads',
      dietary: 'veg' as const,
      spice_level: 'mild' as const,
      match_score: 90,
      reasoning: 'Perfect accompaniment for rich gravies',
    },
    {
      dish_name: 'Mango Lassi',
      description: 'Refreshing churned yogurt smoothie',
      price: 110,
      currency: 'INR',
      category: 'Beverages',
      dietary: 'veg' as const,
      spice_level: 'mild' as const,
      match_score: 88,
      reasoning: 'Cooling sweet refreshment',
    },
  ];

  it('renders Personal mode with Signature Sommelier Pairing and Solo Meal sets', () => {
    const handleOrder = vi.fn();
    const handleStartOver = vi.fn();

    render(
      <DiningModeProvider>
        <Step3Recommendations
          restaurantName="Punjab Grill"
          mood="comfort_food"
          recommendations={mockPersonalRecommendations}
          disclaimer="Check allergens with staff"
          budget={600}
          mode="personal"
          onOrderDish={handleOrder}
          onStartOver={handleStartOver}
        />
      </DiningModeProvider>
    );

    expect(screen.getByText('The Signature Pairing')).toBeInTheDocument();
    expect(screen.getByText(/the crown jewel/i)).toBeInTheDocument();
    expect(screen.getByText('Curated Epicurean Selections')).toBeInTheDocument();

    expect(screen.getAllByText('Paneer Butter Masala').length).toBeGreaterThan(0);
  });

  it('renders Custom Group mode with Consolidated Bill Estimate, Table Share Feast and Member picks', () => {
    const handleOrder = vi.fn();
    const handleStartOver = vi.fn();
    const handleSwitchMode = vi.fn();

    const mockGuests = [
      { id: 'g_dad', name: 'Dad', dietary: 'veg' as const, spice_level: 'mild' as const, max_budget: 450 },
      { id: 'g_friend', name: 'Friend', dietary: 'non-veg' as const, spice_level: 'spicy' as const, max_budget: 650 },
    ];

    const mockGroupBill = {
      total_cost: 1100,
      total_budget: 1100,
      per_person_average: 550,
      is_within_budget: true,
      breakdown: [
        {
          guest_id: 'g_dad',
          guest_name: 'Dad',
          allocated_cost: 450,
          budget_cap: 450,
          is_within_budget: true,
          recommended_dishes: ['Paneer Butter Masala', 'Share of table feast (1 dishes)'],
        },
        {
          guest_id: 'g_friend',
          guest_name: 'Friend',
          allocated_cost: 650,
          budget_cap: 650,
          is_within_budget: true,
          recommended_dishes: ['Mutton Rogan Josh', 'Share of table feast (1 dishes)'],
        },
      ],
    };

    const mockTableShares = [
      {
        dish_name: 'Dal Makhani Heritage Handi',
        description: 'Slow-cooked lentils for the table',
        price: 320,
        currency: 'INR',
        category: 'Dal',
        dietary: 'veg' as const,
        spice_level: 'mild' as const,
        match_score: 96,
        reasoning: 'Universal crowd-pleaser satisfying all table constraints',
      },
    ];

    const mockGuestRecs = {
      g_dad: [mockPersonalRecommendations[0]],
      g_friend: [
        {
          dish_name: 'Mutton Rogan Josh',
          description: 'Aromatic Kashmiri lamb curry',
          price: 480,
          currency: 'INR',
          category: 'Main Course',
          dietary: 'non-veg' as const,
          spice_level: 'spicy' as const,
          match_score: 94,
          reasoning: 'Curated for Friend: Bold spice and rich tender meat',
        },
      ],
    };

    render(
      <DiningModeProvider>
        <Step3Recommendations
          restaurantName="Punjab Grill"
          mood="celebrating"
          recommendations={mockPersonalRecommendations}
          disclaimer="Check allergens with staff"
          budget={1100}
          mode="custom"
          guests={mockGuests}
          guestRecommendations={mockGuestRecs}
          tableShareRecommendations={mockTableShares}
          groupBillEstimate={mockGroupBill}
          onOrderDish={handleOrder}
          onStartOver={handleStartOver}
          onSwitchMode={handleSwitchMode}
        />
      </DiningModeProvider>
    );

    // Group Bill Card
    expect(screen.getByText('Consolidated Group Bill Estimate')).toBeInTheDocument();
    expect(screen.getByText(/per-person avg/i)).toBeInTheDocument();
    expect(screen.getByText('For Dad')).toBeInTheDocument();
    expect(screen.getByText('For Friend')).toBeInTheDocument();

    // Table Share
    expect(screen.getByText(/table share & centerpiece feast/i)).toBeInTheDocument();
    expect(screen.getByText('Dal Makhani Heritage Handi')).toBeInTheDocument();

    // Switch mode trigger
    const personalTab = screen.getByRole('tab', { name: /personal dining/i });
    fireEvent.click(personalTab);
    expect(handleSwitchMode).toHaveBeenCalledWith('personal');
  });
});
