
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
    <div className={cn("w-64 h-screen bg-card border-r border-border sticky top-0 flex flex-col", className)}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <DeepFlowLogo className="h-8 w-8" />
          <h1 className="text-xl font-bold">DeepFlow</h1>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Button
              key={item.path}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-10",
                isActive && "bg-secondary text-secondary-foreground"
              )}
              onClick={() => handleItemClick(item.path)}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={async () => {
            await signOut();
            navigate('/login');
            onItemClick?.();
          }}
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}
