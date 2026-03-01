import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";

interface Pearl {
  id: string;
  pearl_type: 'efficiency' | 'resilience' | 'necklace';
  message: string;
  data: Record<string, unknown> | null;
  created_at: string;
  is_read: boolean;
}

const PEARL_CONFIG = {
  efficiency: { emoji: '💎', label: 'Efficacité', color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/20 border-sky-200/30 dark:border-sky-800/30' },
  resilience: { emoji: '🔮', label: 'Résilience', color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20 border-purple-200/30 dark:border-purple-800/30' },
  necklace: { emoji: '📿', label: 'Collier', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-200/30 dark:border-amber-800/30' },
};

export const PearlsPanel = () => {
  const { user } = useAuth();

  const { data: pearls = [] } = useQuery({
    queryKey: ["penguin-pearls", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("penguin_pearls")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as unknown as Pearl[];
    },
    enabled: !!user,
  });

  return (
    <Card className="border-amber-200/20 dark:border-amber-800/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          💎 Perles d'Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pearls.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <span className="text-4xl block mb-3">💎</span>
            <p className="text-sm">Aucune perle trouvée encore</p>
            <p className="text-xs mt-1">Continuez votre productivité pour découvrir des insights</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pearls.map((pearl, i) => {
              const config = PEARL_CONFIG[pearl.pearl_type];
              return (
                <motion.div
                  key={pearl.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-3 rounded-xl border ${config.color}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg mt-0.5">{config.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-[10px]">{config.label}</Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(pearl.created_at), { addSuffix: true, locale: fr })}
                        </span>
                      </div>
                      <p className="text-sm">{pearl.message}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
