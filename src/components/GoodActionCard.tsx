
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Trash2, Send, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  GoodAction,
  GoodActionComment,
  addGoodActionLike,
  removeGoodActionLike,
  hasUserLikedGoodAction,
  getGoodActionComments,
  addGoodActionComment,
  deleteGoodActionComment,
  deleteGoodAction
} from "@/lib/goodActionsApi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface GoodActionCardProps {
  goodAction: GoodAction;
  onDelete?: (id: string) => void;
}

export const GoodActionCard: React.FC<GoodActionCardProps> = ({ goodAction, onDelete }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<GoodActionComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (user) {
        const liked = await hasUserLikedGoodAction(goodAction.id);
        setIsLiked(liked);
      }
    };

    fetchLikeStatus();
  }, [goodAction.id, user]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const fetchedComments = await getGoodActionComments(goodAction.id);
        setComments(fetchedComments);
      } catch (error) {
        console.error("Failed to fetch comments:", error);
        toast.error("Failed to fetch comments");
      }
    };

    fetchComments();
  }, [goodAction.id]);

  const toggleLike = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour aimer cette action.");
      return;
    }

    try {
      if (isLiked) {
        await removeGoodActionLike(goodAction.id);
        setIsLiked(false);
        goodAction.likes_count--;
      } else {
        await addGoodActionLike(goodAction.id);
        setIsLiked(true);
        goodAction.likes_count++;
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
      toast.error("Failed to toggle like");
      // Revert the local state in case of an error
      setIsLiked(!isLiked);
    }
  };

  const submitComment = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour commenter.");
      return;
    }

    if (!newComment.trim()) {
      toast.error("Le commentaire ne peut pas être vide.");
      return;
    }

    try {
      const comment = await addGoodActionComment({
        content: newComment,
        good_action_id: goodAction.id,
      });
      setComments((prevComments) => [...prevComments, comment]);
      setNewComment("");
      goodAction.comments_count++;
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const removeComment = async (commentId: string) => {
    try {
      await deleteGoodActionComment(commentId);
      setComments((prevComments) =>
        prevComments.filter((comment) => comment.id !== commentId)
      );
      goodAction.comments_count--;
      toast.success("Commentaire supprimé avec succès.");
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGoodAction(goodAction.id);
      toast.success("Good action supprimée avec succès.");
      onDelete?.(goodAction.id);
    } catch (error) {
      console.error("Failed to delete good action:", error);
      toast.error("Failed to delete good action");
    }
  };

  const isOwnGoodAction = user?.id === goodAction.user_id;
  const canModerate = isOwnGoodAction;

  const descriptionLines = goodAction.description.split('\n');
  const shortDescription = isExpanded ? goodAction.description : descriptionLines.slice(0, 2).join('\n');

  return (
    <Card className="bg-white dark:bg-neutral-950 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{goodAction.title}</CardTitle>
          {isOwnGoodAction && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Ouvrir le menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleDelete} className="focus:bg-red-500 focus:text-white">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <Avatar className="mr-2 h-6 w-6">
            <AvatarImage src={`https://avatar.vercel.sh/${goodAction.user_profiles?.email}.png`} alt={goodAction.user_profiles?.display_name || 'User'} />
            <AvatarFallback>{goodAction.user_profiles?.display_name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          {goodAction.user_profiles?.display_name || 'Utilisateur anonyme'}
          <span className="ml-2">•</span>
          <span className="ml-2">{new Date(goodAction.created_at).toLocaleDateString()}</span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {shortDescription}
          {descriptionLines.length > 2 && (
            <Button variant="link" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? "Réduire" : "Lire la suite"}
            </Button>
          )}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 px-2"
              onClick={toggleLike}
            >
              <Heart
                className={`h-4 w-4 ${isLiked ? "text-red-500" : ""}`}
              />
              <span>{goodAction.likes_count}</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 px-2">
              <MessageCircle className="h-4 w-4" />
              <span>{goodAction.comments_count}</span>
            </Button>
          </div>
          <Badge className="uppercase">{goodAction.category}</Badge>
        </div>
        <div className="mt-4">
          <h4 className="mb-2 font-semibold">Commentaires</h4>
          {comments.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aucun commentaire pour le moment.
            </p>
          ) : (
            <ul className="space-y-2">
              {comments.map((comment) => (
                <li key={comment.id} className="flex items-start gap-2">
                  <div className="flex-shrink-0">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={`https://avatar.vercel.sh/${comment.user_profiles?.email}.png`} alt={comment.user_profiles?.display_name || 'User'} />
                      <AvatarFallback>{comment.user_profiles?.display_name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{comment.user_profiles?.display_name || 'Utilisateur anonyme'}</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</div>
                  </div>
                  {(comment.user_id === user?.id || canModerate) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-5 w-5 p-0">
                          <span className="sr-only">Ouvrir le menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => removeComment(comment.id)} className="focus:bg-red-500 focus:text-white">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Ajouter un commentaire..."
            className="resize-none"
          />
          <Button
            onClick={submitComment}
            className="mt-2 w-full"
            disabled={!newComment.trim()}
          >
            Envoyer <Send className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
