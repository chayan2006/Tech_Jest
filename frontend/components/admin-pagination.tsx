import Link from "next/link";
import { adminPageSize } from "@/lib/pagination";

// Previous/next links for long admin lists; hidden when everything fits on one page.
export function AdminPagination({ page, total, basePath }: { page: number; total: number; basePath: string }) {
  const pages = Math.max(1, Math.ceil(total / adminPageSize));
  if (pages <= 1 && page <= 1) return null;
  const href = (target: number) => (target <= 1 ? basePath : `${basePath}?page=${target}`);
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
