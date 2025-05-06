
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  ChartLineIcon,
  BrainCircuitIcon,
  CheckSquareIcon,
  ListTodoIcon,
  CalendarCheckIcon,
  BookOpenTextIcon,
  TargetIcon,
  TimerIcon,
  LogOutIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon
} from "../icons/DeepFlowIcons";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Settings } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const { setTheme, theme } = useTheme();
  const { signOut } = useAuth();

  // Toggle theme between light, dark, and system
  const toggleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  // Get current theme icon
  const getThemeIcon = () => {
    if (theme === "light") return <SunIcon className="h-5 w-5" />;
    if (theme === "dark") return <MoonIcon className="h-5 w-5" />;
    return <MonitorIcon className="h-5 w-5" />;
  };

  // Navigation items with their icons
  const navItems = [
    { name: "Tableau de bord", to: "/dashboard", icon: <ChartLineIcon className="h-5 w-5" /> },
    { name: "Tâches", to: "/tasks", icon: <ListTodoIcon className="h-5 w-5" /> },
    { name: "Habitudes", to: "/habits", icon: <CalendarCheckIcon className="h-5 w-5" /> },
    { name: "Journal", to: "/journal", icon: <BookOpenTextIcon className="h-5 w-5" /> },
    { name: "Objectifs", to: "/goals", icon: <TargetIcon className="h-5 w-5" /> },
    { name: "Focus", to: "/focus", icon: <TimerIcon className="h-5 w-5" /> },
    { name: "Analyse IA", to: "/analysis", icon: <ChartLineIcon className="h-5 w-5" /> },
    { name: "Assistant IA", to: "/assistant", icon: <BrainCircuitIcon className="h-5 w-5" /> },
    { name: "Paramètres", to: "/settings", icon: <Settings className="h-5 w-5" /> },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col glass-morphism overflow-y-auto transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:w-64",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-16 flex-shrink-0 items-center px-4">
        <NavLink to="/dashboard" className="flex items-center space-x-2">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-deepflow-400 to-deepflow-700 animate-pulse"></div>
            <div className="absolute inset-0.5 rounded-full bg-white dark:bg-gray-900"></div>
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-deepflow-400 to-deepflow-600"></div>
          </div>
          <span className="text-xl font-bold font-heading bg-gradient-to-br from-deepflow-400 to-deepflow-700 text-transparent bg-clip-text">
            DeepFlow
          </span>
        </NavLink>
      </div>

      <div className="flex flex-1 flex-col px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )
            }
          >
            {item.icon}
            <span className="ml-3">{item.name}</span>
          </NavLink>
        ))}
      </div>

      <div className="p-3 space-y-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start" 
          onClick={toggleTheme}
        >
          {getThemeIcon()}
          <span className="ml-3">
            {theme === "light" ? "Thème clair" : theme === "dark" ? "Thème sombre" : "Thème système"}
          </span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOutIcon className="h-5 w-5" />
          <span className="ml-3">Déconnexion</span>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
