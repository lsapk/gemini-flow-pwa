/** Quote CSV fields and neutralize spreadsheet formulas, including control prefixes. */
export function encodeCsv(rows: readonly (readonly unknown[])[]): string {
  return rows
    .map((row) =>
      row
        .map((value) => {
          const raw = String(value ?? "");
          let start = 0;
          while (
            start < raw.length &&
            (raw.charCodeAt(start) <= 32 || /\s/u.test(raw[start]))
          )
            start++;
          const safe =
            ["=", "+", "@", "-"].includes(raw[start]) ||
            ["\t", "\r", "\n"].includes(raw[0])
              ? `'${raw}`
              : raw;
          return `"${safe.replace(/"/g, '""')}"`;
        })
        .join(","),
    )
    .join("\r\n");
}
