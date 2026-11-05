import { supabase } from "@/integrations/supabase/client";

export async function requestAI(
  message: string,
  includeJournal = false,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke(
    "gemini-chat-enhanced",
    {
      body: {
        message,
        context: { analysis_mode: true, include_journal: includeJournal },
      },
    },
  );
  if (error) {
    const status =
      error.context instanceof Response ? error.context.status : undefined;
    if (status === 429)
      throw new Error(
        "Vos crédits IA du jour sont épuisés. Consultez la page Crédits IA.",
      );
    if (status === 401)
      throw new Error(
        "Votre session a expiré. Reconnectez-vous pour continuer.",
      );
    throw new Error(
      "L’analyse IA est indisponible. Vérifiez votre connexion et la configuration du service.",
    );
  }
  if (data?.error || typeof data?.response !== "string")
    throw new Error("Aucune réponse IA valide n’a été reçue.");
  return data.response;
}
