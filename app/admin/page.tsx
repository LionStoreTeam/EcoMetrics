"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Importar Link
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Check, Loader2, Building, PlusCircle, Gift, LandPlot, Store, ShoppingBasket } from "lucide-react"; // Añadir Building y PlusCircle
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/dashboard-layout"; // Usar el layout general o uno específico de admin
import toast from 'react-hot-toast';


// ... (resto del código de AdminRewardsPage si se mantiene en el mismo archivo,
// o crea una estructura de dashboard de admin más modular)

// Para este ejemplo, asumimos que AdminRewardsPage es el contenido principal de /app/admin
// y añadiremos una sección para navegar a "Nuevo Centro de Acopio".

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json();
        if (!data.user || data.user.role !== "ADMIN") {
          toast.error("Acceso denegado.");
          router.push("/dashboard");
          return;
        }
        setIsAdmin(true);
      } catch (error) {
        console.error("Error al verificar permisos:", error);
        toast.error("Error al verificar permisos.");
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    checkAdmin();
  }, [router]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-150px)]">
          <Loader2 className="h-12 w-12 animate-spin text-green-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) return null; // Redirección ya manejada

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 m-5 sm:m-10">
        <div className="mt-10 lg:mt-0 p-6 flex flex-col gap-2 text-white bg-gradient-to-r from-slate-700 to-slate-900 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
          <p className="text-slate-300">Gestiona los recursos de EcoMetrics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tarjeta para Navegar a "Añadir Nuevo Centro de Acopio" */}
          <Card className="shadow-lg flex flex-col justify-between items-center">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Building className="h-6 w-6 text-sky-500" />
                <CardTitle>Gestionar Centros de Acopio</CardTitle>
              </div>
              <CardDescription>
                Añade y administra los centros de reciclaje y acopio en la plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center"> {/* Ajustar altura para centrar */}
              <LandPlot className="h-16 w-16 text-sky-300 mb-4" />
              <p className="text-muted-foreground mb-4 text-center">
                Mantén actualizada la red de centros para ayudar a los usuarios a encontrar dónde llevar sus materiales.
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/admin/nuevo-centro" legacyBehavior passHref>
                <Button asChild className="w-full bg-sky-600 hover:bg-sky-700">
                  <a> {/* El componente Link ahora envuelve el Button correctamente */}
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Nuevo Centro de Acopio
                  </a>
                </Button>
              </Link>
            </CardFooter>
          </Card>
          {/* Tarjeta para Navegar a "Crear Nueva Recompensa" */}
          <Card className="shadow-lg flex flex-col justify-between items-center">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Gift className="h-6 w-6 text-amber-500" />
                <CardTitle>Crea nuevas recompensas</CardTitle>
              </div>
              <CardDescription>
                Añade nuevas recompensas para los usuarios.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center"> {/* Ajustar altura para centrar */}
              <Gift className="h-16 w-16 text-amber-300 mb-4" />
              <p className="text-muted-foreground mb-4 text-center">
                Mantén actualizada las recompensas para mantener el entusiasmo en los usuarios.
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/admin/crear-recompensa" legacyBehavior passHref>
                <Button asChild className="w-full bg-amber-600 hover:bg-amber-700">
                  <a> {/* El componente Link ahora envuelve el Button correctamente */}
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Nueva Recompensa
                  </a>
                </Button>
              </Link>
            </CardFooter>
          </Card>
          {/* Tarjeta para Navegar a "Administrar Actividades" */}
          <Card className="shadow-lg flex flex-col justify-between items-center">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Check className="h-6 w-6 text-purple-500" />
                <CardTitle>Administrar las Actividades</CardTitle>
              </div>
              <CardDescription>
                Revisa, Califica, Edita o Elimina las Actividades de los usuarios.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center"> {/* Ajustar altura para centrar */}
              <Check className="h-16 w-16 text-purple-300 mb-4" />
              <p className="text-muted-foreground mb-4 text-center">
                Para mantener la transparencia y honestidad en nuestra plataforma, siempre se debe verificar las evidencias y el contenido de la Actividad.
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/admin/validar-actividades" legacyBehavior passHref>
                <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                  <a> {/* El componente Link ahora envuelve el Button correctamente */}
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ver Las Actividades
                  </a>
                </Button>
              </Link>
            </CardFooter>
          </Card>
          {/* Tarjeta para Navegar a "Administrar Negocios" */}
          <Card className="shadow-lg flex flex-col justify-between items-center">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Store className="h-6 w-6 text-green-500" />
                <CardTitle>Administrar los Negocios</CardTitle>
              </div>
              <CardDescription>
                Revisa, Aprueba o Rechaza los negocios pendientes por publicar en la plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center"> {/* Ajustar altura para centrar */}
              <Store className="h-16 w-16 text-green-300 mb-4" />
              <p className="text-muted-foreground mb-4 text-center">
                Para mantener la transparencia y honestidad en nuestra plataforma, siempre se debe verificar la legalidad de los negocios y el correcto pago según la tarifa establecida.
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/admin/validar-nuevos-negocios" legacyBehavior passHref>
                <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                  <a> {/* El componente Link ahora envuelve el Button correctamente */}
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ver Los Negocios
                  </a>
                </Button>
              </Link>
            </CardFooter>
          </Card>
          {/* Tarjeta para Navegar a "Administrar Productos" */}
          <Card className="shadow-lg flex flex-col justify-between items-center">
            <CardHeader>
              <div className="flex items-center gap-3">
                <ShoppingBasket className="h-6 w-6 text-cyan-500" />
                <CardTitle>Administrar los Productos</CardTitle>
              </div>
              <CardDescription>
                Revisa, Aprueba o Rechaza los productos pendientes por publicar en la plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center"> {/* Ajustar altura para centrar */}
              <ShoppingBasket className="h-16 w-16 text-cyan-300 mb-4" />
              <p className="text-muted-foreground mb-4 text-center">
                Para mantener la transparencia y honestidad en nuestra plataforma, siempre se debe verificar la legalidad de los productos, la promoción y el correcto pago según la tarifa establecida.
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/admin/validar-nuevos-productos" legacyBehavior passHref>
                <Button asChild className="w-full bg-cyan-600 hover:bg-cyan-700">
                  <a> {/* El componente Link ahora envuelve el Button correctamente */}
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ver Los Productos
                  </a>
                </Button>
              </Link>
            </CardFooter>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}
