import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "../../types/database";

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: claimsData } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(claimsData?.claims?.sub);
  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isProtected = pathname === "/assistant" || pathname.startsWith("/assistant/") || pathname === "/projects" || pathname.startsWith("/projects/") || pathname === "/documents" || pathname.startsWith("/documents/") || pathname === "/api/chat" || pathname.startsWith("/api/documents") || pathname === "/api/project-documents" || pathname.startsWith("/api/project-documents/") || pathname === "/api/projects" || pathname.startsWith("/api/projects/") || pathname === "/api/rag/retrieve";

  let destination: string | null = null;
  if (pathname === "/") {
    destination = isAuthenticated ? "/assistant" : "/login";
  } else if (isProtected && !isAuthenticated) {
    destination = "/login";
  } else if (isAuthPage && isAuthenticated) {
    destination = "/assistant";
  }

  if (destination) {
    const redirectResponse = NextResponse.redirect(new URL(destination, request.url));
    copyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  return supabaseResponse;
}
