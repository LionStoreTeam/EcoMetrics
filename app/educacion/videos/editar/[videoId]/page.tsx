// app/education/videos/editar/[videoId]/page.tsx
"use client";

import React, { useState, useEffect, FormEvent, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Video as VideoIconLucide, Loader2, ImagePlus, Save, X, AlertCircle, Upload, Trash2, Link2, ArrowLeft } from "lucide-react"; // Agregado Link2
import { Button } from "@/components/ui/button"; //
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"; //
import { Input } from "@/components/ui/input"; //
import { Label } from "@/components/ui/label"; //
import { Textarea } from "@/components/ui/textarea"; //
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"; //
import DashboardLayout from "@/components/dashboard-layout"; //
import { VideoTopic, UserType } from "@prisma/client";
import { z } from "zod";
import toast from "react-hot-toast";
import Image from "next/image";
import { ALLOWED_VIDEO_TYPES, MAX_SHORT_VIDEO_SIZE, ALLOWED_IMAGE_TYPES, MAX_THUMBNAIL_SIZE } from "@/types/types-s3-service"; //
import { type ShortVideoItem, type ShortVideoFormData as FormDataType } from "@/types/types"; //
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; //


const shortVideoUpdateFormSchemaClient = z.object({
    title: z.string().min(5).max(150).optional(),
    description: z.string().max(1000).optional().nullable(),
    topic: z.nativeEnum(VideoTopic).optional(),
    authorName: z.string().min(3).max(100).optional(),
    authorInstitution: z.string().min(3).max(150).optional(),
    authorInfo: z.string().max(500).optional().nullable(),
    duration: z.string().optional().nullable().refine(val => !val || /^\d+$/.test(val), "Duración en segundos.").transform(val => val || null),
    videoSourceType: z.enum(["upload", "url", "keep"]).optional(),
    externalVideoUrl: z.string().url("URL externa inválida.").optional().nullable(),
    videoFile: z.instanceof(File).optional().nullable(),
    thumbnailFile: z.instanceof(File).optional().nullable()
        .refine(file => !file || file.size <= MAX_THUMBNAIL_SIZE, `Miniatura max ${MAX_THUMBNAIL_SIZE / (1024 * 1024)}MB.`)
        .refine(file => !file || ALLOWED_IMAGE_TYPES.includes(file.type), "Miniatura: tipo no permitido."),
}).superRefine((data, ctx) => {
    if (data.videoSourceType === "upload" && !data.videoFile && !data.externalVideoUrl /* Si se está editando, puede que ya exista un video*/) {
        // Esta validación es más compleja en edición, ya que puede haber un video existente
    }
    if (data.videoSourceType === "url" && (!data.externalVideoUrl || data.externalVideoUrl.trim() === "")) {
        ctx.addIssue({ code: "custom", message: "URL externa requerida si se selecciona 'url'.", path: ["externalVideoUrl"] });
    }
    if (data.videoFile && data.videoFile.size > MAX_SHORT_VIDEO_SIZE) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Video: max ${MAX_SHORT_VIDEO_SIZE / (1024 * 1024)}MB.`, path: ["videoFile"] });
    }
    if (data.videoFile && !ALLOWED_VIDEO_TYPES.filter(t => t !== "image/gif").includes(data.videoFile.type)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Video: tipo no permitido.", path: ["videoFile"] });
    }
});

type ShortVideoUpdateFormClientData = z.infer<typeof shortVideoUpdateFormSchemaClient>;
type ShortVideoUpdateFormErrors = Partial<Record<keyof ShortVideoUpdateFormClientData, string>>;


function useUserSession() { /* ... (Hook de sesión existente) ... */
    const [session, setSession] = useState<{ id: string; userType: UserType; role: string, name: string, email: string } | null>(null);
    const [isLoadingSession, setIsLoadingSession] = useState(true);
    useEffect(() => {
        async function fetchSession() {
            try {
                const res = await fetch('/api/auth/session'); //
                if (res.ok) { const data = await res.json(); setSession(data.user); } else { setSession(null); }
            } catch (error) { console.error("Error fetching session:", error); setSession(null); }
            finally { setIsLoadingSession(false); }
        }
        fetchSession();
    }, []);
    return { session, isLoadingSession };
}

export default function EditShortVideoPage() {
    const router = useRouter();
    const params = useParams();
    const videoId = params.videoId as string;
    const { session, isLoadingSession } = useUserSession();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [formDataState, setFormDataState] = useState<Partial<FormDataType>>({ videoSourceType: "url" }); // Usar el tipo del types/types.ts
    const [errors, setErrors] = useState<ShortVideoUpdateFormErrors>({});

    const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null); // Para mostrar video existente
    const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState<string | null>(null); // Para mostrar miniatura existente

    const videoInputRef = useRef<HTMLInputElement>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);
    const [originalVideoData, setOriginalVideoData] = useState<ShortVideoItem | null>(null);

    useEffect(() => {
        if (!videoId) { toast.error("ID de video no especificado."); router.push("/educacion?tab=videos"); return; }
        async function fetchVideoData() {
            setIsLoadingData(true);
            try {
                const res = await fetch(`/api/education/short-videos/${videoId}`);
                if (res.status === 404) { toast.error("Video no encontrado."); router.push("/educacion?tab=videos"); return; }
                if (!res.ok) { const errData = await res.json(); throw new Error(errData.error || "Error al cargar datos"); }
                const data: ShortVideoItem = await res.json();
                setOriginalVideoData(data);
                setFormDataState({
                    title: data.title, description: data.description || "", topic: data.topic,
                    authorName: data.authorName, authorInstitution: data.authorInstitution, authorInfo: data.authorInfo || "",
                    duration: data.duration?.toString() || "",
                    videoSourceType: data.externalVideoUrl ? "url" : "upload", // 'keep' if S3 video exists
                    externalVideoUrl: data.externalVideoUrl || "",
                    existingVideoS3Key: data.videoUrl && !data.externalVideoUrl ? data.videoUrl : null, // Asumiendo videoUrl es S3 si no hay external
                    existingThumbnailS3Key: data.thumbnailUrl || null,
                });
                setCurrentVideoUrl(data.externalVideoUrl || data.videoUrl || null);
                setCurrentThumbnailUrl(data.thumbnailUrl || null);
            } catch (error) { console.error("Error cargando video:", error); toast.error(error instanceof Error ? error.message : "Error"); router.push("/educacion?tab=videos"); }
            finally { setIsLoadingData(false); }
        }
        if (!isLoadingSession) fetchVideoData();
    }, [videoId, router, isLoadingSession]);

    if (isLoadingSession || isLoadingData) return <DashboardLayout><div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /> Cargando...</div></DashboardLayout>;
    if (!session || (session.id !== originalVideoData?.userId) || (session.userType !== UserType.SCHOOL && session.userType !== UserType.GOVERNMENT)) {
        return <DashboardLayout><div className="container p-4 text-center">Acceso Denegado.</div></DashboardLayout>;
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormDataState(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof ShortVideoUpdateFormErrors]) setErrors(prev => ({ ...prev, [name]: undefined }));
    };
    const handleTopicChange = (value: string) => {
        setFormDataState(prev => ({ ...prev, topic: value as VideoTopic } as any));
        if (errors.topic) setErrors(prev => ({ ...prev, topic: undefined }));
    };
    const handleVideoSourceTypeChange = (value: "upload" | "url" | "keep") => {
        setFormDataState(prev => ({ ...prev, videoSourceType: value } as any));
        if (value === "upload") {
            setFormDataState(prev => ({ ...prev, externalVideoUrl: "" })); // Limpiar URL si se va a subir
        } else if (value === "url") {
            setFormDataState(prev => ({ ...prev, videoFile: null })); // Limpiar archivo si se va a usar URL
            if (videoInputRef.current) videoInputRef.current.value = "";
            setCurrentVideoUrl(null); // Limpiar preview de video subido
        } else if (value === "keep") {
            setFormDataState(prev => ({ ...prev, videoFile: null, externalVideoUrl: originalVideoData?.externalVideoUrl || "" }));
            setCurrentVideoUrl(originalVideoData?.externalVideoUrl || originalVideoData?.videoUrl || null);
            if (videoInputRef.current) videoInputRef.current.value = "";
        }
        setErrors(prev => ({ ...prev, videoFile: undefined, externalVideoUrl: undefined }));
    };

    const handleNewVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setFormDataState(prev => ({ ...prev, videoFile: file || null, videoSourceType: "upload" }));
        if (file) setCurrentVideoUrl(URL.createObjectURL(file));
        else setCurrentVideoUrl(originalVideoData?.videoUrl || null); // Revertir si se deselecciona
        if (errors.videoFile) setErrors(prev => ({ ...prev, videoFile: undefined }));
    };
    const removeNewVideoFile = () => {
        if (formDataState.videoFile && currentVideoUrl?.startsWith("blob:")) URL.revokeObjectURL(currentVideoUrl);
        setFormDataState(prev => ({ ...prev, videoFile: null, videoSourceType: "url" })); // Volver a 'keep' si se elimina el nuevo
        setCurrentVideoUrl(originalVideoData?.externalVideoUrl || originalVideoData?.videoUrl || null);
        if (videoInputRef.current) videoInputRef.current.value = "";
    };

    const handleNewThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setFormDataState(prev => ({ ...prev, thumbnailFile: file || null, deleteExistingThumbnail: false }));
        if (file) setCurrentThumbnailUrl(URL.createObjectURL(file));
        else setCurrentThumbnailUrl(originalVideoData?.thumbnailUrl || null);
        if (errors.thumbnailFile) setErrors(prev => ({ ...prev, thumbnailFile: undefined }));
    };
    const removeThumbnailFile = (p0: boolean) => { // Ahora solo un botón para quitar/marcar para eliminar
        if (formDataState.thumbnailFile && currentThumbnailUrl?.startsWith("blob:")) URL.revokeObjectURL(currentThumbnailUrl); // Si es nueva preview
        setFormDataState(prev => ({ ...prev, thumbnailFile: null, deleteExistingThumbnail: !!originalVideoData?.thumbnailUrl }));
        setCurrentThumbnailUrl(null); // Limpiar preview, se mostrará placeholder o nada
        if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
    };


    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrors({});

        let finalDataToValidate = { ...formDataState };
        if (formDataState.videoSourceType === "upload" && !formDataState.videoFile) {
            setErrors(prev => ({ ...prev, videoFile: "Debes seleccionar un archivo si eliges 'Subir'." })); return;
        }
        if (formDataState.videoSourceType === "url" && (!formDataState.externalVideoUrl || formDataState.externalVideoUrl.trim() === "")) {
            setErrors(prev => ({ ...prev, externalVideoUrl: "La URL es requerida si eliges 'URL externa'." })); return;
        }

        const validationResult = shortVideoUpdateFormSchemaClient.safeParse(finalDataToValidate);
        if (!validationResult.success) {
            const newErrors: ShortVideoUpdateFormErrors = {};
            validationResult.error.errors.forEach(err => { newErrors[err.path[0] as keyof ShortVideoUpdateFormClientData] = err.message; });
            setErrors(newErrors); toast.error("Corrige los errores."); return;
        }
        setIsSubmitting(true);
        const apiFormData = new FormData();
        const dataToSend = validationResult.data;

        Object.entries(dataToSend).forEach(([key, value]) => {
            if (key !== 'videoFile' && key !== 'thumbnailFile' && value !== null && value !== undefined) {
                apiFormData.append(key, String(value));
            }
        });
        if (dataToSend.videoFile) apiFormData.append("videoFile", dataToSend.videoFile);
        if (dataToSend.thumbnailFile) apiFormData.append("thumbnailFile", dataToSend.thumbnailFile);
        if (formDataState.deleteExistingThumbnail) apiFormData.append("deleteThumbnail", "true");


        try {
            const response = await fetch(`/api/education/short-videos/${videoId}`, { method: "PUT", body: apiFormData });
            if (!response.ok) { const errData = await response.json(); throw new Error(errData.error || "Error al actualizar"); }
            toast.success("Video corto actualizado!"); router.push(`/educacion/videos/${videoId}`); router.refresh();
        } catch (error) { toast.error(error instanceof Error ? error.message : "Error."); }
        finally { setIsSubmitting(false); }
    };
    const videoTopicsArray = Object.values(VideoTopic);

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8 mt-10 lg:mt-0">
                <div className="mb-6">
                    <Link href="/educacion/videos" className="text-sm text-blue-600 hover:underline flex items-center">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Volver a Videos</Link>
                </div>

                <Card className="max-w-3xl mx-auto">
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2"><VideoIconLucide className="h-7 w-7 text-blue-600" /><CardTitle className="text-2xl font-semibold">Editar Video Corto</CardTitle></div>
                        <CardDescription>Modifica los detalles de tu video educativo.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6">
                            {/* ... Campos de título, descripción, tema, autor, etc. ... */}
                            <div className="space-y-1">
                                <Label htmlFor="title-video-edit">Título <span className="text-red-500">*</span></Label>
                                <Input id="title-video-edit" name="title" value={formDataState.title || ""} onChange={handleInputChange} disabled={isSubmitting} className={errors.title ? "border-red-500" : ""} />
                                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="description-video-edit">Descripción</Label>
                                <Textarea id="description-video-edit" name="description" value={formDataState.description || ""} onChange={handleInputChange} rows={3} disabled={isSubmitting} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="topic-video-edit">Tema <span className="text-red-500">*</span></Label>
                                    <Select value={formDataState.topic || ""} onValueChange={handleTopicChange} name="topic" disabled={isSubmitting}>
                                        <SelectTrigger id="topic-video-edit" className={errors.topic ? "border-red-500" : ""}><SelectValue placeholder="Tema" /></SelectTrigger>
                                        <SelectContent><SelectGroup><SelectLabel>Temas</SelectLabel>
                                            {videoTopicsArray.map(topicValue => (<SelectItem key={topicValue} value={topicValue}>{topicValue.replace(/_/g, " ")}</SelectItem>))}
                                        </SelectGroup></SelectContent>
                                    </Select>
                                    {errors.topic && <p className="text-sm text-red-500">{errors.topic}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="duration-video-edit">Duración (segundos)</Label>
                                    <Input id="duration-video-edit" name="duration" type="number" value={formDataState.duration || ""} onChange={handleInputChange} placeholder="Ej: 180" disabled={isSubmitting} />
                                    {errors.duration && <p className="text-sm text-red-500">{errors.duration}</p>}
                                </div>
                            </div>

                            {/* Selección de Fuente de Video para Edición */}
                            <div className="space-y-2">
                                <Label>Fuente del Video <span className="text-red-500">*</span></Label>
                                <RadioGroup value={formDataState.videoSourceType} onValueChange={(val) => handleVideoSourceTypeChange(val as "upload" | "url" | "keep")} className="flex space-x-4">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="keep" id="video-keep" /><Label htmlFor="video-keep">Mantener actual</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="upload" id="video-upload-edit" /><Label htmlFor="video-upload-edit">Subir nuevo</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="url" id="video-url-edit" /><Label htmlFor="video-url-edit">Usar URL externa</Label></div>
                                </RadioGroup>
                            </div>

                            {formDataState.videoSourceType === "upload" && (
                                <div className="space-y-1 pl-2 border-l-2 border-blue-500">
                                    <Label htmlFor="newVideoFileEdit">Nuevo Archivo de Video</Label>
                                    <div className={`p-3 border-2 ${errors.videoFile ? 'border-red-500' : 'border-gray-300'} border-dashed rounded-lg`}>
                                        <div className="flex items-center justify-center w-full py-2 bg-gray-50 hover:bg-gray-100 rounded-md cursor-pointer" onClick={() => videoInputRef.current?.click()}>
                                            <input type="file" id="newVideoFileEdit" ref={videoInputRef} onChange={handleNewVideoFileChange} className="hidden" accept={ALLOWED_VIDEO_TYPES.filter(t => t !== "image/gif").join(",")} disabled={isSubmitting} />
                                            <Upload className="h-4 w-4 mr-1.5" /> <span className="text-xs">{formDataState.videoFile ? formDataState.videoFile.name : `Subir para reemplazar (Max ${MAX_SHORT_VIDEO_SIZE / (1024 * 1024)}MB)`}</span>
                                        </div>
                                        {currentVideoUrl && currentVideoUrl.startsWith("blob:") && ( // Solo muestra preview si es un archivo nuevo
                                            <div className="mt-2 relative aspect-video bg-black rounded overflow-hidden">
                                                <video src={currentVideoUrl} controls className="w-full h-full object-contain" />
                                                <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 z-10 p-0.5" onClick={removeNewVideoFile} disabled={isSubmitting}><X className="h-3.5 w-3.5" /></Button>
                                            </div>
                                        )}
                                    </div>
                                    {errors.videoFile && <p className="text-sm text-red-500 mt-1">{errors.videoFile}</p>}
                                </div>
                            )}
                            {formDataState.videoSourceType === "url" && (
                                <div className="space-y-1 pl-2 border-l-2 border-blue-500">
                                    <Label htmlFor="externalVideoUrlEdit">Nueva URL del Video Externo</Label>
                                    <Input id="externalVideoUrlEdit" name="externalVideoUrl" type="url" value={formDataState.externalVideoUrl || ""} onChange={handleInputChange} placeholder="https://..." disabled={isSubmitting} className={errors.externalVideoUrl ? "border-red-500" : ""} />
                                    {errors.externalVideoUrl && <p className="text-sm text-red-500">{errors.externalVideoUrl}</p>}
                                </div>
                            )}
                            {formDataState.videoSourceType === "url" && currentVideoUrl && (
                                <div className="space-y-1 pl-2 border-l-2 border-gray-300">
                                    <Label>Video Actual</Label>
                                    {currentVideoUrl.includes("youtube.com") || currentVideoUrl.includes("youtu.be") || currentVideoUrl.includes("vimeo.com") ? (
                                        <a href={currentVideoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block truncate">{currentVideoUrl}</a>
                                    ) : (
                                        <video src={currentVideoUrl} controls className="w-full max-h-48 object-contain rounded-md bg-black" />
                                    )}
                                </div>
                            )}


                            {/* Miniatura */}
                            <div className="space-y-1">
                                <Label htmlFor="newThumbnailFileEdit">Miniatura (Opcional)</Label>
                                <div className={`p-3 border-2 ${errors.thumbnailFile ? 'border-red-500' : 'border-gray-300'} border-dashed rounded-lg`}>
                                    <div className="flex items-center justify-center w-full py-2 bg-gray-50 hover:bg-gray-100 rounded-md cursor-pointer" onClick={() => thumbnailInputRef.current?.click()}>
                                        <input type="file" id="newThumbnailFileEdit" ref={thumbnailInputRef} onChange={handleNewThumbnailFileChange} className="hidden" accept={ALLOWED_IMAGE_TYPES.join(",")} disabled={isSubmitting} />
                                        <ImagePlus className="h-4 w-4 mr-1.5" /> <span className="text-xs">{formDataState.thumbnailFile ? formDataState.thumbnailFile.name : "Subir/Reemplazar Miniatura"}</span>
                                    </div>
                                    {currentThumbnailUrl && (
                                        <div className="mt-2 relative w-32 h-20 aspect-video bg-gray-100 rounded overflow-hidden group">
                                            <Image src={currentThumbnailUrl} alt="Miniatura" layout="fill" objectFit="cover" />
                                            <Button type="button" variant="destructive" size="icon" className="absolute top-0.5 right-0.5 h-5 w-5 z-10 p-0.5 opacity-0 group-hover:opacity-100" onClick={() => removeThumbnailFile(!!originalVideoData?.thumbnailUrl && currentThumbnailUrl === originalVideoData.thumbnailUrl)} disabled={isSubmitting}><Trash2 className="h-3 w-3" /></Button>
                                        </div>
                                    )}
                                    {formDataState.deleteExistingThumbnail && <p className="text-xs text-red-500 mt-1">La miniatura actual se eliminará al guardar.</p>}
                                </div>
                                {errors.thumbnailFile && <p className="text-sm text-red-500 mt-1">{errors.thumbnailFile}</p>}
                            </div>

                            {/* Info del Autor */}
                            <div className="pt-4 border-t">
                                <h3 className="text-md font-semibold mb-3">Información del Autor</h3>
                                {/* ... campos de autor ... */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="authorName-video-edit">Nombre del Autor <span className="text-red-500">*</span></Label>
                                        <Input id="authorName-video-edit" name="authorName" value={formDataState.authorName || ""} onChange={handleInputChange} disabled={isSubmitting || !!session?.name} className={errors.authorName ? "border-red-500" : ""} />
                                        {errors.authorName && <p className="text-sm text-red-500">{errors.authorName}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="authorInstitution-video-edit">Institución <span className="text-red-500">*</span></Label>
                                        <Input id="authorInstitution-video-edit" name="authorInstitution" value={formDataState.authorInstitution || ""} onChange={handleInputChange} disabled={isSubmitting || !!(session?.userType === UserType.SCHOOL || session?.userType === UserType.GOVERNMENT && session?.name)} className={errors.authorInstitution ? "border-red-500" : ""} />
                                        {errors.authorInstitution && <p className="text-sm text-red-500">{errors.authorInstitution}</p>}
                                    </div>
                                </div>
                                <div className="space-y-1 mt-4">
                                    <Label htmlFor="authorInfo-video-edit">Info. Adicional del Autor</Label>
                                    <Textarea id="authorInfo-video-edit" name="authorInfo" value={formDataState.authorInfo || ""} onChange={handleInputChange} rows={2} disabled={isSubmitting} />
                                    {errors.authorInfo && <p className="text-sm text-red-500">{errors.authorInfo}</p>}
                                </div>
                            </div>

                        </CardContent>
                        <CardFooter className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>Cancelar</Button>
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