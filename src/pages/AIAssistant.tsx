import { useState, useEffect, useRef, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUp, Sparkles, Trash2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAIUsage } from "@/utils/aiLimits";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Markdown } from "@/components/Markdown";
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}
const starters = [
  "Aide-moi à décomposer un projet en petites étapes.",
  "Comment organiser mes révisions cette semaine ?",
  "Comment avancer quand je manque de motivation ?",
];
export default function AIAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [includeJournal, setIncludeJournal] = useState(false),
    [personalize, setPersonalize] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const locked = useRef(false);
  const client = useQueryClient();
  const usage = useQuery({
    queryKey: ["ai-usage", user?.id],
    queryFn: async () => {
      const data = await getAIUsage();
      if (!data) throw new Error("Quota indisponible.");
      return data;
    },
  });
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length, busy]);
  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || locked.current || !usage.data?.remaining) return;
    locked.current = true;
    setBusy(true);
    setError("");
    const text = input.trim();
    const history = messages
      .slice(-10)
      .map(({ role, content }) => ({ role, content: content.slice(0, 4000) }));
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content: text },
    ]);
    setInput("");
    try {
      const { data, error: problem } = await supabase.functions.invoke(
        personalize || includeJournal ? "gemini-chat-enhanced" : "gemini-chat",
        {
          body: {
            message: text,
            context: {
              recent_messages: history,
              analysis_mode: personalize,
              include_journal: includeJournal,
            },
          },
        },
      );
      if (problem) {
        let code: string | undefined;
        if (problem.context instanceof Response) {
          try {
            code = (await problem.context.json()).code;
          } catch {
            /* generic error below */
          }
        }
        throw new Error(
          code === "AI_CREDITS_EXHAUSTED"
            ? "Votre quota est épuisé. Consultez vos crédits pour connaître le prochain renouvellement."
            : "L’assistant est indisponible. Vérifiez votre connexion ou réessayez plus tard.",
        );
      }
      if (!data || typeof data.response !== "string" || !data.response.trim())
        throw new Error("La réponse reçue est vide. Réessayez.");
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: data.response },
      ]);
    } catch (problem) {
      setError(
        problem instanceof Error ? problem.message : "La demande a échoué.",
      );
      setInput(text);
    } finally {
      locked.current = false;
      setBusy(false);
      await client.invalidateQueries({ queryKey: ["ai-usage", user?.id] });
    }
  };
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="page-intro flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">PENSEZ À VOIX HAUTE</p>
          <h1 className="page-title">
            Votre assistant<span className="text-primary">.</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Des idées concrètes pour trouver votre prochain pas.
          </p>
        </div>
        <Link
          to="/credits"
          className="rounded-lg border bg-card px-3 py-2 text-xs text-muted-foreground"
        >
          {usage.isError
            ? "Quota indisponible"
            : usage.isLoading
              ? "Vérification des crédits…"
              : `${usage.data?.remaining} crédits disponibles`}
        </Link>
      </div>
      <section className="assistant-surface panel flex min-h-[480px] flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <span className="flex items-center gap-2 text-xs font-medium">
            <Sparkles size={15} className="text-primary" />
            Deepflow IA
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={!messages.length || busy}
            onClick={() => {
              setMessages([]);
              setError("");
            }}
            className="gap-2 text-xs"
          >
            <Trash2 size={13} />
            Effacer
          </Button>
        </div>
        <div
          className="max-h-[55dvh] flex-1 space-y-5 overflow-y-auto p-5 md:p-8"
          role="log"
          aria-label="Conversation avec l’assistant"
          aria-live="polite"
        >
          {messages.length === 0 ? (
            <div className="py-5">
              <div className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles size={22} strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">
                Par où voulez-vous commencer ?
              </h2>
              <p className="mb-7 mt-2 text-sm text-muted-foreground">
                Un projet flou, une semaine chargée ou simplement besoin de
                recul.
              </p>
              <div className="flex flex-col gap-2">
                {starters.map((text) => (
                  <button
                    key={text}
                    onClick={() => setInput(text)}
                    className="rounded-xl border px-4 py-3 text-left text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <article
                key={message.id}
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[90%] rounded-2xl bg-primary/10 px-5 py-4 text-sm"
                    : "mr-auto max-w-full py-2 text-sm"
                }
              >
                <span className="sr-only">
                  {message.role === "user" ? "Vous : " : "Assistant : "}
                </span>
                {message.role === "assistant" ? (
                  <Markdown content={message.content} />
                ) : (
                  <p className="whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                )}
              </article>
            ))
          )}
          {busy && (
            <p role="status" className="text-sm text-muted-foreground">
              L’assistant prépare sa réponse…
            </p>
          )}
          <div ref={endRef} />
        </div>
        <div className="border-t px-5 py-4">
          <div className="mb-4 flex flex-col gap-2">
            <Label className="flex items-start gap-2 text-xs font-normal leading-relaxed">
              <input
                type="checkbox"
                checked={personalize}
                disabled={busy}
                onChange={(event) => setPersonalize(event.target.checked)}
                className="mt-0.5"
              />
              Inclure mes tâches, habitudes, objectifs et sessions pour
              personnaliser la réponse.
            </Label>
            <Label className="flex items-start gap-2 text-xs font-normal leading-relaxed">
              <input
                type="checkbox"
                checked={includeJournal}
                disabled={busy}
                onChange={(event) => setIncludeJournal(event.target.checked)}
                className="mt-0.5"
              />
              J’autorise aussi l’envoi de mon journal et de mes réflexions au
              fournisseur IA pour cette conversation.
            </Label>
          </div>
          {error && (
            <p role="alert" className="mb-3 text-sm text-destructive">
              {error}
            </p>
          )}
          {usage.isError && (
            <p role="alert" className="mb-3 text-sm text-destructive">
              Le quota ne peut pas être vérifié.{" "}
              <button
                onClick={() => void usage.refetch()}
                className="underline"
              >
                Actualiser
              </button>
            </p>
          )}
          <form onSubmit={send} className="assistant-compose relative">
            <Textarea
              name="message"
              aria-label="Votre message à l’assistant"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={4000}
              rows={2}
              placeholder="Une idée, une question, un projet…"
              className="resize-none pr-14"
              disabled={busy}
            />
            <Button
              type="submit"
              size="icon"
              aria-label="Envoyer le message"
              disabled={busy || !input.trim() || !usage.data?.remaining}
              className="absolute bottom-2 right-2 rounded-lg"
            >
              <ArrowUp size={18} />
            </Button>
          </form>
        </div>
      </section>
      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        1 crédit par réponse réussie. L’IA peut se tromper ; vérifiez ses
        conseils. La conversation reste en mémoire de cet onglet et n’est pas
        enregistrée sur cet appareil.
      </p>
    </div>
  );
}
