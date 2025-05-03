
import { MenuIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const MobileHeader = ({ sidebarOpen, setSidebarOpen }: MobileHeaderProps) => {
  return (
    <div className="sticky top-0 z-10 flex-shrink-0 flex items-center h-16 bg-background/90 backdrop-blur border-b px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? (
          <XIcon className="h-6 w-6" />
        ) : (
          <MenuIcon className="h-6 w-6" />
        )}
      </Button>
      <div className="ml-4 flex items-center">
        <div className="relative w-6 h-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-deepflow-400 to-deepflow-700 animate-pulse"></div>
          <div className="absolute inset-0.5 rounded-full bg-white dark:bg-gray-900"></div>
          <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-deepflow-400 to-deepflow-600"></div>
        </div>
        <span className="ml-2 text-lg font-bold font-heading bg-gradient-to-br from-deepflow-400 to-deepflow-700 text-transparent bg-clip-text">
          DeepFlow
        </span>
      </div>
    </div>
  );
};

export default MobileHeader;
