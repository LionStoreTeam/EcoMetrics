// app/educacion/articulos/[articleId]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpenText, UserCircle, CalendarDays, Tag, ThumbsUp, ThumbsDown, Edit, Trash2, Loader2, AlertTriangle, ArrowLeft, Home, ImageOff } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArticleTopic, UserType } from "@prisma/client";
import { format, formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";
import toast from "react-hot-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


interface ArticleDetailType {
    id: string;
    title: string;
    content: string;
    topic: ArticleTopic;
    authorName: string;
    authorInstitution: string;
    authorInfo?: string | null;
    coverImageUrl?: string | null;
    userId: string;
    user: {
        id: string;
        name: string;
        userType: UserType;
    };
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
    likes: number;
    dislikes: number;
    currentUserRating: boolean | null; // true for like, false for dislike, null if not rated
}

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


export default function EducationalArticlePage() {
    const router = useRouter();
    const params = useParams();
    const articleId = params.articleId as string;
    const { session, isLoadingSession } = useUserSession();

    const [article, setArticle] = useState<ArticleDetailType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchArticle = useCallback(async () => {
        if (!articleId) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/education/articles/${articleId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Artículo no encontrado o error al cargar.");
            }
            const data: ArticleDetailType = await response.json();
            setArticle(data);
        } catch (err) {
            console.error("Error cargando artículo:", err);
            setError(err instanceof Error ? err.message : "Ocurrió un error desconocido.");
        } finally {
            setIsLoading(false);
        }
    }, [articleId]);

    useEffect(() => {
        fetchArticle();
    }, [fetchArticle]);

    const handleRating = async (liked: boolean) => {
        if (!article || !session?.id) {
            toast.error("Debes iniciar sesión para valorar.");
            return;
        }

        // Optimistic update
        const originalRating = article.currentUserRating;
        const originalLikes = article.likes;
        const originalDislikes = article.dislikes;

        setArticle(prev => {
            if (!prev) return null;
            let newLikes = prev.likes;
            let newDislikes = prev.dislikes;
            let newCurrentUserRating: boolean | null = liked;

            if (prev.currentUserRating === liked) { // Toggle off
                newCurrentUserRating = null;
                if (liked) newLikes--; else newDislikes--;
            } else { // New vote or changed vote
                if (prev.currentUserRating === true) newLikes--;
                else if (prev.currentUserRating === false) newDislikes--;

                if (liked) newLikes++; else newDislikes++;
            }
            return { ...prev, likes: newLikes, dislikes: newDislikes, currentUserRating: newCurrentUserRating };
        });

        try {
            const response = await fetch(`/api/education/articles/${article.id}/rate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ liked }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al registrar valoración");
            }
            const result = await response.json();
            // Actualizar con datos del servidor para asegurar consistencia
            setArticle(prev => prev ? { ...prev, likes: result.likes, dislikes: result.dislikes, currentUserRating: result.newRatingStatus } : null);
            // toast.success(result.message);
        } catch (err) {
            console.error("Error valorando artículo:", err);
            toast.error(err instanceof Error ? err.message : "No se pudo registrar tu valoración.");
            // Revertir en caso de error
            setArticle(prev => prev ? { ...prev, currentUserRating: originalRating, likes: originalLikes, dislikes: originalDislikes } : null);
        }
    };

    const handleDelete = async () => {
        if (!article || !session) return;
        if (article.userId !== session.id || (session.userType !== UserType.SCHOOL && session.userType !== UserType.GOVERNMENT)) {
            toast.error("No tienes permiso para eliminar este artículo.");
            return;
        }
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/education/articles/${article.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al eliminar el artículo.");
            }
            toast.success("Artículo eliminado correctamente.");
            router.push("/educacion");
            router.refresh();
        } catch (err) {
            console.error("Error eliminando artículo:", err);
            toast.error(err instanceof Error ? err.message : "No se pudo eliminar el artículo.");
        } finally {
            setIsDeleting(false);
        }
    };

    const topicDisplayName = (topic: ArticleTopic | undefined) => {
        if (!topic) return "Desconocido";
        return topic.replace(/_/g, " ").charAt(0).toUpperCase() + topic.replace(/_/g, " ").slice(1).toLowerCase();
    }


    if (isLoading || isLoadingSession) {
        return <DashboardLayout><div className="flex justify-center items-center h-[calc(100vh-150px)]"><Loader2 className="h-12 w-12 animate-spin text-green-600" /></div></DashboardLayout>;
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="container mx-auto px-4 py-8 text-center">
                    <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
                    <h1 className="text-2xl font-semibold text-red-700">Error al Cargar el Artículo</h1>
                    <p className="text-muted-foreground mt-2">{error}</p>
                    <Button onClick={fetchArticle} className="mt-6 bg-red-600 hover:bg-red-700">Reintentar</Button>
                    <Button asChild variant="outline" className="mt-6 ml-2">
                        <Link href="/educacion"><ArrowLeft className="mr-2 h-4 w-4" />Volver a Educación</Link>
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    if (!article) {
        return <DashboardLayout><div className="container mx-auto px-4 py-8 text-center"><p>Artículo no encontrado.</p></div></DashboardLayout>;
    }

    const canEditOrDelete = session && article.userId === session.id && (session.userType === UserType.SCHOOL || session.userType === UserType.GOVERNMENT);


    return (
        <DashboardLayout>
            <div className="container mx-auto px-2 sm:px-4 py-8 max-w-4xl mt-10 lg:mt-0">
                <div className="mb-6">
                    <Link href="/educacion/articulos/" className="text-sm text-green-600 hover:underline flex items-center">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Volver a todos los artículos
                    </Link>
                </div>

                <Card className="shadow-lg overflow-hidden">
                    {article.coverImageUrl ? (
                        <div className="relative w-full h-64 md:h-80">
                            <Image src={article.coverImageUrl} alt={article.title} layout="fill" objectFit="cover" priority />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>
                    ) : (
                        <div className="w-full h-40 bg-gradient-to-br from-green-100 to-teal-100 flex items-center justify-center">
                            <BookOpenText className="h-20 w-20 text-green-400 opacity-70" />
                        </div>
                    )}

                    <CardHeader className="p-6">
                        <Badge variant="outline" className="mb-2 text-xs self-start text-green-700 border-green-300 bg-green-50">
                            <Tag className="h-3 w-3 mr-1" /> {topicDisplayName(article.topic)}
                        </Badge>
                        <CardTitle className="text-3xl md:text-4xl font-bold text-gray-800 break-words">{article.title}</CardTitle>
                        <div className="text-xs text-gray-500 mt-2 space-y-1 md:flex md:items-center md:gap-4">
                            <div className="flex items-center gap-1.5">
                                <UserCircle className="h-4 w-4" />
                                <span>Por: {article.authorName} ({article.authorInstitution})</span>
                            </div>
                            <span className="hidden md:inline">•</span>
                            <div className="flex items-center gap-1.5">
                                <CalendarDays className="h-4 w-4" />
                                <span>Publicado: {format(new Date(article.createdAt), "dd MMMM, yyyy", { locale: es })}</span>
                                {article.createdAt !== article.updatedAt && (
                                    <span className="text-gray-400">(Actualizado: {formatDistanceToNowStrict(new Date(article.updatedAt), { locale: es, addSuffix: true })})</span>
                                )}
                            </div>
                        </div>
                        {article.authorInfo && (
                            <p className="mt-2 text-xs italic text-gray-500 bg-gray-50 p-2 rounded-md border">
                                {article.authorInfo}
                            </p>
                        )}
                    </CardHeader>

                    <CardContent className="px-6 py-4 prose prose-sm sm:prose-base lg:prose-lg max-w-none text-gray-700 break-words whitespace-pre-line">
                        {article.content}
                    </CardContent>

                    <CardFooter className="px-6 py-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-auto px-2.5 py-1.5 text-sm ${article.currentUserRating === true ? 'text-green-600 bg-green-100 hover:bg-green-200' : 'text-muted-foreground hover:bg-green-50 hover:text-green-700'}`}
                                onClick={() => handleRating(true)}
                                disabled={!session?.id || isDeleting}
                            >
                                <ThumbsUp className="h-4 w-4 mr-1.5" /> {article.likes}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-auto px-2.5 py-1.5 text-sm ${article.currentUserRating === false ? 'text-red-600 bg-red-100 hover:bg-red-200' : 'text-muted-foreground hover:bg-red-50 hover:text-red-700'}`}
                                onClick={() => handleRating(false)}
                                disabled={!session?.id || isDeleting}
                            >
                                <ThumbsDown className="h-4 w-4 mr-1.5" /> {article.dislikes}
                            </Button>
                        </div>
                        {canEditOrDelete && (
                            <div className="flex gap-2">
                                <Link href={`/educacion/articulos/editar/${article.id}`} passHref legacyBehavior>
                                    <Button variant="outline" size="sm" disabled={isDeleting}>
                                        <Edit className="h-4 w-4 mr-1.5" /> Editar
                                    </Button>
                                </Link>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm" disabled={isDeleting}>
                                            <Trash2 className="h-4 w-4 mr-1.5" /> Eliminar
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción no se puede deshacer. Esto eliminará permanentemente el artículo.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
                                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Eliminar
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        )}
                    </CardFooter>
                </Card>
                <div className="mt-8 text-center">
                    <Button asChild variant="link" className="text-green-600">
                        <Link href="/educacion"><Home className="mr-2 h-4 w-4" /> Volver a la página principal</Link>
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}