"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/backend/supabase/client";
import { BellIcon } from "@/frontend/components/icons";
import { ProfileBadge } from "@/frontend/components/profile-badge";

// Fired by the message thread after it marks messages read, so the bell recounts.
export const UNREAD_EVENT = "techjest-unread-changed";

type Account = { id: string; email?: string; name?: string; avatarUrl?: string; admin: boolean };
type AccountState = { account: Account | null; ready: boolean; unread: number };

const AccountContext = createContext<AccountState>({ account: null, ready: false, unread: 0 });

function toAccount(user: User): Account {
  const metadata = user.user_metadata ?? {};
  const name = typeof metadata.full_name === "string" ? metadata.full_name : metadata.name;
  return {
    id: user.id,
    email: user.email,
    name: typeof name === "string" ? name : undefined,
    avatarUrl: typeof metadata.avatar_url === "string" ? metadata.avatar_url : undefined,
    admin: user.app_metadata?.role === "admin",
  };
}

// Who is signed in, for the header and forms only. Public pages are cached and shared by every visitor,
// so the server cannot render this into them. The session read here only decides what to show; pages,
// API routes, and row-level security still check the verified token for everything that matters.
export function AccountProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<AccountState>({ account: null, ready: false, unread: 0 });

  useEffect(() => {
    // Fires once straight away with the current session, then on every sign-in and sign-out.
    const {
      data: { subscription },
    } = createClient().auth.onAuthStateChange((_event, session) => {
      setState((current) => ({
        account: session?.user ? toAccount(session.user) : null,
        ready: true,
        unread: session?.user ? current.unread : 0,
      }));
    });
    return () => subscription.unsubscribe();
  }, []);

  const accountId = state.account?.id;
  const admin = state.account?.admin ?? false;
  // Recounted on every page change, like the server-rendered bell it replaces.
  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;
    const supabase = createClient();
    async function count() {
      const [{ data: rows }, { count: notifications }] = await Promise.all([
        supabase.rpc("unread_message_counts"),
        admin
          ? supabase.from("admin_notifications").select("id", { count: "exact", head: true }).is("read_at", null)
          : Promise.resolve({ count: 0 }),
      ]);
      const messages = ((rows ?? []) as { unread: number | string }[]).reduce(
        (sum, row) => sum + Number(row.unread),
        0,
      );
      if (!cancelled) setState((current) => ({ ...current, unread: messages + (notifications ?? 0) }));
    }
    void count();
    window.addEventListener(UNREAD_EVENT, count);
    return () => {
      cancelled = true;
      window.removeEventListener(UNREAD_EVENT, count);
    };
  }, [accountId, admin, pathname]);

  return <AccountContext.Provider value={state}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  return useContext(AccountContext);
}

export function AccountBadge() {
  const { account } = useAccount();
  if (!account) return null;
  return <ProfileBadge email={account.email} name={account.name} avatarUrl={account.avatarUrl} admin={account.admin} />;
}

export function NotificationBell() {
  const { account, unread } = useAccount();
  if (!account) return null;
  // The link is named by its visible text, so voice-control users can say what they see.
  return (
    <Link className="message-notification" href={account.admin ? "/admin/notifications" : "/messages"}>
      <BellIcon />
      {unread > 0 && <b aria-hidden="true">{unread > 99 ? "99+" : unread}</b>}
      <span className="message-notification-label">
        {unread ? (
          <>
            <span className="visually-hidden">Notifications: </span>
            {unread} new
          </>
        ) : (
          "Notifications"
        )}
      </span>
    </Link>
  );
}
