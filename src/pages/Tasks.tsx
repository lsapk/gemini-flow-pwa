import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCheck,
  Filter,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import CreateTaskForm from "@/components/modals/CreateTaskForm";
import TaskList from "@/components/TaskList";
import { planTasks } from "@/lib/task-planning";
import { readAllPages } from "@/lib/pagination";
import type { Task } from "@/types";
import { toast } from "sonner";
const filters = [
  { key: "pending", label: "À faire" },
  { key: "today", label: "Aujourd’hui" },
  { key: "overdue", label: "En retard" },
  { key: "completed", label: "Terminées" },
  { key: "all", label: "Toutes" },
];
export default function Tasks() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<Task | null>(null),
    [dialog, setDialog] = useState(false),
    [deleting, setDeleting] = useState<string | null>(null),
    [busy, setBusy] = useState(false);
  const client = useQueryClient();
  const status = filters.some((f) => f.key === params.get("status"))
    ? params.get("status")!
    : "pending";
  const sort = params.get("sort") || "due",
    search = params.get("q") || "";
  const setFilter = (key: string, value: string) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  const query = useQuery({
    queryKey: ["tasks", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const rows = await readAllPages((from, to) =>
        supabase
          .from("tasks")
          .select("*")
          .eq("user_id", user!.id)
          .order("id")
          .range(from, to),
      );
      return rows.map((task) => ({
        ...task,
        priority: task.priority || "medium",
      })) as Task[];
    },
  });
  const tasks = query.data || [];
  const subtaskQuery = useQuery({
    queryKey: ["subtasks", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const rows = await readAllPages((from, to) =>
        supabase
          .from("subtasks")
          .select("*")
          .eq("user_id", user!.id)
          .order("sort_order")
          .order("id")
          .range(from, to),
      );
      return rows.reduce(
        (groups, subtask) => {
          (groups[subtask.parent_task_id] ||= []).push(subtask);
          return groups;
        },
        {} as Record<string, typeof rows>,
      );
    },
  });
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["tasks", user?.id] }),
      client.invalidateQueries({ queryKey: ["subtasks", user?.id] }),
      client.invalidateQueries({ queryKey: ["overview", user?.id] }),
    ]);
  };
  const toggle = async (id: string, completed: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await supabase
        .from("tasks")
        .update({ completed: !completed, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user!.id)
        .select("id")
        .single();
      if (result.error) throw result.error;
      await refresh();
    } catch {
      toast.error("La tâche n’a pas pu être modifiée. Réessayez.");
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!deleting || busy) return;
    setBusy(true);
    try {
      const result = await supabase
        .from("tasks")
        .delete()
        .eq("id", deleting)
        .eq("user_id", user!.id)
        .select("id")
        .single();
      if (result.error) throw result.error;
      setDeleting(null);
      toast.success("Tâche supprimée.");
      await refresh();
    } catch {
      toast.error("La tâche n’a pas pu être supprimée. Réessayez.");
    } finally {
      setBusy(false);
    }
  };
  const visible = planTasks(tasks, { status, sort, search });
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">UN PAS APRÈS L’AUTRE</p>
          <h1 className="page-title">
            Mes tâches<span className="text-primary">.</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Une liste claire pour vous concentrer sur l’essentiel.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialog(true);
          }}
          className="gap-2"
        >
          <Plus size={16} />
          Nouvelle tâche
        </Button>
      </div>
      <div className="panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div
            className="flex flex-wrap gap-1"
            role="group"
            aria-label="Filtrer les tâches"
          >
            {filters.map((filter) => (
              <Button
                key={filter.key}
                size="sm"
                variant={status === filter.key ? "secondary" : "ghost"}
                aria-pressed={status === filter.key}
                onClick={() => setFilter("status", filter.key)}
                className="text-xs"
              >
                {filter.label}
              </Button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {visible.length} tâche{visible.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-3 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              aria-label="Rechercher une tâche"
              placeholder="Rechercher une tâche…"
              value={search}
              onChange={(event) => setFilter("q", event.target.value)}
              className="pl-9"
            />
          </div>
          <select
            aria-label="Trier les tâches"
            value={sort}
            onChange={(event) => setFilter("sort", event.target.value)}
            className="rounded-lg border bg-card px-3 py-2 text-sm"
          >
            <option value="due">Échéance puis priorité</option>
            <option value="priority">Priorité puis échéance</option>
            <option value="recent">Plus récentes</option>
          </select>
        </div>
      </div>
      {query.isError ? (
        <div role="alert" className="panel p-6">
          <p>Les tâches n’ont pas pu être chargées.</p>
          <Button
            variant="outline"
            className="mt-3"
            onClick={() => void query.refetch()}
          >
            Réessayer
          </Button>
        </div>
      ) : (
        <TaskList
          tasks={visible}
          loading={query.isLoading}
          onEdit={(task) => {
            setEditing(tasks.find((item) => item.id === task.id) || null);
            setDialog(true);
          }}
          onDelete={setDeleting}
          onToggleComplete={toggle}
          subtasks={subtaskQuery.data || {}}
          onRefreshSubtasks={() => void refresh()}
        />
      )}
      {subtaskQuery.isError && (
        <p role="alert" className="text-sm text-destructive">
          Les sous-tâches ne sont pas disponibles. Rechargez la page pour
          réessayer.
        </p>
      )}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier la tâche" : "Votre prochain pas"}
            </DialogTitle>
            <DialogDescription>
              Une action précise, avec une échéance si nécessaire.
            </DialogDescription>
          </DialogHeader>
          <CreateTaskForm
            task={editing}
            onSuccess={() => {
              setDialog(false);
              void refresh();
            }}
          />
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette tâche ?</AlertDialogTitle>
            <AlertDialogDescription>
              La tâche et ses sous-tâches seront supprimées définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(event) => {
                event.preventDefault();
                void remove();
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
