
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/integrations/supabase/client";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Vérifie si l'application est en mode hors ligne
 */
export function isOffline() {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

/**
 * Génère un ID unique pour le suivi des éléments hors ligne
 */
export function generateUniqueId() {
  return 'offline_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Formate une date en fonction de la langue et du format d'horloge
 */
export function formatDate(date: Date | string | null, language = 'fr', clockFormat = '24h') {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  
  // Ajouter le format d'heure si nécessaire
  if (clockFormat === '24h') {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hour12 = false;
  } else if (clockFormat === '12h') {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hour12 = true;
  }
  
  return new Intl.DateTimeFormat(language, options).format(dateObj);
}

/**
 * Installe et configure le compte administrateur lors du démarrage
 */
export async function setupAdminAccount() {
  try {
    // Vérifier si l'utilisateur est connecté
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user?.email === 'deepflow.ia@gmail.com') {
      // Appeler la fonction Edge qui configurera l'utilisateur comme admin
      const { error } = await supabase.functions.invoke('setup-admin');
      
      if (error) {
        console.error("Erreur lors de la configuration du compte administrateur:", error);
      } else {
        console.log("Compte administrateur configuré avec succès");
      }
    }
  } catch (error) {
    console.error("Erreur lors de la vérification du compte administrateur:", error);
  }
}

// Appeler cette fonction au démarrage de l'application
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user?.email === 'deepflow.ia@gmail.com') {
      setupAdminAccount();
    }
  });
}
