/** Read a stable, explicitly ordered query without silently losing rows to API limits. */
export async function readAllPages<T>(
  read: (
    from: number,
    to: number,
  ) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
  maxRows = 100_000,
): Promise<T[]> {
  const pageSize = 500;
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const result = await read(from, from + pageSize - 1);
    if (result.error) throw new Error(result.error.message);
    const page = result.data ?? [];
    if (page.length > pageSize || rows.length + page.length > maxRows)
      throw new Error(
        "Trop de données à charger. Aucun résultat partiel n’a été affiché.",
      );
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}
