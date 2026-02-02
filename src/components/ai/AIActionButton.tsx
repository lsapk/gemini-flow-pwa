import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export type AIActionType = 
  | 'prioritize_tasks'
  | 'suggest_habit'
  | 'decompose_goal'
  | 'suggest_focus_task'
  | 'analyze_week'
  | 'what_now';

interface AIActionButtonProps {
  action: AIActionType;
  onResult?: (result: any) => void;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  label?: string;
  showLabel?: boolean;
}

const actionConfig: Record<AIActionType, { 
  label: string; 
  tooltip: string;
  analysisType: string;
}> = {
  prioritize_tasks: {
    label: 'Prioriser',
    tooltip: 'L\'IA réorganise vos tâches selon votre chronobiologie',
    analysisType: 'smart_prioritization'
  },
  suggest_habit: {
    label: 'Suggérer',
    tooltip: 'L\'IA suggère une habitude complémentaire',
    analysisType: 'habit_dna'
  },
  decompose_goal: {
    label: 'Décomposer',
    tooltip: 'L\'IA décompose l\'objectif en sous-objectifs',
    analysisType: 'goal_prediction'
  },
  suggest_focus_task: {
    label: 'Tâche optimale',
    tooltip: 'L\'IA suggère la meilleure tâche pour maintenant',
    analysisType: 'flow_prediction'
  },
  analyze_week: {
    label: 'Analyser',
    tooltip: 'L\'IA analyse votre semaine émotionnelle',
    analysisType: 'mood_analysis'
  },
  what_now: {
    label: 'Que faire ?',
    tooltip: 'L\'IA recommande votre prochaine action',
    analysisType: 'daily_briefing'
  }
};

export function AIActionButton({
  action,
  onResult,
  className,
  variant = 'outline',
  size = 'sm',
  label,
  showLabel = true
}: AIActionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const config = actionConfig[action];

  const handleClick = async () => {
    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Veuillez vous connecter');
        return;
      }

      const response = await fetch(
        'https://xzgdfetnjnwrberyddmf.supabase.co/functions/v1/ai-cross-analysis',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: config.analysisType }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Limite de requêtes atteinte. Réessayez plus tard.');
          return;
        }
        if (response.status === 402) {
          toast.error('Crédits IA épuisés.');
          return;
        }
        throw new Error('Failed');
      }

      const data = await response.json();
      
      if (data.result) {
        toast.success('Analyse terminée !');
        onResult?.(data.result);
      }
    } catch (error) {
      console.error('AI Action error:', error);
      toast.error('Erreur lors de l\'analyse');
    } finally {
      setIsLoading(false);
    }
  };

  const buttonContent = (
    <>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      {showLabel && <span className="ml-1.5">{label || config.label}</span>}
    </>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleClick}
            disabled={isLoading}
            className={cn(
              'gap-1 text-primary border-primary/30 hover:bg-primary/10',
              className
            )}
          >
            {buttonContent}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
