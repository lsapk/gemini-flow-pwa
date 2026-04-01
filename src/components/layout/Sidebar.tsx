
import { cn } from "@/lib/utils";
import { 
  Home, 
  CheckSquare, 
  Target, 
  BarChart3, 
  BookOpen, 
  Settings,
  MessageSquare,
  Timer,
  Brain,
  LogOut,
  Calendar,
  Gamepad2,
  Shield
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import deepflowLogo from "@/assets/deepflow-logo.png";

interface SidebarProps {
  className?: string;
  onItemClick?: () => void;
}

export default function Sidebar({ className, onItemClick }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, isAdmin } = useAuth();

  const navItems = [
    { icon: Home, label: "Tableau de bord", path: "/dashboard" },
    { icon: CheckSquare, label: "Tâches", path: "/tasks" },
    { icon: BarChart3, label: "Habitudes", path: "/habits" },
    { icon: Target, label: "Objectifs", path: "/goals" },
    { icon: Timer, label: "Focus", path: "/focus" },
    { icon: Calendar, label: "Calendrier", path: "/calendar" },
    { icon: BookOpen, label: "Journal", path: "/journal" },
    { icon: MessageSquare, label: "Réflexion", path: "/reflection" },
    { icon: Brain, label: "Intelligence IA", path: "/ai-assistant" },
    { icon: Settings, label: "Paramètres", path: "/settings" },
  ];

  const allNavItems = isAdmin 
    ? [...navItems, { icon: Shield, label: "Admin", path: "/admin" }]
    : navItems;

  const handleItemClick = (path: string) => {
    navigate(path);
    onItemClick?.();
  };

  return (
    <div className={cn("w-64 h-screen bg-card border-r border-border/40 sticky top-0 flex flex-col", className)}>
      {/* Logo */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <img src={deepflowLogo} alt="DeepFlow Logo" className="h-9 w-9 rounded-xl object-contain bg-muted/50 p-1" />
          <h1 className="text-lg font-semibold tracking-tight text-foreground">DeepFlow</h1>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hidden">
        {allNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isAdminItem = item.path === "/admin";
          return (
            <button
              key={item.path}
              className={cn(
                "w-full flex items-center gap-3 h-11 px-4 rounded-xl text-sm font-medium transition-colors duration-200",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                isAdminItem && !isActive && "text-destructive hover:text-destructive hover:bg-destructive/10",
                "active:scale-[0.98]"
              )}
              onClick={() => handleItemClick(item.path)}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 w-[3px] h-6 rounded-r-full bg-primary" />
              )}
              <item.icon className={cn(
                "h-[18px] w-[18px] flex-shrink-0",
                isActive && "text-primary",
                isAdminItem && !isActive && "text-destructive"
              )} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      {/* Logout */}
      <div className="p-3 border-t border-border/30">
        <button
          className="w-full flex items-center gap-3 h-11 px-4 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors duration-200 active:scale-[0.98]"
          onClick={async () => {
            await signOut();
            navigate('/login');
            onItemClick?.();
          }}
        >
          <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}
