
import { useState, useEffect } from 'react';

// Breakpoints correspondant aux dimensions courantes d'appareils
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpointValues: Record<Breakpoint, number> = {
  xs: 0,     // Mobile small
  sm: 640,   // Mobile large
  md: 768,   // Tablet
  lg: 1024,  // Desktop small
  xl: 1280,  // Desktop medium
  '2xl': 1536 // Desktop large
};

/**
 * Hook personnalisé pour détecter si la taille d'écran correspond à une requête média spécifique
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    // Initialisation côté client uniquement pour éviter les problèmes de SSR
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const media = window.matchMedia(query);
    
    // Fonction pour mettre à jour l'état en fonction de la requête média
    const updateMatch = () => {
      setMatches(media.matches);
    };
    
    // Initialiser l'état
    updateMatch();
    
    // Ajouter un écouteur d'événements pour les changements
    media.addEventListener('change', updateMatch);
    
    // Nettoyer l'écouteur lorsque le composant se démonte
    return () => {
      media.removeEventListener('change', updateMatch);
    };
  }, [query]);

  return matches;
}

/**
 * Hook personnalisé pour détecter si l'appareil est mobile
 * @param breakpoint - Le point de rupture à utiliser (par défaut 'md')
 * @returns {boolean} - true si l'écran est plus petit que le point de rupture
 */
export function useIsMobile(breakpoint: Breakpoint = 'md'): boolean {
  const value = breakpointValues[breakpoint];
  const isMobileQuery = useMediaQuery(`(max-width: ${value - 1}px)`);
  
  return isMobileQuery;
}

/**
 * Hook personnalisé pour obtenir la breakpoint actuelle
 * @returns {Breakpoint} - La breakpoint actuelle
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('xs');
  
  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width >= breakpointValues['2xl']) {
        setBreakpoint('2xl');
      } else if (width >= breakpointValues.xl) {
        setBreakpoint('xl');
      } else if (width >= breakpointValues.lg) {
        setBreakpoint('lg');
      } else if (width >= breakpointValues.md) {
        setBreakpoint('md');
      } else if (width >= breakpointValues.sm) {
        setBreakpoint('sm');
      } else {
        setBreakpoint('xs');
      }
    };
    
    // Initialiser
    updateBreakpoint();
    
    // Ajouter un écouteur pour les changements de taille de fenêtre
    window.addEventListener('resize', updateBreakpoint);
    
    // Nettoyage
    return () => {
      window.removeEventListener('resize', updateBreakpoint);
    };
  }, []);
  
  return breakpoint;
}

/**
 * Hook personnalisé pour détecter l'orientation de l'appareil
 * @returns {string} - 'portrait' ou 'landscape'
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    typeof window !== 'undefined' && window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  );
  
  useEffect(() => {
    const updateOrientation = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      setOrientation(isPortrait ? 'portrait' : 'landscape');
    };
    
    // Initialiser
    updateOrientation();
    
    // Ajouter des écouteurs pour les changements d'orientation
    window.addEventListener('resize', updateOrientation);
    
    // Pour les appareils mobiles
    if (typeof window.screen.orientation !== 'undefined') {
      window.screen.orientation.addEventListener('change', updateOrientation);
    }
    
    // Nettoyage
    return () => {
      window.removeEventListener('resize', updateOrientation);
      
      if (typeof window.screen.orientation !== 'undefined') {
        window.screen.orientation.removeEventListener('change', updateOrientation);
      }
    };
  }, []);
  
  return orientation;
}
