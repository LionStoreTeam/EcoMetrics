import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "./lib/auth";

// Rutas que requieren autenticación
const protectedRoutes = [
  "/dashboard",
  "/actividades",
  "/recompensas",
  "/perfil",
  "/estadisticas",
];

// Rutas para usuarios no autenticados
const authRoutes = ["/login", "/registro"];

// Rutas de administración
const adminRoutes = ["/admin/:path*", "/admin-auth/:path*"];

// Rutas de autenticación de administradores
const adminAuthRoutes = [
  "/admin-auth/login",
  "/admin-auth/registro",
  "/admin-auth/recuperar",
];

export async function middleware(request: NextRequest) {
  const session = await getSession();
  const { pathname } = request.nextUrl;

  // Verificar si la ruta requiere autenticación
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Verificar si la ruta es para usuarios no autenticados
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Verificar si la ruta es de administración
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  // Verificar si la ruta es de autenticación de administradores
  const isAdminAuthRoute = adminAuthRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Redirigir según el estado de autenticación
  if (isProtectedRoute && !session) {
    // Redirigir a login si intenta acceder a ruta protegida sin sesión
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && session) {
    // Redirigir a dashboard si intenta acceder a login/registro con sesión
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Proteger rutas de administración
  if (isAdminRoute && (!session || session.role !== "ADMIN")) {
    // Redirigir a login de administrador si intenta acceder a ruta de admin sin ser admin
    return NextResponse.redirect(new URL("/admin-auth/login", request.url));
  }

  // Si un usuario ya está autenticado e intenta acceder a la autenticación de admin
  if (isAdminAuthRoute && session && session.role !== "ADMIN") {
    // Redirigir al dashboard normal
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
