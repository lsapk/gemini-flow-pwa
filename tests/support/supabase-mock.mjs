export function createClient(...args) {
  return globalThis.__supabaseMock(...args);
}
