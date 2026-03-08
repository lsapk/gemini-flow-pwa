
import { Button } from "@/components/ui/button";
import { Menu, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import deepflowLogo from "@/assets/deepflow-logo.png";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/30 md:hidden">
      <div className="flex h-14 items-center justify-between px-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-9 w-9 rounded-xl active:scale-[0.95]"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Ouvrir le menu</span>
          </Button>
          <Link to="/dashboard" className="flex items-center gap-2 active:opacity-70 transition-opacity">
            <img src={deepflowLogo} alt="DeepFlow" className="h-8 w-8 rounded-xl object-contain bg-muted/50 p-0.5" />
            <span className="text-lg font-semibold tracking-tight text-foreground">
              DeepFlow
            </span>
          </Link>
        </div>
        
        <div className="flex items-center">
          <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-xl active:scale-[0.95]">
            <Link to="/settings">
              <Settings className="h-[18px] w-[18px] text-muted-foreground" />
              <span className="sr-only">Paramètres</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
