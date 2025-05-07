
import { useState, useEffect, useCallback } from "react";

/**
 * Hook to detect if the device is mobile
 */
export function useMediaQuery(query: string): boolean {
  const getMatches = useCallback((query: string): boolean => {
    // Check for SSR (server-side rendering)
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  }, []);

  const [matches, setMatches] = useState<boolean>(getMatches(query));

  useEffect(() => {
    function handleChange() {
      setMatches(getMatches(query));
    }

    const matchMedia = window.matchMedia(query);
    
    // Initial check
    handleChange();

    // Listen for changes
    if (matchMedia.addEventListener) {
      matchMedia.addEventListener("change", handleChange);
    } else {
      // Fallback for older browsers
      matchMedia.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if (matchMedia.removeEventListener) {
        matchMedia.removeEventListener("change", handleChange);
      } else {
        // Fallback for older browsers
        matchMedia.removeListener(handleChange);
      }
    };
  }, [getMatches, query]);

  return matches;
}

/**
 * Hook to detect if the device is mobile
 */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 768px)");
}

/**
 * Hook alias for backward compatibility
 * Export the hook explicitly for backward compatibility
 */
export const useMobile = useIsMobile;

/**
 * Hook to detect orientation
 */
export function useOrientation(): "portrait" | "landscape" {
  const isPortrait = useMediaQuery("(orientation: portrait)");
  return isPortrait ? "portrait" : "landscape";
}

/**
 * Hook to detect if the device is touch enabled
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState<boolean>(false);

  useEffect(() => {
    const isTouchDevice = 
      "ontouchstart" in window || 
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0;
    
    setIsTouch(isTouchDevice);
  }, []);

  return isTouch;
}

/**
 * Hook to detect device type
 */
export function useDeviceType(): "mobile" | "tablet" | "desktop" {
  const isMobile = useMediaQuery("(max-width: 480px)");
  const isTablet = useMediaQuery("(min-width: 481px) and (max-width: 1024px)");
  
  if (isMobile) return "mobile";
  if (isTablet) return "tablet";
  return "desktop";
}

/**
 * Hook to detect network status
 */
export function useNetworkStatus(): { online: boolean; type: string | undefined } {
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [type, setType] = useState<string | undefined>(undefined);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Try to get connection type if available
    if ((navigator as any).connection) {
      setType((navigator as any).connection.effectiveType);
      
      const handleConnectionChange = () => {
        setType((navigator as any).connection.effectiveType);
      };
      
      (navigator as any).connection.addEventListener("change", handleConnectionChange);
      
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        (navigator as any).connection.removeEventListener("change", handleConnectionChange);
      };
    }
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { online, type };
}
