import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Simple in-memory token bucket rate limiter: max 100 requests per minute per IP.
const RATE_LIMIT = 100; // requests per window
const WINDOW_MS = 60 * 1000; // 1 minute
const ipRequests = new Map<string, number[]>();

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const now = Date.now();
    const timestamps = ipRequests.get(ip) ?? [];
    const recent = timestamps.filter((t) => now - t < WINDOW_MS);
    recent.push(now);
    ipRequests.set(ip, recent);

    if (recent.length > RATE_LIMIT) {
      return new NextResponse("Too many requests", { status: 429 });
    }

    // Prune stale entries when the cache grows to prevent memory leaks
    if (ipRequests.size > 500) {
      for (const [trackedIp, times] of ipRequests.entries()) {
        if (!times.some((t) => now - t < WINDOW_MS)) {
          ipRequests.delete(trackedIp);
        }
      }
    }
  }

  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  // Static files and generated icons/previews never need a session refresh.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|opengraph-image|icons|images).*)"],
};
