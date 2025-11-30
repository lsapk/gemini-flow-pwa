
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
import { useAuth } from "@/hooks/useAuth";
import deepflowLogo from "@/assets/deepflow-logo.jpg";

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
    <div className={cn("w-64 h-screen bg-card/80 backdrop-blur-xl border-r border-border/50 sticky top-0 flex flex-col shadow-lg", className)}>
      <div className="p-5 border-b border-border/30 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={deepflowLogo} alt="DeepFlow Logo" className="h-10 w-10 rounded-xl object-cover ring-2 ring-primary/20" />
            <div className="absolute inset-0 rounded-xl bg-primary/20 blur-md -z-10"></div>
          </div>
          <h1 className="text-xl font-heading font-bold gradient-text tracking-tight">DeepFlow</h1>
        </div>
      </div>
      
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto scrollbar-hidden">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Button
              key={item.path}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-12 font-medium transition-all duration-300 rounded-xl group",
                isActive && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary shadow-md border border-primary/20 glow-effect"
              )}
              onClick={() => handleItemClick(item.path)}
            >
              <item.icon className={cn(
                "h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
                isActive && "text-primary"
              )} />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-glow-pulse"></div>
              )}
            </Button>
          );
        })}
      </nav>
      
      <div className="p-3 border-t border-border/30 bg-gradient-to-br from-muted/30 to-transparent">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10 font-medium rounded-xl transition-all duration-300 hover:scale-105"
          onClick={async () => {
            await signOut();
            navigate('/login');
            onItemClick?.();
          }}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}
