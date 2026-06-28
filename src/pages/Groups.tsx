import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, UserPlus, MessageSquare, Target, CheckSquare,
  Flame, TrendingUp, Send, Settings, Brain, Crown, Plus,
  Search, Mail, CheckCircle2, XCircle, Loader2, ChevronRight, Sparkles, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Group {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
}

interface GroupMember {
  user_id: string;
  role: string;
  display_name?: string | null;
  photo_url?: string | null;
  productivity_score?: number;
  tasks?: any[];
  habits?: any[];
  goals?: any[];
}

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  display_name?: string;
}

export default function Groups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("members");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitations, setInvitations] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchGroups();
      fetchInvitations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedGroupId) {
      fetchMembers(selectedGroupId);
      fetchMessages(selectedGroupId);

      const channel = supabase
        .channel(`group_messages:${selectedGroupId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${selectedGroupId}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedGroupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchGroups = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('groups')
      .select('*');

    if (!error && data) {
      setGroups(data);
      if (data.length > 0 && !selectedGroupId) {
        setSelectedGroupId(data[0].id);
      }
    }
    setIsLoading(false);
  };

  const fetchInvitations = async () => {
    if (!user?.email) return;
    const { data, error } = await supabase
      .from('group_invitations')
      .select('*, groups(name)')
      .eq('invitee_email', user.email)
      .eq('status', 'pending');

    if (!error && data) {
      setInvitations(data);
    }
  };

  const fetchMembers = async (groupId: string) => {
    const { data, error } = await supabase
      .from('group_members')
      .select('user_id, role, user_profiles(display_name, photo_url)')
      .eq('group_id', groupId);

    if (!error && data) {
      const formattedMembers = await Promise.all(data.map(async (m: any) => {
        // Fetch shared items for each member in this group
        const [tasks, habits, goals] = await Promise.all([
          supabase.from('shared_tasks').select('tasks(*)').eq('group_id', groupId).eq('tasks.user_id', m.user_id),
          supabase.from('shared_habits').select('habits(*)').eq('group_id', groupId).eq('habits.user_id', m.user_id),
          supabase.from('shared_goals').select('goals(*)').eq('group_id', groupId).eq('goals.user_id', m.user_id)
        ]);

        return {
          user_id: m.user_id,
          role: m.role,
          display_name: m.user_profiles?.display_name,
          photo_url: m.user_profiles?.photo_url,
          tasks: tasks.data?.map((t: any) => t.tasks).filter(Boolean) || [],
          habits: habits.data?.map((h: any) => h.habits).filter(Boolean) || [],
          goals: goals.data?.map((g: any) => g.goals).filter(Boolean) || []
        };
      }));
      setMembers(formattedMembers);
    }
  };

  const fetchMessages = async (groupId: string) => {
    const { data, error } = await supabase
      .from('group_messages')
      .select('*, user_profiles(display_name)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data.map((m: any) => ({
        ...m,
        display_name: m.user_profiles?.display_name
      })));
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !user) return;

    const { data, error } = await supabase
      .from('groups')
      .insert({ name: newGroupName, created_by: user.id })
      .select()
      .single();

    if (!error && data) {
      await supabase.from('group_members').insert({
        group_id: data.id,
        user_id: user.id,
        role: 'admin'
      });
      setGroups(prev => [...prev, data]);
      setSelectedGroupId(data.id);
      setNewGroupName("");
      setShowCreateDialog(false);
      toast.success("Groupe créé !");
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !selectedGroupId || !user) return;

    const { error } = await supabase
      .from('group_invitations')
      .insert({
        group_id: selectedGroupId,
        inviter_id: user.id,
        invitee_email: inviteEmail.trim()
      });

    if (!error) {
      toast.success("Invitation envoyée !");
      setInviteEmail("");
    } else {
      toast.error("Erreur lors de l'envoi de l'invitation");
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedGroupId || !user) return;

    const { error } = await supabase
      .from('group_messages')
      .insert({
        group_id: selectedGroupId,
        user_id: user.id,
        content: newMessage.trim()
      });

    if (!error) {
      setNewMessage("");
    }
  };

  const handleAIAnalysis = async () => {
    if (!selectedGroupId || !user) return;
    setIsAIAnalyzing(true);
    setAiAnalysis(null);
    setActiveTab("ai");

    try {
      // Get all shared data for the group
      const groupData = members.map(m => ({
        name: m.display_name,
        tasks: m.tasks?.length || 0,
        habits_completed: m.habits?.filter(h => h.is_completed_today).length || 0,
        habits_total: m.habits?.length || 0,
        goals: m.goals?.map(g => ({ title: g.title, progress: g.progress }))
      }));

      const { data, error } = await supabase.functions.invoke('gemini-chat-enhanced', {
        body: {
          message: `Analyse la dynamique de mon groupe "${selectedGroup?.name}" et donne des conseils de productivité et un défi collectif. Voici les données des membres: ${JSON.stringify(groupData)}`,
          context: {
            message_context: 'Analyse de groupe',
            analysis_mode: true
          }
        }
      });

      if (error) throw error;
      setAiAnalysis(data.response);
    } catch (error) {
      console.error("AI Analysis error:", error);
      toast.error("Erreur lors de l'analyse IA");
    } finally {
      setIsAIAnalyzing(false);
    }
  };

  const respondInvitation = async (id: string, status: 'accepted' | 'declined') => {
    const { data: invite, error: fetchError } = await supabase
      .from('group_invitations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !invite) return;

    if (status === 'accepted') {
      const { error: joinError } = await supabase.from('group_members').insert({
        group_id: invite.group_id,
        user_id: user!.id,
        role: 'member'
      });
      if (joinError) {
        toast.error("Erreur lors de l'adhésion au groupe");
        return;
      }
      fetchGroups();
    }

    await supabase
      .from('group_invitations')
      .update({ status })
      .eq('id', id);

    fetchInvitations();
    toast.success(status === 'accepted' ? "Invitation acceptée !" : "Invitation déclinée");
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6 max-w-7xl mx-auto">
      {/* Sidebar - Groups List */}
      <div className="w-72 flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Mes Groupes
          </h2>
          <Button size="icon" variant="ghost" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {invitations.length > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-3 space-y-3">
              <p className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <Mail className="h-3 w-3" /> Invitations ({invitations.length})
              </p>
              {invitations.map(inv => (
                <div key={inv.id} className="space-y-2">
                  <p className="text-xs text-white/80">Invitation pour <span className="font-bold">{inv.groups?.name}</span></p>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-[10px] flex-1" onClick={() => respondInvitation(inv.id, 'accepted')}>Accepter</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-[10px] flex-1 text-destructive" onClick={() => respondInvitation(inv.id, 'declined')}>Refuser</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {groups.map(group => (
            <button
              key={group.id}
              onClick={() => setSelectedGroupId(group.id)}
              className={cn(
                "w-full p-4 rounded-2xl border text-left transition-all duration-300 group",
                selectedGroupId === group.id
                  ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/5 scale-[1.02]"
                  : "bg-white/5 border-transparent hover:bg-white/10"
              )}
            >
              <div className="font-bold text-white group-hover:text-primary transition-colors">{group.name}</div>
              {group.description && <p className="text-xs text-white/40 truncate mt-1">{group.description}</p>}
            </button>
          ))}
          {groups.length === 0 && !isLoading && (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-white/20" />
              </div>
              <p className="text-sm text-white/40">Vous n'avez pas encore de groupe.</p>
              <Button variant="link" onClick={() => setShowCreateDialog(true)}>Créer un groupe</Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Active Group */}
      <div className="flex-1 flex flex-col bg-card/30 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
        {selectedGroup ? (
          <>
            {/* Group Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedGroup.name}</h2>
                  <p className="text-sm text-white/40">{members.length} membres</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex p-1 rounded-xl bg-white/5 border border-white/10">
                  <Button
                    variant={activeTab === "members" ? "secondary" : "ghost"}
                    size="sm"
                    className="rounded-lg h-8"
                    onClick={() => setActiveTab("members")}
                  >
                    <Users className="h-4 w-4 mr-2" /> Membres
                  </Button>
                  <Button
                    variant={activeTab === "chat" ? "secondary" : "ghost"}
                    size="sm"
                    className="rounded-lg h-8"
                    onClick={() => setActiveTab("chat")}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" /> Chat
                  </Button>
                  <Button
                    variant={activeTab === "ai" ? "secondary" : "ghost"}
                    size="sm"
                    className="rounded-lg h-8"
                    onClick={() => setActiveTab("ai")}
                  >
                    <Brain className="h-4 w-4 mr-2" /> Conseil IA
                  </Button>
                </div>
                <Button size="icon" variant="ghost" className="rounded-xl">
                  <Settings className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait">
                {activeTab === "members" && (
                  <motion.div
                    key="members"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full overflow-y-auto p-6 space-y-6"
                  >
                    {/* Invite Section */}
                    <div className="bg-white/5 p-4 rounded-3xl border border-white/10 flex items-center gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-sm mb-1">Inviter un nouveau membre</h3>
                        <p className="text-xs text-white/40">Entrez son adresse email pour rejoindre le groupe</p>
                      </div>
                      <div className="flex gap-2 w-1/2">
                        <Input
                          placeholder="email@example.com"
                          className="h-10 rounded-xl"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                        <Button className="rounded-xl h-10 px-4" onClick={handleInvite}>
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-1 gap-6">
                      {members.map(member => (
                        <Card key={member.user_id} className="bg-white/5 border-white/5 hover:border-primary/10 transition-all rounded-[2rem] overflow-hidden group">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                              <Avatar className="h-16 w-16 border-2 border-white/10 group-hover:scale-105 transition-transform">
                                <AvatarImage src={member.photo_url || undefined} />
                                <AvatarFallback className="font-bold text-xl">{(member.display_name || "?").charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl font-bold text-white truncate">{member.display_name || "Utilisateur"}</span>
                                  {member.role === 'admin' && <Crown className="h-4 w-4 text-amber-500" />}
                                </div>
                                <div className="flex items-center gap-4 mt-1">
                                  <div className="flex items-center gap-1 text-xs text-white/40 uppercase font-black tracking-widest">
                                    <Flame className="h-4 w-4 text-orange-500" />
                                    {(() => {
                                      const total = (member.habits?.length || 0) + (member.tasks?.length || 0);
                                      const done = (member.habits?.filter(h => h.is_completed_today).length || 0) + (member.tasks?.filter(t => t.completed).length || 0);
                                      return total > 0 ? `${Math.round((done / total) * 100)}% Prod.` : "En attente";
                                    })()}
                                  </div>
                                </div>
                              </div>
                              {member.user_id === user?.id && (
                                <Badge variant="outline" className="rounded-lg border-primary/30 text-primary">Vous</Badge>
                              )}
                            </div>

                            <div className="grid sm:grid-cols-3 gap-4">
                              {/* Member Goals */}
                              <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
                                  <Target className="h-3 w-3" /> Objectifs Partagés
                                </h4>
                                <div className="space-y-2">
                                  {member.goals && member.goals.length > 0 ? member.goals.map((goal: any) => (
                                    <div key={goal.id} className="p-3 rounded-2xl bg-white/5 border border-white/5">
                                      <div className="text-xs font-bold text-white mb-1 truncate">{goal.title}</div>
                                      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${goal.progress || 0}%` }} />
                                      </div>
                                    </div>
                                  )) : (
                                    <p className="text-[10px] text-white/20 italic">Aucun objectif partagé</p>
                                  )}
                                </div>
                              </div>

                              {/* Member Habits */}
                              <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
                                  <Flame className="h-3 w-3" /> Habitudes du jour
                                </h4>
                                <div className="space-y-2">
                                  {member.habits && member.habits.length > 0 ? member.habits.map((habit: any) => (
                                    <div key={habit.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                                      <span className="text-xs font-bold text-white truncate mr-2">{habit.title}</span>
                                      <CheckCircle2 className={cn("h-4 w-4 shrink-0", habit.is_completed_today ? "text-emerald-500" : "text-white/10")} />
                                    </div>
                                  )) : (
                                    <p className="text-[10px] text-white/20 italic">Aucune habitude partagée</p>
                                  )}
                                </div>
                              </div>

                              {/* Member Tasks */}
                              <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
                                  <CheckSquare className="h-3 w-3" /> Tâches en cours
                                </h4>
                                <div className="space-y-2">
                                  {member.tasks && member.tasks.length > 0 ? member.tasks.map((task: any) => (
                                    <div key={task.id} className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-2">
                                      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0",
                                        task.priority === 'high' ? 'bg-destructive' :
                                        task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                                      )} />
                                      <span className="text-xs font-medium text-white/80 truncate">{task.title}</span>
                                    </div>
                                  )) : (
                                    <p className="text-[10px] text-white/20 italic">Aucune tâche partagée</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === "chat" && (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="h-full flex flex-col"
                  >
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                      {messages.map(msg => (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex flex-col max-w-[80%]",
                            msg.user_id === user?.id ? "ml-auto items-end" : "items-start"
                          )}
                        >
                          {msg.user_id !== user?.id && (
                            <span className="text-[10px] font-bold text-white/30 ml-2 mb-1">{msg.display_name}</span>
                          )}
                          <div className={cn(
                            "p-3 rounded-2xl text-sm",
                            msg.user_id === user?.id
                              ? "bg-primary text-white rounded-br-none shadow-lg shadow-primary/10"
                              : "bg-white/5 border border-white/10 text-white rounded-bl-none"
                          )}>
                            {msg.content}
                          </div>
                          <span className="text-[9px] text-white/20 mt-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t border-white/5 bg-black/20">
                      <div className="flex gap-2 items-center bg-white/5 rounded-2xl p-1.5 border border-white/10 focus-within:border-primary/50 transition-all">
                        <Input
                          placeholder="Tapez votre message..."
                          className="border-none bg-transparent focus-visible:ring-0 h-10"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <Button size="icon" className="rounded-xl h-10 w-10" onClick={handleSendMessage}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "ai" && (
                  <motion.div
                    key="ai"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-full overflow-y-auto p-6 space-y-6"
                  >
                    {!aiAnalysis ? (
                      <div className="text-center py-12 space-y-6">
                        <div className="relative inline-block">
                          <div className="h-24 w-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto shadow-2xl">
                            <Brain className="h-12 w-12 text-primary" />
                          </div>
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center shadow-lg"
                          >
                            <Sparkles className="h-4 w-4 text-white" />
                          </motion.div>
                        </div>
                        <div className="max-w-md mx-auto space-y-2">
                          <h3 className="text-2xl font-bold text-white">Analyse Collective</h3>
                          <p className="text-sm text-white/40">DeepFlow IA analyse la dynamique de votre groupe pour vous proposer des conseils personnalisés et des défis communs.</p>
                        </div>
                        <Button
                          className="rounded-2xl h-12 px-8 font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                          onClick={handleAIAnalysis}
                          disabled={isAIAnalyzing}
                        >
                          {isAIAnalyzing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Analyse en cours...
                            </>
                          ) : (
                            "Générer une analyse de groupe"
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Brain className="h-5 w-5 text-primary" /> Rapport d'Analyse IA
                          </h3>
                          <Button variant="ghost" size="sm" className="text-xs" onClick={handleAIAnalysis}>
                            <RefreshCw className="h-3 w-3 mr-2" /> Régénérer
                          </Button>
                        </div>

                        <Card className="bg-white/5 border-white/10 p-6 rounded-[2rem] prose prose-invert max-w-none">
                          <div className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                            {aiAnalysis}
                          </div>
                        </Card>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <Card className="bg-primary/10 border-primary/20 p-5 rounded-[2rem]">
                            <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" /> Insight Clé
                            </h4>
                            <p className="text-xs text-white/70">
                              L'IA a détecté une synergie forte entre vos objectifs de santé. Encouragez-vous mutuellement le matin !
                            </p>
                          </Card>
                          <Card className="bg-amber-500/10 border-amber-500/20 p-5 rounded-[2rem]">
                            <h4 className="font-bold text-amber-500 mb-2 flex items-center gap-2">
                              <Target className="h-4 w-4" /> Défi Proposé
                            </h4>
                            <p className="text-xs text-white/70">
                              "Le Sprint des 24h" : Chaque membre doit terminer une tâche haute priorité d'ici demain soir.
                            </p>
                          </Card>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
              <Users className="h-10 w-10 text-white/20" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Bienvenue dans les Groupes</h2>
            <p className="text-white/40 max-w-sm">Sélectionnez un groupe à gauche ou créez-en un nouveau pour commencer à collaborer avec vos proches.</p>
          </div>
        )}
      </div>

      {/* Create Group Dialog */}
      <AnimatePresence>
        {showCreateDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateDialog(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-card border border-white/10 rounded-[2.5rem] shadow-2xl p-8"
            >
              <h2 className="text-2xl font-bold mb-6">Créer un nouveau groupe</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="group-name">Nom du groupe</Label>
                  <Input
                    id="group-name"
                    placeholder="Amis, Famille, Couple..."
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="h-12 rounded-2xl"
                  />
                </div>
                <Button className="w-full h-12 rounded-2xl font-bold text-lg mt-4" onClick={handleCreateGroup}>
                  Créer le groupe
                </Button>
                <Button variant="ghost" className="w-full rounded-2xl" onClick={() => setShowCreateDialog(false)}>
                  Annuler
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-white/60 ml-1">
      {children}
    </label>
  );
}

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
