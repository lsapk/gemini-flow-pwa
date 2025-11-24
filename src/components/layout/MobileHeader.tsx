
import { Button } from "@/components/ui/button";
import { Menu, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import deepflowLogo from "@/assets/deepflow-logo.jpg";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-8 w-8"
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Ouvrir le menu</span>
          </Button>
          <img src={deepflowLogo} alt="DeepFlow" className="h-8 w-8 rounded-full object-cover" />
          <h1 className="text-lg font-semibold">DeepFlow</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link to="/settings">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Paramètres</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
