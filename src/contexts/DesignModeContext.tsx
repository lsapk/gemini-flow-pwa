import { createContext, useContext, useEffect, ReactNode } from "react";

interface DesignModeContextType {
  designMode: "apple";
  setDesignMode: (mode: "apple") => void;
}

const DesignModeContext = createContext<DesignModeContextType | undefined>(undefined);

export function DesignModeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("design-apple");
    localStorage.setItem("design-mode", "apple");
  }, []);

  return (
    <DesignModeContext.Provider value={{ designMode: "apple", setDesignMode: () => {} }}>
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
