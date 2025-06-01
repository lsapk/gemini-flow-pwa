
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Vérifier si Ctrl/Cmd + Shift sont pressés
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;

      if (isCtrlOrCmd && isShift) {
        switch (event.key.toLowerCase()) {
          case 'd':
            event.preventDefault();
            navigate('/dashboard');
            toast({ title: "Navigation", description: "Tableau de bord" });
            break;
          case 't':
            event.preventDefault();
            navigate('/tasks');
            toast({ title: "Navigation", description: "Tâches" });
            break;
          case 'h':
            event.preventDefault();
            navigate('/habits');
            toast({ title: "Navigation", description: "Habitudes" });
            break;
          case 'f':
            event.preventDefault();
            navigate('/focus');
            toast({ title: "Navigation", description: "Focus" });
            break;
          case 'j':
            event.preventDefault();
            navigate('/journal');
            toast({ title: "Navigation", description: "Journal" });
            break;
          case 'g':
            event.preventDefault();
            navigate('/goals');
            toast({ title: "Navigation", description: "Objectifs" });
            break;
          case 'b':
            event.preventDefault();
            navigate('/badges');
            toast({ title: "Navigation", description: "Badges" });
            break;
          case 'a':
            event.preventDefault();
            navigate('/analysis');
            toast({ title: "Navigation", description: "Analyse" });
            break;
          case 's':
            event.preventDefault();
            navigate('/settings');
            toast({ title: "Navigation", description: "Paramètres" });
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate, toast]);
};
