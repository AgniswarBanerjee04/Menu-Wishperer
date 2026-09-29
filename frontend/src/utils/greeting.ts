export interface GreetingData {
  title: string;
  subtitle: string;
  timeContext: string;
}

export function getDiningGreeting(): GreetingData {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return {
      title: 'Good Morning, Epicure',
      subtitle: 'A fresh dawn of bespoke culinary delights awaits your palate',
      timeContext: 'Morning Table Service',
    };
  }

  if (hour >= 12 && hour < 17) {
    return {
      title: 'Good Afternoon, Connoisseur',
      subtitle: 'Curating refined midday dining selections for your table',
      timeContext: 'Afternoon Luncheon',
    };
  }

  if (hour >= 17 && hour < 22) {
    return {
      title: 'Good Evening, Epicure',
      subtitle: 'Welcome back to your table for tonight’s tailored dining',
      timeContext: 'Evening Dinner Service',
    };
  }

  return {
    title: 'Late Night Gastronome',
    subtitle: 'Savoring the night’s finest flavors with unmatched sophistication',
    timeContext: 'Nightcaps & Midnight Cravings',
  };
}
