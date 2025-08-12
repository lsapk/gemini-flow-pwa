
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Target, 
  Focus, 
  BookOpen, 
  BarChart3, 
  Settings, 
  Bot,
  Award,
  PenTool,
  Brain,
  LogOut,
  Repeat
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SidebarProps {
  className?: string;
  onItemClick?: () => void;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Tâches",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    name: "Habitudes",
    href: "/habits",
    icon: Repeat,
  },
  {
    name: "Objectifs",
    href: "/goals",
    icon: Target,
  },
  {
    name: "Focus",
    href: "/focus",
    icon: Focus,
  },
  {
    name: "Journal",
    href: "/journal",
    icon: BookOpen,
  },
  {
    name: "Analyse",
    href: "/analysis",
    icon: BarChart3,
  },
];

const secondaryNavigation = [
  {
    name: "Assistant IA",
    href: "/ai-assistant",
    icon: Bot,
  },
  {
    name: "Badges",
    href: "/badges",
    icon: Award,
  },
  {
    name: "Réflexion",
    href: "/reflection",
    icon: PenTool,
  },
  {
    name: "Profil Psychologique",
    href: "/personality-profile",
    icon: Brain,
  },
];

export default function Sidebar({ className, onItemClick }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
      toast.success("Déconnexion réussie");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const handleItemClick = () => {
    if (onItemClick) {
      onItemClick();
    }
  };

  return (
    <div className={cn("pb-12 w-64", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center mb-6">
            <Focus className="h-8 w-8 text-primary mr-3" />
            <h2 className="text-2xl font-bold tracking-tight">DeepFlow</h2>
          </div>
          <div className="space-y-1">
            <h3 className="mb-2 px-4 text-sm font-semibold text-muted-foreground">
              Principal
            </h3>
            {navigation.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={handleItemClick}
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  location.pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-1">
            <h3 className="mb-2 px-4 text-sm font-semibold text-muted-foreground">
              Outils
            </h3>
            {secondaryNavigation.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={handleItemClick}
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  location.pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-1">
            <Link
              to="/settings"
              onClick={handleItemClick}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                location.pathname === "/settings"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              )}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Paramètres</span>
            </Link>
            
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-accent-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Se déconnecter</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
