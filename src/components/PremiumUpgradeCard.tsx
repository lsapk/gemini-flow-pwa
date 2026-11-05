import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";

export function PremiumUpgradeCard(_props: { onUpgrade?: () => void }) {
  const { isPremium, getRemainingUses, handleStripeCheckout, handleManageSubscription, isLoading } = useSubscription();
  const [pending, setPending] = useState(false);
  const checkout = async (plan: "premium_monthly" | "premium_yearly") => { setPending(true); try { await handleStripeCheckout(plan); } finally { setPending(false); } };
  return <Card><CardHeader><CardTitle>{isPremium ? "Votre abonnement vérifié" : "Crédits et abonnement"}</CardTitle><CardDescription>Un quota fini, partagé entre toutes les demandes IA.</CardDescription></CardHeader>
    <CardContent className="space-y-4"><p>{isLoading ? "Vérification du quota…" : `${getRemainingUses("chat")} crédits disponibles aujourd’hui.`}</p>
      {isPremium ? <Button variant="outline" onClick={() => void handleManageSubscription()}>Gérer mon abonnement</Button> : <><p className="text-sm text-muted-foreground">Le prix et la périodicité sont affichés par Stripe avant toute confirmation. Les offres doivent être configurées par le service.</p><div className="flex flex-wrap gap-3"><Button disabled={pending || isLoading} onClick={() => void checkout("premium_monthly")}>Offre mensuelle</Button><Button variant="outline" disabled={pending || isLoading} onClick={() => void checkout("premium_yearly")}>Offre annuelle</Button></div></>}
      <Button asChild variant="link"><Link to="/credits">Consulter le détail des crédits</Link></Button>
    </CardContent></Card>;
}
export function FeatureLockedOverlay({ feature: _feature, children }: { feature: string; children: React.ReactNode }) {
  const { canUseFeature } = useSubscription();
  if (canUseFeature("chat")) return <>{children}</>;
  return <div className="panel space-y-3 p-6"><p>Votre quota IA est épuisé ou n’a pas pu être vérifié.</p><Button asChild variant="outline"><Link to="/credits">Vérifier mes crédits</Link></Button></div>;
}
