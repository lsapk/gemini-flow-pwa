
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
  Shield
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
    <div className={cn(
      "w-64 h-[calc(100vh-2rem)] m-4 rounded-[2.5rem] bg-black/40 backdrop-blur-2xl border border-white/10 flex flex-col transition-all duration-300 shadow-2xl overflow-hidden",
      className
    )}>
      <div className="p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/10 rounded-2xl">
            <img src={deepflowLogo} alt="DeepFlow Logo" className="h-7 w-7 object-contain" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white/90">DeepFlow</h1>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto scrollbar-hidden">
        {allNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isAdminItem = item.path === "/admin";

          return (
            <button
              key={item.path}
              className={cn(
                "w-full flex items-center gap-3 h-11 px-4 rounded-2xl text-sm font-medium transition-all duration-300 relative group",
                isActive 
                  ? "text-white"
                  : "text-white/40 hover:bg-white/5 hover:text-white/70",
                isAdminItem && !isActive && "text-destructive/70 hover:text-destructive hover:bg-destructive/10",
                "active:scale-[0.97]"
              )}
              onClick={() => handleItemClick(item.path)}
            >
              <item.icon className={cn(
                "h-4 w-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
                isActive ? "text-white" : "text-white/40"
              )} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 mt-auto border-t border-white/5">
        <button
          className="w-full flex items-center gap-3 h-11 px-4 rounded-2xl text-sm font-medium text-white/40 hover:bg-white/5 hover:text-destructive/80 transition-all duration-300 active:scale-[0.97]"
          onClick={async () => {
            await signOut();
            navigate('/login');
            onItemClick?.();
          }}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span>Se déconnecter</span>
        </button>
      </div>
    </div>
  );
}
