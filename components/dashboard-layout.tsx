

"use client";

import React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Leaf, Map, User, LogOut, Menu, X, LayoutDashboard, BarChart2, Medal, Trophy, Bell, Gift } from "lucide-react"; // Añadido Bell y Gift (si no estaba)
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import toast from "react-hot-toast";

import { UserProfileData, UserStats } from "@/types/types"; // Asumo que UserProfileBadge está en types.ts
import LevelUserCard from "./LevelUserCard";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Interfaz para la respuesta de la API de notificaciones (solo necesitamos el contador aquí)
interface NotificationsSummary {
  unreadCount: number;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  // const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null); // No parece usarse en este layout
  const [profile, setProfile] = useState<UserProfileData | null>(null); // Inicializar como null para manejar mejor el estado de carga
  const [unreadNotifications, setUnreadNotifications] = useState(0); // Estado para notificaciones

  const [stats, setStats] = useState<UserStats>({
    totalPoints: 0,
    level: 1,
    activityCount: 0,
    recentActivities: [],
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true); // Iniciar carga
      try {
        const userDataResponse = await fetch("/api/profile");
        if (!userDataResponse.ok) {
          if (userDataResponse.status === 401) { // Manejar caso de no autorizado
            toast.error("Sesión inválida. Por favor, inicia sesión de nuevo.");
            router.push("/login");
            return; // Salir temprano si no está autorizado
          }
          throw new Error("Error al obtener perfil de usuario");
        }
        const userData: UserProfileData = await userDataResponse.json();
        setProfile(userData); // Establecer perfil

        // Fetch notificaciones no leídas solo si el perfil se cargó correctamente
        if (userData && userData.id) { // Asegurarse que userData y userData.id existan
          const notificationsResponse = await fetch("/api/notifications");
          if (notificationsResponse.ok) {
            const notificationsData: NotificationsSummary = await notificationsResponse.json();
            setUnreadNotifications(notificationsData.unreadCount || 0);
          } else {
            console.warn("No se pudieron cargar las notificaciones no leídas para el layout.");
            // No mostrar toast de error aquí para no ser intrusivo, solo loguear
          }
        }

      } catch (error) {
        console.error("Error al cargar datos iniciales en layout:", error);
        // No redirigir aquí para evitar bucles si la página de login también usa este layout
        // o si hay errores intermitentes. El estado !profile se usará para mostrar un loader.
      } finally {
        setIsLoading(false); // Finalizar carga
      }
    };

    fetchInitialData();
  }, [router, pathname]); // Dependencia en pathname para re-fetch notificaciones al navegar (opcional)

  useEffect(() => {
    if (!profile) return; // Solo buscar estadísticas si el perfil está cargado

    const fetchUserStats = async () => {
      try {
        // No es necesario setIsLoading aquí si el loader principal ya está activo
        const statsResponse = await fetch("/api/stats");
        if (!statsResponse.ok) throw new Error("Error al obtener estadísticas");
        const statsData = await statsResponse.json();

        const activitiesResponse = await fetch("/api/activities?limit=3");
        if (!activitiesResponse.ok) throw new Error("Error al obtener actividades");
        const activitiesData = await activitiesResponse.json();

        setStats({
          totalPoints: statsData.totalPoints || 0,
          level: profile.level || statsData.level || 1,
          activityCount: statsData.activityCount || 0,
          recentActivities: activitiesData.activities || [],
        });
      } catch (error) {
        console.error("Error al cargar estadísticas del dashboard:", error);
      }
    };
    fetchUserStats();
  }, [profile]); // Depender del perfil para cargar estadísticas

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        toast.success("Has cerrado sesión correctamente");
        router.push("/");
      } else {
        toast.error("Error al cerrar sesión");
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast.error("No se pudo cerrar sesión");
    }
  };

  const getInitials = (name: string = "") => {
    return name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "U";
  };

  // Loader de página completa mientras se carga el perfil esencial
  if (isLoading && !profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          <Leaf className="h-16 w-16 text-green-600 mb-4 animate-bounce" />
          <p className="text-lg font-semibold text-gray-700">Cargando EcoTrack MX...</p>
          <div className="mt-2 w-24 h-2 bg-green-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-600 animate-pulse-fast" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header para móviles */}
      <header className="bg-white py-3 px-4 flex justify-between items-center lg:hidden border- shadow-sm">
        <Link href="/dashboard" className="flex items-center">
          <Leaf className="h-6 w-6 text-green-600 mr-2" />
          <span className="text-xl font-bold text-gray-800">EcoTrack MX</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/perfil#notifications_tab" passHref> {/* Enlace a la pestaña de notificaciones del perfil */}
            <Button variant="ghost" size="icon" className="relative text-gray-600">
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-0.5 right-0.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-white border-px"></span>
                </span>
              )}
              <span className="sr-only">Notificaciones</span>
            </Button>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-600">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px] bg-white p-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-2">
                    <Leaf className="h-6 w-6 text-green-600" />
                    <span className="text-xl font-bold text-gray-800">EcoTrack MX</span>
                  </div>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-600">
                      <span className="sr-only">Cerrar menú</span>
                    </Button>
                  </SheetTrigger>
                </div>

                {/* Añade el SheetTitle aquí */}
                <SheetTitle className="sr-only">Menú de Navegación</SheetTitle>

                {/* Añade el SheetDescription aquí */}
                <SheetDescription className="sr-only">
                  Menú de navegación principal de la aplicación EcoTrack MX.
                </SheetDescription>
                {profile && (
                  <div className="flex flex-col items-center p-4 border-b ">
                    <Avatar className="h-20 w-20 mb-3">
                      <AvatarImage src={profile.profile?.publicAvatarDisplayUrl || ""} alt={profile.name || "Avatar"} />
                      <AvatarFallback className="text-xl bg-green-100 text-green-800">
                        {getInitials(profile.name)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-medium text-gray-800">{profile.name}</p>
                    <p className="text-sm text-gray-500">{profile.email}</p>
                    <div className="mt-2 flex items-center justify-center space-x-1">
                      <span className="bg-blue-700 text-blue-50 text-xs px-2 py-1 rounded-full">Actividades: {stats.activityCount}</span>
                    </div>
                  </div>
                )}
                <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                  <MobileNavItem href="/dashboard" icon={<LayoutDashboard className="h-5 w-5" />} label="Dashboard" active={pathname === "/dashboard"} />
                  <MobileNavItem href="/estadisticas" icon={<BarChart2 className="h-5 w-5" />} label="Estadísticas" active={pathname === "/estadisticas"} />
                  <MobileNavItem href="/actividades" icon={<Leaf className="h-5 w-5" />} label="Actividades" active={pathname === "/actividades"} />
                  <MobileNavItem href="/recompensas" icon={<Gift className="h-5 w-5" />} label="Recompensas" active={pathname === "/recompensas"} />
                  <MobileNavItem href="/badges" icon={<Medal className="h-5 w-5" />} label="Insignias" active={pathname === "/badges"} />
                  <MobileNavItem href="/scores" icon={<Trophy className="h-5 w-5" />} label="Marcadores" active={pathname === "/scores"} />
                  <MobileNavItem href="/mapa" icon={<Map className="h-5 w-5" />} label="Mapa" active={pathname === "/mapa"} />
                  <MobileNavItem href="/perfil" icon={<User className="h-5 w-5" />} label="Mi Perfil" active={pathname === "/perfil"} />
                </nav>
                <div className="mx-5 mb-5 text-sm p-2">
                  <span>
                    Notificaciones: {" "}
                    <Link href="/perfil#notifications_tab" passHref> {/* Enlace a la pestaña de notificaciones del perfil */}
                      <Button variant="ghost" size="icon" className="relative text-gray-600">
                        <Bell className="h-5 w-5" />
                        {unreadNotifications > 0 && (
                          <span className="absolute top-0.5 right-0.5 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-white border-px"></span>
                          </span>
                        )}
                        <span className="sr-only">Notificaciones</span>
                      </Button>
                    </Link>
                  </span>
                </div>
                <div className="mt-auto p-4 border-t">
                  <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
                    <LogOut className="mr-2 h-5 w-5" />Cerrar Sesión
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      {/* Seccion para Escritorio */}
      <div className="flex flex-1">
        <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border- shadow-md">
          <div className="p-4 border-b">
            <Link href="/dashboard" className="flex items-center">
              <Leaf className="h-7 w-7 text-green-600 mr-2" />
              <span className="text-xl font-bold text-gray-800">EcoTrack MX</span>
            </Link>
          </div>
          {profile && (
            <div className="flex flex-col items-center py-5 px-3 border-b">
              <Avatar className="h-20 w-20 mb-3">
                <AvatarImage src={profile.profile?.publicAvatarDisplayUrl || ""} alt={profile.name || "Avatar"} />
                <AvatarFallback className="text-xl bg-green-100 text-green-800">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center flex flex-col gap-1">
                <p className="font-semibold text-gray-800">{profile.name}</p>
                <p className="text-xs text-gray-500">{profile.email}</p>
                <div className="mt-2 flex items-center justify-center space-x-1">
                  <span className="bg-blue-700 text-blue-50 text-xs px-2 py-1 rounded-full">Actividades: {stats.activityCount}</span>
                </div>
                <div className="mt-1"><LevelUserCard /></div>
              </div>
            </div>
          )}
          <nav className="flex-1 p-5 space-y-1.5 overflow-y-auto">
            <NavItem href="/dashboard" icon={<LayoutDashboard className="h-5 w-5" />} label="Dashboard" active={pathname === "/dashboard"} />
            <NavItem href="/estadisticas" icon={<BarChart2 className="h-5 w-5" />} label="Estadísticas" active={pathname === "/estadisticas"} />
            <NavItem href="/actividades" icon={<Leaf className="h-5 w-5" />} label="Actividades" active={pathname === "/actividades"} />
            <NavItem href="/recompensas" icon={<Gift className="h-5 w-5" />} label="Recompensas" active={pathname === "/recompensas"} />
            <NavItem href="/badges" icon={<Medal className="h-5 w-5" />} label="Insignias" active={pathname === "/badges"} />
            <NavItem href="/scores" icon={<Trophy className="h-5 w-5" />} label="Marcadores" active={pathname === "/scores"} />
            <NavItem href="/mapa" icon={<Map className="h-5 w-5" />} label="Mapa" active={pathname === "/mapa"} />
            <NavItem href="/perfil" icon={<User className="h-5 w-5" />} label="Mi Perfil" active={pathname === "/perfil"} />
          </nav>
          <div className="mx-5 mb-5 text-sm p-2">
            <span>
              Notificaciones: {" "}
              <Link href="/perfil#notifications_tab" passHref> {/* Enlace a la pestaña de notificaciones del perfil */}
                <Button variant="ghost" size="icon" className="relative text-gray-600">
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-0.5 right-0.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-white border-px"></span>
                    </span>
                  )}
                  <span className="sr-only">Notificaciones</span>
                </Button>
              </Link>
            </span>
          </div>
          <div className="p-3 border-t">
            <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-100" onClick={handleLogout}>
              <LogOut className="mr-2 h-5 w-5" />Cerrar Sesión
            </Button>
          </div>
        </aside>

        <main className="flex-1 overflow-auto bg-gray-100">
          <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
      <footer className="py-4 bg-white border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 md:flex-row px-4">
          <p className="text-center text-xs text-gray-600 md:text-left">© {new Date().getFullYear()} EcoTrack MX. Todos los derechos reservados.</p>
          <div className="flex gap-3">
            <Link href="/terminos" className="text-xs text-gray-600">Términos</Link>
            <Link href="/privacidad" className="text-xs text-gray-600">Privacidad</Link>
            <Link href="/contacto" className="text-xs text-gray-600">Contacto</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}



// Label modificado para aceptar notificationsCount
function LabelNotificaction({
  notificationsCount
}: {
  notificationsCount?: number;

}) {
  return (
    <span>
      {notificationsCount && notificationsCount > 0 && (
        <span className="absolute top-1 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
          {notificationsCount > 9 ? '9+' : notificationsCount}
        </span>
      )}
    </span>
  )
}

// NavItem 
function NavItem({
  href, // Añadido href para que Link funcione correctamente
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link href={href} passHref>
      <Button
        variant={active ? "default" : "ghost"}
        className={`w-full justify-start text-sm px-3 py-2 relative ${active
          ? "bg-green-600 hover:bg-green-700 text-white"
          : "text-gray-700 hover:bg-gray-100"
          }`}
      >
        {React.cloneElement(icon as any, { className: "h-5 w-5 mr-3" })}
        {label}
      </Button>
    </Link>
  );
}

// MobileNavItem modificado para aceptar notificationsCount
function MobileNavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link href={href} className="block w-full">
      <Button
        variant={active ? "default" : "ghost"}
        className={`w-full justify-start px-4 py-3 text-base relative ${active
          ? "bg-green-600 hover:bg-green-700 text-white "
          : "text-gray-700 hover:bg-gray-100 "
          }`}
      >
        {React.cloneElement(icon as any, { className: "h-5 w-5 mr-3" })}
        {label}
      </Button>
    </Link>
  );
}
