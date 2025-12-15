import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public routes
  const publicRoutes = ["/", "/auth/login", "/auth/sign-up", "/auth/sign-up-success", "/auth/error"]
  const isPublicRoute = publicRoutes.some((route) => request.nextUrl.pathname === route)

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users from auth pages to dashboard
  if (user && request.nextUrl.pathname.startsWith("/auth/")) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    const url = request.nextUrl.clone()
    url.pathname = profile?.role === "teacher" ? "/teacher" : "/student"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
