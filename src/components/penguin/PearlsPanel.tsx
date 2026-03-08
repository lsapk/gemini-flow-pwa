import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import { Gem } from "lucide-react";

interface Pearl {
  id: string;
  pearl_type: 'efficiency' | 'resilience' | 'necklace';
  message: string;
  data: Record<string, unknown> | null;
  created_at: string;
  is_read: boolean;
}

const PEARL_CONFIG = {
  efficiency: { emoji: '💎', label: 'Efficacité', colorClass: 'bg-sky-500/10 border-sky-500/20 text-sky-400' },
  resilience: { emoji: '🔮', label: 'Résilience', colorClass: 'bg-purple-500/10 border-purple-500/20 text-purple-400' },
  necklace: { emoji: '📿', label: 'Collier', colorClass: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
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
    <Card className="bg-card/80 backdrop-blur-xl border-border/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-foreground">
          <Gem className="w-5 h-5 text-amber-400" />
          Perles d'Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pearls.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <span className="text-5xl block mb-3">💎</span>
            <p className="text-sm font-medium">Aucune perle trouvée</p>
            <p className="text-xs mt-1 text-muted-foreground/70">Continuez votre productivité pour découvrir des insights</p>
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
                  className={`p-4 rounded-2xl border backdrop-blur-sm ${config.colorClass.split(' ').slice(0, 2).join(' ')}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{config.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant="secondary" className="text-[10px] bg-muted/50 border-0">
                          {config.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(pearl.created_at), { addSuffix: true, locale: fr })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90 leading-relaxed">{pearl.message}</p>
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
