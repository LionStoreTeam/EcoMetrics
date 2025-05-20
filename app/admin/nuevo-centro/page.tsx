// app/admin/nuevo-centro/page.tsx
"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Loader2, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import DashboardLayout from "@/components/dashboard-layout"; // Asumiendo que tienes un layout para admin o usas el mismo
import { MEXICAN_STATES, type MexicanState } from "@/lib/constants";
import { type MaterialDefinition } from "@/lib/materialDefinitions"; // Para tipar los materiales
import toast from 'react-hot-toast';


interface FormData {
    name: string;
    description: string;
    address: string;
    city: string;
    state: MexicanState | "";
    zipCode: string;
    phone: string;
    email: string;
    website: string;
    latitude: string; // Se convertirán a número antes de enviar
    longitude: string; // Se convertirán a número antes de enviar
    openingHours: string;
    socialMedia: string;
    materialIds: string[];
}

interface ApiError {
    error: string;
    details?: Record<string, string[] | undefined> | Array<{ path: (string | number)[], message: string }>;
}


export default function AdminNewRecyclingCenterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false); // Para verificar rol
    const [allMaterials, setAllMaterials] = useState<MaterialDefinition[]>([]);
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});

    const [formData, setFormData] = useState<FormData>({
        name: "",
        description: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        phone: "",
        email: "",
        website: "",
        latitude: "",
        longitude: "",
        openingHours: "",
        socialMedia: "",
        materialIds: [],
    });

    // Verificar rol de admin y cargar materiales
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const sessionRes = await fetch("/api/auth/session");
                const sessionData = await sessionRes.json();
                if (!sessionData.user || sessionData.user.role !== "ADMIN") {
                    toast.error("Acceso Denegado. No tienes permisos para acceder a esta página")
                    router.push("/dashboard");
                    return;
                }
                setIsAdmin(true);

                const materialsRes = await fetch("/api/materials");
                if (!materialsRes.ok) throw new Error("Error al cargar materiales");
                const materialsData = await materialsRes.json();
                setAllMaterials(materialsData);
            } catch (error) {
                console.error("Error inicializando página de admin:", error);
                toast.error("No se pudieron cargar los datos necesarios")
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [router, toast]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (formErrors[name as keyof FormData]) {
            setFormErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleStateChange = (value: MexicanState | "") => {
        setFormData((prev) => ({ ...prev, state: value }));
        if (formErrors.state) {
            setFormErrors(prev => ({ ...prev, state: undefined }));
        }
    };

    const handleMaterialChange = (materialId: string) => {
        setFormData((prev) => {
            const newMaterialIds = prev.materialIds.includes(materialId)
                ? prev.materialIds.filter((id) => id !== materialId)
                : [...prev.materialIds, materialId];
            if (formErrors.materialIds && newMaterialIds.length > 0) {
                setFormErrors(prevErrors => ({ ...prevErrors, materialIds: undefined }));
            }
            return { ...prev, materialIds: newMaterialIds };
        });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setFormErrors({});

        const dataToSend = {
            ...formData,
            latitude: parseFloat(formData.latitude),
            longitude: parseFloat(formData.longitude),
            // Asegurarse que los opcionales vacíos se envíen como null o undefined si es necesario por el backend
            description: formData.description || null,
            zipCode: formData.zipCode || null,
            phone: formData.phone || null,
            email: formData.email || null,
            website: formData.website || null,
            openingHours: formData.openingHours || null,
            socialMedia: formData.socialMedia || null,
        };

        try {
            const response = await fetch("/api/centers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSend),
            });

            const result: ApiError | any = await response.json();

            if (!response.ok) {
                if (result.details) {
                    const errors: Partial<Record<keyof FormData, string>> = {};
                    // Manejar errores de Zod (array de objetos con path y message)
                    if (Array.isArray(result.details)) {
                        result.details.forEach((detail: { path: (string | number)[], message: string }) => {
                            if (detail.path && detail.path.length > 0) {
                                errors[detail.path[0] as keyof FormData] = detail.message;
                            }
                        });
                    }
                    // Manejar errores de Zod (objeto con claves de campo)
                    else if (typeof result.details === 'object') {
                        for (const key in result.details) {
                            if (Object.prototype.hasOwnProperty.call(result.details, key)) {
                                errors[key as keyof FormData] = (result.details[key as keyof typeof result.details] as string[]).join(", ");
                            }
                        }
                    }
                    setFormErrors(errors);
                    toast.error("Error de Validación, Por favor, revisa los campos")
                } else {
                    toast.error("Error. No se pudo crear el centro")
                }
                throw new Error(result.error || "Error al crear el centro de acopio");
            }

            toast.success(`Centro Creado. El centro "${result.name}" ha sido añadido exitosamente`)
            // Reset form
            setFormData({
                name: "", description: "", address: "", city: "", state: "", zipCode: "",
                phone: "", email: "", website: "", latitude: "", longitude: "",
                openingHours: "", socialMedia: "", materialIds: [],
            });
            router.push("/admin"); // O a donde quieras redirigir
        } catch (error) {
            console.error("Error al enviar formulario:", error);
            // El toast de error ya se maneja arriba si es un error de la API con detalles
            if (!formErrors || Object.keys(formErrors).length === 0) { // Evita doble toast si ya hay errores de campo
                toast.error("Error. Ocurrió un error inesperado")
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAdmin && !isLoading) { // Si ya terminó de cargar y no es admin, no renderizar nada más que el layout.
        return <DashboardLayout><div className="p-4">Cargando permisos...</div></DashboardLayout>;
    }
    if (isLoading && !allMaterials.length) { // Loader principal mientras se carga todo
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[calc(100vh-150px)]"> {/* Ajustar altura */}
                    <Loader2 className="h-12 w-12 animate-spin text-green-600" />
                </div>
            </DashboardLayout>
        );
    }


    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8 m-5 sm:m-10">
                <div className="p-6 flex flex-col gap-2 text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg">
                    <div className="flex items-center gap-3">
                        <Building className="h-8 w-8" />
                        <h1 className="text-3xl font-bold tracking-tight">Añadir Nuevo Centro de Acopio</h1>
                    </div>
                    <p className="text-blue-100">
                        Completa la información para registrar un nuevo punto de recolección en la plataforma.
                    </p>
                </div>

                <Card className="max-w-3xl mx-auto w-full">
                    <form onSubmit={handleSubmit}>
                        <CardHeader>
                            <CardTitle>Información del Centro</CardTitle>
                            <CardDescription>
                                Proporciona los detalles del centro de acopio. Los campos marcados con * son obligatorios.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Nombre del Centro */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre del Centro <span className="text-red-500">*</span></Label>
                                <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Centro de Reciclaje 'El Sol'" disabled={isLoading} />
                                {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
                            </div>

                            {/* Descripción */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Descripción</Label>
                                <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Breve descripción del centro, qué lo hace especial, etc." rows={3} disabled={isLoading} />
                                {formErrors.description && <p className="text-sm text-red-500">{formErrors.description}</p>}
                            </div>

                            {/* Dirección Completa */}
                            <div className="space-y-2">
                                <Label htmlFor="address">Dirección Completa <span className="text-red-500">*</span></Label>
                                <Input id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Calle, Número, Colonia" disabled={isLoading} />
                                {formErrors.address && <p className="text-sm text-red-500">{formErrors.address}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Ciudad */}
                                <div className="space-y-2">
                                    <Label htmlFor="city">Ciudad <span className="text-red-500">*</span></Label>
                                    <Input id="city" name="city" value={formData.city} onChange={handleChange} placeholder="Ej: Cuernavaca" disabled={isLoading} />
                                    {formErrors.city && <p className="text-sm text-red-500">{formErrors.city}</p>}
                                </div>
                                {/* Estado */}
                                <div className="space-y-2">
                                    <Label htmlFor="state">Estado <span className="text-red-500">*</span></Label>
                                    <Select value={formData.state} onValueChange={(value) => handleStateChange(value as MexicanState | "")} disabled={isLoading}>
                                        <SelectTrigger id="state">
                                            <SelectValue placeholder="Selecciona un estado" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>Estados de México</SelectLabel>
                                                {MEXICAN_STATES.map(stateName => (
                                                    <SelectItem key={stateName} value={stateName}>{stateName}</SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    {formErrors.state && <p className="text-sm text-red-500">{formErrors.state}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Código Postal */}
                                <div className="space-y-2">
                                    <Label htmlFor="zipCode">Código Postal</Label>
                                    <Input id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleChange} placeholder="Ej: 62000" disabled={isLoading} />
                                    {formErrors.zipCode && <p className="text-sm text-red-500">{formErrors.zipCode}</p>}
                                </div>
                                {/* Teléfono */}
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Teléfono</Label>
                                    <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="Ej: 7771234567" disabled={isLoading} />
                                    {formErrors.phone && <p className="text-sm text-red-500">{formErrors.phone}</p>}
                                </div>
                            </div>

                            {/* Ubicación Geográfica */}
                            <h3 className="text-md font-semibold pt-2 border-t mt-4">Ubicación Geográfica</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="latitude">Latitud <span className="text-red-500">*</span></Label>
                                    <Input id="latitude" name="latitude" type="number" step="any" value={formData.latitude} onChange={handleChange} placeholder="Ej: 18.921129" disabled={isLoading} />
                                    {formErrors.latitude && <p className="text-sm text-red-500">{formErrors.latitude}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="longitude">Longitud <span className="text-red-500">*</span></Label>
                                    <Input id="longitude" name="longitude" type="number" step="any" value={formData.longitude} onChange={handleChange} placeholder="Ej: -99.234047" disabled={isLoading} />
                                    {formErrors.longitude && <p className="text-sm text-red-500">{formErrors.longitude}</p>}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">Puedes obtener la latitud y longitud desde Google Maps (clic derecho sobre el mapa &gt; ¿Qué hay aquí?).</p>


                            {/* Horarios */}
                            <div className="space-y-2">
                                <Label htmlFor="openingHours">Horarios de Atención</Label>
                                <Input id="openingHours" name="openingHours" value={formData.openingHours} onChange={handleChange} placeholder="Ej: Lunes a Viernes de 9am - 5pm, Sábados 9am - 1pm" disabled={isLoading} />
                                {formErrors.openingHours && <p className="text-sm text-red-500">{formErrors.openingHours}</p>}
                            </div>

                            {/* Contacto Adicional */}
                            <h3 className="text-md font-semibold pt-2 border-t mt-4">Contacto Adicional (Opcional)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Correo Electrónico</Label>
                                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="contacto@centro.com" disabled={isLoading} />
                                    {formErrors.email && <p className="text-sm text-red-500">{formErrors.email}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="website">Sitio Web</Label>
                                    <Input id="website" name="website" type="url" value={formData.website} onChange={handleChange} placeholder="https://www.centro.com" disabled={isLoading} />
                                    {formErrors.website && <p className="text-sm text-red-500">{formErrors.website}</p>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="socialMedia">Redes Sociales</Label>
                                <Input id="socialMedia" name="socialMedia" value={formData.socialMedia} onChange={handleChange} placeholder="Ej: Facebook, Instagram (@usuario)" disabled={isLoading} />
                                {formErrors.socialMedia && <p className="text-sm text-red-500">{formErrors.socialMedia}</p>}
                            </div>


                            {/* Materiales Aceptados */}
                            <div className="space-y-2">
                                <Label>Materiales Aceptados <span className="text-red-500">*</span></Label>
                                {allMaterials.length === 0 && !isLoading && <p className="text-sm text-muted-foreground">Cargando lista de materiales...</p>}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
                                    {allMaterials.map((material) => (
                                        <div key={material.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`material-${material.id}`}
                                                checked={formData.materialIds.includes(material.id)}
                                                onCheckedChange={() => handleMaterialChange(material.id)}
                                                disabled={isLoading}
                                            />
                                            <Label htmlFor={`material-${material.id}`} className="text-sm font-normal cursor-pointer">
                                                {material.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {formErrors.materialIds && <p className="text-sm text-red-500">{formErrors.materialIds}</p>}
                            </div>

                        </CardContent>
                        <CardFooter className="flex justify-end gap-4">
                            <Button variant="outline" type="button" onClick={() => router.back()} disabled={isLoading}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isLoading}>
                                {isLoading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
                                ) : (
                                    <><PlusCircle className="mr-2 h-4 w-4" /> Añadir Centro</>
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </DashboardLayout>
    );
}
