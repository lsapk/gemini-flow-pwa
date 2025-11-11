
import { Button } from "@/components/ui/button";
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
  Award,
  Brain,
  User,
  LogOut,
  Calendar
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { DeepFlowLogo } from "@/components/icons/DeepFlowIcons";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  className?: string;
  onItemClick?: () => void;
}

export default function Sidebar({ className, onItemClick }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const navItems = [
    { icon: Home, label: "Tableau de bord", path: "/dashboard" },
    { icon: CheckSquare, label: "Tâches", path: "/tasks" },
    { icon: Target, label: "Habitudes", path: "/habits" },
    { icon: Target, label: "Objectifs", path: "/goals" },
    { icon: Timer, label: "Focus", path: "/focus" },
    { icon: Calendar, label: "Calendrier", path: "/calendar" },
    { icon: BookOpen, label: "Journal", path: "/journal" },
    { icon: Brain, label: "Réflexion", path: "/reflection" },
    { icon: User, label: "Profil IA", path: "/profile" },
    { icon: BarChart3, label: "Analyse", path: "/analysis" },
    { icon: MessageSquare, label: "Assistant IA", path: "/ai-assistant" },
    { icon: Award, label: "Badges", path: "/badges" },
    { icon: Settings, label: "Paramètres", path: "/settings" },
  ];

  const handleItemClick = (path: string) => {
    navigate(path);
    onItemClick?.();
  };

  return (
    <div className={cn("w-64 h-screen bg-card border-r border-border sticky top-0 flex flex-col shadow-sm", className)}>
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <DeepFlowLogo className="h-9 w-9" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">DeepFlow</h1>
        </div>
      </div>
      
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hidden">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Button
              key={item.path}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-11 font-medium transition-all",
                isActive && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary shadow-sm"
              )}
              onClick={() => handleItemClick(item.path)}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </Button>
          );
        })}
      </nav>
      
      <div className="p-3 border-t border-border/50 bg-muted/20">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10 font-medium"
          onClick={async () => {
            await signOut();
            navigate('/login');
            onItemClick?.();
          }}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}
