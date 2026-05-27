
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
      "w-72 h-[calc(100vh-2rem)] m-4 rounded-[2.5rem] bg-black/60 backdrop-blur-3xl border border-white/5 flex flex-col transition-all duration-300 shadow-2xl overflow-hidden",
      className
    )}>
      <div className="p-10 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-white/5 rounded-2xl border border-white/10">
            <img src={deepflowLogo} alt="DeepFlow Logo" className="h-7 w-7 object-contain" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white/90">DeepFlow</h1>
        </div>
      </div>
      
      <nav className="flex-1 px-6 py-4 space-y-1.5 overflow-y-auto scrollbar-hidden">
        {allNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isAdminItem = item.path === "/admin";

          return (
            <button
              key={item.path}
              className={cn(
                "w-full flex items-center gap-4 h-12 px-5 rounded-2xl text-[15px] font-medium transition-all duration-300 relative group",
                isActive 
                  ? "text-white bg-white/10"
                  : "text-white/40 hover:bg-white/5 hover:text-white/70",
                isAdminItem && !isActive && "text-destructive/70 hover:text-destructive hover:bg-destructive/10",
                "active:scale-[0.98]"
              )}
              onClick={() => handleItemClick(item.path)}
            >
              <item.icon className={cn(
                "h-[18px] w-[18px] flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
                isActive ? "text-white" : "text-white/40"
              )} />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-2 w-1 h-5 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>
      
      <div className="p-6 mt-auto border-t border-white/5 bg-black/20">
        <div className="mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/5">
          <div className="text-xs text-white/40 mb-1">Session actuelle</div>
          <div className="text-sm font-medium text-white/80 truncate">
            {location.pathname === '/dashboard' ? 'Tableau de bord' : 'Focus Actif'}
          </div>
        </div>
        <button
          className="w-full flex items-center gap-4 h-12 px-5 rounded-2xl text-[15px] font-medium text-white/40 hover:bg-white/5 hover:text-destructive/80 transition-all duration-300 active:scale-[0.98]"
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
