import { useState, useMemo } from "react";
import { format, addDays, startOfWeek, isSameDay, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Plus, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, CalendarDays, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  colorId?: string;
}

interface GoogleCalendarViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onCreateEvent?: (date: Date, hour: number) => void;
  onAddClick?: () => void;
}

const hours = Array.from({ length: 24 }, (_, i) => i); // 00:00 to 23:00

const eventColors = [
  { bg: "bg-blue-500", border: "border-blue-600", text: "text-white" },
  { bg: "bg-orange-500", border: "border-orange-600", text: "text-white" },
  { bg: "bg-purple-500", border: "border-purple-600", text: "text-white" },
  { bg: "bg-cyan-500", border: "border-cyan-600", text: "text-white" },
  { bg: "bg-green-500", border: "border-green-600", text: "text-white" },
  { bg: "bg-pink-500", border: "border-pink-600", text: "text-white" },
  { bg: "bg-red-500", border: "border-red-600", text: "text-white" },
  { bg: "bg-amber-500", border: "border-amber-600", text: "text-white" },
  { bg: "bg-indigo-500", border: "border-indigo-600", text: "text-white" },
  { bg: "bg-teal-500", border: "border-teal-600", text: "text-white" },
];

export function GoogleCalendarView({
  currentDate,
  events,
  onEventClick,
  onCreateEvent,
  onAddClick
}: GoogleCalendarViewProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = viewMode === 'week' 
    ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    : [currentDate];

  // Current time indicator
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimePosition = ((currentHour + currentMinutes / 60) / 24) * 100;

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = event.start.dateTime 
        ? parseISO(event.start.dateTime)
        : event.start.date ? parseISO(event.start.date) : null;
      return eventDate && isSameDay(eventDate, day);
    });
  };

  const getAllDayEvents = (day: Date) => {
    return events.filter(event => {
      if (event.start.date && !event.start.dateTime) {
        const eventDate = parseISO(event.start.date);
        return isSameDay(eventDate, day);
      }
      return false;
    });
  };

  const getTimedEvents = (day: Date) => {
    return events.filter(event => {
      if (event.start.dateTime) {
        const eventDate = parseISO(event.start.dateTime);
        return isSameDay(eventDate, day);
      }
      return false;
    });
  };

  const getEventPosition = (event: CalendarEvent) => {
    if (!event.start.dateTime || !event.end.dateTime) return null;

    const start = parseISO(event.start.dateTime);
    const end = parseISO(event.end.dateTime);
    
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    
    const top = (startHour / 24) * 100;
    const height = Math.max(((endHour - startHour) / 24) * 100, 2); // Minimum 2% height
    
    return { 
      top: `${top}%`, 
      height: `${height}%`,
      startTime: format(start, 'HH:mm'),
      endTime: format(end, 'HH:mm')
    };
  };

  const getEventColor = (index: number) => {
    return eventColors[index % eventColors.length];
  };

  const handleCellClick = (day: Date, hour: number) => {
    if (onCreateEvent) {
      onCreateEvent(day, hour);
    }
  };

  const cellHeight = 48 * zoomLevel; // Base height 48px

  const formatEventTime = (event: CalendarEvent) => {
    if (!event.start.dateTime) return 'Toute la journée';
    const start = parseISO(event.start.dateTime);
    const end = event.end.dateTime ? parseISO(event.end.dateTime) : null;
    return `${format(start, 'HH:mm')}${end ? ` - ${format(end, 'HH:mm')}` : ''}`;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top toolbar */}
      <div className="flex items-center justify-between gap-4 px-4 py-2 border-b bg-card/50 backdrop-blur-sm">
        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={viewMode === 'day' ? 'default' : 'outline'}
            onClick={() => setViewMode('day')}
            className="gap-1"
          >
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Jour</span>
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'week' ? 'default' : 'outline'}
            onClick={() => setViewMode('week')}
            className="gap-1"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Semaine</span>
          </Button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
            disabled={zoomLevel <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <div className="hidden sm:flex items-center gap-2 min-w-[120px]">
            <Slider
              value={[zoomLevel]}
              onValueChange={(value) => setZoomLevel(value[0])}
              min={0.5}
              max={2}
              step={0.25}
              className="flex-1"
            />
          </div>
          <span className="text-xs text-muted-foreground min-w-[40px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}
            disabled={zoomLevel >= 2}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week header */}
      <div className={cn(
        "grid border-b sticky top-0 bg-card/95 backdrop-blur-sm z-20 shadow-sm",
        viewMode === 'week' ? "grid-cols-[60px_repeat(7,1fr)]" : "grid-cols-[60px_1fr]"
      )}>
        <div className="border-r bg-muted/30 flex items-end pb-2 px-2">
          <span className="text-[10px] text-muted-foreground">GMT+1</span>
        </div>
        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, new Date());
          const dayEvents = getEventsForDay(day);
          const allDayEvents = getAllDayEvents(day);
          
          return (
            <div
              key={i}
              className={cn(
                "text-center py-3 px-1 border-r transition-colors",
                isToday && "bg-primary/5"
              )}
            >
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {format(day, 'EEE', { locale: fr })}
              </div>
              <div
                className={cn(
                  "text-2xl font-semibold mt-1 inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors",
                  isToday && "bg-primary text-primary-foreground"
                )}
              >
                {format(day, 'd')}
              </div>
              
              {/* All-day events indicator */}
              {allDayEvents.length > 0 && (
                <div className="mt-2 space-y-1 px-1">
                  {allDayEvents.slice(0, 2).map((event, idx) => (
                    <TooltipProvider key={event.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded-sm truncate cursor-pointer",
                              getEventColor(idx).bg,
                              getEventColor(idx).text
                            )}
                            onClick={() => onEventClick?.(event)}
                          >
                            {event.summary}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{event.summary}</p>
                          <p className="text-xs text-muted-foreground">Toute la journée</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  {allDayEvents.length > 2 && (
                    <Badge variant="secondary" className="text-[10px]">
                      +{allDayEvents.length - 2} autres
                    </Badge>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Calendar grid */}
      <ScrollArea className="flex-1">
        <div className={cn(
          "grid min-h-full relative",
          viewMode === 'week' ? "grid-cols-[60px_repeat(7,1fr)]" : "grid-cols-[60px_1fr]"
        )}>
          {/* Hours column */}
          <div className="border-r bg-muted/20 sticky left-0 z-10">
            {hours.map(hour => (
              <div
                key={hour}
                className="border-b text-[11px] text-muted-foreground pr-2 text-right flex items-start justify-end pt-0"
                style={{ height: `${cellHeight}px` }}
              >
                <span className="-mt-2 bg-background px-1">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Days columns */}
          {weekDays.map((day, dayIndex) => {
            const isToday = isSameDay(day, new Date());
            const timedEvents = getTimedEvents(day);
            
            return (
              <div 
                key={dayIndex} 
                className={cn(
                  "relative border-r",
                  isToday && "bg-primary/[0.02]"
                )}
              >
                {/* Grid cells */}
                {hours.map(hour => {
                  const cellKey = `${dayIndex}-${hour}`;
                  const isCurrentHour = isToday && hour === currentHour;
                  
                  return (
                    <div
                      key={hour}
                      className={cn(
                        "border-b relative group cursor-pointer transition-all duration-150",
                        hoveredCell === cellKey && "bg-primary/10",
                        isCurrentHour && "bg-primary/5"
                      )}
                      style={{ height: `${cellHeight}px` }}
                      onMouseEnter={() => setHoveredCell(cellKey)}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => handleCellClick(day, hour)}
                    >
                      {/* Half-hour line */}
                      <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-border/30" />
                      
                      {/* Hover indicator */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-primary/20 rounded-full p-1">
                          <Plus className="h-3 w-3 text-primary" />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Current time indicator */}
                {isToday && (
                  <div
                    className="absolute left-0 right-0 z-10 pointer-events-none"
                    style={{ top: `${currentTimePosition}%` }}
                  >
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5 shadow-lg" />
                      <div className="flex-1 h-0.5 bg-red-500 shadow-sm" />
                    </div>
                  </div>
                )}

                {/* Events */}
                {timedEvents.map((event, i) => {
                  const position = getEventPosition(event);
                  if (!position) return null;

                  const color = getEventColor(i);

                  return (
                    <TooltipProvider key={event.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "absolute left-1 right-1 rounded-md px-2 py-1 overflow-hidden cursor-pointer",
                              "transition-all duration-150 hover:scale-[1.02] hover:shadow-lg hover:z-20",
                              "border-l-4",
                              color.bg,
                              color.border,
                              color.text
                            )}
                            style={{
                              top: position.top,
                              height: position.height,
                              minHeight: '20px'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick?.(event);
                            }}
                          >
                            <div className="flex flex-col h-full overflow-hidden">
                              <div className="font-medium text-xs truncate">
                                {event.summary}
                              </div>
                              <div className="text-[10px] opacity-90">
                                {position.startTime} - {position.endTime}
                              </div>
                              {event.description && parseFloat(position.height) > 6 && (
                                <div className="text-[10px] opacity-80 mt-0.5 line-clamp-2 flex-1">
                                  {event.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-semibold">{event.summary}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatEventTime(event)}
                            </p>
                            {event.description && (
                              <p className="text-xs">{event.description}</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Floating action button */}
      <Button
        size="lg"
        className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 h-14 w-14 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105 z-30"
        onClick={onAddClick}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}