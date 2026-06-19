// ── Responsive Breakpoints ────────────────────────────────────
// Usage: import { useResponsive } from '../utils/responsive';

import { useState, useEffect } from 'react';

export function useResponsive() {
  const [size, setSize] = useState({
    width:  window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return {
    isMobile:  size.width < 768,
    isTablet:  size.width >= 768 && size.width < 1024,
    isDesktop: size.width >= 1024,
    width:     size.width,
    height:    size.height,
  };
}

// Responsive grid helper
export function grid(mobile, tablet, desktop) {
  return {
    mobile:  `repeat(${mobile}, 1fr)`,
    tablet:  `repeat(${tablet}, 1fr)`,
    desktop: `repeat(${desktop}, 1fr)`,
  };
}
