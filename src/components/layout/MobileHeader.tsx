
import React from 'react';
import { Menu, X, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface MobileHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const MobileHeader = ({ sidebarOpen, setSidebarOpen }: MobileHeaderProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const displayName = user?.user_metadata?.display_name || user?.profile?.display_name || '';
  const initials = displayName ? displayName.charAt(0).toUpperCase() : 'U';
  
  return (
    <header className="fixed top-0 left-0 right-0 glass-nav h-16 flex items-center px-4 gap-4 z-40">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={cn(
          "rounded-full transition-transform",
          sidebarOpen && "rotate-90"
        )}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
      
      <div className="flex-1 flex justify-center">
        <div 
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          <div className="relative w-7 h-7">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-deepflow-400 to-deepflow-700"></div>
            <div className="absolute inset-0.5 rounded-full bg-white dark:bg-gray-900"></div>
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-deepflow-400 to-deepflow-600"></div>
          </div>
          <span className="text-lg font-bold font-heading bg-gradient-to-br from-deepflow-400 to-deepflow-700 text-transparent bg-clip-text">
            DeepFlow
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full"
          onClick={() => navigate('/assistant')}
        >
          <Bell className="h-5 w-5" />
        </Button>
        
        <Avatar 
          className="h-9 w-9 cursor-pointer"
          onClick={() => navigate('/settings')}
        >
          <AvatarImage src="" alt={displayName} />
          <AvatarFallback className="text-sm font-medium bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};

export default MobileHeader;
