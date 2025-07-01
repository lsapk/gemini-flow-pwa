
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MobileInsightsProps {
  insights: string[];
  score: number;
  isLoading: boolean;
  lastUpdate: Date | null;
}

export default function MobileInsights({ insights, score, isLoading, lastUpdate }: MobileInsightsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Score IA</CardTitle>
            <div className="h-6 w-12 bg-muted animate-pulse rounded" />
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Score IA
          </CardTitle>
          <Badge className={getScoreColor(score)}>
            {score}/100
          </Badge>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between p-2 h-8"
        >
          <span className="text-xs text-muted-foreground">
            {insights.length} conseil{insights.length > 1 ? 's' : ''}
          </span>
          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            {insights.slice(0, 2).map((insight, index) => (
              <div key={index} className="text-xs p-2 bg-muted/50 rounded-lg">
                {insight}
              </div>
            ))}
            {lastUpdate && (
              <p className="text-xs text-muted-foreground mt-2">
                Mis à jour : {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
