// app/educacion/articulos/editar/[articleId]/page.tsx
"use client";

import React, { useState, useEffect, FormEvent, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { BookOpen, Loader2, ImagePlus, AlertCircle, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/dashboard-layout";
// Reutiliza el hook de sesión
// import { useSession } from "@/hooks/useSession"; // Tu hook de sesión
import { ArticleTopic, UserType } from "@prisma/client";
import { z } from "zod";
import toast from "react-hot-toast";
import { uploadAvatarToS3, validateAvatarFile } from "@/lib/s3-service"; // Para la imagen de portada
import Image from "next/image";

// Esquema de validación Zod (puede ser el mismo que para crear, pero campos opcionales para PUT)
const articleUpdateFormSchema = z.object({
    title: z.string().min(5, "El título debe tener al menos 5 caracteres.").max(150, "Máximo 150 caracteres.").optional(),
    content: z.string().min(50, "El contenido debe tener al menos 50 caracteres.").optional(),
    topic: z.nativeEnum(ArticleTopic, { errorMap: () => ({ message: "Selecciona un tema válido." }) }).optional(),
    authorName: z.string().min(3, "Nombre del autor requerido.").max(100).optional(),
    authorInstitution: z.string().min(3, "Institución requerida.").max(150).optional(),
    authorInfo: z.string().max(300, "Máximo 300 caracteres.").optional().nullable(),
    coverImageUrl: z.string().url("URL de imagen inválida.").optional().nullable(),
});

type ArticleUpdateFormData = z.infer<typeof articleUpdateFormSchema>;
type ArticleFormErrors = Partial<Record<keyof ArticleUpdateFormData, string>>;

// Hook simple para obtener la sesión del usuario (reutilizado)
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

interface ArticleDetailForEdit {
    id: string;
    title: string;
    content: string;
    topic: ArticleTopic;
    authorName: string;
    authorInstitution: string;
    authorInfo?: string | null;
    coverImageUrl?: string | null;
    userId: string;
}


export default function EditEducationalArticlePage() {
    const router = useRouter();
    const params = useParams();
    const articleId = params.articleId as string;

    const { session, isLoadingSession } = useUserSession();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [formData, setFormData] = useState<Partial<ArticleUpdateFormData>>({}); // Partial para datos iniciales
    const [errors, setErrors] = useState<ArticleFormErrors>({});
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
    const coverImageInputRef = useRef<HTMLInputElement>(null);
    const [originalArticleUserId, setOriginalArticleUserId] = useState<string | null>(null);

    useEffect(() => {
        if (!articleId) {
            toast.error("ID de artículo no especificado.");
            router.push("/educacion");
            return;
        }

        async function fetchArticleData() {
            setIsLoadingData(true);
            try {
                const res = await fetch(`/api/education/articles/${articleId}`);
                if (res.status === 404) {
                    toast.error("Artículo no encontrado.");
                    router.push("/educacion");
                    return;
                }
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || "Error al cargar datos del artículo");
                }
                const articleData: ArticleDetailForEdit = await res.json();

                setFormData({
                    title: articleData.title,
                    content: articleData.content,
                    topic: articleData.topic,
                    authorName: articleData.authorName,
                    authorInstitution: articleData.authorInstitution,
                    authorInfo: articleData.authorInfo,
                    coverImageUrl: articleData.coverImageUrl,
                });
                setOriginalArticleUserId(articleData.userId);
                if (articleData.coverImageUrl) {
                    setCoverImagePreview(articleData.coverImageUrl)
                }

            } catch (error) {
                console.error("Error cargando artículo para editar:", error);
                toast.error(error instanceof Error ? error.message : "Error al cargar el artículo.");
                router.push("/educacion");
            } finally {
                setIsLoadingData(false);
            }
        }
        fetchArticleData();
    }, [articleId, router]);

    if (isLoadingSession || isLoadingData) {
        return <DashboardLayout><div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> Cargando datos del artículo...</div></DashboardLayout>;
    }

    // Permisos: El usuario debe ser el creador Y ser SCHOOL o GOVERNMENT
    if (!session || (session.id !== originalArticleUserId) || (session.userType !== UserType.SCHOOL && session.userType !== UserType.GOVERNMENT)) {
        return (
            <DashboardLayout>
                <div className="container mx-auto px-4 py-8 text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <h1 className="text-2xl font-semibold">Acceso Denegado</h1>
                    <p className="text-muted-foreground mt-2">
                        No tienes permisos para editar este contenido educativo.
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
            const validation = validateAvatarFile(file);
            if (!validation.valid) {
                toast.error(validation.error || "Archivo de imagen de portada inválido.");
                setCoverImageFile(null);
                setCoverImagePreview(formData.coverImageUrl || null); // Revert to original if invalid
                setErrors(prev => ({ ...prev, coverImageUrl: validation.error }));
                if (coverImageInputRef.current) coverImageInputRef.current.value = "";
                return;
            }
            setCoverImageFile(file);
            if (coverImagePreview) URL.revokeObjectURL(coverImagePreview); // Revoke old object URL if it was one
            setCoverImagePreview(URL.createObjectURL(file));
            setErrors(prev => ({ ...prev, coverImageUrl: undefined }));
        } else {
            setCoverImageFile(null);
            // Do not clear preview if no file is selected, keep original or last manual URL
        }
    };

    const removeCoverImage = () => {
        setCoverImageFile(null);
        if (coverImagePreview && coverImagePreview.startsWith("blob:")) URL.revokeObjectURL(coverImagePreview);
        setCoverImagePreview(null);
        setFormData(prev => ({ ...prev, coverImageUrl: "" })); // Clear the URL
        if (coverImageInputRef.current) coverImageInputRef.current.value = "";
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrors({});
        setIsSubmitting(true);

        let finalCoverImageUrl = formData.coverImageUrl || null;

        if (coverImageFile) {
            toast.loading("Subiendo nueva imagen de portada...");
            try {
                const s3Response = await uploadAvatarToS3(coverImageFile, "education-covers/");
                finalCoverImageUrl = s3Response.publicUrl;
                toast.dismiss();
            } catch (uploadError) {
                console.error("Error al subir imagen de portada:", uploadError);
                toast.dismiss();
                toast.error("Error al subir la nueva imagen de portada. Intenta de nuevo.");
                setErrors(prev => ({ ...prev, coverImageUrl: "Error al subir la imagen." }));
                setIsSubmitting(false);
                return;
            }
        }

        const dataToValidate = {
            title: formData.title,
            content: formData.content,
            topic: formData.topic,
            authorName: formData.authorName,
            authorInstitution: formData.authorInstitution,
            authorInfo: formData.authorInfo || null,
            coverImageUrl: finalCoverImageUrl,
        };

        const validationResult = articleUpdateFormSchema.safeParse(dataToValidate);

        if (!validationResult.success) {
            const newErrors: ArticleFormErrors = {};
            validationResult.error.errors.forEach(err => {
                newErrors[err.path[0] as keyof ArticleUpdateFormData] = err.message;
            });
            setErrors(newErrors);
            toast.error("Por favor, corrige los errores en el formulario.");
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch(`/api/education/articles/${articleId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(validationResult.data), // Enviar solo los datos validados
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al actualizar el artículo");
            }

            toast.success("Artículo actualizado exitosamente!");
            router.push(`/educacion/articulos/${articleId}`); // Redirigir a la página del artículo
            router.refresh();

        } catch (error) {
            console.error("Error al enviar formulario de edición:", error);
            toast.error(error instanceof Error ? error.message : "Error desconocido al actualizar.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const articleTopicsArray = Object.values(ArticleTopic);

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                <Card className="max-w-3xl mx-auto">
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <BookOpen className="h-7 w-7 text-blue-600" />
                            <CardTitle className="text-2xl font-semibold">Editar Artículo o Guía</CardTitle>
                        </div>
                        <CardDescription>
                            Modifica los detalles de tu artículo y guarda los cambios.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6">
                            {/* Título */}
                            <div className="space-y-1">
                                <Label htmlFor="title">Título del Artículo <span className="text-red-500">*</span></Label>
                                <Input id="title" name="title" value={formData.title || ""} onChange={handleInputChange} disabled={isSubmitting} className={errors.title ? "border-red-500" : ""} />
                                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                            </div>

                            {/* Contenido (Textarea) */}
                            <div className="space-y-1">
                                <Label htmlFor="content">Contenido del Artículo <span className="text-red-500">*</span></Label>
                                <Textarea id="content" name="content" value={formData.content || ""} onChange={handleInputChange} rows={10} disabled={isSubmitting} className={errors.content ? "border-red-500" : ""} />
                                {errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
                            </div>

                            {/* Tema */}
                            <div className="space-y-1">
                                <Label htmlFor="topic">Tema Principal <span className="text-red-500">*</span></Label>
                                <Select value={formData.topic || ""} onValueChange={handleTopicChange} name="topic" disabled={isSubmitting}>
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
                                <div className={`flex items-center justify-center w-full p-4 border-2 ${errors.coverImageUrl ? 'border-red-500' : 'border-gray-300'} border-dashed rounded-lg`}>
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
                                            <p className="text-xs">Subir nueva imagen (PNG, JPG, WEBP - Máx. 5MB)</p>
                                        </div>
                                    )}
                                </div>
                                <Input
                                    id="coverImageUrl"
                                    name="coverImageUrl"
                                    value={formData.coverImageUrl || ""}
                                    onChange={handleInputChange}
                                    placeholder="O ingresa/modifica una URL de imagen existente"
                                    disabled={isSubmitting || !!coverImageFile}
                                    className={`mt-2 ${errors.coverImageUrl ? "border-red-500" : ""} ${!!coverImageFile ? "bg-gray-100" : ""}`}
                                />
                                {errors.coverImageUrl && <p className="text-sm text-red-500">{errors.coverImageUrl}</p>}
                                {formData.coverImageUrl && !coverImageFile && <p className="text-xs text-muted-foreground mt-1">URL actual: {formData.coverImageUrl}</p>}
                            </div>

                            {/* Información del Autor */}
                            <div className="pt-4 border-t">
                                <h3 className="text-md font-semibold mb-3">Información del Autor</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="authorName">Nombre del Autor <span className="text-red-500">*</span></Label>
                                        <Input id="authorName" name="authorName" value={formData.authorName || ""} onChange={handleInputChange} disabled={isSubmitting} className={errors.authorName ? "border-red-500" : ""} />
                                        {errors.authorName && <p className="text-sm text-red-500">{errors.authorName}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="authorInstitution">Institución <span className="text-red-500">*</span></Label>
                                        <Input id="authorInstitution" name="authorInstitution" value={formData.authorInstitution || ""} onChange={handleInputChange} disabled={isSubmitting} className={errors.authorInstitution ? "border-red-500" : ""} />
                                        {errors.authorInstitution && <p className="text-sm text-red-500">{errors.authorInstitution}</p>}
                                    </div>
                                </div>
                                <div className="space-y-1 mt-4">
                                    <Label htmlFor="authorInfo">Información Adicional del Autor (Opcional)</Label>
                                    <Textarea id="authorInfo" name="authorInfo" value={formData.authorInfo || ""} onChange={handleInputChange} rows={2} disabled={isSubmitting} className={errors.authorInfo ? "border-red-500" : ""} />
                                    {errors.authorInfo && <p className="text-sm text-red-500">{errors.authorInfo}</p>}
                                </div>
                            </div>

                        </CardContent>
                        <CardFooter className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Guardar Cambios
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </DashboardLayout>
    );
}