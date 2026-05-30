import React from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageCircle, HelpCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const SUPPORT_EMAIL = "deepflow.ia@gmail.com";

const FAQS = [
  {
    q: "Comment puis-je modifier mon abonnement ?",
    a: "Rendez-vous dans Réglages → Abonnement. Vous pouvez gérer ou annuler votre abonnement à tout moment via le portail Stripe.",
  },
  {
    q: "Mes données sont-elles privées ?",
    a: "Oui. Vos données sont stockées de façon sécurisée (RLS Supabase) et ne sont jamais partagées. Vous pouvez exporter ou supprimer vos données dans Réglages.",
  },
  {
    q: "Comment fonctionnent les crédits IA ?",
    a: "Chaque action volontaire avec l'IA (chat, analyse, suggestion) consomme un crédit. Les utilisateurs gratuits reçoivent 5 crédits par jour. Les abonnés Pro/Premium ont des limites élevées ou illimitées.",
  },
  {
    q: "Pourquoi mon habitude ne se coche pas ?",
    a: "Vérifiez que l'habitude est planifiée pour aujourd'hui (Réglages → jours de la semaine). Si le problème persiste, rafraîchissez la page ou contactez-nous.",
  },
  {
    q: "L'application fonctionne-t-elle hors ligne ?",
    a: "Oui, en partie. Les pages déjà visitées restent accessibles et vos modifications sont synchronisées automatiquement à la reconnexion.",
  },
  {
    q: "Comment supprimer mon compte ?",
    a: "Réglages → Confidentialité → Supprimer mon compte. Cette action est définitive et conforme RGPD.",
  },
];

export default function Support() {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Aide & Support</h1>
        </div>
        <p className="text-muted-foreground">
          Trouvez rapidement une réponse, ou contactez-nous directement.
        </p>
      </motion.header>

      <Card className="p-6 backdrop-blur-xl bg-card/60 border-border/40 rounded-2xl">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold mb-1">Nous contacter</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Réponse sous 24-48h ouvrées.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="default" size="sm">
                <a href={`mailto:${SUPPORT_EMAIL}?subject=Support%20DeepFlow`}>
                  <Mail className="w-4 h-4 mr-2" />
                  Envoyer un email
                </a>
              </Button>
              <Button variant="outline" size="sm" onClick={copyEmail}>
                {copied ? "Copié ✓" : SUPPORT_EMAIL}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Questions fréquentes</h2>
        </div>
        <Card className="p-2 backdrop-blur-xl bg-card/60 border-border/40 rounded-2xl">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border/40">
                <AccordionTrigger className="px-4 text-left hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="px-4 text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      </section>
    </div>
  );
}
