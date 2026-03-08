import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePenguinProfile } from "@/hooks/usePenguinProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Lock, Check, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

interface Accessory {
  id: string;
  accessory_id: string;
  accessory_name: string;
  accessory_type: string;
}

const SHOP_ITEMS = [
  { id: 'scarf_red', name: 'Écharpe Rouge', type: 'scarf', emoji: '🧣', cost_salmon: 10, stage_required: 'chick' as const },
  { id: 'scarf_blue', name: 'Écharpe Bleue', type: 'scarf', emoji: '🧣', cost_salmon: 10, stage_required: 'chick' as const },
  { id: 'hat_explorer', name: 'Chapeau Explorateur', type: 'hat', emoji: '🎩', cost_salmon: 25, stage_required: 'explorer' as const },
  { id: 'hat_santa', name: 'Bonnet Noël', type: 'hat', emoji: '🎅', cost_salmon: 15, stage_required: 'chick' as const },
  { id: 'glasses_cool', name: 'Lunettes de Soleil', type: 'glasses', emoji: '🕶️', cost_salmon: 20, stage_required: 'explorer' as const },
  { id: 'glasses_nerd', name: 'Lunettes Lecture', type: 'glasses', emoji: '🤓', cost_salmon: 15, stage_required: 'chick' as const },
  { id: 'crown_emperor', name: 'Couronne Impériale', type: 'special', emoji: '👑', cost_salmon: 50, stage_required: 'emperor' as const },
  { id: 'radio', name: 'Radio Polaire', type: 'special', emoji: '📻', cost_salmon: 30, stage_required: 'explorer' as const },
  { id: 'library', name: 'Mini Bibliothèque', type: 'special', emoji: '📚', cost_salmon: 40, stage_required: 'explorer' as const },
  { id: 'lounge_chair', name: 'Chaise Longue', type: 'special', emoji: '🪑', cost_salmon: 20, stage_required: 'chick' as const },
];

const STAGE_ORDER = { egg: 0, chick: 1, explorer: 2, emperor: 3 };

export const AccessoryShop = () => {
  const { user } = useAuth();
  const { profile } = usePenguinProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: owned = [] } = useQuery({
    queryKey: ["penguin-accessories", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("penguin_accessories")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data as unknown as Accessory[];
    },
    enabled: !!user,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (item: typeof SHOP_ITEMS[0]) => {
      if (!user || !profile) throw new Error("Not authenticated");

      if (['radio', 'library', 'lounge_chair'].includes(item.id)) {
        const flagKey = `has_${item.id}` as keyof typeof profile;
        await supabase.from("penguin_profiles").update({ [flagKey]: true }).eq("user_id", user.id);
      }

      await supabase.from("penguin_accessories").insert({
        user_id: user.id,
        accessory_id: item.id,
        accessory_name: item.name,
        accessory_type: item.type,
      });
    },
    onSuccess: (_, item) => {
      queryClient.invalidateQueries({ queryKey: ["penguin-accessories"] });
      queryClient.invalidateQueries({ queryKey: ["penguin-profile"] });
      toast({ title: `${item.emoji} Débloqué !`, description: item.name });
    },
  });

  const ownedIds = new Set(owned.map(a => a.accessory_id));

  return (
    <Card className="bg-[#1A1F26]/80 backdrop-blur-xl border-white/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-white/90">
          <ShoppingBag className="w-5 h-5 text-purple-400" />
          Boutique
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {SHOP_ITEMS.slice(0, 6).map((item, i) => {
            const isOwned = ownedIds.has(item.id);
            const stageLocked = profile ? STAGE_ORDER[profile.stage] < STAGE_ORDER[item.stage_required] : true;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`p-3 rounded-2xl border text-center backdrop-blur-sm transition-all ${
                  isOwned
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : stageLocked
                    ? 'bg-white/5 border-white/5 opacity-50'
                    : 'bg-white/5 border-white/10 hover:border-purple-500/30 hover:bg-purple-500/5'
                }`}
              >
                <span className="text-2xl block mb-1">{item.emoji}</span>
                <p className="text-xs font-medium text-white/80 mb-1">{item.name}</p>
                <div className="text-[10px] text-white/40 mb-2">🐟 {item.cost_salmon}</div>

                {isOwned ? (
                  <Badge className="text-[10px] bg-emerald-500/20 border-emerald-500/30 text-emerald-300">
                    <Check className="h-3 w-3 mr-1" /> Obtenu
                  </Badge>
                ) : stageLocked ? (
                  <Badge className="text-[10px] bg-white/10 border-white/10 text-white/50">
                    <Lock className="h-3 w-3 mr-1" /> {item.stage_required}
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                    onClick={() => purchaseMutation.mutate(item)}
                    disabled={purchaseMutation.isPending}
                  >
                    Obtenir
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
