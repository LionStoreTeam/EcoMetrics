// app/education/videos/nuevo/page.tsx
"use client";

import React, { useState, useEffect, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Video, Loader2, ImagePlus, Upload, Save, X, AlertCircle, Film, Link2, ArrowLeft } from "lucide-react"; // Agregado Link2
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; //

const shortVideoFormSchemaClient = z.object({
    title: z.string().min(5, "Título: min 5 caracteres.").max(150, "Título: max 150 caracteres."),
    description: z.string().max(1000, "Descripción: max 1000 caracteres.").optional().nullable(),
    topic: z.nativeEnum(VideoTopic, { errorMap: () => ({ message: "Selecciona un tema." }) }),
    authorName: z.string().min(3, "Nombre del autor requerido.").max(100),
    authorInstitution: z.string().min(3, "Institución requerida.").max(150),
    authorInfo: z.string().max(500, "Info. autor: max 500 caracteres.").optional().nullable(),
    duration: z.string().optional().nullable().refine(val => !val || /^\d+$/.test(val), "Duración: solo números (segundos)."),
    videoSourceType: z.enum(["upload", "url"], { required_error: "Debes seleccionar una fuente para el video." }),
    videoFile: z.instanceof(File).optional().nullable(),
    externalVideoUrl: z.string().url("URL de video externa inválida.").optional().nullable(),
    thumbnailFile: z.instanceof(File).optional().nullable()
        .refine(file => !file || file.size <= MAX_THUMBNAIL_SIZE, `Miniatura: max ${MAX_THUMBNAIL_SIZE / (1024 * 1024)}MB.`)
        .refine(file => !file || ALLOWED_IMAGE_TYPES.includes(file.type), "Miniatura: tipo no permitido."),
}).superRefine((data, ctx) => {
    if (data.videoSourceType === "upload" && !data.videoFile) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Debes subir un archivo de video.", path: ["videoFile"] });
    } else if (data.videoSourceType === "upload" && data.videoFile) {
        if (data.videoFile.size > MAX_SHORT_VIDEO_SIZE) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Video: max ${MAX_SHORT_VIDEO_SIZE / (1024 * 1024)}MB.`, path: ["videoFile"] });
        if (!ALLOWED_VIDEO_TYPES.filter(t => t !== "image/gif").includes(data.videoFile.type)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Video: tipo no permitido.", path: ["videoFile"] });
    }
    if (data.videoSourceType === "url" && (!data.externalVideoUrl || data.externalVideoUrl.trim() === "")) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Debes ingresar una URL para el video.", path: ["externalVideoUrl"] });
    }
});

type ShortVideoFormClientData = z.infer<typeof shortVideoFormSchemaClient>;
type ShortVideoFormErrors = Partial<Record<keyof ShortVideoFormClientData, string>>;

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

export default function NewShortVideoPage() {
    const router = useRouter();
    const { session, isLoadingSession } = useUserSession();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formDataState, setFormDataState] = useState<ShortVideoFormClientData>({
        title: "", description: "", topic: VideoTopic.TUTORIAL_PRACTICO, authorName: "", authorInstitution: "", authorInfo: "", duration: "",
        videoSourceType: "upload", videoFile: null, externalVideoUrl: "", thumbnailFile: null,
    });
    const [errors, setErrors] = useState<ShortVideoFormErrors>({});
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isLoadingSession && session) {
            setFormDataState(prev => ({
                ...prev,
                authorName: session.name || "",
                authorInstitution: (session.userType === UserType.SCHOOL || session.userType === UserType.GOVERNMENT) ? session.name : "",
            }));
        }
    }, [session, isLoadingSession]);

    if (isLoadingSession) return <DashboardLayout><div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div></DashboardLayout>;
    if (!session || (session.userType !== UserType.SCHOOL && session.userType !== UserType.GOVERNMENT)) {
        return <DashboardLayout><div className="container mx-auto p-4 text-center">Acceso Denegado.</div></DashboardLayout>;
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormDataState(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof ShortVideoFormErrors]) setErrors(prev => ({ ...prev, [name]: undefined }));
    };
    const handleTopicChange = (value: string) => {
        setFormDataState(prev => ({ ...prev, topic: value as VideoTopic }));
        if (errors.topic) setErrors(prev => ({ ...prev, topic: undefined }));
    };
    const handleVideoSourceTypeChange = (value: "upload" | "url") => {
        setFormDataState(prev => ({ ...prev, videoSourceType: value, videoFile: null, externalVideoUrl: "", /* Clear other source */ }));
        setVideoPreview(null);
        if (videoInputRef.current) videoInputRef.current.value = "";
        setErrors(prev => ({ ...prev, videoFile: undefined, externalVideoUrl: undefined }));
    };

    const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setFormDataState(prev => ({ ...prev, videoFile: file || null }));
        if (file) setVideoPreview(URL.createObjectURL(file)); else setVideoPreview(null);
        if (errors.videoFile) setErrors(prev => ({ ...prev, videoFile: undefined }));
    };
    const removeVideoFile = () => {
        if (videoPreview) URL.revokeObjectURL(videoPreview);
        setFormDataState(prev => ({ ...prev, videoFile: null })); setVideoPreview(null);
        if (videoInputRef.current) videoInputRef.current.value = "";
    };
    const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setFormDataState(prev => ({ ...prev, thumbnailFile: file || null }));
        if (file) setThumbnailPreview(URL.createObjectURL(file)); else setThumbnailPreview(null);
        if (errors.thumbnailFile) setErrors(prev => ({ ...prev, thumbnailFile: undefined }));
    };
    const removeThumbnailFile = () => {
        if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
        setFormDataState(prev => ({ ...prev, thumbnailFile: null })); setThumbnailPreview(null);
        if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrors({});
        const validationResult = shortVideoFormSchemaClient.safeParse(formDataState);
        if (!validationResult.success) {
            const newErrors: ShortVideoFormErrors = {};
            validationResult.error.errors.forEach(err => { newErrors[err.path[0] as keyof ShortVideoFormClientData] = err.message; });
            setErrors(newErrors); toast.error("Por favor, corrige los errores."); return;
        }
        setIsSubmitting(true);
        const apiFormData = new FormData();
        const dataToSend = validationResult.data;

        Object.entries(dataToSend).forEach(([key, value]) => {
            if (key === 'videoFile' && value instanceof File) apiFormData.append(key, value);
            else if (key === 'thumbnailFile' && value instanceof File) apiFormData.append(key, value);
            else if (value !== null && value !== undefined) apiFormData.append(key, String(value));
        });

        try {
            const response = await fetch("/api/education/short-videos", { method: "POST", body: apiFormData });
            if (!response.ok) { const errData = await response.json(); throw new Error(errData.error || "Error al crear video"); }
            toast.success("Video corto creado!"); router.push("/educacion?tab=videos"); router.refresh();
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
                        <div className="flex items-center gap-3 mb-2"><Video className="h-7 w-7 text-blue-600" /><CardTitle className="text-2xl font-semibold">Subir Nuevo Video Corto</CardTitle></div>
                        <CardDescription>Comparte videos educativos sobre prácticas sostenibles y medio ambiente.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6">
                            {/* ... Título, Descripción, Tema, Autor, Institución, Info. Autor ... */}
                            <div className="space-y-1">
                                <Label htmlFor="title-video-new">Título <span className="text-red-500">*</span></Label>
                                <Input id="title-video-new" name="title" value={formDataState.title} onChange={handleInputChange} disabled={isSubmitting} className={errors.title ? "border-red-500" : ""} />
                                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="description-video-new">Descripción</Label>
                                <Textarea id="description-video-new" name="description" value={formDataState.description || ""} onChange={handleInputChange} rows={3} disabled={isSubmitting} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="topic-video-new">Tema <span className="text-red-500">*</span></Label>
                                    <Select value={formDataState.topic} onValueChange={handleTopicChange} name="topic" disabled={isSubmitting}>
                                        <SelectTrigger id="topic-video-new" className={errors.topic ? "border-red-500" : ""}><SelectValue placeholder="Tema" /></SelectTrigger>
                                        <SelectContent><SelectGroup><SelectLabel>Temas</SelectLabel>
                                            {videoTopicsArray.map(topicValue => (<SelectItem key={topicValue} value={topicValue}>{topicValue.replace(/_/g, " ")}</SelectItem>))}
                                        </SelectGroup></SelectContent>
                                    </Select>
                                    {errors.topic && <p className="text-sm text-red-500">{errors.topic}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="duration-video-new">Duración (segundos)</Label>
                                    <Input id="duration-video-new" name="duration" type="number" value={formDataState.duration || ""} onChange={handleInputChange} placeholder="Ej: 180" disabled={isSubmitting} />
                                    {errors.duration && <p className="text-sm text-red-500">{errors.duration}</p>}
                                </div>
                            </div>

                            {/* Selección de Fuente de Video */}
                            <div className="space-y-2">
                                <Label>Fuente del Video <span className="text-red-500">*</span></Label>
                                <RadioGroup value={formDataState.videoSourceType} onValueChange={(val) => handleVideoSourceTypeChange(val as "upload" | "url")} className="flex space-x-4">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="upload" id="video-upload" /><Label htmlFor="video-upload">Subir archivo</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="url" id="video-url" /><Label htmlFor="video-url">Usar URL externa</Label></div>
                                </RadioGroup>
                                {errors.videoSourceType && <p className="text-sm text-red-500">{errors.videoSourceType}</p>}
                            </div>

                            {/* Input para Video (Archivo o URL) */}
                            {formDataState.videoSourceType === "upload" && (
                                <div className="space-y-1">
                                    <Label htmlFor="videoFile">Archivo de Video <span className="text-red-500">*</span></Label>
                                    <div className={`p-3 border-2 ${errors.videoFile ? 'border-red-500' : 'border-gray-300'} border-dashed rounded-lg`}>
                                        <div className="flex items-center justify-center w-full py-2 bg-gray-50 hover:bg-gray-100 rounded-md cursor-pointer" onClick={() => videoInputRef.current?.click()}>
                                            <input type="file" id="videoFile" ref={videoInputRef} onChange={handleVideoFileChange} className="hidden" accept={ALLOWED_VIDEO_TYPES.filter(t => t !== "image/gif").join(",")} disabled={isSubmitting} />
                                            <Upload className="h-4 w-4 mr-1.5 text-gray-500" />
                                            <span className="text-xs text-gray-600">{formDataState.videoFile ? formDataState.videoFile.name : `Subir video (MP4, etc. - Máx. ${MAX_SHORT_VIDEO_SIZE / (1024 * 1024)}MB)`}</span>
                                        </div>
                                        {videoPreview && (
                                            <div className="mt-2 relative aspect-video bg-black rounded overflow-hidden">
                                                <video src={videoPreview} controls className="w-full h-full object-contain" />
                                                <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 z-10 p-0.5" onClick={removeVideoFile} disabled={isSubmitting}><X className="h-3.5 w-3.5" /></Button>
                                            </div>
                                        )}
                                    </div>
                                    {errors.videoFile && <p className="text-sm text-red-500 mt-1">{errors.videoFile}</p>}
                                </div>
                            )}
                            {formDataState.videoSourceType === "url" && (
                                <div className="space-y-1">
                                    <Label htmlFor="externalVideoUrl">URL del Video Externo <span className="text-red-500">*</span></Label>
                                    <Input id="externalVideoUrl" name="externalVideoUrl" type="url" value={formDataState.externalVideoUrl || ""} onChange={handleInputChange} placeholder="https://www.youtube.com/watch?v=..." disabled={isSubmitting} className={errors.externalVideoUrl ? "border-red-500" : ""} />
                                    {errors.externalVideoUrl && <p className="text-sm text-red-500">{errors.externalVideoUrl}</p>}
                                </div>
                            )}

                            {/* Input para Miniatura (Opcional) */}
                            <div className="space-y-1">
                                <Label htmlFor="thumbnailFile">Miniatura (Opcional)</Label>
                                <div className={`p-3 border-2 ${errors.thumbnailFile ? 'border-red-500' : 'border-gray-300'} border-dashed rounded-lg`}>
                                    <div className="flex items-center justify-center w-full py-2 bg-gray-50 hover:bg-gray-100 rounded-md cursor-pointer" onClick={() => thumbnailInputRef.current?.click()}>
                                        <input type="file" id="thumbnailFile" ref={thumbnailInputRef} onChange={handleThumbnailFileChange} className="hidden" accept={ALLOWED_IMAGE_TYPES.join(",")} disabled={isSubmitting} />
                                        <ImagePlus className="h-4 w-4 mr-1.5 text-gray-500" />
                                        <span className="text-xs text-gray-600">{formDataState.thumbnailFile ? formDataState.thumbnailFile.name : `Subir miniatura (Max ${MAX_THUMBNAIL_SIZE / (1024 * 1024)}MB)`}</span>
                                    </div>
                                    {thumbnailPreview && (
                                        <div className="mt-2 relative w-32 h-20 aspect-video bg-gray-100 rounded overflow-hidden group">
                                            <Image src={thumbnailPreview} alt="Miniatura" layout="fill" objectFit="cover" />
                                            <Button type="button" variant="destructive" size="icon" className="absolute top-0.5 right-0.5 h-5 w-5 z-10 p-0.5 opacity-0 group-hover:opacity-100" onClick={removeThumbnailFile} disabled={isSubmitting}><X className="h-3 w-3" /></Button>
                                        </div>
                                    )}
                                </div>
                                {errors.thumbnailFile && <p className="text-sm text-red-500 mt-1">{errors.thumbnailFile}</p>}
                            </div>
                            {/* Info del Autor */}
                            <div className="pt-4 border-t">
                                <h3 className="text-md font-semibold mb-3">Información del Autor</h3>
                                {/* ... campos de autor como antes ... */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="authorName-video-new">Nombre del Autor <span className="text-red-500">*</span></Label>
                                        <Input id="authorName-video-new" name="authorName" value={formDataState.authorName} onChange={handleInputChange} disabled={isSubmitting || !!session?.name} className={errors.authorName ? "border-red-500" : ""} />
                                        {errors.authorName && <p className="text-sm text-red-500">{errors.authorName}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="authorInstitution-video-new">Institución <span className="text-red-500">*</span></Label>
                                        <Input id="authorInstitution-video-new" name="authorInstitution" value={formDataState.authorInstitution} onChange={handleInputChange} disabled={isSubmitting || !!(session?.userType === UserType.SCHOOL || session?.userType === UserType.GOVERNMENT && session?.name)} className={errors.authorInstitution ? "border-red-500" : ""} />
                                        {errors.authorInstitution && <p className="text-sm text-red-500">{errors.authorInstitution}</p>}
                                    </div>
                                </div>
                                <div className="space-y-1 mt-4 flex flex-col">
                                    <Label htmlFor="authorInfo-video-new">Info. Adicional del Autor</Label>
                                    <Label
                                        className="text-sm text-slate-500 font-normal"
                                        htmlFor="authorInfo-video-new"
                                    >
                                        Si la URL del video es externa (YouTube). Añade las referencias correspondietes del autor.
                                    </Label>
                                    <Textarea id="authorInfo-video-new" name="authorInfo" placeholder="Añade más detalles o información..." value={formDataState.authorInfo || ""} onChange={handleInputChange} rows={2} disabled={isSubmitting} />
                                    {errors.authorInfo && <p className="text-sm text-red-500">{errors.authorInfo}</p>}
                                </div>
                            </div>

                        </CardContent>
                        <CardFooter className="flex flex-col justify-center gap-3 sm:flex-row sm:items-start sm:justify-end">
                            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>Cancelar</Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Publicar Video
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </DashboardLayout>
    );
}