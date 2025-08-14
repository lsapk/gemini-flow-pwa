
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useNotifications } from "@/hooks/useNotifications";

export const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  useKeyboardShortcuts();
  useNotifications();
  
  return <>{children}</>;
};
