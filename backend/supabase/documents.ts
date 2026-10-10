import type { createClient } from "@/backend/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

// Private bucket created by backend/supabase/migrations/2026-10-07-project-documents-storage.sql.
export const documentsBucket = "project-documents";

// Short-lived download links; storage policies only sign files the viewer may read.
export async function withDownloadLinks<T extends { storage_path: string }>(
  supabase: ServerClient,
  documents: T[],
): Promise<(T & { url: string | null })[]> {
  if (!documents.length) return [];
  const { data } = await supabase.storage.from(documentsBucket).createSignedUrls(
    documents.map((document) => document.storage_path),
    600,
  );
  const urls = new Map((data ?? []).map((item) => [item.path, item.signedUrl]));
  return documents.map((document) => ({ ...document, url: urls.get(document.storage_path) ?? null }));
}
