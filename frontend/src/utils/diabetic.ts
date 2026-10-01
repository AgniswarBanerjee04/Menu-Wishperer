/**
 * Diabetic and Low-Sugar Dietary Intelligence Utilities
 */

const HIGH_SUGAR_KEYWORDS = [
  'gulab jamun',
  'rasgulla',
  'rasmalai',
  'kheer',
  'halwa',
  'kulfi',
  'jalebi',
  'rabri',
  'rabdi',
  'sweet lassi',
  'dessert',
  'ice cream',
  'brownie',
  'pudding',
  'pastry',
  'cake',
  'sweet chutney',
  'honey',
  'caramel',
  'sugar syrup',
  'chocolate',
  'waffle',
  'pancake',
  'baklava',
  'mithai',
  'mango shake',
  'sweet corn soup',
  'sweet corn',
  'sweet makhani',
  'sweet gravy',
  'sweet sauce',
  'sweet glaze',
  'korma with sugar',
  'jaggery',
  'gur',
  'shakkar',
  'condensed milk',
  'glaze',
  'sugar',
];

export const DIABETIC_RESTRICTION_TAG = 'diabetic_safe';

/**
 * Check if the current user profile has Diabetic / Zero Added Sugar enabled in localStorage
 */
export function isDiabeticProfile(): boolean {
  if (typeof localStorage === 'undefined') return false;

  // 1. Direct boolean flag
  const directFlag = localStorage.getItem('is_diabetic');
  if (directFlag === 'true') return true;

  // 2. Checked from stored user_profile
  try {
    const rawUser = localStorage.getItem('user_profile') || localStorage.getItem('mw_current_mock_user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed.is_diabetic === true) return true;
    }
  } catch {
    // ignore
  }

  // 3. Checked from mock or cached preferences
  try {
    const rawPref = localStorage.getItem('mw_mock_preferences');
    if (rawPref) {
      const parsed = JSON.parse(rawPref);
      if (parsed.is_diabetic === true) return true;
      if (Array.isArray(parsed.dietary_restrictions)) {
        if (
          parsed.dietary_restrictions.includes(DIABETIC_RESTRICTION_TAG) ||
          parsed.dietary_restrictions.some((d: string) => d.toLowerCase().includes('diabetic'))
        ) {
          return true;
        }
      }
    }
  } catch {
    // ignore
  }

  return false;
}

/**
 * Update the user's diabetic health profile preference in localStorage
 */
export function setDiabeticProfile(enabled: boolean): void {
  if (typeof localStorage === 'undefined') return;

  localStorage.setItem('is_diabetic', enabled ? 'true' : 'false');

  // Also update user_profile object if present
  try {
    const rawUser = localStorage.getItem('user_profile');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      user.is_diabetic = enabled;
      localStorage.setItem('user_profile', JSON.stringify(user));
    }
  } catch {
    // ignore
  }

  // Update mw_current_mock_user if present
  try {
    const rawMock = localStorage.getItem('mw_current_mock_user');
    if (rawMock) {
      const mockUser = JSON.parse(rawMock);
      mockUser.is_diabetic = enabled;
      localStorage.setItem('mw_current_mock_user', JSON.stringify(mockUser));
    }
  } catch {
    // ignore
  }

  // Update mw_mock_preferences
  try {
    const rawPref = localStorage.getItem('mw_mock_preferences');
    if (rawPref) {
      const pref = JSON.parse(rawPref);
      pref.is_diabetic = enabled;
      const restrictions: string[] = pref.dietary_restrictions || [];
      if (enabled) {
        if (!restrictions.includes(DIABETIC_RESTRICTION_TAG)) {
          restrictions.push(DIABETIC_RESTRICTION_TAG);
        }
      } else {
        pref.dietary_restrictions = restrictions.filter((r) => r !== DIABETIC_RESTRICTION_TAG);
      }
      pref.dietary_restrictions = restrictions;
      localStorage.setItem('mw_mock_preferences', JSON.stringify(pref));
    }
  } catch {
    // ignore
  }
}

/**
 * Inspect dish name and description for sweet or high-glycemic components
 */
export function checkDishSugar(
  dishName: string,
  description?: string,
  category?: string
): { isSugarHeavy: boolean; reason: string; warningText?: string } {
  let text = `${dishName} ${description || ''} ${category || ''}`.toLowerCase();

  // Strip explicit sugar-free phrases first so words like "sugar" inside "zero added sugar" do not falsely trigger
  const safePhrases = [
    'zero added sugar',
    'zero sugar',
    'no added sugar',
    'no sugar',
    'sugar-free',
    'sugar free',
    'without added sugar',
    'without sugar',
    'low sugar',
    'unsweetened',
  ];

  for (const phrase of safePhrases) {
    if (text.includes(phrase)) {
      text = text.split(phrase).join('');
    }
  }

  for (const kw of HIGH_SUGAR_KEYWORDS) {
    if (text.includes(kw)) {
      const warningText = `⚠️ High Sugar Alert: Contains added sugar, sweet glaze, or sweet ingredients (${kw}). Not recommended for strict diabetic management.`;
      return {
        isSugarHeavy: true,
        reason: warningText,
        warningText,
      };
    }
  }

  return {
    isSugarHeavy: false,
    reason: 'Zero added sugar and low-glycemic profile suitable for diabetic diners.',
  };
}
