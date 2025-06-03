import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Analysis() {
  const [data, setData] = useState(null);

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl">
      <div className="flex flex-col space-y-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Analyse & Insights</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Découvrez vos statistiques de productivité et obtenez des insights personnalisés
          </p>
        </div>

        {/* Mobile optimized Assistant IA Card */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-12 w-12 sm:h-16 sm:w-16 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl sm:text-3xl">🤖</span>
              </div>
              <div className="text-center sm:text-left flex-1">
                <h3 className="text-lg sm:text-xl font-semibold text-purple-900 mb-2">Assistant IA</h3>
                <p className="text-sm sm:text-base text-purple-700 mb-4">
                  Obtenez des conseils personnalisés pour améliorer votre productivité
                </p>
                <Button 
                  asChild 
                  className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
                >
                  <Link to="/ai-assistant">
                    Consulter l'assistant
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
