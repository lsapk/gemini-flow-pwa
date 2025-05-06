
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Function to update state based on media query
    const updateMatch = () => {
      setMatches(media.matches);
    };
    
    // Initialize state
    updateMatch();
    
    // Add event listener for changes
    media.addEventListener('change', updateMatch);
    
    // Clean up listener when component unmounts
    return () => {
      media.removeEventListener('change', updateMatch);
    };
  }, [query]);

  return matches;
}

// Mobile breakpoint
const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
