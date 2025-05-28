// app/promociona-tu-producto/page.tsx
"use client";

import React, { useState, useRef, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar"; //
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; //
import toast from 'react-hot-toast';
import { Package, Upload, Image as ImageIcon, X, Loader2, CreditCard, CalendarIcon as CalendarIconLucide, Tag } from "lucide-react";
import Image from "next/image";
import { MEXICAN_STATES, BUSINESS_TYPES, type MexicanState, type BusinessType } from "@/lib/constants";
import { ProductPromotionFormData } from "@/types/types"; //
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ALLOWED_AVATAR_TYPES, MAX_AVATAR_SIZE, MAX_FILE_SIZE, MAX_FILES } from "@/types/types-s3-service";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");
const PRODUCT_PROMOTION_PRICE_MXN = 30.00;

const promoteProductFormSchemaClient = z.object({
    businessName: z.string().min(3, "El nombre del negocio es demasiado corto.").max(100),
    productName: z.string().min(3, "El nombre del producto es demasiado corto.").max(100),
    businessLogoFile: z.instanceof(File).optional().nullable()
        .refine(file => !file || file.size <= MAX_AVATAR_SIZE, `El logo no debe exceder ${MAX_AVATAR_SIZE / (1024 * 1024)}MB.`)
        .refine(file => !file || ALLOWED_AVATAR_TYPES.includes(file.type), "Tipo de archivo de logo no permitido."),
    description: z.string().min(20, "La descripción del producto es demasiado corta.").max(1000),
    businessType: z.string().min(1, "Debes seleccionar un tipo de negocio."),
    productImageFiles: z.array(z.instanceof(File))
        .min(1, "Debes subir al menos 1 imagen del producto.")
        .max(MAX_FILES, `Puedes subir un máximo de ${MAX_FILES} imágenes del producto.`)
        .refine(files => files.every(file => file.size <= MAX_FILE_SIZE), `Cada imagen no debe exceder ${MAX_FILE_SIZE / (1024 * 1024)}MB.`)
        .refine(files => files.every(file => ALLOWED_AVATAR_TYPES.includes(file.type)), "Alguna de las imágenes tiene un tipo de archivo no permitido (solo JPG, PNG, WEBP)."),
    priceOrPromotion: z.string().min(3, "Especifica el precio o promoción.").max(200),
    address: z.string().min(5).max(200),
    city: z.string().min(1).max(100),
    state: z.string().min(1),
    validUntil: z.date().optional().nullable(),
    zipCode: z.string().max(10).optional().nullable().or(z.literal("")),
    phone: z.string().max(20).optional().nullable().or(z.literal("")),
    latitude: z.string().optional().nullable().or(z.literal(""))
        .refine(val => !val || (parseFloat(val) >= -90 && parseFloat(val) <= 90), "Latitud inválida."),
    longitude: z.string().optional().nullable().or(z.literal(""))
        .refine(val => !val || (parseFloat(val) >= -180 && parseFloat(val) <= 180), "Longitud inválida."),
    openingHours: z.string().max(200).optional().nullable().or(z.literal("")),
    contactEmail: z.string().email("Correo de contacto inválido.").optional().nullable().or(z.literal("")),
    website: z.string().url("URL de sitio web inválida.").optional().nullable().or(z.literal("")),
    socialMediaLinks: z.string().max(500).optional().nullable().or(z.literal("")),
});

type PromoteProductFormValues = z.infer<typeof promoteProductFormSchemaClient>;
type ProductFormErrors = Partial<Record<keyof PromoteProductFormValues, string>>;


function PromoteProductForm() {
    const router = useRouter();
    const stripe = useStripe();
    const elements = useElements();

    const [isSubmittingForm, setIsSubmittingForm] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [formStep, setFormStep] = useState<"details" | "payment">("details");

    const [formData, setFormData] = useState<ProductPromotionFormData>({
        businessName: "", productName: "", businessLogoFile: null, description: "",
        businessType: "", productImageFiles: [], priceOrPromotion: "", address: "",
        city: "", state: "", validUntil: null, zipCode: "", phone: "",
        latitude: "", longitude: "", openingHours: "", contactEmail: "",
        website: "", socialMediaLinks: "",
    });

    const [businessLogoPreview, setBusinessLogoPreview] = useState<string | null>(null);
    const [productImagePreviews, setProductImagePreviews] = useState<string[]>([]);
    const [errors, setErrors] = useState<ProductFormErrors>({});
    const businessLogoInputRef = useRef<HTMLInputElement>(null);
    const productImagesInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name as keyof ProductFormErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleStateChange = (value: string) => {
        setFormData((prev) => ({ ...prev, state: value as MexicanState | "" }));
        if (errors.state) setErrors(prev => ({ ...prev, state: undefined }));
    };

    const handleBusinessTypeChange = (value: string) => {
        setFormData((prev) => ({ ...prev, businessType: value }));
        if (errors.businessType) setErrors(prev => ({ ...prev, businessType: undefined }));
    };

    const handleDateChange = (date: Date | undefined) => {
        setFormData((prev) => ({ ...prev, validUntil: date ? date.toISOString().split("T")[0] : null }));
        if (errors.validUntil) setErrors(prev => ({ ...prev, validUntil: undefined }));
    };

    const handleBusinessLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const validationResult = promoteProductFormSchemaClient.shape.businessLogoFile.safeParse(file);
            if (!validationResult.success) {
                setErrors(prev => ({ ...prev, businessLogoFile: validationResult.error.issues[0].message }));
                setBusinessLogoPreview(null);
                setFormData(prev => ({ ...prev, businessLogoFile: null }));
                if (businessLogoInputRef.current) businessLogoInputRef.current.value = "";
                return;
            }
            setFormData(prev => ({ ...prev, businessLogoFile: file }));
            setBusinessLogoPreview(URL.createObjectURL(file));
            setErrors(prev => ({ ...prev, businessLogoFile: undefined }));
        } else {
            setFormData(prev => ({ ...prev, businessLogoFile: null }));
            setBusinessLogoPreview(null);
        }
    };

    const removeBusinessLogo = () => {
        setFormData(prev => ({ ...prev, businessLogoFile: null }));
        setBusinessLogoPreview(null);
        if (businessLogoInputRef.current) businessLogoInputRef.current.value = "";
    };

    const handleProductImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const filesArray = Array.from(e.target.files || []);
        if (filesArray.length === 0) return;

        const currentTotalFiles = formData.productImageFiles.length + filesArray.length;
        if (currentTotalFiles > MAX_FILES) {
            setErrors(prev => ({ ...prev, productImageFiles: `No puedes subir más de ${MAX_FILES} imágenes para el producto.` }));
            if (productImagesInputRef.current) productImagesInputRef.current.value = "";
            return;
        }

        const newImageFiles = [...formData.productImageFiles, ...filesArray];
        const validationResult = promoteProductFormSchemaClient.shape.productImageFiles.safeParse(newImageFiles);

        if (!validationResult.success) {
            setErrors(prev => ({ ...prev, productImageFiles: validationResult.error.issues[0].message }));
            if (productImagesInputRef.current) productImagesInputRef.current.value = "";
            return;
        }

        setFormData(prev => ({ ...prev, productImageFiles: newImageFiles } as any));
        const newPreviews = filesArray.map(file => URL.createObjectURL(file));
        setProductImagePreviews(prev => [...prev, ...newPreviews]);
        setErrors(prev => ({ ...prev, productImageFiles: undefined }));
        if (productImagesInputRef.current) productImagesInputRef.current.value = "";
    };

    const removeProductImage = (index: number) => {
        URL.revokeObjectURL(productImagePreviews[index]);
        setFormData(prev => ({
            ...prev,
            productImageFiles: prev.productImageFiles.filter((_, i) => i !== index)
        }));
        setProductImagePreviews(prev => prev.filter((_, i) => i !== index));
        if (formData.productImageFiles.length - 1 < MAX_FILES && errors.productImageFiles?.includes("máximo")) {
            setErrors(prev => ({ ...prev, productImageFiles: undefined }));
        }
        if (formData.productImageFiles.length - 1 >= 1 && errors.productImageFiles?.includes("al menos 1")) {
            setErrors(prev => ({ ...prev, productImageFiles: undefined }));
        }
    };


    const handleProceedToPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        const dataToValidate: PromoteProductFormValues = {
            ...formData,
            validUntil: formData.validUntil ? new Date(formData.validUntil) : undefined,
            latitude: formData.latitude || undefined,
            longitude: formData.longitude || undefined,
            businessName: formData.businessName,
            productName: formData.productName,
            businessLogoFile: formData.businessLogoFile, // Logo del negocio
            description: formData.description,
            businessType: formData.businessType,
            productImageFiles: formData.productImageFiles as any,
            priceOrPromotion: formData.priceOrPromotion,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            phone: formData.phone,
            openingHours: formData.openingHours,
            contactEmail: formData.contactEmail,
            website: formData.website,
            socialMediaLinks: formData.socialMediaLinks,
        };

        const validationResult = promoteProductFormSchemaClient.safeParse(dataToValidate);
        if (!validationResult.success) {
            const newErrors: ProductFormErrors = {};
            validationResult.error.errors.forEach((err) => {
                newErrors[err.path[0] as keyof PromoteProductFormValues] = err.message;
            });
            setErrors(newErrors);
            toast.error("Por favor, corrige los errores en el formulario.");
            console.log("Errores de Zod:", newErrors);
            return;
        }

        setIsSubmittingForm(true);
        toast.loading("Cargando pasarela de pagos...");

        try {
            const response = await fetch("/api/stripe/create-product-payment-intent", { // Nuevo endpoint
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: PRODUCT_PROMOTION_PRICE_MXN * 100, currency: "mxn" }),
            });
            const data = await response.json();
            toast.dismiss();
            if (!response.ok || !data.clientSecret) {
                throw new Error(data.error || "No se pudo iniciar el proceso de pago para el producto.");
            }
            setClientSecret(data.clientSecret);
            setFormStep("payment");
        } catch (error) {
            console.error("Error al crear PaymentIntent para producto:", error);
            toast.dismiss();
            toast.error(error instanceof Error ? error.message : "Error al iniciar el pago.");
        } finally {
            setIsSubmittingForm(false);
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
        toast.loading("Procesando pago del producto...");

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
            confirmParams: { return_url: `${window.location.origin}/promociona-tu-producto/confirmacion-pago` },
            redirect: "if_required",
        });
        toast.dismiss();

        if (error) {
            setPaymentError(error.message || "Ocurrió un error durante el pago del producto.");
            toast.error(error.message || "Error en el pago del producto.");
            setPaymentProcessing(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            toast.success("¡Pago de producto exitoso!");
            await submitProductPromotionForm(paymentIntent.id);
        } else if (paymentIntent) {
            setPaymentError(`Estado del pago del producto: ${paymentIntent.status}.`);
            toast.error(`Pago de producto no completado (Estado: ${paymentIntent.status})`);
            setPaymentProcessing(false);
        } else {
            setPaymentError("Ocurrió un error inesperado durante el pago del producto.");
            toast.error("Error inesperado en el pago del producto.");
            setPaymentProcessing(false);
        }
    };

    const submitProductPromotionForm = async (paymentIntentId: string) => {
        setIsSubmittingForm(true);
        toast.loading("Procesando formulario de promoción de producto...");

        const apiFormData = new FormData();
        // Campos de texto
        (Object.keys(formData) as Array<keyof ProductPromotionFormData>).forEach(key => {
            if (key !== 'businessLogoFile' && key !== 'productImageFiles' && formData[key] !== null && formData[key] !== undefined) {
                apiFormData.append(key, String(formData[key]));
            }
        });
        if (formData.validUntil) { // Asegurar que la fecha se envíe en formato ISO si existe
            apiFormData.set("validUntil", new Date(formData.validUntil).toISOString());
        }


        // Logo del negocio
        if (formData.businessLogoFile) {
            apiFormData.append("businessLogoFile", formData.businessLogoFile);
        }
        // Imágenes del producto
        formData.productImageFiles.forEach((file, index) => {
            apiFormData.append(`productImageFile_${index}`, file as any);
        });
        apiFormData.append("paymentIntentId", paymentIntentId);

        try {
            const response = await fetch("/api/product-promotions/submit", {
                method: "POST",
                body: apiFormData,
            });
            const result = await response.json();
            toast.dismiss();
            if (!response.ok) throw new Error(result.error || "Error al enviar la solicitud de promoción de producto.");

            toast.success("¡Tu solicitud de promoción de producto ha sido enviada con éxito!");
            setFormData({
                businessName: "", productName: "", businessLogoFile: null, description: "",
                businessType: "", productImageFiles: [], priceOrPromotion: "", address: "",
                city: "", state: "", validUntil: null, zipCode: "", phone: "",
                latitude: "", longitude: "", openingHours: "", contactEmail: "",
                website: "", socialMediaLinks: "",
            });
            setBusinessLogoPreview(null);
            setProductImagePreviews([]);
            if (businessLogoInputRef.current) businessLogoInputRef.current.value = "";
            if (productImagesInputRef.current) productImagesInputRef.current.value = "";
            setClientSecret(null);
            setFormStep("details");
            setErrors({});
            router.push("/");
        } catch (error) {
            console.error("Error al enviar formulario de promoción de producto:", error);
            toast.dismiss();
            toast.error(error instanceof Error ? error.message : "No se pudo enviar tu solicitud de producto.");
        } finally {
            setIsSubmittingForm(false);
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
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex flex-col items-center py-8 px-4">
            <header className="w-full max-w-4xl mb-8">
                <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-sky-600 transition-colors">
                    <Image src="/logo.png" alt="EcoMetrics Logo" width={50} height={50} priority />
                    <span className="text-2xl font-bold">EcoMetrics</span>
                </Link>
            </header>

            <Card className="w-full max-w-2xl shadow-xl">
                {formStep === "details" && (
                    <>
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <Package className="h-8 w-8 text-sky-600" />
                                <CardTitle className="text-3xl font-semibold text-gray-800">Promociona tu Producto</CardTitle>
                            </div>
                            <CardDescription className="text-gray-600">
                                Describe tu producto o servicio y cómo ayuda al medio ambiente o a la comunidad.
                                El costo de la publicación es de ${PRODUCT_PROMOTION_PRICE_MXN.toFixed(2)} MXN.
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleProceedToPayment}>
                            <CardContent className="space-y-6">
                                {/* Nombre del Negocio */}
                                <div className="space-y-2">
                                    <Label htmlFor="businessName" className="font-medium text-gray-700">Nombre del Negocio <span className="text-red-500">*</span></Label>
                                    <Input id="businessName" name="businessName" value={formData.businessName} onChange={handleChange} placeholder="Tu Negocio S.A. de C.V." disabled={isSubmittingForm} className={errors.businessName ? "border-red-500" : ""} />
                                    {errors.businessName && <p className="text-sm text-red-500">{errors.businessName}</p>}
                                </div>

                                {/* Logo del Negocio */}
                                <div className="space-y-2">
                                    <Label htmlFor="businessLogoFile" className="font-medium text-gray-700">Logo del Negocio (Opcional)</Label>
                                    <div
                                        className={`flex items-center justify-center w-full p-4 border-2 ${errors.businessLogoFile ? 'border-red-500' : 'border-gray-300'} border-dashed rounded-lg cursor-pointer hover:border-sky-400 hover:bg-sky-50/50 transition-colors`}
                                        onClick={() => businessLogoInputRef.current?.click()}
                                    >
                                        <input type="file" id="businessLogoFile" name="businessLogoFile" ref={businessLogoInputRef} onChange={handleBusinessLogoChange} className="hidden" accept="image/png, image/jpeg, image/webp" disabled={isSubmittingForm} />
                                        {businessLogoPreview ? (
                                            <div className="relative group w-24 h-24"> {/* Reducido tamaño para logo */}
                                                <Image src={businessLogoPreview} alt="Vista previa del logo" layout="fill" objectFit="contain" className="rounded-md" />
                                                <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); removeBusinessLogo(); }} disabled={isSubmittingForm}>
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="text-center text-gray-500">
                                                <ImageIcon className="mx-auto h-8 w-8 mb-1" />
                                                <p className="text-xs">Subir logo (PNG, JPG, WEBP - Máx. 5MB)</p>
                                            </div>
                                        )}
                                    </div>
                                    {errors.businessLogoFile && <p className="text-sm text-red-500">{errors.businessLogoFile}</p>}
                                </div>


                                {/* Nombre del Producto */}
                                <div className="space-y-2">
                                    <Label htmlFor="productName" className="font-medium text-gray-700">Nombre del Producto/Servicio <span className="text-red-500">*</span></Label>
                                    <Input id="productName" name="productName" value={formData.productName} onChange={handleChange} placeholder="Ej: EcoBolsas Reutilizables de Algodón" disabled={isSubmittingForm} className={errors.productName ? "border-red-500" : ""} />
                                    {errors.productName && <p className="text-sm text-red-500">{errors.productName}</p>}
                                </div>

                                {/* Descripción del Producto */}
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="font-medium text-gray-700">Descripción del Producto/Servicio <span className="text-red-500">*</span></Label>
                                    <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Detalla las características, beneficios y el impacto positivo de tu producto/servicio..." rows={4} disabled={isSubmittingForm} className={errors.description ? "border-red-500" : ""} />
                                    {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                                </div>

                                {/* Imágenes del Producto */}
                                <div className="space-y-2">
                                    <Label htmlFor="productImageFiles" className="font-medium text-gray-700">Imágenes del Producto ({formData.productImageFiles.length}/{MAX_FILES}) <span className="text-red-500">*</span></Label>
                                    <div className={`p-4 border-2 ${errors.productImageFiles ? 'border-red-500' : 'border-gray-300'} border-dashed rounded-lg`}>
                                        <div
                                            className="flex items-center justify-center w-full py-3 bg-gray-50 hover:bg-gray-100 rounded-md cursor-pointer transition-colors"
                                            onClick={() => productImagesInputRef.current?.click()}
                                        >
                                            <input type="file" id="productImageFiles" name="productImageFiles" ref={productImagesInputRef} onChange={handleProductImagesChange} className="hidden" accept="image/png, image/jpeg, image/webp" multiple disabled={isSubmittingForm || formData.productImageFiles.length >= MAX_FILES} />
                                            <Upload className="h-5 w-5 mr-2 text-gray-500" />
                                            <span className="text-sm text-gray-600">
                                                {formData.productImageFiles.length >= MAX_FILES ? `Máximo ${MAX_FILES} imágenes alcanzado` : "Añadir imágenes (JPG, PNG, WEBP - Máx. 5MB c/u)"}
                                            </span>
                                        </div>
                                        {productImagePreviews.length > 0 && (
                                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {productImagePreviews.map((previewUrl, index) => (
                                                    <div key={index} className="relative group aspect-square">
                                                        <Image src={previewUrl} alt={`Vista previa producto ${index + 1}`} layout="fill" objectFit="cover" className="rounded" />
                                                        <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5" onClick={() => removeProductImage(index)} disabled={isSubmittingForm}>
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {errors.productImageFiles && <p className="text-sm text-red-500 mt-1">{errors.productImageFiles}</p>}
                                </div>


                                {/* Tipo de Negocio (Reutilizado) */}
                                <div className="space-y-2">
                                    <Label htmlFor="businessTypeProduct" className="font-medium text-gray-700">Tipo de Negocio <span className="text-red-500">*</span></Label>
                                    <Select value={formData.businessType} onValueChange={handleBusinessTypeChange} name="businessType" disabled={isSubmittingForm}>
                                        <SelectTrigger id="businessTypeProduct" className={errors.businessType ? "border-red-500" : ""}><SelectValue placeholder="Selecciona el tipo de negocio" /></SelectTrigger>
                                        <SelectContent><SelectGroup><SelectLabel>Tipos de Negocio</SelectLabel>{BUSINESS_TYPES.map(type => (<SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>))}</SelectGroup></SelectContent>
                                    </Select>
                                    {errors.businessType && <p className="text-sm text-red-500">{errors.businessType}</p>}
                                </div>

                                {/* Precio o Promoción */}
                                <div className="space-y-2">
                                    <Label htmlFor="priceOrPromotion" className="font-medium text-gray-700">Precio o Promoción <span className="text-red-500">*</span></Label>
                                    <Input id="priceOrPromotion" name="priceOrPromotion" value={formData.priceOrPromotion} onChange={handleChange} placeholder="Ej: $250 MXN, 15% de descuento, Desde $99" disabled={isSubmittingForm} className={errors.priceOrPromotion ? "border-red-500" : ""} />
                                    {errors.priceOrPromotion && <p className="text-sm text-red-500">{errors.priceOrPromotion}</p>}
                                </div>

                                {/* Válido Hasta */}
                                <div className="space-y-2">
                                    <Label htmlFor="validUntil" className="font-medium text-gray-700">Promoción Válida Hasta (Opcional)</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={`w-full justify-start text-left font-normal ${!formData.validUntil ? "text-gray-500" : "text-gray-900"} ${errors.validUntil ? "border-red-500" : ""}`}
                                                disabled={isSubmittingForm}
                                            >
                                                <CalendarIconLucide className="mr-2 h-4 w-4" />
                                                {formData.validUntil ? format(new Date(formData.validUntil), "PPP", { locale: es }) : <span>Siempre válido / No aplica</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <div className="flex justify-end p-1">
                                                <Button variant="ghost" size="sm" onClick={() => handleDateChange(undefined)} disabled={isSubmittingForm}>Limpiar</Button>
                                            </div>
                                            <Calendar
                                                mode="single"
                                                selected={formData.validUntil ? new Date(formData.validUntil) : undefined}
                                                onSelect={handleDateChange}
                                                initialFocus
                                                disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1)) || isSubmittingForm} // No permitir fechas pasadas
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    {errors.validUntil && <p className="text-sm text-red-500">{errors.validUntil}</p>}
                                </div>


                                <div className="pt-4 border-t">
                                    <Label className="text-md font-semibold text-gray-700">Información de Contacto y Ubicación del Negocio</Label>
                                    <p className="text-xs text-gray-500 mb-3">Esta información ayudará a los clientes a encontrarte y contactarte.</p>
                                    {/* Dirección Completa */}
                                    <div className="space-y-2 mt-2">
                                        <Label htmlFor="addressProduct" className="font-medium text-gray-700">Dirección Completa del Negocio <span className="text-red-500">*</span></Label>
                                        <Input id="addressProduct" name="address" value={formData.address} onChange={handleChange} placeholder="Calle, Número, Colonia donde se encuentra el negocio" disabled={isSubmittingForm} className={errors.address ? "border-red-500" : ""} />
                                        {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="cityProduct" className="font-medium text-gray-700">Ciudad <span className="text-red-500">*</span></Label>
                                            <Input id="cityProduct" name="city" value={formData.city} onChange={handleChange} placeholder="Ciudad del negocio" disabled={isSubmittingForm} className={errors.city ? "border-red-500" : ""} />
                                            {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="stateProduct" className="font-medium text-gray-700">Estado <span className="text-red-500">*</span></Label>
                                            <Select value={formData.state} onValueChange={handleStateChange} name="state" disabled={isSubmittingForm}>
                                                <SelectTrigger id="stateProduct" className={errors.state ? "border-red-500" : ""}><SelectValue placeholder="Estado del negocio" /></SelectTrigger>
                                                <SelectContent><SelectGroup><SelectLabel>Estados de México</SelectLabel>{MEXICAN_STATES.map(stateName => (<SelectItem key={stateName} value={stateName}>{stateName}</SelectItem>))}</SelectGroup></SelectContent>
                                            </Select>
                                            {errors.state && <p className="text-sm text-red-500">{errors.state}</p>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="zipCodeProduct" className="font-medium text-gray-700">Código Postal</Label>
                                            <Input id="zipCodeProduct" name="zipCode" value={formData.zipCode} onChange={handleChange} placeholder="C.P." disabled={isSubmittingForm} className={errors.zipCode ? "border-red-500" : ""} />
                                            {errors.zipCode && <p className="text-sm text-red-500">{errors.zipCode}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phoneProduct" className="font-medium text-gray-700">Teléfono de Contacto</Label>
                                            <Input id="phoneProduct" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="Teléfono del negocio" disabled={isSubmittingForm} className={errors.phone ? "border-red-500" : ""} />
                                            {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="latitudeProduct" className="font-medium text-gray-700">Latitud (Opcional)</Label>
                                            <Input id="latitudeProduct" name="latitude" type="text" value={formData.latitude} onChange={handleChange} placeholder="Ej: 18.9211" disabled={isSubmittingForm} className={errors.latitude ? "border-red-500" : ""} />
                                            {errors.latitude && <p className="text-sm text-red-500">{errors.latitude}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="longitudeProduct" className="font-medium text-gray-700">Longitud (Opcional)</Label>
                                            <Input id="longitudeProduct" name="longitude" type="text" value={formData.longitude} onChange={handleChange} placeholder="Ej: -99.2340" disabled={isSubmittingForm} className={errors.longitude ? "border-red-500" : ""} />
                                            {errors.longitude && <p className="text-sm text-red-500">{errors.longitude}</p>}
                                        </div>
                                    </div>
                                    <div className="space-y-2 mt-4">
                                        <Label htmlFor="openingHoursProduct" className="font-medium text-gray-700">Horarios de Atención (Opcional)</Label>
                                        <Input id="openingHoursProduct" name="openingHours" value={formData.openingHours} onChange={handleChange} placeholder="L-V: 9am-6pm, S: 10am-2pm" disabled={isSubmittingForm} className={errors.openingHours ? "border-red-500" : ""} />
                                        {errors.openingHours && <p className="text-sm text-red-500">{errors.openingHours}</p>}
                                    </div>
                                    <div className="space-y-2 mt-4">
                                        <Label htmlFor="contactEmailProduct" className="font-medium text-gray-700">Email de Contacto (Opcional)</Label>
                                        <Input id="contactEmailProduct" name="contactEmail" type="email" value={formData.contactEmail} onChange={handleChange} placeholder="info@negocio.com" disabled={isSubmittingForm} className={errors.contactEmail ? "border-red-500" : ""} />
                                        {errors.contactEmail && <p className="text-sm text-red-500">{errors.contactEmail}</p>}
                                    </div>
                                    <div className="space-y-2 mt-4">
                                        <Label htmlFor="websiteProduct" className="font-medium text-gray-700">Sitio Web (Opcional)</Label>
                                        <Input id="websiteProduct" name="website" type="url" value={formData.website} onChange={handleChange} placeholder="https://www.negocio.com" disabled={isSubmittingForm} className={errors.website ? "border-red-500" : ""} />
                                        {errors.website && <p className="text-sm text-red-500">{errors.website}</p>}
                                    </div>
                                    <div className="space-y-2 mt-4">
                                        <Label htmlFor="socialMediaLinksProduct" className="font-medium text-gray-700">Redes Sociales (Opcional)</Label>
                                        <Input id="socialMediaLinksProduct" name="socialMediaLinks" value={formData.socialMediaLinks} onChange={handleChange} placeholder="facebook.com/negocio, instagram.com/negocio" disabled={isSubmittingForm} className={errors.socialMediaLinks ? "border-red-500" : ""} />
                                        {errors.socialMediaLinks && <p className="text-sm text-red-500">{errors.socialMediaLinks}</p>}
                                    </div>
                                </div>


                            </CardContent>
                            <CardFooter className="border-t pt-6">
                                <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-lg py-3" disabled={isSubmittingForm}>
                                    {isSubmittingForm ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
                                    Proceder al Pago (${PRODUCT_PROMOTION_PRICE_MXN.toFixed(2)} MXN)
                                </Button>
                            </CardFooter>
                        </form>
                    </>
                )}

                {formStep === "payment" && clientSecret && stripe && elements && (
                    <>
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <CreditCard className="h-8 w-8 text-sky-600" />
                                <CardTitle className="text-3xl font-semibold text-gray-800">Realizar Pago del Producto</CardTitle>
                            </div>
                            <CardDescription className="text-gray-600">
                                Completa el pago de ${PRODUCT_PROMOTION_PRICE_MXN.toFixed(2)} MXN para publicar la promoción de tu producto/servicio.
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
                                <Button type="submit" className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-lg py-3" disabled={!stripe || !elements || paymentProcessing || isSubmittingForm}>
                                    {paymentProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                                    Pagar ${PRODUCT_PROMOTION_PRICE_MXN.toFixed(2)} MXN
                                </Button>
                            </CardFooter>
                        </form>
                    </>
                )}
            </Card>

            <footer className="w-full max-w-4xl mt-12 text-center">
                <p className="text-xs text-gray-500">
                    © {new Date().getFullYear()} EcoMetrics. Todos los derechos reservados.
                    <Link href="/terminos-promocion-producto" className="underline hover:text-sky-600 ml-2">Términos de Promoción de Producto</Link>
                </p>
            </footer>
        </div>
    );
}


export default function PromoteProductPage() {
    return (
        <Elements stripe={stripePromise} options={{
            mode: 'payment',
            amount: PRODUCT_PROMOTION_PRICE_MXN * 100,
            currency: 'mxn',
            appearance: { theme: 'stripe' /* o 'flat', etc. */ },
        }}>
            <PromoteProductForm />
        </Elements>
    );
}