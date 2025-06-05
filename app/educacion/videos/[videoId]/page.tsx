
// app/education/videos/[videoId]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Video as VideoIconLucide, UserCircle, CalendarDays, Tag, ThumbsUp, ThumbsDown, Edit, Trash2, Loader2, AlertTriangle, ArrowLeft, Home, Film, PlayCircle, ExternalLink } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout"; //
import { Button } from "@/components/ui/button"; //
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"; //
import { Badge } from "@/components/ui/badge"; //
import { VideoTopic, UserType } from "@prisma/client";
import { format, formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";
import toast from "react-hot-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"; //
import { type ShortVideoItem } from "@/types/types"; //

// Hook para sesión de usuario (reutilizado)
function useUserSession() {
    const [session, setSession] = useState<{ id: string; userType: UserType; role: string, name: string, email: string } | null>(null);
    const [isLoadingSession, setIsLoadingSession] = useState(true);

    useEffect(() => {
        async function fetchSession() {
            try {
                const res = await fetch('/api/auth/session'); //
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

// Helper para determinar el tipo de video y obtener la URL de incrustación
const getVideoEmbedDetails = (url: string): { type: 'youtube' | 'vimeo' | 'direct' | 'unknown', embedUrl?: string, originalUrl: string } => {
    if (url.match(/^(https?:)?(\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/)) {
        const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
        return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${videoId}`, originalUrl: url };
    }
    if (url.match(/^(https?:)?(\/\/)?(www\.)?(vimeo\.com)\/.+/)) {
        const videoId = url.split('/').pop()?.split('?')[0];
        return { type: 'vimeo', embedUrl: `https://player.vimeo.com/video/${videoId}`, originalUrl: url };
    }
    if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
        return { type: 'direct', embedUrl: url, originalUrl: url };
    }
    return { type: 'unknown', originalUrl: url };
};


export default function ShortVideoDetailPage() {
    const router = useRouter();
    const params = useParams();
    const videoId = params.videoId as string;
    const { session, isLoadingSession } = useUserSession();

    const [video, setVideo] = useState<ShortVideoItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchShortVideo = useCallback(async () => {
        if (!videoId) return;
        setIsLoading(true); setError(null);
        try {
            const response = await fetch(`/api/education/short-videos/${videoId}`);
            if (!response.ok) { const errData = await response.json(); throw new Error(errData.error || "Video no encontrado."); }
            const data: ShortVideoItem = await response.json();
            setVideo(data);
        } catch (err) { console.error("Error cargando video:", err); setError(err instanceof Error ? err.message : "Error."); }
        finally { setIsLoading(false); }
    }, [videoId]);

    useEffect(() => { if (!isLoadingSession) fetchShortVideo(); }, [fetchShortVideo, isLoadingSession]);

    const handleRating = async (liked: boolean) => {
        // ... (lógica de handleRating sin cambios, como en la respuesta anterior)
        if (!video || !session?.id) { toast.error("Debes iniciar sesión para valorar."); return; }
        const originalRating = video.currentUserRating;
        const originalLikes = video.likes;
        const originalDislikes = video.dislikes;
        setVideo(prev => {
            if (!prev) return null; let nL = prev.likes, nD = prev.dislikes, nCR: boolean | null = liked;
            if (prev.currentUserRating === liked) { nCR = null; if (liked) nL--; else nD--; }
            else { if (prev.currentUserRating === true) nL--; else if (prev.currentUserRating === false) nD--; if (liked) nL++; else nD++; }
            return { ...prev, likes: nL, dislikes: nD, currentUserRating: nCR };
        });
        try {
            const response = await fetch(`/api/education/short-videos/${video.id}/rate`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ liked }),
            });
            if (!response.ok) { const errData = await response.json(); throw new Error(errData.error); }
            const result = await response.json();
            setVideo(prev => prev ? { ...prev, likes: result.likes, dislikes: result.dislikes, currentUserRating: result.newRatingStatus } : null);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "No se pudo valorar.");
            setVideo(prev => prev ? { ...prev, currentUserRating: originalRating, likes: originalLikes, dislikes: originalDislikes } : null);
        }
    };
    const handleDelete = async () => {
        // ... (lógica de handleDelete sin cambios, como en la respuesta anterior)
        if (!video || !session) return;
        if (video.userId !== session.id || (session.userType !== UserType.SCHOOL && session.userType !== UserType.GOVERNMENT)) {
            toast.error("No tienes permiso para eliminar este video."); return;
        }
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/education/short-videos/${video.id}`, { method: 'DELETE' });
            if (!response.ok) { const errData = await response.json(); throw new Error(errData.error); }
            toast.success("Video eliminado."); router.push("/educacion?tab=videos"); router.refresh();
        } catch (err) { toast.error(err instanceof Error ? err.message : "No se pudo eliminar."); }
        finally { setIsDeleting(false); }
    };

    const topicDisplayName = (topic: VideoTopic | undefined) => topic ? topic.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "Desconocido";

    const renderVideoPlayer = () => {
        if (!video) return <div className="aspect-video bg-gray-200 flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-gray-400" /></div>;

        const videoSourceUrl = video.externalVideoUrl || video.videoUrl; // Prioriza URL externa si existe

        if (!videoSourceUrl) {
            return (
                <div className="aspect-video bg-gray-100 flex flex-col items-center justify-center text-gray-500">
                    <Film className="h-16 w-16 mb-2" />
                    Video no disponible.
                </div>
            );
        }

        const videoDetails = getVideoEmbedDetails(videoSourceUrl);

        if (videoDetails.type === 'youtube' || videoDetails.type === 'vimeo') {
            return (
                <iframe
                    src={videoDetails.embedUrl}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full aspect-video"
                ></iframe>
            );
        } else if (videoDetails.type === 'direct') {
            return (
                <video src={videoDetails.embedUrl} controls poster={video.thumbnailUrl || undefined} className="w-full h-full aspect-video bg-black">
                    Tu navegador no soporta la etiqueta de video.
                    <a href={videoDetails.embedUrl} download className="text-blue-400 hover:underline">Descarga el video</a>.
                </video>
            );
        } else { // type === 'unknown'
            return (
                <div className="aspect-video bg-gray-100 flex flex-col items-center justify-center text-gray-500 p-4">
                    <AlertTriangle className="h-12 w-12 mb-3 text-yellow-500" />
                    <p className="text-center mb-2">No se puede reproducir este video directamente.</p>
                    <Button asChild variant="outline" size="sm">
                        <a href={videoDetails.originalUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" /> Ver en fuente original
                        </a>
                    </Button>
                </div>
            );
        }
    };


    if (isLoading || isLoadingSession) return <DashboardLayout><div className="flex justify-center items-center h-[calc(100vh-150px)]"><Loader2 className="h-12 w-12 animate-spin text-blue-600" /></div></DashboardLayout>;
    if (error) return <DashboardLayout><div className="container text-center p-8"><AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" /><h1 className="text-2xl font-semibold text-red-700">Error</h1><p className="mt-2">{error}</p><Button onClick={fetchShortVideo} className="mt-6 bg-red-600">Reintentar</Button></div></DashboardLayout>;
    if (!video) return <DashboardLayout><div className="container text-center p-8">Video no encontrado.</div></DashboardLayout>;

    const canEditOrDelete = session && video.userId === session.id && (session.userType === UserType.SCHOOL || session.userType === UserType.GOVERNMENT);

    return (
        <DashboardLayout>
            <div className="container mx-auto px-2 sm:px-4 py-8 max-w-4xl mt-10 lg:mt-0">
                <div className="mb-6"><Link href="/educacion/videos" className="text-sm text-blue-600 hover:underline flex items-center"><ArrowLeft className="h-4 w-4 mr-1" /> Volver a Videos</Link></div>
                <Card className="shadow-lg overflow-hidden">
                    <div className="relative w-full aspect-video bg-black">
                        {renderVideoPlayer()}
                        {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-black/50"><Loader2 className="h-10 w-10 animate-spin text-white" /></div>}
                    </div>
                    <CardHeader className="p-6">
                        <Badge variant="outline" className="mb-2 text-xs self-start text-blue-700 border-blue-300 bg-blue-50"><Tag className="h-3 w-3 mr-1" /> {topicDisplayName(video.topic)}</Badge>
                        <CardTitle className="text-3xl md:text-4xl font-bold text-gray-800 break-words">{video.title}</CardTitle>
                        <div className="text-xs text-gray-500 mt-2 space-y-1 md:flex md:items-center md:gap-4">
                            <div className="flex items-center gap-1.5"><UserCircle className="h-4 w-4" /><span>Por: {video.authorName} ({video.authorInstitution})</span></div>
                            <span className="hidden md:inline">•</span>
                            <div className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /><span>Publicado: {format(new Date(video.createdAt), "dd MMMM, yyyy", { locale: es })}</span></div>
                        </div>
                        <div className="w-full mt-3 bg-gray-50 p-3 rounded-md border">
                            {video.authorInfo && <p className="text-xs italic text-gray-500 text-balance overflow-auto">{video.authorInfo}</p>}
                        </div>
                    </CardHeader>
                    {video.description && <CardContent className="px-6 pt-0 pb-4 prose prose-sm sm:prose-base max-w-none text-gray-700 break-words whitespace-pre-line">{video.description}</CardContent>}
                    <CardFooter className="px-6 py-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="sm" className={`h-auto px-2.5 py-1.5 text-sm ${video.currentUserRating === true ? 'text-blue-600 bg-blue-100 hover:bg-blue-200' : 'text-muted-foreground hover:bg-blue-50 hover:text-blue-700'}`} onClick={() => handleRating(true)} disabled={!session?.id || isDeleting}><ThumbsUp className="h-4 w-4 mr-1.5" /> {video.likes}</Button>
                            <Button variant="ghost" size="sm" className={`h-auto px-2.5 py-1.5 text-sm ${video.currentUserRating === false ? 'text-red-600 bg-red-100 hover:bg-red-200' : 'text-muted-foreground hover:bg-red-50 hover:text-red-700'}`} onClick={() => handleRating(false)} disabled={!session?.id || isDeleting}><ThumbsDown className="h-4 w-4 mr-1.5" /> {video.dislikes}</Button>
                        </div>
                        {canEditOrDelete && (
                            <div className="flex gap-2">
                                <Link href={`/educacion/videos/editar/${video.id}`} passHref legacyBehavior><Button variant="outline" size="sm" disabled={isDeleting}><Edit className="h-4 w-4 mr-1.5" /> Editar</Button></Link>
                                <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={isDeleting}><Trash2 className="h-4 w-4 mr-1.5" /> Eliminar</Button></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>¿Seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción eliminará el video permanentemente.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">{isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Eliminar</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        )}
                    </CardFooter>
                </Card>
                <div className="mt-8 text-center"><Button asChild variant="link" className="text-blue-600"><Link href="/educacion"><Home className="mr-2 h-4 w-4" />Volver a la página principal</Link></Button></div>
            </div>
        </DashboardLayout>
    );
}