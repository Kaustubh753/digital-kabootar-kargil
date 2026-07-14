/**
 * Minimal, dependency-free CSV generation for the admin export (PRD §5.3).
 * RFC-4180-ish: quote fields containing comma/quote/newline; escape quotes by
 * doubling. A leading `'` neutralises spreadsheet formula injection.
 */

function escapeCell(value: unknown): string {
  let s = value == null ? "" : String(value);
  // Guard against CSV formula injection in Excel/Sheets.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(
  headers: string[],
  rows: Array<Array<unknown>>,
): string {
  const lines = [headers.map(escapeCell).join(",")];
  for (const row of rows) lines.push(row.map(escapeCell).join(","));
  return lines.join("\r\n");
}
