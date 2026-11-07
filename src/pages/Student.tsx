import { useState, type FormEvent, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Download,
  GraduationCap,
  Link2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { studentService } from "@/services/student-service";
import {
  defaultStudentProfile,
  formatGrade,
  formatStudentDate,
  moduleResult,
  parisWallTime,
  semesterKey,
  semesterResult,
  toParisInput,
  type StudentAssessment,
  type StudentDeadline,
  type StudentModule,
  type StudentProfile,
} from "@/lib/student";
import {
  calendarEventKey,
  MAX_ICS_BYTES,
  parseStudentCalendar,
  type CalendarPreview,
} from "@/lib/student-calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const kindLabel = {
  exam: "Examen",
  assignment: "Rendu",
  administrative: "Démarche",
};
const field = (data: FormData, key: string) =>
  String(data.get(key) || "").trim();
const numberField = (data: FormData, key: string) => Number(field(data, key));
function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center text-sm leading-relaxed text-muted-foreground">
      {children}
    </div>
  );
}
function FormError({
  notice,
}: {
  notice: { text: string; error: boolean } | null;
}) {
  return notice?.error ? (
    <p
      role="alert"
      className="rounded-lg bg-destructive/5 p-3 text-sm text-destructive"
    >
      {notice.text}
    </p>
  ) : null;
}
function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}

export default function Student() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [profileOpen, setProfileOpen] = useState(false);
  const [moduleEditor, setModuleEditor] =
    useState<Partial<StudentModule> | null>(null);
  const [assessmentEditor, setAssessmentEditor] =
    useState<Partial<StudentAssessment> | null>(null);
  const [deadlineEditor, setDeadlineEditor] =
    useState<Partial<StudentDeadline> | null>(null);
  const [revision, setRevision] = useState<StudentDeadline | null>(null);
  const [deletion, setDeletion] = useState<{
    table:
      | "student_modules"
      | "student_assessments"
      | "student_deadlines"
      | "student_calendar_events";
    id: string;
    title: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(
    null,
  );
  const [preview, setPreview] = useState<CalendarPreview | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [source, setSource] = useState("Emploi du temps");
  const [feedUrl, setFeedUrl] = useState("");
  const [fromDate, setFromDate] = useState(() =>
    toParisInput(new Date().toISOString()).slice(0, 10),
  );
  const [untilDate, setUntilDate] = useState(() =>
    toParisInput(new Date(Date.now() + 7 * 86400000).toISOString()).slice(
      0,
      10,
    ),
  );
  const profileQuery = useQuery({
    queryKey: ["student-profile", user?.id],
    queryFn: () => studentService.getProfile(user!.id),
    enabled: !!user && isSupabaseConfigured,
  });
  const profile =
    profileQuery.data || (user ? defaultStudentProfile(user.id) : null);
  const key = profile ? semesterKey(profile) : "";
  const workspaceQuery = useQuery({
    queryKey: ["student-workspace", user?.id, key],
    queryFn: () => studentService.getWorkspace(user!.id, key),
    enabled: !!user && !!key && isSupabaseConfigured && profileQuery.isSuccess,
  });
  const workspace = workspaceQuery.data;
  const modules = workspace?.modules || [];
  const assessments = workspace?.assessments || [];
  const deadlines = [...(workspace?.deadlines || [])].sort((a, b) =>
    a.due_at.localeCompare(b.due_at),
  );
  const result = semesterResult(modules, assessments);
  const upcoming = deadlines.filter(
    (item) => !item.completed && item.due_at >= new Date().toISOString(),
  );
  const eventList = (workspace?.events || [])
    .filter(
      (item) =>
        item.status !== "cancelled" &&
        item.starts_at &&
        toParisInput(item.starts_at).slice(0, 10) >= fromDate &&
        toParisInput(item.starts_at).slice(0, 10) <= untilDate,
    )
    .sort((a, b) => a.starts_at!.localeCompare(b.starts_at!));
  const loading = profileQuery.isLoading || workspaceQuery.isLoading;
  const dataError = profileQuery.error || workspaceQuery.error;
  const canEdit = !!user && isSupabaseConfigured && !loading && !dataError;

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["student-profile", user?.id],
      }),
      queryClient.invalidateQueries({
        queryKey: ["student-workspace", user?.id],
      }),
      queryClient.invalidateQueries({ queryKey: ["tasks", user?.id] }),
    ]);
  }
  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setNotice(null);
    try {
      await action();
      await refresh();
      setNotice({ text: success, error: false });
      return true;
    } catch (error) {
      setNotice({
        text:
          error instanceof Error
            ? error.message
            : "L’enregistrement a échoué. Réessayez.",
        error: true,
      });
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value: StudentProfile = {
      user_id: user!.id,
      institution: field(data, "institution"),
      degree: field(data, "degree"),
      study_year: field(data, "study_year"),
      academic_year: field(data, "academic_year"),
      semester: numberField(data, "semester"),
    };
    if (
      await run(() => {
        const years = value.academic_year.split("-").map(Number);
        if (years.length !== 2 || years[1] !== years[0] + 1)
          throw new Error(
            "L’année universitaire doit contenir deux années consécutives, par exemple 2026-2027.",
          );
        return studentService.saveProfile(value);
      }, "Parcours enregistré. Les données restent associées à leur année et à leur semestre.")
    )
      setProfileOpen(false);
  }
  async function saveModule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (
      await run(
        () =>
          studentService.saveModule({
            ...(moduleEditor?.id ? { id: moduleEditor.id } : {}),
            user_id: user!.id,
            semester_key: key,
            name: field(data, "name"),
            code: field(data, "code"),
            ects: numberField(data, "ects"),
            coefficient: numberField(data, "coefficient"),
          }),
        "UE enregistrée.",
      )
    )
      setModuleEditor(null);
  }
  async function saveAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (
      await run(async () => {
        const weight = numberField(data, "weight");
        const otherWeight = assessments
          .filter(
            (item) =>
              item.module_id === assessmentEditor!.module_id &&
              item.id !== assessmentEditor?.id,
          )
          .reduce((sum, item) => sum + item.weight, 0);
        if (otherWeight + weight > 100.001)
          throw new Error(
            `Les pondérations dépasseraient 100 % (${otherWeight + weight} %). Ajustez d’abord les autres évaluations.`,
          );
        return studentService.saveAssessment({
          ...(assessmentEditor?.id ? { id: assessmentEditor.id } : {}),
          user_id: user!.id,
          module_id: assessmentEditor!.module_id!,
          title: field(data, "title"),
          weight,
          grade:
            field(data, "grade") === "" ? null : numberField(data, "grade"),
        });
      }, "Évaluation enregistrée.")
    )
      setAssessmentEditor(null);
  }
  async function saveDeadline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (
      await run(
        () =>
          studentService.saveDeadline({
            ...(deadlineEditor?.id ? { id: deadlineEditor.id } : {}),
            user_id: user!.id,
            semester_key: key,
            title: field(data, "title"),
            kind: field(data, "kind") as StudentDeadline["kind"],
            due_at: parisWallTime(field(data, "due_at")),
            location: field(data, "location"),
            notes: field(data, "notes"),
            completed: deadlineEditor?.completed || false,
            linked_task_id: deadlineEditor?.linked_task_id || null,
          }),
        "Échéance enregistrée.",
      )
    )
      setDeadlineEditor(null);
  }
  async function readCalendar(file?: File) {
    setPreview(null);
    setNotice(null);
    setPreviewExpanded(false);
    if (!file) return;
    setBusy(true);
    try {
      if (file.size > MAX_ICS_BYTES)
        throw new Error(
          "Le fichier dépasse 2 Mo. Exportez une période plus courte.",
        );
      const next = parseStudentCalendar(await file.text());
      setPreview(next);
    } catch (error) {
      setNotice({
        text:
          error instanceof Error
            ? error.message
            : "Impossible de lire le calendrier.",
        error: true,
      });
    } finally {
      setBusy(false);
    }
  }

  async function previewFeed(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPreview(null);
    setNotice(null);
    setPreviewExpanded(false);
    setBusy(true);
    try {
      setPreview(
        parseStudentCalendar(await studentService.fetchCalendarFeed(feedUrl)),
      );
    } catch (error) {
      setNotice({
        text:
          error instanceof Error
            ? error.message
            : "Impossible de récupérer le calendrier.",
        error: true,
      });
    } finally {
      setBusy(false);
    }
  }

  async function exportStudentData() {
    if (!user) return;
    setBusy(true);
    setNotice(null);
    try {
      const data = await studentService.exportAllData(user.id);
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `deepflow-etudiant-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice({
        text: "Export étudiant téléchargé : tous vos semestres et leurs tâches de révision liées.",
        error: false,
      });
    } catch (error) {
      setNotice({
        text:
          error instanceof Error
            ? error.message
            : "L’export a échoué. Aucun fichier incomplet n’a été téléchargé.",
        error: true,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-w-0 bg-background">
      <section
        aria-label="Espace étudiant"
        className="mx-auto max-w-7xl space-y-7 px-4 pb-12 pt-6 md:px-8 md:pt-8"
      >
        <header className="page-intro flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <GraduationCap className="h-4 w-4" /> Espace étudiant
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Votre semestre, au clair.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Cours, évaluations et révisions : un espace pour avancer, quel que
              soit votre établissement.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => void exportStudentData()}
              disabled={!canEdit || busy}
            >
              <Download className="mr-2 h-4 w-4" />
              Exporter mes données
            </Button>
            <Button
              variant="outline"
              onClick={() => setProfileOpen(true)}
              disabled={!canEdit || busy}
            >
              <Pencil className="mr-2 h-4 w-4" />
              {profileQuery.data
                ? "Modifier mon parcours"
                : "Configurer mon parcours"}
            </Button>
          </div>
        </header>
        {!isSupabaseConfigured ? (
          <Card>
            <CardHeader>
              <CardTitle>Connecter votre espace personnel</CardTitle>
              <CardDescription>
                La configuration Supabase est nécessaire pour enregistrer votre
                parcours et vos cours. Définissez les variables de connexion du
                projet et appliquez la migration de l’espace étudiant.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : authLoading ? (
          <p role="status" className="flex gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Vérification de la session…
          </p>
        ) : !user ? (
          <Empty>
            <p>
              Connectez-vous pour retrouver votre espace étudiant personnel.
            </p>
            <Button asChild className="mt-4">
              <Link to="/login">Se connecter</Link>
            </Button>
          </Empty>
        ) : (
          <>
            <div className="semester-band flex flex-wrap items-center gap-2 rounded-xl border px-4 py-3 text-sm">
              <span className="font-medium">
                {profile?.institution || "Votre établissement"}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                {[profile?.degree, profile?.study_year]
                  .filter(Boolean)
                  .join(" · ") || "Parcours à renseigner"}
              </span>
              <Badge variant="secondary" className="sm:ml-auto">
                {profile?.academic_year} · S{profile?.semester}
              </Badge>
            </div>
            {notice && (
              <div
                role={notice.error ? "alert" : "status"}
                className={`rounded-lg border p-4 text-sm ${notice.error ? "border-destructive/40 bg-destructive/5 text-destructive" : "border-primary/20 bg-primary/5"}`}
              >
                {notice.text}
              </div>
            )}
            {dataError ? (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 p-5"
              >
                <p className="text-sm text-destructive">
                  {dataError instanceof Error
                    ? dataError.message
                    : "Impossible de charger votre espace."}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => void refresh()}
                >
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Réessayer
                </Button>
              </div>
            ) : loading ? (
              <div
                role="status"
                className="flex items-center gap-2 py-12 text-sm text-muted-foreground"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement de votre semestre…
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    {
                      label: "Moyenne indicative",
                      value: `${formatGrade(result.mean)} / 20`,
                      detail: result.complete
                        ? "Toutes les évaluations renseignées"
                        : `${result.gradedModules}/${modules.length} UE avec une note`,
                    },
                    {
                      label: "ECTS planifiés",
                      value: String(result.ects),
                      detail: `${modules.length} unité${modules.length > 1 ? "s" : ""} d’enseignement`,
                    },
                    {
                      label: "Prochaines échéances",
                      value: String(upcoming.length),
                      detail: upcoming[0]
                        ? formatStudentDate(upcoming[0].due_at)
                        : "Aucune échéance à venir",
                    },
                    {
                      label: "Cours dans la période",
                      value: String(eventList.length),
                      detail: "Emploi du temps importé",
                    },
                  ].map((item) => (
                    <Card key={item.label} className="shadow-none">
                      <CardContent className="p-4 md:p-5">
                        <p className="text-xs text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="my-2 text-2xl font-semibold tabular-nums">
                          {item.value}
                        </p>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {item.detail}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Tabs defaultValue="modules" className="space-y-6">
                  <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted/60 p-1 sm:inline-flex sm:w-auto">
                    <TabsTrigger value="modules">
                      <BookOpen className="mr-2 h-4 w-4" />
                      UE & notes
                    </TabsTrigger>
                    <TabsTrigger value="schedule">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Emploi du temps
                    </TabsTrigger>
                    <TabsTrigger value="deadlines">
                      <Clock3 className="mr-2 h-4 w-4" />
                      Examens & rendus
                    </TabsTrigger>
                    <TabsTrigger value="connections">
                      <Link2 className="mr-2 h-4 w-4" />
                      Connexions
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="modules" className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-semibold">
                          Les UE de votre semestre
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Renseignez les coefficients et les modalités de votre
                          formation.
                        </p>
                      </div>
                      <Button onClick={() => setModuleEditor({})}>
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter une UE
                      </Button>
                    </div>
                    <p className="rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
                      Les moyennes sont calculées sur les notes saisies,
                      pondérées au sein de chaque UE puis par coefficient d’UE.
                      Une moyenne partielle exclut les notes manquantes. Les
                      ECTS indiquent votre programme, pas des crédits acquis. La
                      compensation, les seuils éliminatoires, les absences et le
                      rattrapage dépendent de vos modalités officielles et ne
                      sont pas déduits ici.
                    </p>
                    {!modules.length ? (
                      <Empty>
                        <BookOpen className="mx-auto mb-3 h-7 w-7 opacity-50" />
                        <p>Aucune UE pour ce semestre.</p>
                        <p>
                          Ajoutez votre première UE, puis ses évaluations et
                          leurs pondérations.
                        </p>
                      </Empty>
                    ) : (
                      <div className="grid items-start gap-5 lg:grid-cols-2">
                        {modules.map((module) => {
                          const items = assessments.filter(
                            (item) => item.module_id === module.id,
                          );
                          const average = moduleResult(items);
                          return (
                            <Card
                              key={module.id}
                              className="overflow-hidden shadow-none"
                            >
                              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                                <div>
                                  <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
                                    {module.code || "Unité d’enseignement"}
                                  </p>
                                  <CardTitle className="text-lg leading-snug">
                                    {module.name}
                                  </CardTitle>
                                  <CardDescription className="mt-2">
                                    {module.ects} ECTS · coefficient{" "}
                                    {module.coefficient}
                                  </CardDescription>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    aria-label={`Modifier ${module.name}`}
                                    onClick={() => setModuleEditor(module)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    aria-label={`Supprimer ${module.name}`}
                                    onClick={() =>
                                      setDeletion({
                                        table: "student_modules",
                                        id: module.id,
                                        title: module.name,
                                      })
                                    }
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                                  <span className="text-sm">
                                    {average.complete
                                      ? "Moyenne renseignée"
                                      : "Moyenne partielle"}
                                  </span>
                                  <span className="font-semibold tabular-nums">
                                    {formatGrade(average.mean)}{" "}
                                    <span className="text-xs font-normal text-muted-foreground">
                                      / 20
                                    </span>
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  {items.map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex items-center gap-2 border-b py-2 text-sm last:border-0"
                                    >
                                      <div className="min-w-0 flex-1">
                                        <p className="break-words">
                                          {item.title}
                                        </p>
                                        <span className="text-xs text-muted-foreground">
                                          Poids : {item.weight} %
                                        </span>
                                      </div>
                                      <span className="shrink-0 tabular-nums">
                                        {item.grade === null
                                          ? "À venir"
                                          : `${formatGrade(item.grade)} / 20`}
                                      </span>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        aria-label={`Modifier ${item.title}`}
                                        onClick={() =>
                                          setAssessmentEditor(item)
                                        }
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        aria-label={`Supprimer ${item.title}`}
                                        onClick={() =>
                                          setDeletion({
                                            table: "student_assessments",
                                            id: item.id,
                                            title: item.title,
                                          })
                                        }
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p
                                    className={`text-xs ${Math.abs(average.totalWeight - 100) > 0.001 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}
                                  >
                                    {average.gradedWeight} % notés ·{" "}
                                    {average.totalWeight} / 100 % définis
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setAssessmentEditor({
                                        module_id: module.id,
                                      })
                                    }
                                  >
                                    <Plus className="mr-1 h-3.5 w-3.5" />
                                    Évaluation
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="schedule" className="space-y-5">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                      <div>
                        <h2 className="text-xl font-semibold">
                          Votre emploi du temps
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Affichage en heure de Paris · import manuel dans
                          Connexions.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Field id="calendar-from" label="Du">
                          <Input
                            id="calendar-from"
                            type="date"
                            value={fromDate}
                            onChange={(event) =>
                              setFromDate(event.target.value)
                            }
                          />
                        </Field>
                        <Field id="calendar-until" label="Au">
                          <Input
                            id="calendar-until"
                            type="date"
                            value={untilDate}
                            min={fromDate}
                            onChange={(event) =>
                              setUntilDate(event.target.value)
                            }
                          />
                        </Field>
                      </div>
                    </div>
                    {fromDate > untilDate ? (
                      <p role="alert" className="text-sm text-destructive">
                        La fin de période doit suivre son début.
                      </p>
                    ) : !eventList.length ? (
                      <Empty>
                        <CalendarDays className="mx-auto mb-3 h-7 w-7 opacity-50" />
                        <p>Aucun cours dans cette période.</p>
                        <p>
                          Importez votre fichier .ics ou changez les dates
                          ci-dessus.
                        </p>
                      </Empty>
                    ) : (
                      <div className="divide-y rounded-xl border">
                        {eventList.map((event) => (
                          <div
                            key={event.id}
                            className="flex items-start gap-4 bg-card p-4 first:rounded-t-xl last:rounded-b-xl"
                          >
                            <div className="mt-0.5 h-10 w-1 shrink-0 rounded-full bg-primary/60" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-primary">
                                {formatStudentDate(
                                  event.starts_at!,
                                  event.all_day,
                                )}
                                {event.all_day
                                  ? " · Journée entière"
                                  : event.ends_at &&
                                      event.ends_at !== event.starts_at
                                    ? ` → ${formatStudentDate(event.ends_at)}`
                                    : ""}
                              </p>
                              <h3 className="mt-1 break-words font-medium">
                                {event.title}
                              </h3>
                              {event.location && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {event.location}
                                </p>
                              )}
                              <p className="mt-1 text-xs text-muted-foreground">
                                {event.source_key}
                              </p>
                              {event.description && (
                                <details className="mt-2 text-sm">
                                  <summary className="cursor-pointer text-muted-foreground">
                                    Détails du cours
                                  </summary>
                                  <p className="mt-2 whitespace-pre-wrap break-words">
                                    {event.description}
                                  </p>
                                </details>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Supprimer le cours ${event.title}`}
                              onClick={() =>
                                setDeletion({
                                  table: "student_calendar_events",
                                  id: event.id!,
                                  title: event.title,
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      L’import est un instantané. Réimportez régulièrement la
                      même source pour actualiser les cours. Les annulations
                      explicites du fichier sont appliquées ; l’absence d’un
                      cours dans un nouvel export ne le supprime pas.
                    </p>
                  </TabsContent>
                  <TabsContent value="deadlines" className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-semibold">
                          Préparer la prochaine échéance
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Examens, travaux à rendre et démarches, en heure de
                          Paris.
                        </p>
                      </div>
                      <Button onClick={() => setDeadlineEditor({})}>
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter une échéance
                      </Button>
                    </div>
                    {!deadlines.length ? (
                      <Empty>
                        <p>Aucune échéance pour ce semestre.</p>
                        <p>
                          Ajoutez un examen et créez sa tâche de révision dans
                          votre liste de tâches.
                        </p>
                      </Empty>
                    ) : (
                      <div className="space-y-3">
                        {deadlines.map((item) => {
                          const task = workspace?.tasks.find(
                            (task) => task.id === item.linked_task_id,
                          );
                          const overdue =
                            !item.completed &&
                            item.due_at < new Date().toISOString();
                          return (
                            <Card
                              key={item.id}
                              className={`shadow-none ${item.completed ? "opacity-70" : ""}`}
                            >
                              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  disabled={busy}
                                  className="shrink-0"
                                  aria-label={`${item.completed ? "Réouvrir" : "Terminer"} ${item.title}`}
                                  onClick={() =>
                                    void run(
                                      () =>
                                        studentService.saveDeadline({
                                          ...item,
                                          completed: !item.completed,
                                        }),
                                      "Échéance mise à jour.",
                                    )
                                  }
                                >
                                  {item.completed && (
                                    <Check className="h-4 w-4" />
                                  )}
                                </Button>
                                <div className="min-w-0 flex-1">
                                  <div className="mb-1 flex flex-wrap items-center gap-2">
                                    <Badge variant="secondary">
                                      {kindLabel[item.kind]}
                                    </Badge>
                                    {overdue && (
                                      <span className="text-xs text-amber-600 dark:text-amber-400">
                                        Date dépassée
                                      </span>
                                    )}
                                  </div>
                                  <h3
                                    className={`break-words font-medium ${item.completed ? "line-through" : ""}`}
                                  >
                                    {item.title}
                                  </h3>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {formatStudentDate(item.due_at)}
                                    {item.location && ` · ${item.location}`}
                                  </p>
                                  {item.notes && (
                                    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                                      {item.notes}
                                    </p>
                                  )}
                                  {task && (
                                    <Link
                                      className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                      to="/tasks"
                                    >
                                      {task.completed
                                        ? "Révision terminée"
                                        : `Révision : ${task.title}`}
                                      <ArrowUpRight className="h-3 w-3" />
                                    </Link>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-1">
                                  {!task && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setRevision(item)}
                                    >
                                      Planifier une révision
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Modifier ${item.title}`}
                                    onClick={() => setDeadlineEditor(item)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Supprimer ${item.title}`}
                                    onClick={() =>
                                      setDeletion({
                                        table: "student_deadlines",
                                        id: item.id,
                                        title: item.title,
                                      })
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="connections" className="space-y-5">
                    <div>
                      <h2 className="text-xl font-semibold">
                        Relier votre université
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Importez un fichier ou actualisez un lien iCalendar,
                        sans partager votre mot de passe universitaire.
                      </p>
                    </div>
                    <div className="grid items-start gap-5 lg:grid-cols-2">
                      <Card className="shadow-none">
                        <CardHeader>
                          <div className="flex items-center justify-between gap-2">
                            <GraduationCap className="h-6 w-6 text-primary" />
                            <Badge variant="secondary">
                              Import ICS disponible
                            </Badge>
                          </div>
                          <CardTitle className="pt-3 text-lg">
                            Université Claude Bernard Lyon 1
                          </CardTitle>
                          <CardDescription>
                            Emploi du temps ADE · import et actualisation
                            manuelle
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm leading-relaxed">
                          <ol className="list-decimal space-y-2 pl-5">
                            <li>
                              Ouvrez l’emploi du temps officiel de Lyon 1 et
                              authentifiez-vous sur le site de l’université si
                              nécessaire.
                            </li>
                            <li>
                              Sélectionnez votre formation, votre groupe et la
                              période à récupérer. Utilisez l’export d’agenda /
                              iCalendar si votre composante le propose.
                            </li>
                            <li>
                              Téléchargez le fichier .ics sur votre appareil. Si
                              ADE fournit un lien d’export, utilisez-le
                              ci-contre si son serveur est autorisé, ou
                              téléchargez le fichier.
                            </li>
                            <li>
                              Chargez le calendrier ci-contre, vérifiez
                              l’aperçu, puis confirmez l’import.
                            </li>
                          </ol>
                          <div className="flex flex-col items-start gap-2">
                            <ExternalLink href="https://edt.univ-lyon1.fr/">
                              Ouvrir ADE Lyon 1
                            </ExternalLink>
                            <ExternalLink href="https://etu.univ-lyon1.fr/outils">
                              Outils officiels des étudiants
                            </ExternalLink>
                            <ExternalLink href="https://moodle.univ-lyon1.fr/pluginfile.php/2472533/mod_resource/content/2/2024%202025%20-%20Rentre%CC%81e%20des%20enseignants%20-%20Pre%CC%81sentation%20-%20Direction%20des%20e%CC%81tudes%20-%20Consulter%20son%20Emploi%20du%20Temps.pdf">
                              Guide ADE de l’INSPE (selon la composante)
                            </ExternalLink>
                          </div>
                          <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                            La connexion ENT / CAS, la synchronisation
                            automatique et l’import des notes TOMUSS ne sont pas
                            disponibles dans cette version. Les notes sont à
                            saisir dans UE & notes. Aucun mot de passe
                            universitaire n’est demandé.
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="shadow-none">
                        <CardHeader>
                          <Upload className="h-6 w-6 text-primary" />
                          <CardTitle className="pt-3 text-lg">
                            Importer un emploi du temps
                          </CardTitle>
                          <CardDescription>
                            Lyon 1 ou tout établissement proposant un export
                            .ics : ADE, Celcat, Moodle…
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Field id="calendar-source" label="Nom de la source">
                            <Input
                              id="calendar-source"
                              value={source}
                              maxLength={120}
                              placeholder="Ex. Mon groupe de TD"
                              onChange={(event) =>
                                setSource(event.target.value)
                              }
                            />
                          </Field>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            Réutilisez exactement ce nom pour les prochains
                            imports du même groupe. Un nouveau nom crée une
                            source distincte.
                          </p>
                          <Field
                            id="calendar-file"
                            label="Fichier iCalendar (.ics, 2 Mo maximum)"
                          >
                            <Input
                              id="calendar-file"
                              type="file"
                              accept=".ics,text/calendar"
                              disabled={busy}
                              onChange={(event) => {
                                void readCalendar(event.target.files?.[0]);
                                event.target.value = "";
                              }}
                            />
                          </Field>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            UTC et Europe/Paris acceptés ; heures flottantes
                            interprétées à Paris. Les récurrences
                            RRULE/RDATE/EXDATE et les durées DURATION sont
                            refusées avec un message explicite. Demandez un
                            export d’occurrences individuelles avec heure de
                            fin. Le fichier est analysé sur votre appareil, puis
                            les événements sont enregistrés dans votre compte
                            après confirmation.
                          </p>
                          <form
                            onSubmit={previewFeed}
                            className="space-y-3 border-t pt-4"
                          >
                            <Field
                              id="calendar-feed-url"
                              label="Lien privé iCalendar (facultatif)"
                            >
                              <Input
                                id="calendar-feed-url"
                                type="url"
                                value={feedUrl}
                                maxLength={4096}
                                autoComplete="off"
                                spellCheck={false}
                                placeholder="https://…"
                                onChange={(event) =>
                                  setFeedUrl(event.target.value)
                                }
                                disabled={busy}
                                required
                              />
                            </Field>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                              Seuls les serveurs universitaires autorisés sont
                              accessibles. Le lien est transmis au service pour
                              ce téléchargement et reste uniquement en mémoire
                              dans cette page. Il n’est pas enregistré dans
                              votre compte. Chaque actualisation demande votre
                              confirmation.
                            </p>
                            <Button
                              type="submit"
                              variant="outline"
                              disabled={busy || !feedUrl.trim()}
                            >
                              {busy ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                              )}
                              Actualiser l’aperçu depuis le lien
                            </Button>
                          </form>
                          <div className="flex items-start gap-2 rounded-lg border p-3 text-xs text-muted-foreground">
                            <Download className="mt-0.5 h-4 w-4 shrink-0" />
                            Pour une autre université, exportez votre agenda
                            depuis son outil officiel, puis utilisez le même
                            import.
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    {preview && (
                      <Card className="border-primary/30 shadow-none">
                        <CardHeader>
                          <CardTitle className="text-lg">
                            Vérifier avant d’importer
                          </CardTitle>
                          <CardDescription>
                            {preview.events.length} événement(s) ·{" "}
                            {
                              preview.events.filter(
                                (item) => item.status === "cancelled",
                              ).length
                            }{" "}
                            annulation(s) ·{" "}
                            {
                              preview.events.filter((item) =>
                                workspace?.events.some(
                                  (old) =>
                                    old.source_key === source.trim() &&
                                    calendarEventKey(old) ===
                                      calendarEventKey(item),
                                ),
                              ).length
                            }{" "}
                            déjà présent(s) dans cette source · destination{" "}
                            {key}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {preview.warnings.map((warning) => (
                            <p
                              key={warning}
                              className="rounded-lg bg-amber-500/10 p-3 text-sm"
                            >
                              {warning}
                            </p>
                          ))}
                          <div className="max-h-80 divide-y overflow-auto rounded-lg border">
                            {(previewExpanded
                              ? preview.events
                              : preview.events.slice(0, 50)
                            ).map((item) => (
                              <div
                                key={calendarEventKey(item)}
                                className="p-3 text-sm"
                              >
                                <p className="font-medium">
                                  {item.status === "cancelled"
                                    ? "Annulation · "
                                    : ""}
                                  {item.title}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {item.starts_at
                                    ? formatStudentDate(
                                        item.starts_at,
                                        item.all_day,
                                      )
                                    : "Annulation identifiée par UID"}
                                  {item.all_day
                                    ? " · journée entière (fin exclusive)"
                                    : ""}
                                  {item.location ? ` · ${item.location}` : ""}
                                </p>
                              </div>
                            ))}
                          </div>
                          {preview.events.length > 50 && !previewExpanded && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPreviewExpanded(true)}
                            >
                              Afficher les {preview.events.length} événements
                            </Button>
                          )}
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            Les versions antérieures ne remplacent pas les
                            versions plus récentes. Les annulations peuvent
                            masquer des occurrences déjà importées. Les autres
                            cours sont conservés.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              disabled={busy || !source.trim()}
                              onClick={async () => {
                                if (
                                  await run(
                                    () =>
                                      studentService.importCalendar(
                                        key,
                                        source,
                                        preview.events,
                                      ),
                                    "Emploi du temps enregistré. Retrouvez les cours dans l’onglet Emploi du temps.",
                                  )
                                )
                                  setPreview(null);
                              }}
                            >
                              {busy ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="mr-2 h-4 w-4" />
                              )}
                              Confirmer l’import
                            </Button>
                            <Button
                              variant="outline"
                              disabled={busy}
                              onClick={() => setPreview(null)}
                            >
                              Annuler
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </>
        )}
      </section>
      <Dialog
        open={profileOpen}
        onOpenChange={(open) => {
          if (!busy) setProfileOpen(open);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mon parcours universitaire</DialogTitle>
            <DialogDescription>
              Changez de semestre pour retrouver ses UE et son agenda. Les
              données des autres semestres restent enregistrées.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveProfile} className="space-y-4">
            <Field id="institution" label="Établissement">
              <Input
                id="institution"
                name="institution"
                defaultValue={profile?.institution}
                list="institutions"
                placeholder="Nom de votre université ou école"
                maxLength={200}
                required
              />
              <datalist id="institutions">
                <option value="Université Claude Bernard Lyon 1" />
              </datalist>
            </Field>
            <Field id="degree" label="Formation / diplôme">
              <Input
                id="degree"
                name="degree"
                defaultValue={profile?.degree}
                placeholder="Ex. Licence informatique"
                maxLength={200}
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field id="study_year" label="Niveau / année">
                <Input
                  id="study_year"
                  name="study_year"
                  defaultValue={profile?.study_year}
                  placeholder="Ex. L2, M1, BUT 3"
                  maxLength={60}
                  required
                />
              </Field>
              <Field id="academic_year" label="Année universitaire">
                <Input
                  id="academic_year"
                  name="academic_year"
                  defaultValue={profile?.academic_year}
                  pattern="[0-9]{4}-[0-9]{4}"
                  placeholder="2026-2027"
                  required
                />
              </Field>
            </div>
            <Field id="semester" label="Semestre">
              <select
                className={selectClass}
                id="semester"
                name="semester"
                defaultValue={profile?.semester || 1}
              >
                {Array.from({ length: 12 }, (_, index) => (
                  <option key={index} value={index + 1}>
                    Semestre {index + 1}
                  </option>
                ))}
              </select>
            </Field>
            <FormError notice={notice} />
            <DialogFooter>
              <Button type="submit" disabled={busy}>
                Enregistrer mon parcours
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!moduleEditor}
        onOpenChange={(open) => {
          if (!open && !busy) setModuleEditor(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {moduleEditor?.id ? "Modifier l’UE" : "Ajouter une UE"}
            </DialogTitle>
            <DialogDescription>
              Recopiez les ECTS et le coefficient indiqués dans les modalités de
              votre formation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveModule} className="space-y-4">
            <Field id="module-name" label="Nom de l’UE">
              <Input
                id="module-name"
                name="name"
                defaultValue={moduleEditor?.name}
                maxLength={200}
                required
              />
            </Field>
            <Field id="module-code" label="Code UE (facultatif)">
              <Input
                id="module-code"
                name="code"
                defaultValue={moduleEditor?.code}
                maxLength={50}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field id="module-ects" label="ECTS">
                <Input
                  id="module-ects"
                  name="ects"
                  type="number"
                  min="0"
                  max="60"
                  step="0.5"
                  defaultValue={moduleEditor?.ects ?? 0}
                  required
                />
              </Field>
              <Field id="module-coefficient" label="Coefficient de l’UE">
                <Input
                  id="module-coefficient"
                  name="coefficient"
                  type="number"
                  min="0.01"
                  max="1000"
                  step="0.01"
                  defaultValue={moduleEditor?.coefficient ?? 1}
                  required
                />
              </Field>
            </div>
            <FormError notice={notice} />
            <DialogFooter>
              <Button type="submit" disabled={busy}>
                Enregistrer l’UE
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!assessmentEditor}
        onOpenChange={(open) => {
          if (!open && !busy) setAssessmentEditor(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {assessmentEditor?.id
                ? "Modifier l’évaluation"
                : "Ajouter une évaluation"}
            </DialogTitle>
            <DialogDescription>
              Les poids doivent totaliser 100 % dans l’UE. Laissez la note vide
              si l’évaluation est à venir.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveAssessment} className="space-y-4">
            <Field id="assessment-title" label="Évaluation">
              <Input
                id="assessment-title"
                name="title"
                defaultValue={assessmentEditor?.title}
                placeholder="Ex. Contrôle continu, partiel…"
                maxLength={200}
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field id="assessment-weight" label="Poids dans l’UE (%)">
                <Input
                  id="assessment-weight"
                  name="weight"
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  defaultValue={assessmentEditor?.weight ?? 100}
                  required
                />
              </Field>
              <Field id="assessment-grade" label="Note sur 20 (facultative)">
                <Input
                  id="assessment-grade"
                  name="grade"
                  type="number"
                  min="0"
                  max="20"
                  step="0.01"
                  defaultValue={assessmentEditor?.grade ?? ""}
                />
              </Field>
            </div>
            <FormError notice={notice} />
            <DialogFooter>
              <Button type="submit" disabled={busy}>
                Enregistrer l’évaluation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!deadlineEditor}
        onOpenChange={(open) => {
          if (!open && !busy) setDeadlineEditor(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {deadlineEditor?.id
                ? "Modifier l’échéance"
                : "Ajouter une échéance"}
            </DialogTitle>
            <DialogDescription>
              Date et heure en Europe/Paris.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveDeadline} className="space-y-4">
            <Field id="deadline-title" label="Intitulé">
              <Input
                id="deadline-title"
                name="title"
                defaultValue={deadlineEditor?.title}
                maxLength={200}
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="deadline-kind" label="Type">
                <select
                  id="deadline-kind"
                  name="kind"
                  className={selectClass}
                  defaultValue={deadlineEditor?.kind || "exam"}
                >
                  <option value="exam">Examen</option>
                  <option value="assignment">Rendu</option>
                  <option value="administrative">Démarche</option>
                </select>
              </Field>
              <Field id="deadline-date" label="Date et heure (Paris)">
                <Input
                  id="deadline-date"
                  name="due_at"
                  type="datetime-local"
                  defaultValue={
                    deadlineEditor?.due_at
                      ? toParisInput(deadlineEditor.due_at)
                      : ""
                  }
                  required
                />
              </Field>
            </div>
            <Field id="deadline-location" label="Lieu (facultatif)">
              <Input
                id="deadline-location"
                name="location"
                defaultValue={deadlineEditor?.location}
                maxLength={500}
              />
            </Field>
            <Field
              id="deadline-notes"
              label="Consignes / programme (facultatif)"
            >
              <Textarea
                id="deadline-notes"
                name="notes"
                defaultValue={deadlineEditor?.notes}
                maxLength={5000}
              />
            </Field>
            <FormError notice={notice} />
            <DialogFooter>
              <Button type="submit" disabled={busy}>
                Enregistrer l’échéance
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!revision}
        onOpenChange={(open) => {
          if (!open && !busy) setRevision(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Planifier une révision</DialogTitle>
            <DialogDescription>
              Cette tâche apparaîtra aussi dans votre liste de tâches
              habituelle. Une seule tâche est liée à cette échéance.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              if (
                await run(
                  () =>
                    studentService.createRevisionTask(
                      revision!.id,
                      field(data, "title"),
                      field(data, "due_date"),
                    ),
                  "Tâche de révision créée dans vos tâches.",
                )
              )
                setRevision(null);
            }}
          >
            <Field id="revision-title" label="Tâche à accomplir">
              <Input
                id="revision-title"
                name="title"
                defaultValue={revision ? `Réviser : ${revision.title}` : ""}
                maxLength={250}
                required
              />
            </Field>
            <Field id="revision-date" label="À terminer le">
              <Input
                id="revision-date"
                name="due_date"
                type="date"
                max={
                  revision
                    ? toParisInput(revision.due_at).slice(0, 10)
                    : undefined
                }
                required
              />
            </Field>
            <FormError notice={notice} />
            <DialogFooter>
              <Button type="submit" disabled={busy}>
                Créer la tâche de révision
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!deletion}
        onOpenChange={(open) => {
          if (!open && !busy) setDeletion(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cet élément ?</DialogTitle>
            <DialogDescription>
              « {deletion?.title} » sera supprimé.
              {deletion?.table === "student_modules"
                ? " Ses évaluations seront également supprimées."
                : deletion?.table === "student_deadlines"
                  ? " Sa tâche de révision restera dans votre liste de tâches."
                  : ""}
            </DialogDescription>
          </DialogHeader>
          <FormError notice={notice} />
          <DialogFooter>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setDeletion(null)}
            >
              Conserver
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={async () => {
                if (
                  await run(
                    () =>
                      studentService.deleteRow(
                        deletion!.table,
                        deletion!.id,
                        user!.id,
                      ),
                    "Élément supprimé.",
                  )
                )
                  setDeletion(null);
              }}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
