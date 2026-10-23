export const adminPageSize = 25;

// "?page=3" → 3. Anything missing, malformed, or below 1 is the first page.
export function pageFromParam(value: string | string[] | undefined): number {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(page) && page > 1 ? Math.min(page, 100000) : 1;
}

// Inclusive row range for Supabase's .range(from, to).
export function pageRange(page: number, pageSize = adminPageSize): [number, number] {
  const from = (page - 1) * pageSize;
  return [from, from + pageSize - 1];
}

// "?q=..." → a search term that is safe inside a quoted PostgREST filter value: trimmed, at most
// 100 characters, without quotes, backslashes, or the % and * wildcards. Empty means no search.
export function searchFromParam(value: string | string[] | undefined): string {
  const text = Array.isArray(value) ? value[0] : value;
  return (text ?? "")
    .replace(/["\\%*]/g, "")
    .trim()
    .slice(0, 100);
}
