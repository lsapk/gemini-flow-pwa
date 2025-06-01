
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Repeat, 
  Timer, 
  BookOpen, 
  Target, 
  Award,
  BarChart3 
} from "lucide-react";
import { motion } from "framer-motion";

const navigation = [
  { name: "Accueil", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tâches", href: "/tasks", icon: CheckSquare },
  { name: "Habitudes", href: "/habits", icon: Repeat },
  { name: "Focus", href: "/focus", icon: Timer },
  { name: "Journal", href: "/journal", icon: BookOpen },
  { name: "Objectifs", href: "/goals", icon: Target },
  { name: "Badges", href: "/badges", icon: Award },
  { name: "Analyse", href: "/analysis", icon: BarChart3 },
];

export default function MobileBottomNav() {
  const location = useLocation();

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border"
    >
      <div className="grid grid-cols-4 gap-1 p-2">
        {navigation.slice(0, 4).map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg text-xs transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
      
      {/* Deuxième rangée pour le reste */}
      <div className="grid grid-cols-4 gap-1 p-2 pt-0">
        {navigation.slice(4).map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg text-xs transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
