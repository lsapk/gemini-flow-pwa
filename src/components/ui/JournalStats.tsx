
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Heart, BookOpen, Target, Clock } from "lucide-react";
import { format, differenceInDays, subWeeks, isAfter } from "date-fns";
import { fr } from "date-fns/locale";

interface JournalStatsProps {
  entries: any[];
}

export function JournalStats({ entries }: JournalStatsProps) {
  const totalEntries = entries.length;
  const currentStreak = calculateCurrentStreak(entries);
  const weeklyGoal = calculateWeeklyProgress(entries);
  const moodDistribution = calculateMoodDistribution(entries);
  const averageWordsPerEntry = calculateAverageWords(entries);
  const longestStreak = calculateLongestStreak(entries);
  const entriesThisMonth = calculateEntriesThisMonth(entries);

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

  function calculateLongestStreak(entries: any[]) {
    if (entries.length === 0) return 0;
    
    const sortedEntries = entries
      .map(entry => new Date(entry.created_at))
      .sort((a, b) => a.getTime() - b.getTime());
    
    let maxStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < sortedEntries.length; i++) {
      const diffDays = Math.abs(differenceInDays(sortedEntries[i], sortedEntries[i-1]));
      if (diffDays === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    
    return maxStreak;
  }

  function calculateWeeklyProgress(entries: any[]) {
    const oneWeekAgo = subWeeks(new Date(), 1);
    const thisWeekEntries = entries.filter(entry => 
      isAfter(new Date(entry.created_at), oneWeekAgo)
    );
    return Math.min((thisWeekEntries.length / 7) * 100, 100);
  }

  function calculateEntriesThisMonth(entries: any[]) {
    const now = new Date();
    const thisMonth = entries.filter(entry => {
      const entryDate = new Date(entry.created_at);
      return entryDate.getMonth() === now.getMonth() && 
             entryDate.getFullYear() === now.getFullYear();
    });
    return thisMonth.length;
  }

  function calculateMoodDistribution(entries: any[]) {
    const moods = entries.map(entry => entry.mood).filter(Boolean);
    const distribution: Record<string, number> = {};
    
    moods.forEach(mood => {
      distribution[mood] = (distribution[mood] || 0) + 1;
    });
    
    const total = moods.length;
    return Object.entries(distribution)
      .map(([mood, count]) => ({
        mood,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
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
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
          <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-2 sm:p-4 pt-0">
          <div className="text-lg sm:text-2xl font-bold">{totalEntries}</div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {entriesThisMonth} ce mois
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Série</CardTitle>
          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-2 sm:p-4 pt-0">
          <div className="text-lg sm:text-2xl font-bold">{currentStreak}</div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Max: {longestStreak} jours
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Objectif</CardTitle>
          <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-2 sm:p-4 pt-0">
          <div className="text-lg sm:text-2xl font-bold">{Math.round(weeklyGoal)}%</div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            cette semaine
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Humeur</CardTitle>
          <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-2 sm:p-4 pt-0">
          <div className="text-lg sm:text-2xl font-bold">
            {moodDistribution.length > 0 ? (
              <span className="flex items-center gap-1">
                {getMoodEmoji(moodDistribution[0].mood)} 
                <span className="text-sm">{moodDistribution[0].percentage}%</span>
              </span>
            ) : (
              '😐'
            )}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            dominante
          </p>
        </CardContent>
      </Card>

      {/* Statistiques supplémentaires pour desktop */}
      <div className="hidden lg:block lg:col-span-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Détails
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold">{averageWordsPerEntry}</div>
                <div className="text-xs text-muted-foreground">mots/entrée</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{Math.round(totalEntries / Math.max(1, Math.ceil((Date.now() - new Date(entries[entries.length - 1]?.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24))))}</div>
                <div className="text-xs text-muted-foreground">entrées/jour</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{moodDistribution.length}</div>
                <div className="text-xs text-muted-foreground">humeurs diff.</div>
              </div>
            </div>
            {moodDistribution.length > 1 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {moodDistribution.slice(0, 3).map(({ mood, percentage }) => (
                  <Badge key={mood} variant="secondary" className="text-xs">
                    {getMoodEmoji(mood)} {percentage}%
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
