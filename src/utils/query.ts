import { getTableColumns } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

export function getSelectedColumns<T extends PgTable>(table: T, fieldsQuery?: unknown) {
  if (!fieldsQuery || typeof fieldsQuery !== "string") {
    return undefined;
  }

  const requested = fieldsQuery.split(",").map((f) => f.trim()).filter(Boolean);
  if (requested.length === 0) {
    return undefined;
  }

  const tableCols = getTableColumns(table) as Record<string, any>;
  const lookup: Record<string, string> = {};

  for (const [key, col] of Object.entries(tableCols)) {
    lookup[key.toLowerCase()] = key;
    if (col && typeof col.name === "string") {
      lookup[col.name.toLowerCase()] = key;
      lookup[col.name.replace(/_/g, "").toLowerCase()] = key;
    }
  }

  const selection: Record<string, any> = {};
  for (const field of requested) {
    const matchedKey = lookup[field.toLowerCase()];
    if (matchedKey && tableCols[matchedKey]) {
      selection[matchedKey] = tableCols[matchedKey];
    }
  }

  return Object.keys(selection).length > 0 ? selection : undefined;
}
