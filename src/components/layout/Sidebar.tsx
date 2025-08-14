
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Target, 
  Focus, 
  BookOpen, 
  BarChart3, 
  Settings, 
  Bot,
  Trophy,
  User,
  Lightbulb
} from "lucide-react";
import { BrainCircuitIcon } from "@/components/icons/DeepFlowIcons";

const navigation = [
  { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tâches", href: "/tasks", icon: CheckSquare },
  { name: "Habitudes", href: "/habits", icon: Target },
  { name: "Objectifs", href: "/goals", icon: Target },
  { name: "Focus", href: "/focus", icon: Focus },
  { name: "Journal", href: "/journal", icon: BookOpen },
  { name: "Réflexion", href: "/reflection", icon: Lightbulb },
  { name: "Profil Psychologique", href: "/personality-profile", icon: User },
  { name: "Analyse", href: "/analysis", icon: BarChart3 },
  { name: "Assistant IA", href: "/ai-assistant", icon: Bot },
  { name: "Badges", href: "/badges", icon: Trophy },
  { name: "Paramètres", href: "/settings", icon: Settings },
];

interface SidebarProps {
  className?: string;
  onItemClick?: () => void;
}

export default function Sidebar({ className, onItemClick }: SidebarProps) {
  const location = useLocation();

  return (
    <div className={cn("flex h-screen w-64 flex-col bg-background border-r", className)}>
      <div className="flex items-center gap-2 px-6 py-4 border-b">
        <BrainCircuitIcon className="h-8 w-8" />
        <span className="text-xl font-bold">DeepFlow</span>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
