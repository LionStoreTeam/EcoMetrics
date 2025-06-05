import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "./lib/auth";

// Rutas que requieren autenticación general de usuario
const protectedUserRoutes = [
  "/dashboard", //
  "/actividades", //
  "/recompensas", //
  "/badges", //
  "/scores", //
  "/mapa", //
  "/perfil", //
  "/estadisticas", //
  "/educacion", // La página principal de educación es protegida, pero las de creación/edición tienen reglas más específicas
];

// Rutas de creación/edición de contenido educativo (requieren tipo SCHOOL o GOVERNMENT)
const educationCreatorRoutes = [
  "/educacion/articulos/nuevo", //
  "/educacion/articulos/editar", // Cubrirá /editar/[id] con startsWith
  "/educacion/visual/nuevo",
  "/educacion/visual/editar", // Cubrirá /editar/[id] con startsWith
  "/educacion/videos/nuevo", // Añadido para consistencia, si existe o se planea
  "/educacion/videos/editar", // Añadido para consistencia, si existe o se planea
];

// Rutas para usuarios no autenticados
const authRoutes = ["/login", "/registro"];

// Rutas de administración
const adminRoutes = ["/admin/:path*", "/admin-auth/:path*"];

// Rutas de autenticación de administradores
const adminAuthRoutes = [
  "/admin/",
  "/admin-auth/login",
  "/admin-auth/registro",
  "/admin-auth/recuperar",
];

export async function middleware(request: NextRequest) {
  const session = await getSession();
  const { pathname } = request.nextUrl;

  // Verificar si la ruta requiere autenticación
  const isProtectedRoute = protectedUserRoutes.some((route) =>
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

  // 3. Proteger rutas de creación/edición de contenido educativo
  const isEducationCreatorRoute = educationCreatorRoutes.some((route) =>
    pathname.startsWith(route)
  );
  if (isEducationCreatorRoute) {
    if (!session) {
      // Si no hay sesión, redirigir a login (aunque la regla anterior ya podría cubrir esto)
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    // Si hay sesión, verificar el tipo de usuario
    if (!(session.userType === "SCHOOL" || session.userType === "GOVERNMENT")) {
      // Redirigir a la página principal de educación con un mensaje (opcional)
      // O al dashboard si se prefiere.
      const deniedUrl = new URL("/educacion", request.url);
      // Podrías añadir un query param para mostrar un toast en la página /educacion,
      // pero el toast desde el middleware no es directo.
      // deniedUrl.searchParams.set("error", "access_denied_creator");
      return NextResponse.redirect(deniedUrl);
    }
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

// --------------------------------------------------------- //

// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { getSession } from "./lib/auth"; //

// // Rutas que requieren autenticación general de usuario
// const protectedUserRoutes = [
//   "/dashboard", //
//   "/actividades", //
//   "/recompensas", //
//   "/badges", //
//   "/scores", //
//   "/mapa", //
//   "/perfil", //
//   "/estadisticas", //
//   "/educacion", // La página principal de educación es protegida, pero las de creación/edición tienen reglas más específicas
// ];

// // Rutas de creación/edición de contenido educativo (requieren tipo SCHOOL o GOVERNMENT)
// const educationCreatorRoutes = [
//   "/educacion/articulos/nuevo", //
//   "/educacion/articulos/editar", // Cubrirá /editar/[id] con startsWith
//   "/educacion/visual/nuevo",
//   "/educacion/visual/editar", // Cubrirá /editar/[id] con startsWith
//   "/educacion/videos/nuevo", // Añadido para consistencia, si existe o se planea
//   "/educacion/videos/editar", // Añadido para consistencia, si existe o se planea
// ];

// // Rutas para usuarios no autenticados (públicas o de autenticación)
// const authRoutes = ["/login", "/registro"]; //

// // Rutas de administración (requieren rol ADMIN)
// const adminPanelRoutes = ["/admin"]; // Para /admin y /admin/*

// // Rutas de autenticación de administradores (públicas si no hay sesión de admin)
// const adminAuthRoutes = [
//   "/admin-auth/login", //
//   "/admin-auth/registro", //
//   "/admin-auth/recuperar", //
// ];

// export async function middleware(request: NextRequest) {
//   const session = await getSession();
//   const { pathname } = request.nextUrl;

//   // 1. Redirigir a dashboard si un usuario autenticado intenta acceder a /login o /registro
//   if (session && authRoutes.some((route) => pathname.startsWith(route))) {
//     return NextResponse.redirect(new URL("/dashboard", request.url));
//   }

//   // 2. Proteger rutas de usuario general
//   const isProtectedUserRoute = protectedUserRoutes.some((route) =>
//     pathname.startsWith(route)
//   );
//   if (isProtectedUserRoute && !session) {
//     const url = new URL("/login", request.url);
//     url.searchParams.set("callbackUrl", pathname);
//     return NextResponse.redirect(url);
//   }

//   // 3. Proteger rutas de creación/edición de contenido educativo
//   const isEducationCreatorRoute = educationCreatorRoutes.some((route) =>
//     pathname.startsWith(route)
//   );
//   if (isEducationCreatorRoute) {
//     if (!session) {
//       // Si no hay sesión, redirigir a login (aunque la regla anterior ya podría cubrir esto)
//       const url = new URL("/login", request.url);
//       url.searchParams.set("callbackUrl", pathname);
//       return NextResponse.redirect(url);
//     }
//     // Si hay sesión, verificar el tipo de usuario
//     if (!(session.userType === "SCHOOL" || session.userType === "GOVERNMENT")) {
//       // Redirigir a la página principal de educación con un mensaje (opcional)
//       // O al dashboard si se prefiere.
//       const deniedUrl = new URL("/educacion", request.url);
//       // Podrías añadir un query param para mostrar un toast en la página /educacion,
//       // pero el toast desde el middleware no es directo.
//       // deniedUrl.searchParams.set("error", "access_denied_creator");
//       return NextResponse.redirect(deniedUrl);
//     }
//   }

//   // 4. Proteger rutas del panel de administración
//   const isAdminPanelRoute = adminPanelRoutes.some(
//     (route) => pathname.startsWith(route) && route !== "/admin-auth"
//   ); // /admin, /admin/*
//   if (isAdminPanelRoute) {
//     if (!session) {
//       // No hay sesión, redirigir a login de admin
//       return NextResponse.redirect(new URL("/admin-auth/login", request.url));
//     }
//     if (session.role !== "ADMIN") {
//       // Sesión existe pero no es ADMIN
//       return NextResponse.redirect(new URL("/dashboard", request.url)); // Redirigir al dashboard de usuario
//     }
//     // Si es ADMIN, permitir acceso
//   }

//   // 5. Manejo de rutas de autenticación de admin (/admin-auth/*)
//   const isAdminAuthSubRoute = adminAuthRoutes.some((route) =>
//     pathname.startsWith(route)
//   );
//   if (isAdminAuthSubRoute && session) {
//     if (session.role === "ADMIN") {
//       // Si un ADMIN ya logueado intenta ir a /admin-auth/login
//       return NextResponse.redirect(new URL("/admin", request.url));
//     }
//     // Si un usuario normal logueado intenta ir a /admin-auth/*, redirigir a su dashboard
//     // (Esto previene que un usuario normal vea las páginas de login/registro de admin)
//     return NextResponse.redirect(new URL("/dashboard", request.url));
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - api (API routes)
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      * - / (la página de inicio pública) - si es necesario permitirla sin login
//      * - /terminos, /privacidad, etc. (páginas legales públicas)
//      */
//     "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|logo.png|hero.svg|report-analysis.svg|global-warming.svg).*)",
//   ],
// };
