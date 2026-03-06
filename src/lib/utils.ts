
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
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
 * Formate les minutes en heures et minutes
 */
export function formatMinutesToHoursMinutes(minutes: number): string {
  if (isNaN(minutes) || minutes < 0) {
    return '0 h 0 min';
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (hours === 0) {
    return `${remainingMinutes} min`;
  } else {
    return `${hours} h ${remainingMinutes} min`;
  }
}
