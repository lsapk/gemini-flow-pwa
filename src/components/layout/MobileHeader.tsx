
import { Button } from "@/components/ui/button";
import { Menu, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import deepflowLogo from "@/assets/deepflow-logo.png";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 md:hidden"
      style={{ 
        background: 'hsl(var(--background) / 0.72)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div className="flex h-12 items-center justify-between px-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-11 w-11 rounded-xl"
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
          <Button variant="ghost" size="icon" asChild className="h-11 w-11 rounded-xl">
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
