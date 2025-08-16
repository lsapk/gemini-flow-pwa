
import { useState } from "react";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export default function PageLayout({ children, title, className = "" }: PageLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <div className="flex-1 min-w-0">
          <div className="md:hidden">
            <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetContent side="left" className="p-0 w-64">
                <Sidebar className="border-0 static" onItemClick={() => setIsMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
          
          <div className={`pt-14 md:pt-6 px-3 md:px-6 ${className}`}>
            <div className="max-w-4xl mx-auto space-y-3 md:space-y-6">
              {title && (
                <h1 className="text-lg md:text-2xl font-bold tracking-tight">{title}</h1>
              )}
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
