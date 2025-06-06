
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Heart, MessageCircle, Trash2, Flag, Send } from "lucide-react";
import { GoodAction, GoodActionComment, likeGoodAction, getGoodActionComments, addComment, deleteComment, moderateComment, deleteGoodAction } from "@/lib/goodActionsApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface GoodActionCardProps {
  action: GoodAction;
  onRefresh?: () => void;
}

export default function GoodActionCard({ action, onRefresh }: GoodActionCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Vérifier si l'utilisateur est admin
  const { data: userRoles } = useQuery({
    queryKey: ['userRoles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user
  });

  const isAdmin = userRoles?.some(role => role.role === 'admin') || false;

  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ['comments', action.id],
    queryFn: () => getGoodActionComments(action.id),
    enabled: showComments
  });

  const likeMutation = useMutation({
    mutationFn: () => likeGoodAction(action.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goodActions'] });
      onRefresh?.();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le like",
        variant: "destructive",
      });
    }
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => addComment(action.id, content),
    onSuccess: () => {
      setNewComment("");
      refetchComments();
      queryClient.invalidateQueries({ queryKey: ['goodActions'] });
      onRefresh?.();
      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été publié avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le commentaire",
        variant: "destructive",
      });
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId, action.id),
    onSuccess: () => {
      refetchComments();
      queryClient.invalidateQueries({ queryKey: ['goodActions'] });
      onRefresh?.();
      toast({
        title: "Commentaire supprimé",
        description: "Le commentaire a été supprimé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le commentaire",
        variant: "destructive",
      });
    }
  });

  const moderateMutation = useMutation({
    mutationFn: (commentId: string) => moderateComment(commentId),
    onSuccess: () => {
      refetchComments();
      toast({
        title: "Commentaire modéré",
        description: "Le commentaire a été masqué",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de modérer le commentaire",
        variant: "destructive",
      });
    }
  });

  const deleteActionMutation = useMutation({
    mutationFn: () => deleteGoodAction(action.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goodActions'] });
      onRefresh?.();
      toast({
        title: "Bonne action supprimée",
        description: "La bonne action a été supprimée avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la bonne action",
        variant: "destructive",
      });
    }
  });

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await likeMutation.mutateAsync();
    } finally {
      setIsLiking(false);
    }
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    commentMutation.mutate(newComment.trim());
  };

  const canDeleteAction = user && (user.id === action.user_id || isAdmin);
  const canDeleteComment = (comment: GoodActionComment) => user && (user.id === comment.user_id || isAdmin);
  const canModerate = isAdmin;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>
                {action.user_profiles?.display_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{action.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Par {action.user_profiles?.display_name || 'Utilisateur'} • {new Date(action.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{action.category}</Badge>
            {canDeleteAction && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteActionMutation.mutate()}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {action.description && (
          <p className="text-muted-foreground mb-4">{action.description}</p>
        )}

        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={isLiking}
            className="flex items-center gap-2"
          >
            <Heart className="h-4 w-4" />
            {action.likes_count}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            {action.comments_count}
          </Button>
        </div>

        {showComments && (
          <div className="border-t pt-4 space-y-4">
            {/* Formulaire de commentaire */}
            <form onSubmit={handleSubmitComment} className="space-y-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Écrivez un commentaire..."
                className="min-h-[80px]"
              />
              <Button 
                type="submit" 
                size="sm" 
                disabled={!newComment.trim() || commentMutation.isPending}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Publier
              </Button>
            </form>

            {/* Liste des commentaires */}
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {comment.user_profiles?.display_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {comment.user_profiles?.display_name || 'Utilisateur'}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                        {canDeleteComment(comment) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCommentMutation.mutate(comment.id)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                        {canModerate && !canDeleteComment(comment) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moderateMutation.mutate(comment.id)}
                            className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700"
                          >
                            <Flag className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
