import { describe, expect, it, vi } from 'vitest';
import { systemColorScheme } from '../models/preferences/systemColorScheme';

describe('systemColorScheme', () => {
  it('reads and subscribes to the system dark-scheme preference', () => {
    let matches = false;
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    const mediaQuery = {
      get matches() {
        return matches;
      },
      addEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener);
      }),
      removeEventListener: vi.fn(
        (_type: string, listener: (event: MediaQueryListEvent) => void) => {
          listeners.delete(listener);
        },
      ),
    } as unknown as MediaQueryList;
    const matchMedia = vi.fn(() => mediaQuery);
    vi.stubGlobal('matchMedia', matchMedia);

    expect(systemColorScheme.read()).toBe('clair');
    expect(matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');

    const onChange = vi.fn();
    const unsubscribe = systemColorScheme.subscribe(onChange);
    matches = true;
    listeners.forEach((listener) => listener({ matches, media: '' } as MediaQueryListEvent));
    expect(onChange).toHaveBeenCalledOnce();

    unsubscribe();
    expect(listeners.size).toBe(0);
    expect(mediaQuery.removeEventListener).toHaveBeenCalledOnce();
  });
});
