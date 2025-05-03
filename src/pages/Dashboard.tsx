
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheckIcon, ChartLineIcon, ListTodoIcon, TargetIcon, TimerIcon } from "@/components/icons/DeepFlowIcons";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  // Temporary user data - will come from Supabase
  const userName = "Utilisateur";
  
  // Get time of day for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };
  
  // Mock data for the dashboard
  const stats = [
    { name: "Tâches à faire aujourd'hui", value: 3, link: "/tasks" },
    { name: "Habitudes suivies", value: "2/5", link: "/habits" },
    { name: "Objectifs en cours", value: 2, link: "/goals" },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {getGreeting()}, <span className="text-primary">{userName}</span> !
        </h1>
        <p className="text-muted-foreground">
          Voici un aperçu de votre journée et de vos activités.
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="dashboard-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">{stat.value}</CardTitle>
              <CardDescription>{stat.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to={stat.link}>
                <Button variant="outline" className="w-full">
                  Voir détails
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick access */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Accès rapide</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/tasks" className="block">
            <div className="glass-card hover:bg-primary/5 transition-all flex flex-col items-center justify-center p-6 h-32 text-center">
              <ListTodoIcon className="h-8 w-8 mb-2 text-primary" />
              <span className="font-medium">Tâches</span>
            </div>
          </Link>
          
          <Link to="/habits" className="block">
            <div className="glass-card hover:bg-primary/5 transition-all flex flex-col items-center justify-center p-6 h-32 text-center">
              <CalendarCheckIcon className="h-8 w-8 mb-2 text-primary" />
              <span className="font-medium">Habitudes</span>
            </div>
          </Link>
          
          <Link to="/focus" className="block">
            <div className="glass-card hover:bg-primary/5 transition-all flex flex-col items-center justify-center p-6 h-32 text-center">
              <TimerIcon className="h-8 w-8 mb-2 text-primary" />
              <span className="font-medium">Focus</span>
            </div>
          </Link>
          
          <Link to="/analysis" className="block">
            <div className="glass-card hover:bg-primary/5 transition-all flex flex-col items-center justify-center p-6 h-32 text-center">
              <ChartLineIcon className="h-8 w-8 mb-2 text-primary" />
              <span className="font-medium">Analyse IA</span>
            </div>
          </Link>
        </div>
      </div>
      
      {/* Today's focus */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Focus du jour</h2>
        <Card className="dashboard-card">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <TargetIcon className="h-12 w-12 text-primary mb-4" />
            <p className="text-xl font-medium mb-4">Définissez votre objectif principal du jour</p>
            <Button>Ajouter mon focus</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
