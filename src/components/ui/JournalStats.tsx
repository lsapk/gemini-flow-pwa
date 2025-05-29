
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Heart, BookOpen } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";

interface JournalStatsProps {
  entries: any[];
}

export function JournalStats({ entries }: JournalStatsProps) {
  const totalEntries = entries.length;
  const currentStreak = calculateCurrentStreak(entries);
  const moodDistribution = calculateMoodDistribution(entries);
  const averageWordsPerEntry = calculateAverageWords(entries);

  function calculateCurrentStreak(entries: any[]) {
    if (entries.length === 0) return 0;
    
    const sortedEntries = entries
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(entry => format(new Date(entry.created_at), 'yyyy-MM-dd'));
    
    let streak = 0;
    let currentDate = new Date();
    
    for (let i = 0; i < sortedEntries.length; i++) {
      const entryDate = format(currentDate, 'yyyy-MM-dd');
      if (sortedEntries[i] === entryDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  }

  function calculateMoodDistribution(entries: any[]) {
    const moods = entries.map(entry => entry.mood).filter(Boolean);
    const distribution: Record<string, number> = {};
    
    moods.forEach(mood => {
      distribution[mood] = (distribution[mood] || 0) + 1;
    });
    
    const total = moods.length;
    return Object.entries(distribution).map(([mood, count]) => ({
      mood,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  }

  function calculateAverageWords(entries: any[]) {
    if (entries.length === 0) return 0;
    const totalWords = entries.reduce((sum, entry) => {
      return sum + (entry.content?.split(' ').length || 0);
    }, 0);
    return Math.round(totalWords / entries.length);
  }

  const getMoodEmoji = (mood: string) => {
    const moodEmojis: Record<string, string> = {
      'très-heureux': '😊',
      'heureux': '🙂',
      'neutre': '😐',
      'triste': '😢',
      'très-triste': '😭',
      'anxieux': '😰',
      'motivé': '💪',
      'fatigué': '😴'
    };
    return moodEmojis[mood] || '😐';
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total d'entrées</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEntries}</div>
          <p className="text-xs text-muted-foreground">
            entrées dans votre journal
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Série actuelle</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentStreak}</div>
          <p className="text-xs text-muted-foreground">
            {currentStreak > 1 ? 'jours consécutifs' : 'jour'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Mots par entrée</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageWordsPerEntry}</div>
          <p className="text-xs text-muted-foreground">
            mots en moyenne
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Humeur dominante</CardTitle>
          <Heart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {moodDistribution.length > 0 ? (
              <span>
                {getMoodEmoji(moodDistribution[0].mood)} {moodDistribution[0].percentage}%
              </span>
            ) : (
              '😐'
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            cette semaine
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
