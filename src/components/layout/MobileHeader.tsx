
import { Button } from "@/components/ui/button";
import { Menu, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import deepflowLogo from "@/assets/deepflow-logo.png";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="glass-nav md:hidden">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Ouvrir le menu</span>
          </Button>
          <div className="flex items-center gap-2">
            <div className="relative">
              <img src={deepflowLogo} alt="DeepFlow" className="h-8 w-8 rounded-lg object-contain bg-white/90 dark:bg-white/10 dark:invert p-0.5 ring-2 ring-primary/20" />
              <div className="absolute inset-0 rounded-lg bg-primary/10 blur-sm -z-10"></div>
            </div>
            <h1 className="text-lg font-heading font-bold gradient-text">DeepFlow</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
            <Link to="/settings">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Paramètres</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
