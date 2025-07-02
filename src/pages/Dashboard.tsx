
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarIcon,
  CheckCircle2,
  Flame,
  ListChecks,
  Target,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRealtimeProductivityScore } from "@/hooks/useRealtimeProductivityScore";
import MobileInsights from "@/components/ui/MobileInsights";
import { ProductivityScore } from "@/components/ui/ProductivityScore";

export default function Dashboard() {
  const { user } = useAuth();
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const productivityData = useRealtimeProductivityScore();

  useEffect(() => {
    const fetchLastLogin = async () => {
      if (!user) return;

      try {
        // Récupérer les données du profil utilisateur
        const { data, error } = await supabase
          .from('user_profiles')
          .select('created_at')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error);
        } else {
          setLastLogin(data?.created_at ? format(new Date(data.created_at), "dd MMMM yyyy", { locale: fr }) : "Inconnu");
        }
      } catch (error) {
        console.error("Unexpected error fetching user data:", error);
      }
    };

    fetchLastLogin();
  }, [user]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border rounded-md shadow-md p-2">
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-xs text-gray-600">Minutes: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-3 sm:p-6">
      {/* Mobile Insights - visible only on mobile */}
      <div className="block sm:hidden">
        <ProductivityScore />
      </div>

      {/* Desktop layout */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProductivityScore />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <CalendarIcon className="h-10 w-10 text-blue-500 mb-3" />
            <h3 className="text-xl font-semibold mb-1">Dernière connexion</h3>
            <div className="text-muted-foreground">
              {lastLogin ? lastLogin : <Skeleton className="w-24" />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <ListChecks className="h-10 w-10 text-green-500 mb-3" />
            <h3 className="text-xl font-semibold mb-1">Tâches terminées</h3>
            <p className="text-3xl font-bold text-green-600">
              {productivityData.isLoading ? <Skeleton className="w-12" /> : productivityData.tasksCompleted}
            </p>
            <p className="text-muted-foreground">
              {productivityData.isLoading ? "Chargement..." : "Tâches complétées au total"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Target className="h-10 w-10 text-red-500 mb-3" />
            <h3 className="text-xl font-semibold mb-1">Objectifs atteints</h3>
            <p className="text-3xl font-bold text-red-600">
              {productivityData.isLoading ? <Skeleton className="w-12" /> : productivityData.goalsCompleted}
            </p>
            <p className="text-muted-foreground">
              {productivityData.isLoading ? "Chargement..." : "Objectifs atteints au total"}
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-3">
          <CardContent>
            <h2 className="text-lg font-semibold mb-4">Temps de concentration (7 derniers jours)</h2>
            {productivityData.isLoading ? (
              <Skeleton className="h-40" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={productivityData.focusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="minutes" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
