import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { CalendarItem } from "@/hooks/useCalendarData";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";

interface WeekCalendarViewProps {
  items: CalendarItem[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function WeekCalendarView({ items, selectedDate, onDateChange }: WeekCalendarViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Lundi
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

  // Organiser les items par jour et par heure
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
      if (!item.date) return hour === 0; // Items sans heure vont à minuit
      const itemDate = new Date(item.date);
      return itemDate.getHours() === hour;
    }) || [];
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {format(weekStart, "'Semaine du' d MMMM yyyy", { locale: fr })}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Aujourd'hui
            </Button>
            <Button variant="outline" size="icon" onClick={previousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* En-tête des jours */}
            <div className="grid grid-cols-8 border-b sticky top-0 bg-background z-10">
              <div className="p-2 text-xs font-medium text-muted-foreground border-r">
                Heure
              </div>
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "p-2 text-center border-r",
                    isSameDay(day, selectedDate) && "bg-primary/5"
                  )}
                >
                  <div className="text-xs font-medium text-muted-foreground">
                    {format(day, 'EEEE', { locale: fr })}
                  </div>
                  <div className={cn(
                    "text-lg font-semibold mt-1",
                    isSameDay(day, new Date()) && "text-primary"
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Grille des heures */}
            <div className="max-h-[600px] overflow-y-auto">
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b min-h-[60px]">
                  <div className="p-2 text-xs text-muted-foreground border-r flex items-start">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  {weekDays.map((day) => {
                    const dayItems = getItemsForDayAndHour(day, hour);
                    return (
                      <div
                        key={`${day.toISOString()}-${hour}`}
                        className={cn(
                          "p-1 border-r relative",
                          isSameDay(day, selectedDate) && "bg-primary/5"
                        )}
                      >
                        {dayItems.map((item) => (
                          <div
                            key={item.id}
                            className={cn(
                              "text-xs p-1 mb-1 rounded border-l-2 bg-card hover:shadow-sm transition-shadow cursor-pointer",
                              item.type === 'task' && "border-l-blue-500 bg-blue-500/10",
                              item.type === 'goal' && "border-l-purple-500 bg-purple-500/10",
                              item.type === 'google_event' && "border-l-green-500 bg-green-500/10",
                              item.completed && "opacity-60"
                            )}
                          >
                            <div className={cn(
                              "font-medium truncate",
                              item.completed && "line-through"
                            )}>
                              {item.title}
                            </div>
                            {item.priority && (
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {item.priority}
                              </div>
                            )}
                            {item.source === 'google' && (
                              <div className="text-[10px] text-green-600 mt-0.5">
                                📅 Google
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
      </CardContent>
    </Card>
  );
}
