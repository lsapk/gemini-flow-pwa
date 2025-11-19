import { useState, useMemo } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { CalendarItem } from "@/hooks/useCalendarData";
import { ChevronLeft, ChevronRight, Calendar, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";

interface ProfessionalWeekCalendarProps {
  items: CalendarItem[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onCreateEvent?: (date: Date, hour: number) => void;
}

export function ProfessionalWeekCalendar({ 
  items, 
  selectedDate, 
  onDateChange,
  onCreateEvent 
}: ProfessionalWeekCalendarProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const previousWeek = () => {
    onDateChange(addDays(selectedDate, -7));
  };

  const nextWeek = () => {
    onDateChange(addDays(selectedDate, 7));
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const itemsByDay = useMemo(() => {
    const organized: Record<string, CalendarItem[]> = {};
    
    weekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      organized[dayKey] = items.filter(item => {
        const itemDate = new Date(item.date);
        return isSameDay(itemDate, day);
      });
    });
    
    return organized;
  }, [items, weekDays]);

  const getItemsForDayAndHour = (day: Date, hour: number) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    return itemsByDay[dayKey]?.filter(item => {
      if (!item.date) return hour === 0;
      const itemDate = new Date(item.date);
      return itemDate.getHours() === hour;
    }) || [];
  };

  const getEventStyle = (type: string) => {
    switch (type) {
      case 'task':
        return 'bg-blue-500/90 border-blue-600 hover:bg-blue-500';
      case 'habit':
        return 'bg-purple-500/90 border-purple-600 hover:bg-purple-500';
      case 'goal':
        return 'bg-amber-500/90 border-amber-600 hover:bg-amber-500';
      case 'google_event':
        return 'bg-emerald-500/90 border-emerald-600 hover:bg-emerald-500';
      default:
        return 'bg-primary/90 border-primary hover:bg-primary';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">
            {format(weekStart, "MMMM yyyy", { locale: fr })}
          </h2>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Aujourd'hui
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={previousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[1000px] h-full">
          {/* Days Header */}
          <div className="grid grid-cols-8 sticky top-0 bg-background z-20 border-b">
            <div className="p-3 text-xs font-medium text-muted-foreground border-r"></div>
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "p-3 text-center border-r flex flex-col items-center gap-1",
                  isSameDay(day, new Date()) && "bg-primary/5"
                )}
              >
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {format(day, 'EEE', { locale: fr })}
                </div>
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold",
                  isSameDay(day, new Date()) && "bg-primary text-primary-foreground"
                )}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Hours Grid */}
          <div className="relative">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b min-h-[80px]">
                {/* Hour Label */}
                <div className="p-2 text-xs text-muted-foreground border-r text-right pr-3 pt-1">
                  {hour.toString().padStart(2, '0')}:00
                </div>

                {/* Day Columns */}
                {weekDays.map((day) => {
                  const dayItems = getItemsForDayAndHour(day, hour);
                  
                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className={cn(
                        "border-r p-1 hover:bg-muted/30 transition-colors cursor-pointer relative group",
                        isSameDay(day, new Date()) && "bg-primary/[0.02]"
                      )}
                      onClick={() => onCreateEvent?.(day, hour)}
                    >
                      {/* Plus button on hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-background/90 rounded-full p-1 shadow-sm">
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Events */}
                      {dayItems.map((item, idx) => (
                        <div
                          key={`${item.id}-${idx}`}
                          className={cn(
                            "mb-1 p-2 rounded-md text-xs font-medium text-white border-l-4 shadow-sm transition-all hover:shadow-md cursor-pointer",
                            getEventStyle(item.type),
                            item.completed && "opacity-60 line-through"
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="font-semibold truncate">{item.title}</div>
                          {item.date && (
                            <div className="text-[10px] opacity-90 mt-0.5">
                              {format(new Date(item.date), 'HH:mm')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="border-t p-3 bg-card">
        <div className="flex items-center gap-4 text-xs">
          <span className="text-muted-foreground font-medium">Légende:</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span>Tâches</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-500"></div>
            <span>Habitudes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500"></div>
            <span>Objectifs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500"></div>
            <span>Google Calendar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
