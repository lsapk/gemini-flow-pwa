
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
      "w-64 h-[calc(100vh-2rem)] m-4 rounded-[2rem] bg-black/40 backdrop-blur-xl border border-white/10 flex flex-col transition-all duration-300 shadow-2xl",
      className
    )}>
      <div className="p-6">
        <div className="flex items-center gap-3">
          <img src={deepflowLogo} alt="DeepFlow Logo" className="h-9 w-9 rounded-xl object-contain bg-white/5 p-1" />
          <h1 className="text-xl font-bold tracking-tight text-white/90">DeepFlow</h1>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hidden">
        {allNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isAdminItem = item.path === "/admin";
          return (
            <button
              key={item.path}
              className={cn(
                "w-full flex items-center gap-3 h-12 px-4 rounded-2xl text-sm font-medium transition-all duration-300 relative group",
                isActive 
                  ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80",
                isAdminItem && !isActive && "text-destructive/70 hover:text-destructive hover:bg-destructive/10",
                "active:scale-[0.97]"
              )}
              onClick={() => handleItemClick(item.path)}
            >
              <item.icon className={cn(
                "h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
                isActive && "text-white",
                isAdminItem && !isActive && "text-destructive/70"
              )} />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 mt-auto">
        <button
          className="w-full flex items-center gap-3 h-12 px-4 rounded-2xl text-sm font-medium text-white/40 hover:bg-white/5 hover:text-destructive/80 transition-all duration-300 active:scale-[0.97]"
          onClick={async () => {
            await signOut();
            navigate('/login');
            onItemClick?.();
          }}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
}
