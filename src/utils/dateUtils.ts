/**
 * Returns the local date as YYYY-MM-DD string, avoiding timezone shift issues
 * that occur with toISOString().split('T')[0] (which converts to UTC first).
 */
export const toLocalDateKey = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
