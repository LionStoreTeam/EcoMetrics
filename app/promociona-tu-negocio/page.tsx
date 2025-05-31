// app/promociona-tu-negocio/page.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"; //
import { Input } from "@/components/ui/input"; //
import { Label } from "@/components/ui/label"; //
import { Textarea } from "@/components/ui/textarea"; //
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"; //
import toast from 'react-hot-toast';
import { Briefcase, Upload, Image as ImageIcon, X, Loader2, CreditCard } from "lucide-react";
import Image from "next/image";
import { MEXICAN_STATES, BUSINESS_TYPES, type MexicanState } from "@/lib/constants"; //
import { BusinessFormData } from "@/types/types"; //
import { z } from "zod";

import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ALLOWED_AVATAR_TYPES, MAX_AVATAR_SIZE } from "@/types/types-s3-service";

// Asegúrate de que tu clave publicable de Stripe esté disponible como variable de entorno
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

const promoteBusinessFormSchema = z.object({
    businessName: z.string().min(3, "El nombre del negocio debe tener al menos 3 caracteres.").max(100, "El nombre del negocio no puede exceder los 100 caracteres."),
    logoFile: z.instanceof(File).optional().nullable()
        .refine(file => !file || file.size <= MAX_AVATAR_SIZE, `El logo no debe exceder ${MAX_AVATAR_SIZE / (1024 * 1024)}MB.`) //
        .refine(file => !file || ALLOWED_AVATAR_TYPES.includes(file.type), "Tipo de archivo de logo no permitido."), //
    description: z.string().min(20, "La descripción debe tener al menos 20 caracteres.").max(1000, "La descripción no puede exceder los 1000 caracteres."),
    businessType: z.string().min(1, "Debes seleccionar un tipo de negocio."),
    address: z.string().min(5, "La dirección es requerida.").max(200),
    city: z.string().min(1, "La ciudad es requerida.").max(100),
    state: z.string().min(1, "El estado es requerido."),
    zipCode: z.string().max(10).optional().nullable().or(z.literal("")),
    phone: z.string().max(20).optional().nullable().or(z.literal("")),
    email: z.string().email("Correo electrónico inválido.").optional().nullable().or(z.literal("")),
    website: z.string().url("URL de sitio web inválida.").optional().nullable().or(z.literal("")),
    latitude: z.string().optional().nullable().or(z.literal(""))
        .refine(val => !val || (parseFloat(val) >= -90 && parseFloat(val) <= 90), "Latitud inválida (entre -90 y 90)."),
    longitude: z.string().optional().nullable().or(z.literal(""))
        .refine(val => !val || (parseFloat(val) >= -180 && parseFloat(val) <= 180), "Longitud inválida (entre -180 y 180)."),
    openingHours: z.string().max(200).optional().nullable().or(z.literal("")),
    socialMedia: z.string().max(255).optional().nullable().or(z.literal("")),
});


type PromoteBusinessFormValues = z.infer<typeof promoteBusinessFormSchema>;
type FormErrors = Partial<Record<keyof PromoteBusinessFormValues, string>>;


function PromoteBusinessForm() {
    const router = useRouter();
    const stripe = useStripe();
    const elements = useElements();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [formStep, setFormStep] = useState<"details" | "payment">("details");


    const [formData, setFormData] = useState<BusinessFormData>({
        businessName: "",
        logo: null,
        description: "",
        businessType: "",
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
    });
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});
    const logoInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleStateChange = (value: string) => {
        setFormData((prev) => ({ ...prev, state: value as MexicanState | "" }));
        if (errors.state) {
            setErrors(prev => ({ ...prev, state: undefined }));
        }
    };

    const handleBusinessTypeChange = (value: string) => {
        setFormData((prev) => ({ ...prev, businessType: value }));
        if (errors.businessType) {
            setErrors(prev => ({ ...prev, businessType: undefined }));
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const validationResult = promoteBusinessFormSchema.shape.logoFile.safeParse(file);
            if (!validationResult.success) {
                setErrors(prev => ({ ...prev, logoFile: validationResult.error.issues[0].message }));
                setLogoPreview(null);
                setFormData(prev => ({ ...prev, logoFile: null }));
                if (logoInputRef.current) logoInputRef.current.value = "";
                return;
            }
            setFormData(prev => ({ ...prev, logoFile: file }));
            setLogoPreview(URL.createObjectURL(file));
            setErrors(prev => ({ ...prev, logoFile: undefined }));
        } else {
            setFormData(prev => ({ ...prev, logoFile: null }));
            setLogoPreview(null);
        }
    };

    const removeLogo = () => {
        setFormData(prev => ({ ...prev, logoFile: null }));
        setLogoPreview(null);
        if (logoInputRef.current) {
            logoInputRef.current.value = "";
        }
    };

    const handleProceedToPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        const dataToValidate: PromoteBusinessFormValues = {
            ...formData,
            latitude: formData.latitude || undefined, // Zod espera undefined si es opcional y no se provee
            longitude: formData.longitude || undefined,
        };


        const validationResult = promoteBusinessFormSchema.safeParse(dataToValidate);

        if (!validationResult.success) {
            const newErrors: FormErrors = {};
            validationResult.error.errors.forEach((err) => {
                newErrors[err.path[0] as keyof PromoteBusinessFormValues] = err.message;
            });
            setErrors(newErrors);
            toast.error("Por favor, corrige los errores en el formulario.");
            return;
        }

        setIsSubmitting(true);
        toast.loading("Cargando pasarela de pagos...");

        try {
            const response = await fetch("/api/stripe/create-payment-intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: 5000, currency: "mxn" }), // Monto en centavos
            });

            const data = await response.json();
            toast.dismiss();

            if (!response.ok || !data.clientSecret) {
                throw new Error(data.error || "No se pudo iniciar el proceso de pago.");
            }
            setClientSecret(data.clientSecret);
            setFormStep("payment");

        } catch (error) {
            console.error("Error al crear PaymentIntent:", error);
            toast.dismiss();
            toast.error(error instanceof Error ? error.message : "Error al iniciar el pago.");
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleStripePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements || !clientSecret) {
            toast.error("Error: Stripe no está listo. Intenta de nuevo.");
            return;
        }

        setPaymentProcessing(true);
        setPaymentError(null);
        toast.loading("Procesando pago...");

        const { error: submitError } = await elements.submit();
        if (submitError) {
            setPaymentError(submitError.message || "Error al enviar datos de pago.");
            toast.dismiss();
            toast.error(submitError.message || "Error en el envío del pago.");
            setPaymentProcessing(false);
            return;
        }

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            clientSecret,
            confirmParams: {
                // Asegúrate de que esta URL sea correcta para tu aplicación
                return_url: `${window.location.origin}/promociona-tu-negocio/confirmacion-pago`,
            },
            redirect: "if_required", // Para manejar la redirección manualmente o cuando no es necesaria
        });

        toast.dismiss();

        if (error) {
            setPaymentError(error.message || "Ocurrió un error durante el pago.");
            toast.error(error.message || "Error en el pago.");
            setPaymentProcessing(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            toast.success("¡Pago exitoso!");
            await submitPromotionForm(paymentIntent.id);
        } else if (paymentIntent) {
            setPaymentError(`Estado del pago: ${paymentIntent.status}. Por favor, intenta de nuevo o contacta soporte.`);
            toast.error(`Pago no completado (Estado: ${paymentIntent.status})`);
            setPaymentProcessing(false);
        } else {
            setPaymentError("Ocurrió un error inesperado durante el pago.");
            toast.error("Error inesperado en el pago.");
            setPaymentProcessing(false);
        }
    };

    const submitPromotionForm = async (paymentIntentId: string) => {
        setIsSubmitting(true);
        toast.loading("Procesando formulario de promoción...");

        const apiFormData = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (key === "logoFile" && value instanceof File) {
                apiFormData.append(key, value);
            } else if (value !== null && value !== undefined) {
                apiFormData.append(key, String(value));
            }
        });
        apiFormData.append("paymentIntentId", paymentIntentId);

        try {
            const response = await fetch("/api/promote-business/submit", {
                method: "POST",
                body: apiFormData,
            });

            const result = await response.json();
            toast.dismiss();

            if (!response.ok) {
                throw new Error(result.error || "Error al enviar la solicitud de promoción.");
            }

            toast.success("¡Tu solicitud de promoción ha sido enviada con éxito y está pendiente de aprobación!");
            toast.success("Dentro de 1 a 24 horas tu negocio se podrá ver reflejado en la seccion Negocios Disponibles de nuestra plataforma.");
            // Resetear formulario y estado
            setFormData({
                businessName: "", logo: null, description: "", businessType: "",
                address: "", city: "", state: "", zipCode: "", phone: "", email: "",
                website: "", latitude: "", longitude: "", openingHours: "", socialMedia: "",
            });
            setLogoPreview(null);
            if (logoInputRef.current) logoInputRef.current.value = "";
            setClientSecret(null);
            setFormStep("details");
            setErrors({});
            router.push("/"); // O a una página de agradecimiento

        } catch (error) {
            console.error("Error al enviar formulario de promoción:", error);
            toast.dismiss();
            toast.error(error instanceof Error ? error.message : "No se pudo enviar tu solicitud.");
        } finally {
            setIsSubmitting(false);
            setPaymentProcessing(false);
        }
    };


    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <p className="text-red-500">Error de configuración: La clave publicable de Stripe no está definida.</p>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex flex-col items-center py-8 px-4">
            <header className="w-full max-w-4xl mb-8">
                <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors">
                    <Image src="/logo.png" alt="EcoMetrics Logo" width={50} height={50} priority />
                    <span className="text-2xl font-bold">EcoMetrics</span>
                </Link>
            </header>

            <Card className="w-full max-w-2xl shadow-xl">
                {formStep === "details" && (
                    <>
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <Briefcase className="h-8 w-8 text-green-600" />
                                <CardTitle className="text-3xl font-semibold text-gray-800">Promociona tu Negocio</CardTitle>
                            </div>
                            <CardDescription className="text-gray-600">
                                Comparte los detalles de tu negocio para que la comunidad EcoMetrics pueda conocerte.
                                El costo de la publicación es de $50.00 MXN.
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleProceedToPayment}>
                            <CardContent className="space-y-6">
                                {/* Nombre del Negocio */}
                                <div className="space-y-2">
                                    <Label htmlFor="businessName" className="font-medium text-gray-700">Nombre del Negocio <span className="text-red-500">*</span></Label>
                                    <Input id="businessName" name="businessName" value={formData.businessName} onChange={handleChange} placeholder="Ej: El Rincón Verde Orgánico" disabled={isSubmitting} className={errors.businessName ? "border-red-500" : ""} />
                                    {errors.businessName && <p className="text-sm text-red-500">{errors.businessName}</p>}
                                </div>

                                {/* Logo del Negocio */}
                                <div className="space-y-2">
                                    <Label htmlFor="logoFile" className="font-medium text-gray-700">Logo del Negocio (Opcional)</Label>
                                    <div
                                        className={`flex items-center justify-center w-full p-4 border-2 ${errors.logoFile ? 'border-red-500' : 'border-gray-300'} border-dashed rounded-lg cursor-pointer hover:border-green-400 hover:bg-green-50/50 transition-colors`}
                                        onClick={() => logoInputRef.current?.click()}
                                    >
                                        <input type="file" id="logoFile" name="logoFile" ref={logoInputRef} onChange={handleLogoChange} className="hidden" accept="image/png, image/jpeg, image/webp" disabled={isSubmitting} />
                                        {logoPreview ? (
                                            <div className="relative group w-32 h-32">
                                                <Image src={logoPreview} alt="Vista previa del logo" layout="fill" objectFit="contain" className="rounded-md" />
                                                <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); removeLogo(); }} disabled={isSubmitting}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="text-center text-gray-500">
                                                <ImageIcon className="mx-auto h-10 w-10 mb-2" />
                                                <p className="text-sm">Haz clic o arrastra para subir un logo</p>
                                                <p className="text-xs mt-1">PNG, JPG, WEBP (Máx. 5MB)</p>
                                            </div>
                                        )}
                                    </div>
                                    {errors.logoFile && <p className="text-sm text-red-500">{errors.logoFile}</p>}
                                </div>


                                {/* Descripción */}
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="font-medium text-gray-700">Descripción <span className="text-red-500">*</span></Label>
                                    <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Describe tu negocio, misión y qué lo hace especial..." rows={4} disabled={isSubmitting} className={errors.description ? "border-red-500" : ""} />
                                    {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                                </div>

                                {/* Tipo de Negocio */}
                                <div className="space-y-2">
                                    <Label htmlFor="businessType" className="font-medium text-gray-700">Tipo de Negocio <span className="text-red-500">*</span></Label>
                                    <Select value={formData.businessType} onValueChange={handleBusinessTypeChange} name="businessType" disabled={isSubmitting}>
                                        <SelectTrigger id="businessType" className={errors.businessType ? "border-red-500" : ""}>
                                            <SelectValue placeholder="Selecciona el tipo de negocio" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>Tipos de Negocio</SelectLabel>
                                                {BUSINESS_TYPES.map(type => ( //
                                                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    {errors.businessType && <p className="text-sm text-red-500">{errors.businessType}</p>}
                                </div>

                                {/* Dirección Completa */}
                                <div className="space-y-2">
                                    <Label htmlFor="address" className="font-medium text-gray-700">Dirección Completa <span className="text-red-500">*</span></Label>
                                    <Input id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Calle, Número, Colonia" disabled={isSubmitting} className={errors.address ? "border-red-500" : ""} />
                                    {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Ciudad */}
                                    <div className="space-y-2">
                                        <Label htmlFor="city" className="font-medium text-gray-700">Ciudad <span className="text-red-500">*</span></Label>
                                        <Input id="city" name="city" value={formData.city} onChange={handleChange} placeholder="Ej: Cuernavaca" disabled={isSubmitting} className={errors.city ? "border-red-500" : ""} />
                                        {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
                                    </div>
                                    {/* Estado */}
                                    <div className="space-y-2">
                                        <Label htmlFor="state" className="font-medium text-gray-700">Estado <span className="text-red-500">*</span></Label>
                                        <Select value={formData.state} onValueChange={handleStateChange} name="state" disabled={isSubmitting}>
                                            <SelectTrigger id="state" className={errors.state ? "border-red-500" : ""}>
                                                <SelectValue placeholder="Selecciona un estado" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>Estados de México</SelectLabel>
                                                    {MEXICAN_STATES.map(stateName => ( //
                                                        <SelectItem key={stateName} value={stateName}>{stateName}</SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        {errors.state && <p className="text-sm text-red-500">{errors.state}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Código Postal */}
                                    <div className="space-y-2">
                                        <Label htmlFor="zipCode" className="font-medium text-gray-700">Código Postal</Label>
                                        <Input id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleChange} placeholder="Ej: 62000" disabled={isSubmitting} className={errors.zipCode ? "border-red-500" : ""} />
                                        {errors.zipCode && <p className="text-sm text-red-500">{errors.zipCode}</p>}
                                    </div>
                                    {/* Teléfono */}
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="font-medium text-gray-700">Teléfono</Label>
                                        <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="Ej: 7771234567" disabled={isSubmitting} className={errors.phone ? "border-red-500" : ""} />
                                        {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                                    </div>
                                </div>

                                {/* Ubicación Geográfica */}
                                <div className="pt-4 border-t">
                                    <Label className="text-md font-semibold text-gray-700">Ubicación Geográfica (Opcional)</Label>
                                    <p className="text-xs text-gray-500 mb-2">Ayuda a los clientes a encontrarte en el mapa. Puedes obtenerla de Google Maps.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="latitude" className="font-medium text-gray-700">Latitud</Label>
                                            <Input id="latitude" name="latitude" type="text" value={formData.latitude} onChange={handleChange} placeholder="Ej: 18.921129" disabled={isSubmitting} className={errors.latitude ? "border-red-500" : ""} />
                                            {errors.latitude && <p className="text-sm text-red-500">{errors.latitude}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="longitude" className="font-medium text-gray-700">Longitud</Label>
                                            <Input id="longitude" name="longitude" type="text" value={formData.longitude} onChange={handleChange} placeholder="Ej: -99.234047" disabled={isSubmitting} className={errors.longitude ? "border-red-500" : ""} />
                                            {errors.longitude && <p className="text-sm text-red-500">{errors.longitude}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Horarios de Atención */}
                                <div className="space-y-2">
                                    <Label htmlFor="openingHours" className="font-medium text-gray-700">Horarios de Atención</Label>
                                    <Input id="openingHours" name="openingHours" value={formData.openingHours} onChange={handleChange} placeholder="Ej: Lunes a Viernes 9am - 6pm, Sábados 10am - 2pm" disabled={isSubmitting} className={errors.openingHours ? "border-red-500" : ""} />
                                    {errors.openingHours && <p className="text-sm text-red-500">{errors.openingHours}</p>}
                                </div>

                                {/* Contacto Adicional */}
                                <div className="pt-4 border-t">
                                    <Label className="text-md font-semibold text-gray-700">Contacto Adicional (Opcional)</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="font-medium text-gray-700">Correo Electrónico de Contacto</Label>
                                            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="contacto@miempresa.com" disabled={isSubmitting} className={errors.email ? "border-red-500" : ""} />
                                            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="website" className="font-medium text-gray-700">Sitio Web</Label>
                                            <Input id="website" name="website" type="url" value={formData.website} onChange={handleChange} placeholder="https://www.miempresa.com" disabled={isSubmitting} className={errors.website ? "border-red-500" : ""} />
                                            {errors.website && <p className="text-sm text-red-500">{errors.website}</p>}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="socialMedia" className="font-medium text-gray-700">Redes Sociales</Label>
                                    <Input id="socialMedia" name="socialMedia" value={formData.socialMedia} onChange={handleChange} placeholder="Ej: facebook.com/negocio, @instagram_negocio" disabled={isSubmitting} className={errors.socialMedia ? "border-red-500" : ""} />
                                    {errors.socialMedia && <p className="text-sm text-red-500">{errors.socialMedia}</p>}
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-6 text-wrap md:w-full justify-center items-center flex flex-col text-center">
                                <Button type="submit" className="w-[250px] text-wrap p-5 bg-green-600 hover:bg-green-700 text-lg" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
                                    Pagar ($50.00 MXN)
                                </Button>
                            </CardFooter>
                        </form>
                    </>
                )}

                {formStep === "payment" && clientSecret && stripe && elements && (
                    <>
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <CreditCard className="h-8 w-8 text-green-600" />
                                <CardTitle className="text-3xl font-semibold text-gray-800">Realizar Pago</CardTitle>
                            </div>
                            <CardDescription className="text-gray-600">
                                Completa el pago de $50.00 MXN para publicar la promoción de tu negocio.
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleStripePaymentSubmit}>
                            <CardContent className="space-y-6">
                                <PaymentElement />
                                {paymentError && <p className="text-sm text-red-500 mt-2">{paymentError}</p>}
                            </CardContent>
                            <CardFooter className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <Button type="button" variant="outline" onClick={() => setFormStep("details")} disabled={paymentProcessing}>
                                    Volver a Detalles
                                </Button>
                                <Button type="submit" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-lg py-3" disabled={!stripe || !elements || paymentProcessing || isSubmitting}>
                                    {paymentProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                                    Pagar $50.00 MXN
                                </Button>
                            </CardFooter>
                        </form>
                    </>
                )}
            </Card>

            <footer className="w-full max-w-4xl mt-12 text-center">
                <p className="text-xs text-gray-500">
                    © {new Date().getFullYear()} EcoMetrics. Todos los derechos reservados.
                    <Link href="/terminos-promocion-negocio" className="underline hover:text-green-600 ml-2">Términos de Promoción de Negocio</Link>
                </p>
            </footer>
        </div>
    );
}

// Componente contenedor que provee el Stripe Context
export default function PromoteBusinessPage() {
    return (
        <Elements stripe={stripePromise} options={{
            mode: 'payment',
            amount: 5000, // 50.00 MXN en centavos
            currency: 'mxn',
            appearance: { theme: 'stripe' },
        }}>
            <PromoteBusinessForm />
        </Elements>
    );
}