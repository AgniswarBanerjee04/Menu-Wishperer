import { describe, it, expect } from 'vitest';
import {
  cleanIndianPhoneDigits,
  formatIndianMobile,
  isValidIndianMobile,
  capitalizeName
} from '../utils/phoneUtils';

describe('phoneUtils', () => {
  it('cleanIndianPhoneDigits removes non-digits and leading +91 or 0', () => {
    expect(cleanIndianPhoneDigits('+91 98765 43210')).toBe('9876543210');
    expect(cleanIndianPhoneDigits('09876543210')).toBe('9876543210');
    expect(cleanIndianPhoneDigits('98765-43210')).toBe('9876543210');
  });

  it('formatIndianMobile formats digits with 5-5 split and +91 prefix', () => {
    expect(formatIndianMobile('9876543210', true)).toBe('+91 98765 43210');
    expect(formatIndianMobile('9876543210', false)).toBe('98765 43210');
    expect(formatIndianMobile('', true)).toBe('');
  });

  it('isValidIndianMobile validates 10-digit numbers starting with 6-9', () => {
    expect(isValidIndianMobile('9876543210')).toBe(true);
    expect(isValidIndianMobile('+91 87654 32109')).toBe(true);
    expect(isValidIndianMobile('7012345678')).toBe(true);
    expect(isValidIndianMobile('6123456789')).toBe(true);

    // Invalid numbers
    expect(isValidIndianMobile('1234567890')).toBe(false);
    expect(isValidIndianMobile('98765')).toBe(false);
    expect(isValidIndianMobile('987654321012')).toBe(false);
  });

  it('capitalizeName capitalizes each word properly', () => {
    expect(capitalizeName('alex gourmet')).toBe('Alex Gourmet');
    expect(capitalizeName('AARAV SHARMA')).toBe('Aarav Sharma');
    expect(capitalizeName('chef de cuisine')).toBe('Chef De Cuisine');
  });
});
