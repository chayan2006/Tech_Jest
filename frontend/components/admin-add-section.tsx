import type { ReactNode } from "react";

// A "create" form that stays open while its list is empty, and folds away behind one line once there is
// something to look at, so long admin pages stay short on phones.
export function AdminAddSection({ label, open, children }: { label: string; open: boolean; children: ReactNode }) {
  return (
    <details className="admin-add" open={open}>
      <summary>{label}</summary>
      {children}
    </details>
  );
}
