
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Repeat, 
  Timer, 
  BookOpen, 
  Target, 
  BarChart3, 
  Settings, 
  LogOut,
  Bot,
  Award
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const navigation = [
  { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tâches", href: "/tasks", icon: CheckSquare },
  { name: "Habitudes", href: "/habits", icon: Repeat },
  { name: "Focus", href: "/focus", icon: Timer },
  { name: "Journal", href: "/journal", icon: BookOpen },
  { name: "Objectifs", href: "/goals", icon: Target },
  { name: "Analyse", href: "/analysis", icon: BarChart3 },
  { name: "Assistant IA", href: "/ai-assistant", icon: Bot },
  { name: "Badges", href: "/badges", icon: Award },
];

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className={cn("pb-12 w-64 bg-background border-r", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            DeepFlow
          </h2>
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Button
                  key={item.name}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive && "bg-secondary"
                  )}
                  asChild
                >
                  <Link to={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
        
        <Separator />
        
        <div className="px-3 py-2">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start"
              asChild
            >
              <Link to="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
