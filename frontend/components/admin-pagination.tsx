import Link from "next/link";
import { adminPageSize } from "@/lib/pagination";

// Previous/next links for long admin lists; hidden when everything fits on one page.
// Any active search or filter (params) is kept when moving between pages.
export function AdminPagination({
  page,
  total,
  basePath,
  params = {},
}: {
  page: number;
  total: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / adminPageSize));
  if (pages <= 1 && page <= 1) return null;
  const href = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
    if (target > 1) query.set("page", String(target));
    const search = query.toString();
    return search ? `${basePath}?${search}` : basePath;
  };
  return (
    <nav className="admin-pagination" aria-label="Pages">
      {page > 1 ? <Link href={href(Math.min(page - 1, pages))}>← Newer</Link> : <span aria-hidden="true" />}
      <span>
        Page {page} of {pages}
      </span>
      {page < pages ? <Link href={href(page + 1)}>Older →</Link> : <span aria-hidden="true" />}
    </nav>
  );
}
