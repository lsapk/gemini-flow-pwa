
import { Button } from "@/components/ui/button";
import { Menu, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import deepflowLogo from "@/assets/deepflow-logo.png";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50 md:hidden">
      <div className="flex h-16 items-center justify-between px-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Ouvrir le menu</span>
          </Button>
          <Link to="/dashboard" className="flex items-center gap-2.5 active:opacity-80 transition-opacity">
            <div className="relative">
              <img src={deepflowLogo} alt="DeepFlow" className="h-9 w-9 rounded-xl object-contain bg-white/90 dark:bg-white/10 dark:invert p-1 ring-1 ring-primary/20 shadow-sm" />
              <div className="absolute inset-0 rounded-xl bg-primary/20 blur-md -z-10"></div>
            </div>
            <span className="text-xl font-heading font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              DeepFlow
            </span>
          </Link>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all active:scale-90">
            <Link to="/settings">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <span className="sr-only">Paramètres</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
