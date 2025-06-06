
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeProductivityScore } from "@/hooks/useRealtimeProductivityScore";
import { Link } from "react-router-dom";
import { 
  CheckSquare, 
  Repeat, 
  Timer, 
  BookOpen, 
  Target, 
  TrendingUp,
  Calendar,
  Award,
  Zap
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const productivityData = useRealtimeProductivityScore();

  const quickActions = [
    { name: "Nouvelle tâche", href: "/tasks", icon: CheckSquare, color: "bg-blue-500" },
    { name: "Session focus", href: "/focus", icon: Timer, color: "bg-green-500" },
    { name: "Journal", href: "/journal", icon: BookOpen, color: "bg-purple-500" },
    { name: "Habitudes", href: "/habits", icon: Repeat, color: "bg-orange-500" },
  ];

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* En-tête du tableau de bord */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">
          Tableau de bord
        </h1>
        <p className="text-muted-foreground">
          Bonjour {user?.email} ! Voici votre aperçu de productivité aujourd'hui.
        </p>
      </div>

      {/* Score de productivité principal */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-full transform translate-x-16 -translate-y-16"></div>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Score de productivité
            </span>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Temps réel
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-bold text-primary mb-1">
                {productivityData.score}
              </div>
              <Badge variant="outline" className="mb-2">
                {productivityData.level}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Taux de complétion: {Math.round(productivityData.completionRate)}%
              </p>
            </div>
            <div className="text-right">
              <Button asChild variant="outline" size="sm">
                <Link to="/analysis">
                  Voir l'analyse complète
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Actions rapides
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Card key={action.name} className="hover:shadow-md transition-shadow cursor-pointer">
              <Link to={action.href}>
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="font-medium text-sm">{action.name}</p>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </div>

      {/* Badges récents */}
      {productivityData.badges.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Badges obtenus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {productivityData.badges.slice(0, 4).map((badge, index) => (
                <Badge key={index} variant="secondary">
                  {badge}
                </Badge>
              ))}
              {productivityData.badges.length > 4 && (
                <Button asChild variant="outline" size="sm">
                  <Link to="/badges">
                    Voir tous les badges ({productivityData.badges.length})
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{Math.round(productivityData.focusTimeScore)}</div>
            <p className="text-sm text-muted-foreground">Score Focus</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{Math.round(productivityData.consistencyScore)}</div>
            <p className="text-sm text-muted-foreground">Score Consistance</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{Math.round(productivityData.journalScore)}</div>
            <p className="text-sm text-muted-foreground">Score Journal</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
