// app/educacion/articulos/nuevo/page.tsx
"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Loader2, ImagePlus, AlertCircle, Save, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/dashboard-layout";
import { ArticleTopic, UserType } from "@prisma/client";
import { z } from "zod";
import toast from "react-hot-toast";
import { uploadAvatarToS3, validateAvatarFile } from "@/lib/s3-service"; // Para la imagen de portada
import Image from "next/image";

// Esquema de validación Zod para el frontend
const articleFormSchema = z.object({
    title: z.string().min(5, "El título debe tener al menos 5 caracteres.").max(150, "Máximo 150 caracteres."),
    content: z.string().min(50, "El contenido debe tener al menos 50 caracteres."),
    topic: z.nativeEnum(ArticleTopic, { errorMap: () => ({ message: "Selecciona un tema válido." }) }),
    authorName: z.string().min(3, "Nombre del autor requerido.").max(100),
    authorInstitution: z.string().min(3, "Institución requerida.").max(150),
    authorInfo: z.string().max(300, "Máximo 300 caracteres.").optional().nullable(),
    coverImageUrl: z.string().url("URL de imagen inválida.").optional().nullable(), // Temporalmente string, idealmente File
});

type ArticleFormData = z.infer<typeof articleFormSchema>;
type ArticleFormErrors = Partial<Record<keyof ArticleFormData, string>>;

// Hook simple para obtener la sesión del usuario (puedes adaptarlo o usar tu método existente)
function useUserSession() {
    const [session, setSession] = useState<{ id: string; userType: UserType; role: string, name: string, email: string } | null>(null);
    const [isLoadingSession, setIsLoadingSession] = useState(true);

    useEffect(() => {
        async function fetchSession() {
            try {
                const res = await fetch('/api/auth/session');
                if (res.ok) {
                    const data = await res.json();
                    setSession(data.user);
                    console.log("Data User:", data.user);

                } else {
                    setSession(null);
                }
            } catch (error) {
                console.error("Error fetching session:", error);
                setSession(null);
            } finally {
                setIsLoadingSession(false);
            }
        }
        fetchSession();
    }, []);
    return { session, isLoadingSession };
}


export default function NewEducationalArticlePage() {
    const router = useRouter();
    const { session, isLoadingSession } = useUserSession();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<ArticleFormData>({
        title: "",
        content: "",
        topic: ArticleTopic.REDUCCION_RESIDUOS, // Valor por defecto
        authorName: "",
        authorInstitution: "",
        authorInfo: "",
        coverImageUrl: "",
    });
    const [errors, setErrors] = useState<ArticleFormErrors>({});
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
    const coverImageInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isLoadingSession && session) {
            // Pre-llenar autor e institución si es posible
            setFormData(prev => ({
                ...prev,
                authorName: session.name || "",
                // Asumimos que la institución podría venir de algún campo del perfil,
                // o el usuario lo debe llenar. Aquí un placeholder.
                authorInstitution: session.userType === UserType.SCHOOL || session.userType === UserType.GOVERNMENT ? session.name : ""
            }));
        }
    }, [session, isLoadingSession]);


    if (isLoadingSession) {
        return <DashboardLayout><div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div></DashboardLayout>;
    }

    if (!session || (session.userType !== UserType.SCHOOL && session.userType !== UserType.GOVERNMENT)) {
        // Esta verificación también debería estar en el middleware, pero una doble capa es buena.
        return (
            <DashboardLayout>
                <div className="container mx-auto px-4 py-8 text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <h1 className="text-2xl font-semibold">Acceso Denegado</h1>
                    <p className="text-muted-foreground mt-2">
                        No tienes permisos para crear contenido educativo. Esta función está reservada para usuarios de tipo Escuela o Gobierno.
                    </p>
                    <Button asChild className="mt-6">
                        <Link href="/educacion">Volver a Educación</Link>
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof ArticleFormErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleTopicChange = (value: string) => {
        setFormData(prev => ({ ...prev, topic: value as ArticleTopic }));
        if (errors.topic) {
            setErrors(prev => ({ ...prev, topic: undefined }));
        }
    };

    const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const validation = validateAvatarFile(file); // Reutilizando validación de avatar para simplicidad
            if (!validation.valid) {
                toast.error(validation.error || "Archivo de imagen de portada inválido.");
                setCoverImageFile(null);
                setCoverImagePreview(null);
                setErrors(prev => ({ ...prev, coverImageUrl: validation.error }));
                if (coverImageInputRef.current) coverImageInputRef.current.value = "";
                return;
            }
            setCoverImageFile(file);
            setCoverImagePreview(URL.createObjectURL(file));
            setErrors(prev => ({ ...prev, coverImageUrl: undefined }));
        } else {
            setCoverImageFile(null);
            setCoverImagePreview(null);
        }
    };

    const removeCoverImage = () => {
        setCoverImageFile(null);
        if (coverImagePreview) URL.revokeObjectURL(coverImagePreview);
        setCoverImagePreview(null);
        setFormData(prev => ({ ...prev, coverImageUrl: "" })); // Limpiar si se estaba usando una URL manual
        if (coverImageInputRef.current) coverImageInputRef.current.value = "";
    };


    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrors({});
        setIsSubmitting(true);

        let finalCoverImageUrl = formData.coverImageUrl || null;

        if (coverImageFile) {
            toast.loading("Subiendo imagen de portada...");
            try {
                const s3Response = await uploadAvatarToS3(coverImageFile, "education-covers/");
                finalCoverImageUrl = s3Response.publicUrl; // Usar la URL pública directamente
                toast.dismiss();
            } catch (uploadError) {
                console.error("Error al subir imagen de portada:", uploadError);
                toast.dismiss();
                toast.error("Error al subir la imagen de portada. Intenta de nuevo.");
                setErrors(prev => ({ ...prev, coverImageUrl: "Error al subir la imagen." }));
                setIsSubmitting(false);
                return;
            }
        }


        const dataToValidate: ArticleFormData = {
            ...formData,
            coverImageUrl: finalCoverImageUrl, // URL de S3 o la manual
            authorInfo: formData.authorInfo || null, // Asegurar null si está vacío
        };

        const validationResult = articleFormSchema.safeParse(dataToValidate);

        if (!validationResult.success) {
            const newErrors: ArticleFormErrors = {};
            validationResult.error.errors.forEach(err => {
                newErrors[err.path[0] as keyof ArticleFormData] = err.message;
            });
            setErrors(newErrors);
            toast.error("Por favor, corrige los errores en el formulario.");
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch("/api/education/articles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(validationResult.data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al crear el artículo");
            }

            toast.success("Artículo creado exitosamente!");
            router.push("/educacion"); // Redirigir a la página principal de educación
            router.refresh(); // Para asegurar que la lista se actualice

        } catch (error) {
            console.error("Error al enviar formulario:", error);
            toast.error(error instanceof Error ? error.message : "Error desconocido al crear el artículo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const articleTopicsArray = Object.values(ArticleTopic);
    console.log(session);


    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8 mt-10 lg:mt-0">
                <div className="mb-6">
                    <Link href="/educacion/articulos/" className="text-sm text-green-600 hover:underline flex items-center">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Volver a todos los artículos
                    </Link>
                </div>
                <Card className="max-w-3xl mx-auto">
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <BookOpen className="h-7 w-7 text-green-600" />
                            <CardTitle className="text-2xl font-semibold">Crear Nuevo Artículo o Guía</CardTitle>
                        </div>
                        <CardDescription>
                            Comparte tu conocimiento sobre sostenibilidad. Completa los campos para publicar tu contenido.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6">
                            {/* Título */}
                            <div className="space-y-1">
                                <Label htmlFor="title">Título del Artículo <span className="text-red-500">*</span></Label>
                                <Input id="title" name="title" value={formData.title} onChange={handleInputChange} placeholder="Ej: 10 Formas Sencillas de Reducir tu Huella de Carbono" disabled={isSubmitting} className={errors.title ? "border-red-500" : ""} />
                                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                            </div>

                            {/* Contenido (Textarea) */}
                            <div className="space-y-1">
                                <Label htmlFor="content">Contenido del Artículo <span className="text-red-500">*</span></Label>
                                <Textarea id="content" name="content" value={formData.content} onChange={handleInputChange} placeholder="Escribe aquí el contenido detallado de tu artículo o guía..." rows={10} disabled={isSubmitting} className={errors.content ? "border-red-500" : ""} />
                                {errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
                                <p className="text-xs text-muted-foreground">Puedes usar saltos de línea. Para un formato más rico, considera implementar un editor Markdown o Rich Text.</p>
                            </div>

                            {/* Tema */}
                            <div className="space-y-1">
                                <Label htmlFor="topic">Tema Principal <span className="text-red-500">*</span></Label>
                                <Select value={formData.topic} onValueChange={handleTopicChange} name="topic" disabled={isSubmitting}>
                                    <SelectTrigger id="topic" className={errors.topic ? "border-red-500" : ""}>
                                        <SelectValue placeholder="Selecciona un tema" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Temas de Sostenibilidad</SelectLabel>
                                            {articleTopicsArray.map(topicValue => (
                                                <SelectItem key={topicValue} value={topicValue}>
                                                    {topicValue.replace(/_/g, " ").charAt(0).toUpperCase() + topicValue.replace(/_/g, " ").slice(1).toLowerCase()}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                {errors.topic && <p className="text-sm text-red-500">{errors.topic}</p>}
                            </div>

                            {/* Imagen de Portada */}
                            <div className="space-y-1">
                                <Label htmlFor="coverImageFile">Imagen de Portada (Opcional)</Label>
                                {/* <div className={`flex items-center justify-center w-full p-4 border-2 ${errors.coverImageUrl ? 'border-red-500' : 'border-gray-300'} border-dashed rounded-lg`}>
                                    <input type="file" id="coverImageFile" ref={coverImageInputRef} onChange={handleCoverImageChange} className="hidden" accept="image/png, image/jpeg, image/webp" disabled={isSubmitting} />
                                    {coverImagePreview ? (
                                        <div className="relative group w-full h-48">
                                            <Image src={coverImagePreview} alt="Vista previa de portada" layout="fill" objectFit="contain" className="rounded-md" />
                                            <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-7 w-7 z-10 opacity-70 group-hover:opacity-100" onClick={removeCoverImage} disabled={isSubmitting}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-500 cursor-pointer hover:bg-gray-50 p-4 rounded-md w-full" onClick={() => coverImageInputRef.current?.click()}>
                                            <ImagePlus className="mx-auto h-10 w-10 mb-1" />
                                            <p className="text-xs">Subir imagen (PNG, JPG, WEBP - Máx. 5MB)</p>
                                        </div>
                                    )}
                                </div> */}
                                <Input
                                    id="coverImageUrl"
                                    name="coverImageUrl"
                                    value={formData.coverImageUrl || ""}
                                    onChange={handleInputChange}
                                    placeholder="Ingresa una URL de imagen existente"
                                    disabled={isSubmitting || !!coverImageFile} // Deshabilitar si se subió un archivo
                                    className={`mt-2 ${errors.coverImageUrl ? "border-red-500" : ""} ${!!coverImageFile ? "bg-gray-100" : ""}`}
                                />
                                {errors.coverImageUrl && <p className="text-sm text-red-500">{errors.coverImageUrl}</p>}
                            </div>


                            {/* Información del Autor */}
                            <div className="pt-4 border-t">
                                <h3 className="text-md font-semibold mb-3">Información del Autor</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="authorName">Nombre del Autor <span className="text-red-500">*</span></Label>
                                        <Input id="authorName" name="authorName" value={formData.authorName} onChange={handleInputChange} placeholder="Ej: Dra. Jane Goodall" disabled={isSubmitting} className={errors.authorName ? "border-red-500" : ""} />
                                        {errors.authorName && <p className="text-sm text-red-500">{errors.authorName}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="authorInstitution">Institución <span className="text-red-500">*</span></Label>
                                        <Input id="authorInstitution" name="authorInstitution" value={formData.authorInstitution} onChange={handleInputChange} placeholder="Ej: Instituto de Ecología, A.C." disabled={isSubmitting} className={errors.authorInstitution ? "border-red-500" : ""} />
                                        {errors.authorInstitution && <p className="text-sm text-red-500">{errors.authorInstitution}</p>}
                                    </div>
                                </div>
                                <div className="space-y-1 mt-4">
                                    <Label htmlFor="authorInfo">Información Adicional del Autor (Opcional)</Label>
                                    <Textarea id="authorInfo" name="authorInfo" value={formData.authorInfo || ""} onChange={handleInputChange} placeholder="Ej: Bióloga con especialidad en ecosistemas forestales, Directora del Programa de Conservación..." rows={2} disabled={isSubmitting} className={errors.authorInfo ? "border-red-500" : ""} />
                                    {errors.authorInfo && <p className="text-sm text-red-500">{errors.authorInfo}</p>}
                                </div>
                            </div>

                        </CardContent>
                        <CardFooter className="flex flex-col justify-center gap-3 sm:flex-row sm:items-start sm:justify-end">
                            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Publicar Artículo
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </DashboardLayout>
    );
}