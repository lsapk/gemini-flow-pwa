import { useState } from "react";
import { ChevronLeft, ChevronRight, Menu, Search, Calendar, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GoogleCalendarHeaderProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onMenuToggle?: () => void;
  userEmail?: string;
}

export function GoogleCalendarHeader({
  currentDate,
  onDateChange,
  onMenuToggle,
  userEmail
}: GoogleCalendarHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const handlePreviousMonth = () => {
    onDateChange(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    onDateChange(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const displayMonth = format(currentDate, 'MMMM', { locale: fr });

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="flex items-center justify-between p-3 gap-3">
        {/* Left section */}
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="h-10 w-10"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Month navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousMonth}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-base font-normal capitalize min-w-[120px] sm:min-w-[140px]">
                  {displayMonth}
                  <ChevronRight className="ml-1 h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {Array.from({ length: 12 }).map((_, i) => {
                  const date = new Date(currentDate.getFullYear(), i, 1);
                  return (
                    <DropdownMenuItem
                      key={i}
                      onClick={() => onDateChange(date)}
                      className="capitalize"
                    >
                      {format(date, 'MMMM', { locale: fr })}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="h-9 w-9 sm:h-10 sm:w-10"
          >
            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleToday}
            className="h-9 w-9 sm:h-10 sm:w-10"
          >
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 sm:h-10 sm:w-10"
          >
            <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
              {userEmail?.charAt(0).toUpperCase() || "L"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Search bar (collapsible on mobile) */}
      {isSearchOpen && (
        <div className="px-4 pb-3">
          <Input
            placeholder="Rechercher..."
            className="max-w-md"
          />
        </div>
      )}
    </header>
  );
}
