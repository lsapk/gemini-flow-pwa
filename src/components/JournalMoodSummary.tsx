
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import React from "react";

type MoodSummaryProps = {
  entries: { mood?: string }[];
  moods: { value: string; label: string; color: string }[];
};

const emojiByMood: Record<string, string> = {
  happy: "😊", sad: "😢", excited: "🤩", calm: "😌", stressed: "😰",
  grateful: "🙏", motivated: "💪", thoughtful: "🤔"
};

export default function JournalMoodSummary({ entries, moods }: MoodSummaryProps) {
  // Regroupe par humeur
  const moodCounts: Record<string, number> = {};
  entries.forEach(entry => {
    if (entry.mood) {
      moodCounts[entry.mood] = (moodCounts[entry.mood] ?? 0) + 1;
    }
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-3">
      {moods.map((mood) => {
        const count = moodCounts[mood.value] ?? 0;
        if (count === 0) return null;
        return (
          <Card
            key={mood.value}
            className="flex px-2 py-2 sm:p-4 items-center transition-shadow"
          >
            <CardContent className="p-0 flex items-center gap-2 sm:gap-4 w-full">
              <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${mood.color}`}>
                <span className="text-xl sm:text-2xl">{emojiByMood[mood.value] || "📝"}</span>
              </div>
              <div className="flex flex-col gap-0.5 sm:gap-1">
                <div className="font-semibold text-xs sm:text-base">{mood.label}</div>
                <div className="text-[11px] sm:text-sm text-muted-foreground">
                  {count} entrée{count > 1 ? "s" : ""}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {/* Carte "Autres"/sans humeur ? */}
      {entries.filter(e => !e.mood).length > 0 && (
        <Card className="flex px-2 py-2 sm:p-4 items-center transition-shadow">
          <CardContent className="p-0 flex items-center gap-2 sm:gap-4 w-full">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center bg-muted">
              <span className="text-xl sm:text-2xl">📝</span>
            </div>
            <div className="flex flex-col gap-0.5 sm:gap-1">
              <div className="font-semibold text-xs sm:text-base">Sans humeur</div>
              <div className="text-[11px] sm:text-sm text-muted-foreground">
                {entries.filter(e => !e.mood).length} entrée{entries.filter(e => !e.mood).length > 1 ? "s" : ""}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
