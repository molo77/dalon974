/**
 * Utilitaires pour la gestion des dates avec le fuseau horaire de La Réunion
 */

/**
 * Formate une date avec le fuseau horaire de La Réunion
 * @param date - Date à formater
 * @param options - Options de formatage (optionnel)
 * @returns Date formatée en heure de La Réunion
 */
export function formatDateReunion(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '-';
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Indian/Reunion',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };

  return dateObj.toLocaleString('fr-FR', { ...defaultOptions, ...options });
}

/**
 * Formate une heure avec le fuseau horaire de La Réunion
 * @param date - Date à formater
 * @param options - Options de formatage (optionnel)
 * @returns Heure formatée en heure de La Réunion
 */
export function formatTimeReunion(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '-';
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Indian/Reunion',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };

  return dateObj.toLocaleTimeString('fr-FR', { ...defaultOptions, ...options });
}

/**
 * Formate une date courte avec le fuseau horaire de La Réunion
 * @param date - Date à formater
 * @returns Date courte formatée en heure de La Réunion
 */
export function formatDateShortReunion(date: Date | string | number): string {
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '-';
  }

  return dateObj.toLocaleDateString('fr-FR', {
    timeZone: 'Indian/Reunion',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Formate une date pour l'affichage relatif (ex: "il y a 2 heures")
 * @param date - Date à formater
 * @returns Texte relatif en français
 */
export function formatRelativeTime(date: Date | string | number): string {
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '-';
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'à l\'instant';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `il y a ${days} jour${days > 1 ? 's' : ''}`;
  }
}
