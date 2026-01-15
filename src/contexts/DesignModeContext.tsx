import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type DesignMode = "futuristic" | "apple";

interface DesignModeContextType {
  designMode: DesignMode;
  setDesignMode: (mode: DesignMode) => void;
}

const DesignModeContext = createContext<DesignModeContextType | undefined>(undefined);

export function DesignModeProvider({ children }: { children: ReactNode }) {
  const [designMode, setDesignMode] = useState<DesignMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("design-mode") as DesignMode) || "futuristic";
    }
    return "futuristic";
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove previous design mode classes
    root.classList.remove("design-futuristic", "design-apple");
    
    // Add current design mode class
    root.classList.add(`design-${designMode}`);
    
    // Persist choice
    localStorage.setItem("design-mode", designMode);
  }, [designMode]);

  return (
    <DesignModeContext.Provider value={{ designMode, setDesignMode }}>
      {children}
    </DesignModeContext.Provider>
  );
}

export function useDesignMode() {
  const context = useContext(DesignModeContext);
  if (!context) {
    throw new Error("useDesignMode must be used within a DesignModeProvider");
  }
  return context;
}
