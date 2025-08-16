
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, AlertCircle } from "lucide-react";
import { usePersonalityProfile } from "@/hooks/usePersonalityProfile";
import PersonalityProfileCard from "@/components/PersonalityProfileCard";
import Sidebar from "@/components/layout/Sidebar";
import MobileHeader from "@/components/layout/MobileHeader";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function Profile() {
  const { profile, isLoading, generateProfile } = usePersonalityProfile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <div className="flex-1 min-w-0">
          <div className="md:hidden">
            <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetContent side="left" className="p-0 w-64">
                <Sidebar className="border-0 static" onItemClick={() => setIsMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="pt-14 md:pt-6 px-3 md:px-6">
            <div className="max-w-6xl mx-auto space-y-6">
              {!profile ? (
                <div className="text-center space-y-6">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <Brain className="h-10 w-10 text-primary" />
                    <h1 className="text-2xl md:text-3xl font-bold">Profil de Personnalité IA</h1>
                  </div>
                  
                  <Card className="max-w-2xl mx-auto">
                    <CardContent className="py-12 px-6">
                      <div className="text-center space-y-6">
                        <div className="flex justify-center">
                          <div className="p-4 bg-primary/10 rounded-full">
                            <Sparkles className="h-12 w-12 text-primary" />
                          </div>
                        </div>
                        
                        <div>
                          <h2 className="text-xl font-semibold mb-3">
                            Découvrez votre profil psychologique complet
                          </h2>
                          <p className="text-muted-foreground mb-6">
                            Notre IA analyse vos réflexions, habitudes, tâches et objectifs pour créer 
                            un profil de personnalité détaillé avec des insights psychologiques et 
                            des recommandations personnalisées.
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-primary" />
                            <span>Analyse de personnalité</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span>Insights psychologiques</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-primary" />
                            <span>Recommandations personnalisées</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-primary" />
                            <span>Trajectoire de croissance</span>
                          </div>
                        </div>
                        
                        <Button
                          onClick={generateProfile}
                          disabled={isLoading}
                          size="lg"
                          className="w-full sm:w-auto"
                        >
                          {isLoading ? (
                            <>
                              <Brain className="mr-2 h-4 w-4 animate-pulse" />
                              Analyse en cours...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Générer mon profil
                            </>
                          )}
                        </Button>
                        
                        <p className="text-xs text-muted-foreground">
                          L'analyse prend quelques secondes et utilise toutes vos données DeepFlow
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <PersonalityProfileCard 
                  profile={profile} 
                  onRefresh={generateProfile}
                  isLoading={isLoading}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
