import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface AdminAnnouncement {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  announcement_type: 'info' | 'warning' | 'success' | 'update';
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const useAdminAnnouncements = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active announcements for all users using raw query
  const { data: announcements, isLoading } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      // Use rpc or direct fetch since table might not be in types yet
      const { data, error } = await supabase
        .from("admin_announcements" as any)
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching announcements:", error);
        return [];
      }
      return (data || []) as unknown as AdminAnnouncement[];
    },
  });

  // Create announcement (admin only)
  const createAnnouncement = useMutation({
    mutationFn: async (announcement: Omit<AdminAnnouncement, 'id' | 'created_at' | 'updated_at'>) => {
      if (!user || !isAdmin) throw new Error("Not authorized");

      const { data, error } = await supabase
        .from("admin_announcements" as any)
        .insert({
          ...announcement,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      toast({
        title: "Annonce créée",
        description: "L'annonce a été publiée avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update announcement (admin only)
  const updateAnnouncement = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AdminAnnouncement> & { id: string }) => {
      if (!isAdmin) throw new Error("Not authorized");

      const { data, error } = await supabase
        .from("admin_announcements" as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      toast({
        title: "Annonce mise à jour",
        description: "L'annonce a été modifiée avec succès",
      });
    },
  });

  // Delete announcement (admin only)
  const deleteAnnouncement = useMutation({
    mutationFn: async (id: string) => {
      if (!isAdmin) throw new Error("Not authorized");

      const { error } = await supabase
        .from("admin_announcements" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      toast({
        title: "Annonce supprimée",
        description: "L'annonce a été supprimée",
      });
    },
  });

  return {
    announcements: announcements || [],
    isLoading,
    createAnnouncement: createAnnouncement.mutate,
    updateAnnouncement: updateAnnouncement.mutate,
    deleteAnnouncement: deleteAnnouncement.mutate,
    isAdmin,
  };
};
