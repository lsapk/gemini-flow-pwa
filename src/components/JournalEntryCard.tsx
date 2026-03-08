import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Edit, Trash2 } from "lucide-react";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { JournalEntry } from "@/types";
import { motion } from "framer-motion";

type MoodInfo = { value: string, label: string, color: string };

interface JournalEntryCardProps {
  entry: JournalEntry;
  moods: MoodInfo[];
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entryId: string) => void;
  getMoodInfo: (mood: string) => MoodInfo | undefined;
}

export default function JournalEntryCard({ entry, onEdit, onDelete, getMoodInfo }: JournalEntryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="backdrop-blur-sm bg-card/80 border-border/30 hover:bg-card/90 active:scale-[0.98] transition-all duration-200">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-semibold truncate">{entry.title}</h3>
                {entry.mood && (
                  <Badge className="rounded-full text-xs font-medium" variant="secondary">
                    {getMoodInfo(entry.mood)?.label}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{format(new Date(entry.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85 pt-1">{entry.content}</p>
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              <Button variant="ghost" size="icon" onClick={() => onEdit(entry)} aria-label="Modifier" className="h-8 w-8 rounded-xl">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(entry.id)} aria-label="Supprimer" className="h-8 w-8 rounded-xl text-destructive/70 hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
