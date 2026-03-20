/**
 * Minimal CSV parser and serialiser — no dependencies.
 * Handles RFC 4180: quoted fields, embedded commas, escaped quotes.
 */

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

// ─── Serialise ────────────────────────────────────────────────────────────────

function escapeField(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  // Wrap in quotes if the value contains comma, double-quote, or newline
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function stringifyCSV(rows: Record<string, unknown>[], columns: string[]): string {
  const lines: string[] = [columns.join(",")];
  for (const row of rows) {
    lines.push(columns.map((col) => escapeField(row[col])).join(","));
  }
  return lines.join("\r\n");
}

// ─── Parse ────────────────────────────────────────────────────────────────────

function parseLine(line: string): string[] {
  const fields: string[] = [];
  let i = 0;
  let field = "";
  let inQuotes = false;

  while (i < line.length) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        // Peek ahead — escaped quote ("") or end of quoted field
        if (line[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ",") {
        fields.push(field);
        field = "";
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }
  fields.push(field);
  return fields;
}

export function parseCSV(text: string): Record<string, string>[] {
  if (!text.trim()) return [];

  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];

  const headers = parseLine(lines[0]).map((h) => h.trim());
  const result: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (values[j] ?? "").trim();
    }
    result.push(row);
  }

  return result;
}
