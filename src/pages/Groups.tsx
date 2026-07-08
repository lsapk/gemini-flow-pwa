import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Users, UserPlus, MessageSquare, Target, CheckSquare,
  Flame, TrendingUp, Send, Settings, Brain, Crown, Plus,
  Mail, CheckCircle2, Loader2, Sparkles, RefreshCw, Copy, LogIn, Hash
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Group {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  invite_code?: string | null;
}

interface GroupMember {
  user_id: string;
  role: string;
  display_name?: string | null;
  photo_url?: string | null;
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

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

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
        }, async (payload) => {
          const msg = payload.new as Message;
          // fetch author name
          const { data: prof } = await supabase
            .from('user_profiles').select('display_name').eq('id', msg.user_id).maybeSingle();
          setMessages(prev => [...prev, { ...msg, display_name: prof?.display_name || 'Utilisateur' }]);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedGroupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchGroups = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('groups').select('*');
    if (error) {
      console.error(error);
      toast.error("Impossible de charger les groupes");
    } else if (data) {
      setGroups(data);
      if (data.length > 0 && !selectedGroupId) setSelectedGroupId(data[0].id);
    }
    setIsLoading(false);
  };

  const fetchInvitations = async () => {
    if (!user?.email) return;
    const { data } = await supabase
      .from('group_invitations')
      .select('*, groups(name)')
      .eq('invitee_email', user.email)
      .eq('status', 'pending');
    if (data) setInvitations(data);
  };

  const fetchMembers = async (groupId: string) => {
    const { data: memberRows, error } = await supabase
      .from('group_members').select('user_id, role').eq('group_id', groupId);
    if (error || !memberRows) { setMembers([]); return; }

    const ids = memberRows.map(m => m.user_id);
    const { data: profiles } = await supabase
      .from('user_profiles').select('id, display_name, photo_url').in('id', ids);

    const formatted = await Promise.all(memberRows.map(async (m) => {
      const prof = profiles?.find(p => p.id === m.user_id);
      const [tasks, habits, goals] = await Promise.all([
        supabase.from('shared_tasks').select('tasks(*)').eq('group_id', groupId),
        supabase.from('shared_habits').select('habits(*)').eq('group_id', groupId),
        supabase.from('shared_goals').select('goals(*)').eq('group_id', groupId),
      ]);
      return {
        user_id: m.user_id,
        role: m.role,
        display_name: prof?.display_name,
        photo_url: prof?.photo_url,
        tasks: (tasks.data || []).map((t: any) => t.tasks).filter((t: any) => t && t.user_id === m.user_id),
        habits: (habits.data || []).map((h: any) => h.habits).filter((h: any) => h && h.user_id === m.user_id),
        goals: (goals.data || []).map((g: any) => g.goals).filter((g: any) => g && g.user_id === m.user_id),
      };
    }));
    setMembers(formatted);
  };

  const fetchMessages = async (groupId: string) => {
    const { data } = await supabase
      .from('group_messages').select('*').eq('group_id', groupId)
      .order('created_at', { ascending: true });
    if (!data) return;
    const ids = Array.from(new Set(data.map((m: any) => m.user_id)));
    const { data: profs } = await supabase
      .from('user_profiles').select('id, display_name').in('id', ids);
    setMessages(data.map((m: any) => ({
      ...m,
      display_name: profs?.find(p => p.id === m.user_id)?.display_name || 'Utilisateur'
    })));
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !user) return;
    setCreating(true);
    const { data, error } = await supabase.from('groups')
      .insert({ name: newGroupName.trim(), description: newGroupDesc.trim() || null, created_by: user.id })
      .select().single();

    if (error || !data) {
      console.error(error);
      toast.error(error?.message || "Impossible de créer le groupe");
      setCreating(false);
      return;
    }

    // created_by and admin membership are set automatically by DB triggers
    setGroups(prev => [...prev, data]);
    setSelectedGroupId(data.id);
    setNewGroupName(""); setNewGroupDesc("");
    setShowCreateDialog(false);
    setCreating(false);
    toast.success("Groupe créé !");
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    const { data, error } = await supabase.rpc('join_group_by_code', { _code: joinCode.trim().toUpperCase() });
    setJoining(false);
    if (error) {
      toast.error(error.message || "Code invalide");
      return;
    }
    toast.success("Vous avez rejoint le groupe !");
    setJoinCode("");
    setShowJoinDialog(false);
    await fetchGroups();
    if (typeof data === 'string') setSelectedGroupId(data);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !selectedGroupId || !user) return;
    const { error } = await supabase.from('group_invitations').insert({
      group_id: selectedGroupId, inviter_id: user.id, invitee_email: inviteEmail.trim().toLowerCase()
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Invitation envoyée !");
    setInviteEmail("");
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedGroupId || !user) return;
    const content = newMessage.trim();
    setNewMessage("");
    const { error } = await supabase.from('group_messages')
      .insert({ group_id: selectedGroupId, user_id: user.id, content });
    if (error) { toast.error("Envoi impossible"); setNewMessage(content); }
  };

  const handleAIAnalysis = async () => {
    if (!selectedGroupId || !user) return;
    setIsAIAnalyzing(true); setAiAnalysis(null); setActiveTab("ai");
    try {
      const groupData = members.map(m => ({
        name: m.display_name,
        tasks: m.tasks?.length || 0,
        habits_total: m.habits?.length || 0,
        goals: m.goals?.map((g: any) => ({ title: g.title, progress: g.progress }))
      }));
      const { data, error } = await supabase.functions.invoke('gemini-chat-enhanced', {
        body: {
          message: `Analyse la dynamique de mon groupe "${selectedGroup?.name}" et donne des conseils de productivité et un défi collectif. Données: ${JSON.stringify(groupData)}`,
          context: { message_context: 'Analyse de groupe', analysis_mode: true }
        }
      });
      if (error) throw error;
      setAiAnalysis(data.response);
    } catch (e: any) {
      console.error(e);
      toast.error("Erreur analyse IA");
    } finally { setIsAIAnalyzing(false); }
  };

  const respondInvitation = async (id: string, status: 'accepted' | 'declined') => {
    const { data: invite } = await supabase.from('group_invitations').select('*').eq('id', id).single();
    if (!invite) return;
    if (status === 'accepted') {
      const { error } = await supabase.from('group_members').insert({
        group_id: invite.group_id, user_id: user!.id, role: 'member'
      });
      if (error) { toast.error("Adhésion impossible"); return; }
      fetchGroups();
    }
    await supabase.from('group_invitations').update({ status }).eq('id', id);
    fetchInvitations();
    toast.success(status === 'accepted' ? "Invitation acceptée !" : "Invitation déclinée");
  };

  const copyInviteCode = () => {
    if (!selectedGroup?.invite_code) return;
    navigator.clipboard.writeText(selectedGroup.invite_code);
    toast.success("Code copié !");
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] gap-6 max-w-7xl mx-auto">
      {/* Sidebar */}
      <div className="w-full md:w-72 flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Mes Groupes
          </h2>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1 rounded-2xl h-11" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-1" /> Créer
          </Button>
          <Button variant="secondary" className="flex-1 rounded-2xl h-11" onClick={() => setShowJoinDialog(true)}>
            <LogIn className="h-4 w-4 mr-1" /> Rejoindre
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
                    <Button size="sm" className="h-8 text-xs flex-1" onClick={() => respondInvitation(inv.id, 'accepted')}>Accepter</Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs flex-1 text-destructive" onClick={() => respondInvitation(inv.id, 'declined')}>Refuser</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {groups.map(group => (
            <button
              key={group.id}
              onClick={() => setSelectedGroupId(group.id)}
              className={cn(
                "w-full p-4 rounded-2xl border text-left transition-all",
                selectedGroupId === group.id
                  ? "bg-primary/10 border-primary/30"
                  : "bg-white/5 border-transparent hover:bg-white/10"
              )}
            >
              <div className="font-bold text-white">{group.name}</div>
              {group.description && <p className="text-xs text-white/40 truncate mt-1">{group.description}</p>}
            </button>
          ))}
          {groups.length === 0 && !isLoading && (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-white/20" />
              </div>
              <p className="text-sm text-white/40 mb-3">Aucun groupe pour l'instant.</p>
              <div className="flex flex-col gap-2">
                <Button size="sm" onClick={() => setShowCreateDialog(true)}>Créer un groupe</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowJoinDialog(true)}>Rejoindre avec un code</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col bg-card/30 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
        {selectedGroup ? (
          <>
            <div className="p-6 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedGroup.name}</h2>
                  <p className="text-sm text-white/40">{members.length} membre{members.length > 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedGroup.invite_code && (
                  <button
                    onClick={copyInviteCode}
                    className="flex items-center gap-2 px-3 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-mono"
                    title="Copier le code d'invitation"
                  >
                    <Hash className="h-3.5 w-3.5 text-primary" />
                    <span className="font-bold tracking-wider">{selectedGroup.invite_code}</span>
                    <Copy className="h-3 w-3 text-white/40" />
                  </button>
                )}
                <div className="flex p-1 rounded-xl bg-white/5 border border-white/10">
                  {[
                    { key: "members", icon: Users, label: "Membres" },
                    { key: "chat", icon: MessageSquare, label: "Chat" },
                    { key: "ai", icon: Brain, label: "Conseil IA" },
                  ].map(t => (
                    <Button key={t.key}
                      variant={activeTab === t.key ? "secondary" : "ghost"}
                      size="sm" className="rounded-lg h-8"
                      onClick={() => setActiveTab(t.key)}>
                      <t.icon className="h-4 w-4 mr-2" /> {t.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait">
                {activeTab === "members" && (
                  <motion.div key="members" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="h-full overflow-y-auto p-6 space-y-6">
                    <div className="bg-white/5 p-4 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-center gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-sm mb-1">Inviter par email</h3>
                        <p className="text-xs text-white/40">L'utilisateur recevra une invitation dans son espace groupes.</p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-1/2">
                        <Input placeholder="email@exemple.com" className="h-10 rounded-xl"
                          value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                        <Button className="rounded-xl h-10 px-4" onClick={handleInvite}>
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-6">
                      {members.map(member => (
                        <Card key={member.user_id} className="bg-white/5 border-white/5 rounded-[2rem]">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                              <Avatar className="h-16 w-16 border-2 border-white/10">
                                <AvatarImage src={member.photo_url || undefined} />
                                <AvatarFallback className="font-bold text-xl">
                                  {(member.display_name || "?").charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl font-bold text-white truncate">{member.display_name || "Utilisateur"}</span>
                                  {member.role === 'admin' && <Crown className="h-4 w-4 text-amber-500" />}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-white/40 uppercase font-black tracking-widest mt-1">
                                  <Flame className="h-4 w-4 text-orange-500" />
                                  {(member.habits?.length || 0) + (member.tasks?.length || 0)} éléments partagés
                                </div>
                              </div>
                              {member.user_id === user?.id && (
                                <Badge variant="outline" className="rounded-lg border-primary/30 text-primary">Vous</Badge>
                              )}
                            </div>

                            <div className="grid sm:grid-cols-3 gap-4">
                              <MemberSection icon={Target} title="Objectifs" items={member.goals} render={(g: any) => (
                                <div key={g.id} className="p-3 rounded-2xl bg-white/5 border border-white/5">
                                  <div className="text-xs font-bold text-white mb-1 truncate">{g.title}</div>
                                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `${g.progress || 0}%` }} />
                                  </div>
                                </div>
                              )} />
                              <MemberSection icon={Flame} title="Habitudes" items={member.habits} render={(h: any) => (
                                <div key={h.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                                  <span className="text-xs font-bold text-white truncate mr-2">{h.title}</span>
                                  <CheckCircle2 className={cn("h-4 w-4 shrink-0", h.is_completed_today ? "text-emerald-500" : "text-white/10")} />
                                </div>
                              )} />
                              <MemberSection icon={CheckSquare} title="Tâches" items={member.tasks} render={(t: any) => (
                                <div key={t.id} className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-2">
                                  <div className={cn("w-1.5 h-1.5 rounded-full shrink-0",
                                    t.priority === 'high' ? 'bg-destructive' : t.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                                  )} />
                                  <span className="text-xs font-medium text-white/80 truncate">{t.title}</span>
                                </div>
                              )} />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === "chat" && (
                  <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {messages.length === 0 && (
                        <p className="text-center text-white/30 text-sm py-10">Aucun message. Lancez la conversation !</p>
                      )}
                      {messages.map(msg => (
                        <div key={msg.id} className={cn("flex flex-col max-w-[80%]",
                          msg.user_id === user?.id ? "ml-auto items-end" : "items-start")}>
                          {msg.user_id !== user?.id && (
                            <span className="text-[10px] font-bold text-white/30 ml-2 mb-1">{msg.display_name}</span>
                          )}
                          <div className={cn("p-3 rounded-2xl text-sm",
                            msg.user_id === user?.id
                              ? "bg-primary text-white rounded-br-none"
                              : "bg-white/5 border border-white/10 text-white rounded-bl-none")}>
                            {msg.content}
                          </div>
                          <span className="text-[9px] text-white/20 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="p-4 border-t border-white/5 bg-black/20">
                      <div className="flex gap-2 items-center bg-white/5 rounded-2xl p-1.5 border border-white/10">
                        <Input placeholder="Tapez votre message..." className="border-none bg-transparent focus-visible:ring-0 h-10"
                          value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} />
                        <Button size="icon" className="rounded-xl h-10 w-10" onClick={handleSendMessage}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "ai" && (
                  <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="h-full overflow-y-auto p-6 space-y-6">
                    {!aiAnalysis ? (
                      <div className="text-center py-12 space-y-6">
                        <div className="relative inline-block">
                          <div className="h-24 w-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                            <Brain className="h-12 w-12 text-primary" />
                          </div>
                          <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="max-w-md mx-auto space-y-2">
                          <h3 className="text-2xl font-bold text-white">Analyse Collective</h3>
                          <p className="text-sm text-white/40">DeepFlow IA analyse la dynamique de votre groupe pour proposer des conseils et défis.</p>
                        </div>
                        <Button className="rounded-2xl h-12 px-8 font-bold" onClick={handleAIAnalysis} disabled={isAIAnalyzing}>
                          {isAIAnalyzing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyse...</> : "Générer une analyse"}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Brain className="h-5 w-5 text-primary" /> Rapport d'Analyse IA
                          </h3>
                          <Button variant="ghost" size="sm" onClick={handleAIAnalysis}>
                            <RefreshCw className="h-3 w-3 mr-2" /> Régénérer
                          </Button>
                        </div>
                        <Card className="bg-white/5 border-white/10 p-6 rounded-[2rem]">
                          <div className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{aiAnalysis}</div>
                        </Card>
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
            <p className="text-white/40 max-w-sm mb-6">Créez un groupe ou rejoignez-en un avec un code d'invitation.</p>
            <div className="flex gap-3">
              <Button onClick={() => setShowCreateDialog(true)}><Plus className="h-4 w-4 mr-2" />Créer</Button>
              <Button variant="secondary" onClick={() => setShowJoinDialog(true)}><LogIn className="h-4 w-4 mr-2" />Rejoindre</Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un nouveau groupe</DialogTitle>
            <DialogDescription>Un code d'invitation unique sera généré automatiquement.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="group-name">Nom du groupe *</Label>
              <Input id="group-name" placeholder="Amis, Famille, Équipe..." value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-desc">Description (optionnelle)</Label>
              <Textarea id="group-desc" placeholder="À quoi sert ce groupe ?" value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)} className="rounded-xl min-h-[80px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>Annuler</Button>
            <Button onClick={handleCreateGroup} disabled={creating || !newGroupName.trim()}>
              {creating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Création...</> : "Créer le groupe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Join Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rejoindre un groupe</DialogTitle>
            <DialogDescription>Entrez le code d'invitation communiqué par un membre du groupe.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="join-code">Code d'invitation</Label>
              <Input id="join-code" placeholder="Ex: A3F9K2LM" value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="h-12 rounded-xl font-mono tracking-widest text-center text-lg uppercase" maxLength={12} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowJoinDialog(false)}>Annuler</Button>
            <Button onClick={handleJoinByCode} disabled={joining || !joinCode.trim()}>
              {joining ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Connexion...</> : "Rejoindre"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MemberSection({ icon: Icon, title, items, render }: { icon: any; title: string; items: any[] | undefined; render: (item: any) => React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
        <Icon className="h-3 w-3" /> {title}
      </h4>
      <div className="space-y-2">
        {items && items.length > 0 ? items.map(render) : (
          <p className="text-[10px] text-white/20 italic">Aucun élément partagé</p>
        )}
      </div>
    </div>
  );
}
