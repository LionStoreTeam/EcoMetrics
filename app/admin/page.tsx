"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Importar Link
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Check, Loader2, Building, PlusCircle, Gift, MapPin } from "lucide-react"; // Añadir Building y PlusCircle
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
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    pointsCost: 100,
    category: "PRODUCT",
    available: true,
    hasQuantity: false,
    quantity: 1,
    hasExpiration: false,
    expiresAt: null as Date | null,
  });

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "pointsCost" || name === "quantity" ? Number.parseInt(value) || 0 : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleDateChange = (date: Date | null) => {
    setFormData((prev) => ({ ...prev, expiresAt: date }));
  };

  const handleSubmitReward = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const rewardData = {
        title: formData.title,
        description: formData.description,
        pointsCost: formData.pointsCost,
        category: formData.category,
        available: formData.available,
        quantity: formData.hasQuantity ? formData.quantity : null,
        expiresAt: formData.hasExpiration ? formData.expiresAt : null,
      };
      const response = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rewardData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear la recompensa");
      }
      toast.success("Recompensa creada correctamente.");
      setFormData({
        title: "", description: "", pointsCost: 100, category: "PRODUCT",
        available: true, hasQuantity: false, quantity: 1, hasExpiration: false, expiresAt: null,
      });
    } catch (error) {
      console.error("Error al crear recompensa:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear la recompensa");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className="p-6 flex flex-col gap-2 text-white bg-gradient-to-r from-slate-700 to-slate-900 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
          <p className="text-slate-300">Gestiona los recursos de EcoTrack MX.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tarjeta para Crear Nueva Recompensa */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Gift className="h-6 w-6 text-pink-500" />
                <CardTitle>Crear Nueva Recompensa</CardTitle>
              </div>
              <CardDescription>
                Completa el formulario para añadir una nueva recompensa para los usuarios.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmitReward}>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="title-reward">Título</Label>
                  <Input id="title-reward" name="title" placeholder="Ej: Descuento en tienda" value={formData.title} onChange={handleChange} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="description-reward">Descripción</Label>
                  <Textarea id="description-reward" name="description" placeholder="Detalles de la recompensa" value={formData.description} onChange={handleChange} required rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="pointsCost-reward">Costo (Puntos)</Label>
                    <Input id="pointsCost-reward" name="pointsCost" type="number" min={1} value={formData.pointsCost} onChange={handleChange} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="category-reward">Categoría</Label>
                    <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                      <SelectTrigger id="category-reward"><SelectValue placeholder="Categoría" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DISCOUNT">Descuento</SelectItem>
                        <SelectItem value="WORKSHOP">Taller</SelectItem>
                        <SelectItem value="PRODUCT">Producto</SelectItem>
                        <SelectItem value="RECOGNITION">Reconocimiento</SelectItem>
                        <SelectItem value="EXPERIENCE">Experiencia</SelectItem>
                        <SelectItem value="OTHER">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Switches para cantidad y expiración */}
                <div className="flex items-center space-x-2 pt-2">
                  <Switch id="available-reward" checked={formData.available} onCheckedChange={(checked) => handleSwitchChange("available", checked)} />
                  <Label htmlFor="available-reward">Disponible</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="hasQuantity-reward" checked={formData.hasQuantity} onCheckedChange={(checked) => handleSwitchChange("hasQuantity", checked)} />
                  <Label htmlFor="hasQuantity-reward">Cantidad limitada</Label>
                </div>
                {formData.hasQuantity && (
                  <div className="pl-6 space-y-1">
                    <Label htmlFor="quantity-reward">Cantidad</Label>
                    <Input id="quantity-reward" name="quantity" type="number" min={1} value={formData.quantity} onChange={handleChange} required={formData.hasQuantity} />
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Switch id="hasExpiration-reward" checked={formData.hasExpiration} onCheckedChange={(checked) => handleSwitchChange("hasExpiration", checked)} />
                  <Label htmlFor="hasExpiration-reward">Tiene expiración</Label>
                </div>
                {formData.hasExpiration && (
                  <div className="pl-6 space-y-1">
                    <Label htmlFor="expiresAt-reward">Fecha de Expiración</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.expiresAt && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.expiresAt ? format(formData.expiresAt, "PPP", { locale: es }) : <span>Selecciona fecha</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.expiresAt || undefined} onSelect={handleDateChange as any} initialFocus disabled={(date) => date < new Date()} /></PopoverContent>
                    </Popover>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando...</> : <><Check className="mr-2 h-4 w-4" /> Crear Recompensa</>}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Tarjeta para Navegar a "Añadir Nuevo Centro de Acopio" */}
          <Card className="shadow-lg flex flex-col justify-between items-center">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Building className="h-6 w-6 text-blue-500" />
                <CardTitle>Gestionar Centros de Acopio</CardTitle>
              </div>
              <CardDescription>
                Añade y administra los centros de reciclaje y acopio en la plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center"> {/* Ajustar altura para centrar */}
              <MapPin className="h-16 w-16 text-blue-300 mb-4" />
              <p className="text-muted-foreground mb-4 text-center">
                Mantén actualizada la red de centros para ayudar a los usuarios a encontrar dónde llevar sus materiales.
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/admin/nuevo-centro" legacyBehavior passHref>
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                  <a> {/* El componente Link ahora envuelve el Button correctamente */}
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Nuevo Centro de Acopio
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
