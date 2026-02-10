
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface AppLayoutProps {
  children?: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Gradient de fond animé */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-info/5 animate-pulse" style={{ animationDuration: '8s' }}></div>
      </div>
      
      {/* Mobile Header */}
      <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
      
      {/* Mobile Navigation Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-card/95 backdrop-blur-xl border-border/50">
          <Sidebar className="border-0 static bg-transparent" onItemClick={closeMobileMenu} />
        </SheetContent>
      </Sheet>

      <div className="flex relative z-10">
        {/* Desktop Sidebar - Fixed position */}
        <div className="hidden md:block">
          <Sidebar className="fixed top-0 left-0 h-full z-40" />
        </div>

        {/* Main Content */}
        <main className="flex-1 pt-16 md:pt-0 md:ml-64 min-h-screen transition-all duration-300">
          <div className="p-3 sm:p-4 md:p-8 max-w-[1600px] mx-auto">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}
