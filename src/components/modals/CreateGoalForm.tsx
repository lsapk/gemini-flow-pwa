
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Goal } from "@/types";

const goalSchema = z.object({
  title: z.string().min(3, {
    message: "Le titre doit contenir au moins 3 caractères.",
  }),
  description: z.string().optional(),
  category: z.enum(["personal", "professional", "health", "finance"]).default("personal"),
  target_date: z.date().optional(),
  progress: z.number().min(0).max(100).default(0),
});

interface CreateGoalFormProps {
  onSuccess: () => void;
  goal?: Goal | null;
}

export default function CreateGoalForm({ onSuccess, goal }: CreateGoalFormProps) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof goalSchema>>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: goal?.title || "",
      description: goal?.description || "",
      category: goal?.category as "personal" | "professional" | "health" | "finance" || "personal",
      target_date: goal?.target_date ? new Date(goal.target_date) : undefined,
      progress: goal?.progress || 0,
    },
  });

  const onSubmit = async (values: any) => {
    if (!user) return;

    try {
      setIsSaving(true);
      
      const goalData = {
        ...values,
        user_id: user.id,
        target_date: values.target_date || null,
      };

      if (goal) {
        // Update existing goal
        const { error } = await supabase
          .from('goals')
          .update(goalData)
          .eq('id', goal.id)
          .eq('user_id', user.id);

        if (error) throw error;
        toast.success('Objectif mis à jour avec succès !');
      } else {
        // Create new goal
        const { error } = await supabase
          .from('goals')
          .insert([goalData]);

        if (error) throw error;
        toast.success('Objectif créé avec succès !');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error('Erreur lors de la sauvegarde de l\'objectif');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre</FormLabel>
              <FormControl>
                <Input placeholder="Nommez votre objectif" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Décrivez votre objectif"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Ajoutez des détails pour mieux comprendre votre objectif.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catégorie</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="personal">Personnel</SelectItem>
                  <SelectItem value="professional">Professionnel</SelectItem>
                  <SelectItem value="health">Santé</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choisissez la catégorie qui correspond à votre objectif.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="target_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date cible</FormLabel>
              <DatePicker
                onSelect={field.onChange}
                defaultValue={field.value}
                mode="single"
              />
              <FormDescription>
                Fixez une date pour atteindre votre objectif.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="progress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Progression initiale (%)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0" 
                  max="100" 
                  placeholder="0" 
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>
                Définissez votre progression actuelle (0-100%).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </form>
    </Form>
  );
}
