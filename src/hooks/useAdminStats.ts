import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PlatformStats {
  totalUsers: number;
  totalTasks: number;
  totalHabits: number;
  totalGoals: number;
  totalFocusMinutes: number;
  activeUsersToday: number;
  newUsersThisWeek: number;
  totalJournalEntries: number;
  totalSubscribers: number;
  retentionRate: number;
}

interface AdminLog {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  target_user_id: string | null;
  target_user_email: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export const useAdminStats = () => {
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalTasks: 0,
    totalHabits: 0,
    totalGoals: 0,
    totalFocusMinutes: 0,
    activeUsersToday: 0,
    newUsersThisWeek: 0,
    totalJournalEntries: 0,
    totalSubscribers: 0,
    retentionRate: 0,
  });
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const [usersRes, tasksRes, habitsRes, goalsRes, focusRes, journalRes, subscribersRes] = await Promise.allSettled([
        supabase.from("user_profiles").select("id, created_at"),
        supabase.from("tasks").select("id", { count: "exact", head: true }),
        supabase.from("habits").select("id", { count: "exact", head: true }),
        supabase.from("goals").select("id", { count: "exact", head: true }),
        supabase.from("focus_sessions").select("duration"),
        supabase.from("journal_entries").select("id", { count: "exact", head: true }),
        supabase.from("subscribers").select("id", { count: "exact", head: true }).eq("subscribed", true),
      ]);

      const users = usersRes.status === "fulfilled" ? usersRes.value.data || [] : [];
      const tasksCount = tasksRes.status === "fulfilled" ? tasksRes.value.count || 0 : 0;
      const habitsCount = habitsRes.status === "fulfilled" ? habitsRes.value.count || 0 : 0;
      const goalsCount = goalsRes.status === "fulfilled" ? goalsRes.value.count || 0 : 0;
      const focusSessions = focusRes.status === "fulfilled" ? focusRes.value.data || [] : [];
      const journalCount = journalRes.status === "fulfilled" ? journalRes.value.count || 0 : 0;
      const subscribersCount = subscribersRes.status === "fulfilled" ? subscribersRes.value.count || 0 : 0;

      const totalFocusMinutes = focusSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const newUsersThisWeek = users.filter(u => 
        new Date(u.created_at) > oneWeekAgo
      ).length;

      const totalUsers = users.length;
      const retentionRate = totalUsers > 0 ? Math.round((newUsersThisWeek / totalUsers) * 100) : 0;

      setStats({
        totalUsers,
        totalTasks: tasksCount,
        totalHabits: habitsCount,
        totalGoals: goalsCount,
        totalFocusMinutes,
        activeUsersToday: 0,
        newUsersThisWeek,
        totalJournalEntries: journalCount,
        totalSubscribers: subscribersCount,
        retentionRate,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    }
  };

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_actions_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs((data as AdminLog[]) || []);
    } catch (error) {
      console.error("Error fetching admin logs:", error);
    }
  };

  const logAction = async (
    action: string, 
    targetUserId?: string, 
    targetUserEmail?: string,
    details?: Record<string, unknown>
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const insertData: {
        admin_id: string;
        admin_email: string;
        action: string;
        target_user_id?: string;
        target_user_email?: string;
        details?: Record<string, unknown>;
      } = {
        admin_id: user.id,
        admin_email: user.email || "unknown",
        action,
      };

      if (targetUserId) insertData.target_user_id = targetUserId;
      if (targetUserEmail) insertData.target_user_email = targetUserEmail;
      if (details) insertData.details = details;

      await supabase.from("admin_actions_log").insert(insertData as never);
      fetchLogs();
    } catch (error) {
      console.error("Error logging admin action:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchStats(), fetchLogs()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  return {
    stats,
    logs,
    isLoading,
    refetch: () => Promise.all([fetchStats(), fetchLogs()]),
    logAction,
  };
};
