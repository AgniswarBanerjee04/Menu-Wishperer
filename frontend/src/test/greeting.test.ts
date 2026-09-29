import { describe, it, expect } from 'vitest';
import { getDiningGreeting } from '../utils/greeting';

describe('getDiningGreeting', () => {
  it('returns valid greeting structure with title, subtitle, and timeContext', () => {
    const greeting = getDiningGreeting();
    expect(greeting).toHaveProperty('title');
    expect(greeting).toHaveProperty('subtitle');
    expect(greeting).toHaveProperty('timeContext');
    expect(greeting.title.length).toBeGreaterThan(0);
    expect(greeting.subtitle.length).toBeGreaterThan(0);
    expect(greeting.timeContext.length).toBeGreaterThan(0);
  });
});
