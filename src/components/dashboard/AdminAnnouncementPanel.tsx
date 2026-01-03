import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminAnnouncements, AdminAnnouncement } from "@/hooks/useAdminAnnouncements";
import { Megaphone, AlertTriangle, CheckCircle2, Info, Sparkles, Pencil, Trash2, X, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const typeConfig = {
  info: { icon: Info, color: "bg-blue-500/10 border-blue-500/30 text-blue-600", badge: "bg-blue-500" },
  warning: { icon: AlertTriangle, color: "bg-amber-500/10 border-amber-500/30 text-amber-600", badge: "bg-amber-500" },
  success: { icon: CheckCircle2, color: "bg-green-500/10 border-green-500/30 text-green-600", badge: "bg-green-500" },
  update: { icon: Sparkles, color: "bg-purple-500/10 border-purple-500/30 text-purple-600", badge: "bg-purple-500" },
};

export const AdminAnnouncementPanel = () => {
  const { announcements, isLoading, isAdmin, createAnnouncement, updateAnnouncement, deleteAnnouncement } = useAdminAnnouncements();
  const [isCreating, setIsCreating] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    announcement_type: "info" as AdminAnnouncement['announcement_type'],
    is_active: true,
  });

  const handleCreate = () => {
    if (!newAnnouncement.title || !newAnnouncement.content) return;
    createAnnouncement(newAnnouncement);
    setNewAnnouncement({ title: "", content: "", announcement_type: "info", is_active: true });
    setIsCreating(false);
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="h-24" />
      </Card>
    );
  }

  // Show nothing if no announcements and not admin
  if (announcements.length === 0 && !isAdmin) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Admin create button */}
      {isAdmin && (
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle annonce
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une annonce</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Titre de l'annonce"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
              />
              <Textarea
                placeholder="Contenu de l'annonce"
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
              />
              <Select
                value={newAnnouncement.announcement_type}
                onValueChange={(v: AdminAnnouncement['announcement_type']) => 
                  setNewAnnouncement({ ...newAnnouncement, announcement_type: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Information</SelectItem>
                  <SelectItem value="warning">Avertissement</SelectItem>
                  <SelectItem value="success">Succès</SelectItem>
                  <SelectItem value="update">Mise à jour</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleCreate} className="w-full">
                Publier l'annonce
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Announcements display */}
      <AnimatePresence>
        {announcements.map((announcement) => {
          const config = typeConfig[announcement.announcement_type || 'info'];
          const Icon = config.icon;

          return (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className={`border ${config.color}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${config.badge} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{announcement.title}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {announcement.announcement_type === 'info' && 'Info'}
                            {announcement.announcement_type === 'warning' && 'Attention'}
                            {announcement.announcement_type === 'success' && 'Nouveau'}
                            {announcement.announcement_type === 'update' && 'Mise à jour'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{announcement.content}</p>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateAnnouncement({ id: announcement.id, is_active: false })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteAnnouncement(announcement.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
