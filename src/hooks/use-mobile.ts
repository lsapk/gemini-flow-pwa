
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Fonction de mise à jour de l'état en fonction du média query
    const updateMatch = () => {
      setMatches(media.matches);
    };
    
    // Initialiser l'état
    updateMatch();
    
    // Ajouter l'écouteur d'événement pour les changements
    media.addEventListener('change', updateMatch);
    
    // Nettoyer l'écouteur lors du démontage du composant
    return () => {
      media.removeEventListener('change', updateMatch);
    };
  }, [query]);

  return matches;
}
