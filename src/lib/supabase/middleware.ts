import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

const ADMIN_ROUTES = ['/ventas', '/clientes', '/inventario', '/caja', '/dashboard']
const ADMIN_ONLY_ROUTES = ['/gastos', '/reportes', '/configuracion', '/mercaderia']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  const isAuthRoute = pathname.startsWith('/iniciar-sesion') || pathname.startsWith('/registro')
  const isStaffRoute = ADMIN_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))
  const isAdminOnlyRoute = ADMIN_ONLY_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))
  const isProtectedRoute = false

  if (!user) {
    if (isStaffRoute || isAdminOnlyRoute || isProtectedRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/iniciar-sesion'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  if (isAuthRoute || isStaffRoute || isAdminOnlyRoute) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = (profileData as { role: string } | null)?.role

    if (isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = (role === 'admin' || role === 'staff') ? '/ventas' : '/'
      return NextResponse.redirect(url)
    }

    if (role !== 'admin' && role !== 'staff') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    if (isAdminOnlyRoute && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/ventas'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
