
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
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
      
      {/* Mobile Navigation Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-72 bg-card border-border/30">
          <Sidebar className="border-0 static bg-transparent" onItemClick={closeMobileMenu} />
        </SheetContent>
      </Sheet>

      <div className="flex">
        {/* Desktop Sidebar - Fixed position */}
        <div className="hidden md:block">
          <Sidebar className="fixed top-0 left-0 h-full z-40" />
        </div>

        {/* Main Content */}
        <main className="flex-1 pt-16 md:pt-0 md:ml-64 min-h-screen">
          <div className="px-4 py-5 sm:p-5 md:p-8 lg:p-10 max-w-[1400px] mx-auto">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}
