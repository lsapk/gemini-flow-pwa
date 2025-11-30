import AppLayout from "@/components/layout/AppLayout";
import { CyberAvatar } from "@/components/gamification/CyberAvatar";
import { XPBar } from "@/components/gamification/XPBar";
import { QuestBoard } from "@/components/gamification/QuestBoard";
import { PowerUpShop } from "@/components/gamification/PowerUpShop";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gamepad2, Target, ShoppingBag } from "lucide-react";

export default function Gamification() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header avec effet cyberpunk */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-cyan-500/20 blur-3xl animate-pulse" />
          <div className="relative glass-morphism p-6 rounded-2xl">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-cyan-500 flex items-center justify-center glow-effect-primary animate-pulse">
                <Gamepad2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-heading gradient-text mb-1">
                  Cyber Arena
                </h1>
                <p className="text-muted-foreground">
                  Montez en niveau, accomplissez des quêtes, dominez le leaderboard
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Avatar et XP Bar */}
        <div className="grid gap-6 lg:grid-cols-2">
          <CyberAvatar />
          <XPBar />
        </div>

        {/* Tabs pour Quêtes et Shop */}
        <Tabs defaultValue="quests" className="space-y-6">
          <TabsList className="glass-morphism">
            <TabsTrigger value="quests" className="gap-2">
              <Target className="w-4 h-4" />
              Quêtes
            </TabsTrigger>
            <TabsTrigger value="shop" className="gap-2">
              <ShoppingBag className="w-4 h-4" />
              Power-Ups
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quests">
            <QuestBoard />
          </TabsContent>

          <TabsContent value="shop">
            <PowerUpShop />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}