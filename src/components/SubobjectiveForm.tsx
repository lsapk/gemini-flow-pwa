
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SubobjectiveFormProps {
  parentGoalId: string;
  onSuccess: () => void;
  onCancel: () => void;
  initialSubobjective?: {
    id: string;
    title: string;
    description?: string;
  } | null;
}

export const SubobjectiveForm = ({ 
  parentGoalId, 
  onSuccess, 
  onCancel,
  initialSubobjective 
}: SubobjectiveFormProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialSubobjective) {
      setTitle(initialSubobjective.title);
      setDescription(initialSubobjective.description || '');
    }
  }, [initialSubobjective]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setIsLoading(true);
    try {
      if (initialSubobjective) {
        // Modification
        const { error } = await supabase
          .from('subobjectives')
          .update({
            title: title.trim(),
            description: description.trim() || null,
          })
          .eq('id', initialSubobjective.id)
          .eq('user_id', user.id);

        if (error) throw error;
        toast.success('Sous-objectif modifié avec succès');
      } else {
        // Création
        const { error } = await supabase
          .from('subobjectives')
          .insert({
            title: title.trim(),
            description: description.trim() || null,
            parent_goal_id: parentGoalId,
            user_id: user.id,
          });

        if (error) throw error;
        toast.success('Sous-objectif créé avec succès');
      }

      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du sous-objectif:', error);
      toast.error('Erreur lors de la sauvegarde du sous-objectif');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 border rounded-lg bg-card">
      <Input
        placeholder="Titre du sous-objectif"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <Textarea
        placeholder="Description (optionnelle)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isLoading || !title.trim()}>
          {isLoading ? 'Sauvegarde...' : initialSubobjective ? 'Modifier' : 'Créer'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
};
