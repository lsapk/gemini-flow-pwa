
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, Edit, Trash2 } from "lucide-react";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { JournalEntry } from "@/types";
import React from "react";

type MoodInfo = { value: string, label: string, color: string };
interface JournalEntryCardProps {
  entry: JournalEntry;
  moods: MoodInfo[];
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entryId: string) => void;
  getMoodInfo: (mood: string) => MoodInfo | undefined;
}

export default function JournalEntryCard({
  entry,
  moods,
  onEdit,
  onDelete,
  getMoodInfo,
}: JournalEntryCardProps) {
  return (
    <Card className="shadow border-2 border-muted/50 hover:shadow-lg transition-all duration-200 sm:rounded-xl rounded-lg">
      <CardHeader className="pb-3 px-4 pt-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          {/* Title, Mood badge, Date */}
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-base sm:text-lg">{entry.title}</CardTitle>
              {entry.mood && (
                <Badge className={`rounded-full ${getMoodInfo(entry.mood)?.color || ""} text-xs sm:text-base`}>
                  {getMoodInfo(entry.mood)?.label}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground font-normal">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(entry.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(entry)}
              aria-label="Modifier"
              className="h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(entry.id)}
              aria-label="Supprimer"
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4">
        <div className="prose max-w-none">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {entry.content}
          </p>
        </div>
        {entry.tags && Array.isArray(entry.tags) && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-4">
            {entry.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
