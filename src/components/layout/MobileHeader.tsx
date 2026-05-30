import React from "react";

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
      className="fixed top-4 left-4 right-4 z-50 md:hidden rounded-[2rem] border border-white/10 overflow-hidden"
      style={{ 
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      }}
    >
      <div className="flex h-14 items-center justify-between px-4 max-w-7xl mx-auto">
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
            <div className="p-1 bg-white rounded-xl">
              <img src={deepflowLogo} alt="DeepFlow" className="h-8 w-8 object-contain" />
            </div>
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
