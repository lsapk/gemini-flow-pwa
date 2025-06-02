
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Heart, 
  MessageSquare, 
  Send,
  Trash2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  likeGoodAction,
  unlikeGoodAction,
  getGoodActionLikes,
  addComment,
  getComments,
  deleteComment,
  GoodActionComment
} from "@/lib/goodActionsApi";

const CATEGORIES = [
  { value: 'environment', label: '🌱 Environnement', color: 'bg-green-100 text-green-800' },
  { value: 'community', label: '🤝 Communauté', color: 'bg-blue-100 text-blue-800' },
  { value: 'help', label: '❤️ Entraide', color: 'bg-red-100 text-red-800' },
  { value: 'learning', label: '📚 Apprentissage', color: 'bg-purple-100 text-purple-800' },
  { value: 'kindness', label: '✨ Bienveillance', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'health', label: '💪 Santé', color: 'bg-orange-100 text-orange-800' },
  { value: 'other', label: '🌟 Autre', color: 'bg-gray-100 text-gray-800' }
];

interface GoodActionCardProps {
  action: {
    id: string;
    title: string;
    description?: string;
    category: string;
    created_at: string;
    user_id: string;
    likes_count: number;
    comments_count: number;
    user_profiles?: {
      display_name: string;
      email: string;
    };
  };
  isAdmin?: boolean;
}

export default function GoodActionCard({ action, isAdmin = false }: GoodActionCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(action.likes_count);
  const [comments, setComments] = useState<GoodActionComment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const categoryInfo = CATEGORIES.find(c => c.value === action.category);

  useEffect(() => {
    if (user) {
      checkIfLiked();
    }
  }, [user, action.id]);

  const checkIfLiked = async () => {
    try {
      const likes = await getGoodActionLikes(action.id);
      setIsLiked(likes.some(like => like.user_id === user?.id));
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLike = async () => {
    if (!user) return;
    
    try {
      if (isLiked) {
        await unlikeGoodAction(action.id);
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        await likeGoodAction(action.id);
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le like.",
        variant: "destructive",
      });
    }
  };

  const loadComments = async () => {
    try {
      const commentsData = await getComments(action.id);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleShowComments = () => {
    if (!showComments) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;
    
    setIsLoading(true);
    try {
      await addComment(action.id, newComment.trim());
      setNewComment("");
      loadComments();
      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été publié.",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le commentaire.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      loadComments();
      toast({
        title: "Commentaire supprimé",
        description: "Le commentaire a été supprimé.",
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le commentaire.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-medium text-sm sm:text-base">{action.title}</h3>
            {action.description && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {action.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Par {action.user_profiles?.display_name || action.user_profiles?.email || 'Utilisateur anonyme'}
            </p>
          </div>
          <Badge className={`${categoryInfo?.color} text-xs ml-2`}>
            {categoryInfo?.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex justify-between items-center text-xs sm:text-sm text-muted-foreground">
          <span>
            {format(new Date(action.created_at), 'dd MMM yyyy', { locale: fr })}
          </span>
          
          <div className="flex gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={!user}
              className={`flex items-center gap-1 text-xs p-1 sm:p-2 ${isLiked ? 'text-red-500' : ''}`}
            >
              <Heart className={`h-3 w-3 sm:h-4 sm:w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowComments}
              className="flex items-center gap-1 text-xs p-1 sm:p-2"
            >
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{action.comments_count}</span>
              {showComments ? (
                <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
            </Button>
          </div>
        </div>

        {showComments && (
          <div className="mt-4 space-y-3">
            {user && (
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ajouter un commentaire..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isLoading}
                  size="sm"
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded p-2 text-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-xs">
                        {comment.user_profiles?.display_name || comment.user_profiles?.email || 'Utilisateur'}
                      </p>
                      <p className="text-sm mt-1">{comment.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(comment.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                      </p>
                    </div>
                    
                    {(isAdmin || comment.user_id === user?.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {comments.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-4">
                  Aucun commentaire pour le moment
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
