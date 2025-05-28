// app/education/visual/nuevo/page.tsx
"use client";

import React, { useState, useEffect, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2, ImagePlus, Save, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/dashboard-layout";
import { VisualMaterialTopic, UserType } from "@prisma/client"; // Asumiendo que VisualMaterialTopic se genera en el cliente Prisma
import { z } from "zod";
import toast from "react-hot-toast";
import Image from "next/image";
import { ALLOWED_IMAGE_TYPES, MAX_FILES, MIN_FILES, MAX_FILE_SIZE } from "@/types/types-s3-service";

// Esquema de validación Zod para el frontend
const visualMaterialFormSchemaClient = z.object({
    title: z.string().min(5, "El título debe tener al menos 5 caracteres.").max(150, "Máximo 150 caracteres."),
    description: z.string().max(1000, "Máximo 1000 caracteres.").optional().nullable(),
    topic: z.nativeEnum(VisualMaterialTopic, { errorMap: () => ({ message: "Selecciona un tema válido." }) }),
    authorName: z.string().min(3, "Nombre del autor requerido.").max(100),
    authorInstitution: z.string().min(3, "Institución requerida.").max(150),
    authorInfo: z.string().max(500, "Máximo 500 caracteres.").optional().nullable(),
    images: z.array(z.instanceof(File))
        .min(MIN_FILES, `Debes subir al menos ${MIN_FILES} imagen.`)
        .max(MAX_FILES, `Puedes subir un máximo de ${MAX_FILES} imágenes.`)
        .refine(files => files.every(file => file.size <= MAX_FILE_SIZE), `Cada imagen no debe exceder ${MAX_FILE_SIZE / (1024 * 1024)}MB.`)
        .refine(files => files.every(file => ALLOWED_IMAGE_TYPES.includes(file.type)), "Alguna imagen tiene un tipo de archivo no permitido (JPG, PNG, WEBP)."),
});

type VisualMaterialFormClientData = z.infer<typeof visualMaterialFormSchemaClient>;
type VisualMaterialFormErrors = Partial<Record<keyof VisualMaterialFormClientData, string>>;

function useUserSession() {
    // ... (código del hook useUserSession como en educacion/articulos/nuevo/page.tsx)
    const [session, setSession] = useState<{ id: string; userType: UserType; role: string, name: string, email: string } | null>(null);
    const [isLoadingSession, setIsLoadingSession] = useState(true);

    useEffect(() => {
        async function fetchSession() {
            try {
                const res = await fetch('/api/auth/session');
                if (res.ok) {
                    const data = await res.json();
                    setSession(data.user);
                } else { setSession(null); }
            } catch (error) { console.error("Error fetching session:", error); setSession(null); }
            finally { setIsLoadingSession(false); }
        }
        fetchSession();
    }, []);
    return { session, isLoadingSession };
}


export default function NewVisualMaterialPage() {
    const router = useRouter();
    const { session, isLoadingSession } = useUserSession();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormDataState] = useState<Omit<VisualMaterialFormClientData, 'images'> & { images: File[] }>({
        title: "", description: "", topic: VisualMaterialTopic.INFOGRAFIA, // Valor por defecto
        authorName: "", authorInstitution: "", authorInfo: "", images: [],
    });
    const [errors, setErrors] = useState<VisualMaterialFormErrors>({});
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const imageInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isLoadingSession && session) {
            setFormDataState(prev => ({
                ...prev,
                authorName: session.name || "",
                authorInstitution: (session.userType === UserType.SCHOOL || session.userType === UserType.GOVERNMENT) ? session.name : "",
            }));
        }
    }, [session, isLoadingSession]);

    if (isLoadingSession) {
        return <DashboardLayout><div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div></DashboardLayout>;
    }
    if (!session || (session.userType !== UserType.SCHOOL && session.userType !== UserType.GOVERNMENT)) {
        return <DashboardLayout><div className="container mx-auto p-4 text-center">Acceso Denegado.</div></DashboardLayout>;
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormDataState(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof VisualMaterialFormErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };
    const handleTopicChange = (value: string) => {
        setFormDataState(prev => ({ ...prev, topic: value as VisualMaterialTopic }));
        if (errors.topic) setErrors(prev => ({ ...prev, topic: undefined }));
    };

    const handleImageFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const filesArray = Array.from(e.target.files || []);
        if (filesArray.length === 0) return;

        const currentTotalFiles = formData.images.length + filesArray.length;
        if (currentTotalFiles > MAX_FILES) {
            setErrors(prev => ({ ...prev, images: `No puedes subir más de ${MAX_FILES} imágenes.` }));
            if (imageInputRef.current) imageInputRef.current.value = "";
            return;
        }

        const newImageFiles = [...formData.images, ...filesArray];
        const validationResult = visualMaterialFormSchemaClient.shape.images.safeParse(newImageFiles);

        if (!validationResult.success) {
            setErrors(prev => ({ ...prev, images: validationResult.error.issues[0].message }));
            if (imageInputRef.current) imageInputRef.current.value = "";
            return;
        }

        setFormDataState(prev => ({ ...prev, images: newImageFiles }));
        const newPreviews = filesArray.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews]);
        setErrors(prev => ({ ...prev, images: undefined }));
        if (imageInputRef.current) imageInputRef.current.value = "";
    };

    const removeImageFile = (index: number) => {
        URL.revokeObjectURL(imagePreviews[index]);
        setFormDataState(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        // Re-validar o limpiar errores de cantidad si es necesario
        if (formData.images.length - 1 < MAX_FILES && errors.images?.includes("máximo")) {
            setErrors(prev => ({ ...prev, images: undefined }));
        }
        if (formData.images.length - 1 >= MIN_FILES && errors.images?.includes("al menos")) {
            setErrors(prev => ({ ...prev, images: undefined }));
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrors({});
        setIsSubmitting(true);

        const validationResult = visualMaterialFormSchemaClient.safeParse(formData);
        if (!validationResult.success) {
            const newErrors: VisualMaterialFormErrors = {};
            validationResult.error.errors.forEach(err => {
                newErrors[err.path[0] as keyof VisualMaterialFormClientData] = err.message;
            });
            setErrors(newErrors);
            toast.error("Por favor, corrige los errores en el formulario.");
            setIsSubmitting(false);
            return;
        }

        const apiFormData = new FormData();
        apiFormData.append("title", formData.title);
        if (formData.description) apiFormData.append("description", formData.description);
        apiFormData.append("topic", formData.topic);
        apiFormData.append("authorName", formData.authorName);
        apiFormData.append("authorInstitution", formData.authorInstitution);
        if (formData.authorInfo) apiFormData.append("authorInfo", formData.authorInfo);

        formData.images.forEach((file, index) => {
            apiFormData.append(`images[${index}]`, file);
        });

        try {
            const response = await fetch("/api/education/visual-materials", {
                method: "POST",
                body: apiFormData, // FormData se envía directamente
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al crear el material visual");
            }
            toast.success("Material visual creado exitosamente!");
            router.push("/educacion?tab=visual"); // Redirigir a la pestaña de material visual
            router.refresh();
        } catch (error) {
            console.error("Error al enviar formulario:", error);
            toast.error(error instanceof Error ? error.message : "Error desconocido al crear material visual.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const visualMaterialTopicsArray = Object.values(VisualMaterialTopic);

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                <Card className="max-w-3xl mx-auto">
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <ImagePlus className="h-7 w-7 text-purple-600" />
                            <CardTitle className="text-2xl font-semibold">Crear Nuevo Material Visual</CardTitle>
                        </div>
                        <CardDescription>Comparte infografías, videos cortos, presentaciones o galerías de imágenes.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6">
                            {/* Título */}
                            <div className="space-y-1">
                                <Label htmlFor="title">Título del Material Visual <span className="text-red-500">*</span></Label>
                                <Input id="title" name="title" value={formData.title} onChange={handleInputChange} placeholder="Ej: Infografía sobre el Ciclo del Agua" disabled={isSubmitting} className={errors.title ? "border-red-500" : ""} />
                                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                            </div>

                            {/* Descripción */}
                            <div className="space-y-1">
                                <Label htmlFor="description">Descripción (Opcional)</Label>
                                <Textarea id="description" name="description" value={formData.description || ""} onChange={handleInputChange} placeholder="Breve descripción del contenido visual..." rows={3} disabled={isSubmitting} className={errors.description ? "border-red-500" : ""} />
                                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                            </div>

                            {/* Tema */}
                            <div className="space-y-1">
                                <Label htmlFor="topic-visual">Tema Principal <span className="text-red-500">*</span></Label>
                                <Select value={formData.topic} onValueChange={handleTopicChange} name="topic" disabled={isSubmitting}>
                                    <SelectTrigger id="topic-visual" className={errors.topic ? "border-red-500" : ""}><SelectValue placeholder="Selecciona un tema" /></SelectTrigger>
                                    <SelectContent><SelectGroup><SelectLabel>Temas de Material Visual</SelectLabel>
                                        {visualMaterialTopicsArray.map(topicValue => (
                                            <SelectItem key={topicValue} value={topicValue}>{topicValue.replace(/_/g, " ").charAt(0).toUpperCase() + topicValue.replace(/_/g, " ").slice(1).toLowerCase()}</SelectItem>
                                        ))}
                                    </SelectGroup></SelectContent>
                                </Select>
                                {errors.topic && <p className="text-sm text-red-500">{errors.topic}</p>}
                            </div>

                            {/* Imágenes */}
                            <div className="space-y-1">
                                <Label htmlFor="images">Imágenes (Mín. {MIN_FILES}, Máx. {MAX_FILES}) <span className="text-red-500">*</span></Label>
                                <div className={`p-4 border-2 ${errors.images ? 'border-red-500' : 'border-gray-300'} border-dashed rounded-lg`}>
                                    <div className="flex items-center justify-center w-full py-3 bg-gray-50 hover:bg-gray-100 rounded-md cursor-pointer transition-colors" onClick={() => imageInputRef.current?.click()}>
                                        <input type="file" id="images" name="images" ref={imageInputRef} onChange={handleImageFilesChange} className="hidden" accept={ALLOWED_IMAGE_TYPES.join(",")} multiple disabled={isSubmitting || formData.images.length >= MAX_FILES} />
                                        <Upload className="h-5 w-5 mr-2 text-gray-500" />
                                        <span className="text-sm text-gray-600">
                                            {formData.images.length >= MAX_FILES ? `Máximo ${MAX_FILES} imágenes` : `Añadir imágenes (${formData.images.length}/${MAX_FILES})`}
                                        </span>
                                    </div>
                                    {imagePreviews.length > 0 && (
                                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {imagePreviews.map((previewUrl, index) => (
                                                <div key={index} className="relative group aspect-square">
                                                    <Image src={previewUrl} alt={`Vista previa ${index + 1}`} layout="fill" objectFit="cover" className="rounded" />
                                                    <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5" onClick={() => removeImageFile(index)} disabled={isSubmitting}>
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {errors.images && <p className="text-sm text-red-500 mt-1">{errors.images}</p>}
                            </div>

                            {/* Información del Autor */}
                            <div className="pt-4 border-t">
                                <h3 className="text-md font-semibold mb-3">Información del Autor</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="authorName">Nombre del Autor <span className="text-red-500">*</span></Label>
                                        <Input id="authorName" name="authorName" value={formData.authorName} onChange={handleInputChange} disabled={isSubmitting || !!session?.name} className={errors.authorName ? "border-red-500" : ""} />
                                        {errors.authorName && <p className="text-sm text-red-500">{errors.authorName}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="authorInstitution">Institución <span className="text-red-500">*</span></Label>
                                        <Input id="authorInstitution" name="authorInstitution" value={formData.authorInstitution} onChange={handleInputChange} disabled={isSubmitting || !!(session?.userType === UserType.SCHOOL || session?.userType === UserType.GOVERNMENT && session?.name)} className={errors.authorInstitution ? "border-red-500" : ""} />
                                        {errors.authorInstitution && <p className="text-sm text-red-500">{errors.authorInstitution}</p>}
                                    </div>
                                </div>
                                <div className="space-y-1 mt-4">
                                    <Label htmlFor="authorInfo">Información Adicional del Autor (Opcional)</Label>
                                    <Textarea id="authorInfo" name="authorInfo" value={formData.authorInfo || ""} onChange={handleInputChange} placeholder="Ej: Docente de Ciencias Naturales, Especialista en Energías Renovables..." rows={2} disabled={isSubmitting} className={errors.authorInfo ? "border-red-500" : ""} />
                                    {errors.authorInfo && <p className="text-sm text-red-500">{errors.authorInfo}</p>}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>Cancelar</Button>
                            <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Publicar Material
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </DashboardLayout>
    );
}