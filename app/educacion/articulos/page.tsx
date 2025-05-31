// app/educacion/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { BookText, Search, Filter, PlusCircle, ThumbsUp, ThumbsDown, Edit, Trash2, Loader2, AlertTriangle, ChevronRight, UserCircle, ImageOff } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";
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
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";


// Tipos para los artículos y la paginación
interface EducationalArticleItem {
    id: string;
    title: string;
    content: string; // Podría ser un extracto
    topic: ArticleTopic;
    authorName: string;
    authorInstitution: string;
    coverImageUrl?: string | null;
    userId: string; // Para verificar permisos de edición/eliminación
    user: {
        id: string;
        name: string;
        userType: UserType;
    };
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
    likes: number;
    dislikes: number;
    currentUserRating: boolean | null; // true para like, false para dislike, null si no ha votado
}

interface ArticlesApiResponse {
    articles: EducationalArticleItem[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

const ITEMS_PER_PAGE = 9; // Artículos por página

export default function ArticlesPage() {
    const router = useRouter();
    const { session, isLoadingSession } = useUserSession(); // Usando el hook de sesión
    const [articles, setArticles] = useState<EducationalArticleItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [topicFilter, setTopicFilter] = useState<ArticleTopic | "ALL">("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [articleToDelete, setArticleToDelete] = useState<EducationalArticleItem | null>(null);


    const fetchArticles = useCallback(async (page = 1, search = searchTerm, topic = topicFilter) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: ITEMS_PER_PAGE.toString(),
            });
            if (search) params.append("search", search);
            if (topic !== "ALL") params.append("topic", topic);

            const response = await fetch(`/api/education/articles?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al obtener los artículos educativos");
            }
            const data: ArticlesApiResponse = await response.json();
            setArticles(data.articles);
            setCurrentPage(data.pagination.page);
            setTotalPages(data.pagination.totalPages);
        } catch (err) {
            console.error("Error al cargar artículos:", err);
            setError(err instanceof Error ? err.message : "Ocurrió un error desconocido.");
            setArticles([]);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, topicFilter]); // Dependencias actualizadas

    useEffect(() => {
        if (!isLoadingSession) { // Solo cargar artículos después de verificar la sesión
            fetchArticles(1);
        }
    }, [fetchArticles, isLoadingSession]);

    const handleSearchSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
        if (event) event.preventDefault();
        setCurrentPage(1);
        fetchArticles(1, searchTerm, topicFilter);
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            fetchArticles(page, searchTerm, topicFilter);
        }
    };

    const handleRating = async (articleId: string, liked: boolean) => {
        if (!session?.id) {
            toast.error("Debes iniciar sesión para valorar.");
            return;
        }

        // Optimistic update
        const originalArticles = [...articles];
        setArticles(prevArticles => prevArticles.map(article => {
            if (article.id === articleId) {
                let newLikes = article.likes;
                let newDislikes = article.dislikes;
                let newCurrentUserRating: boolean | null = liked;

                if (article.currentUserRating === liked) { // Toggle off
                    newCurrentUserRating = null;
                    if (liked) newLikes--; else newDislikes--;
                } else { // New vote or changed vote
                    if (article.currentUserRating === true) newLikes--; // Votó like antes
                    else if (article.currentUserRating === false) newDislikes--; // Votó dislike antes

                    if (liked) newLikes++; else newDislikes++;
                }
                return { ...article, likes: newLikes, dislikes: newDislikes, currentUserRating: newCurrentUserRating };
            }
            return article;
        }));

        try {
            const response = await fetch(`/api/education/articles/${articleId}/rate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ liked }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al registrar valoración");
            }
            const result = await response.json();
            // Actualizar con datos del servidor para asegurar consistencia (opcional si el optimistic update es fiable)
            setArticles(prevArticles => prevArticles.map(article =>
                article.id === articleId ? { ...article, likes: result.likes, dislikes: result.dislikes, currentUserRating: result.newRatingStatus } : article
            ));
            // toast.success(result.message); // Opcional: puede ser mucho feedback
        } catch (err) {
            console.error("Error valorando artículo:", err);
            toast.error(err instanceof Error ? err.message : "No se pudo registrar tu valoración.");
            setArticles(originalArticles); // Revertir en caso de error
        }
    };

    const handleDeleteArticle = async () => {
        if (!articleToDelete || !session) return;

        if (articleToDelete.userId !== session.id || (session.userType !== UserType.SCHOOL && session.userType !== UserType.GOVERNMENT)) {
            toast.error("No tienes permiso para eliminar este artículo.");
            setArticleToDelete(null);
            return;
        }

        setIsLoading(true); // Podrías usar un `isDeleting` específico
        try {
            const response = await fetch(`/api/education/articles/${articleToDelete.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al eliminar el artículo.");
            }
            toast.success("Artículo eliminado correctamente.");
            setArticleToDelete(null);
            fetchArticles(currentPage); // Recargar artículos
            router.refresh();
        } catch (err) {
            console.error("Error eliminando artículo:", err);
            toast.error(err instanceof Error ? err.message : "No se pudo eliminar el artículo.");
        } finally {
            setIsLoading(false);
        }
    };


    const articleTopicsArray = Object.values(ArticleTopic);

    const renderPaginationItems = () => {
        const items = [];
        const maxPagesToShow = 3;
        const halfPagesToShow = Math.floor(maxPagesToShow / 2);

        if (totalPages <= maxPagesToShow + 2) { // Mostrar todos los números si son pocos
            for (let i = 1; i <= totalPages; i++) {
                items.push(
                    <PaginationItem key={`edu-page-${i}`}>
                        <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i); }} isActive={currentPage === i}>
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }
        } else {
            items.push(
                <PaginationItem key="edu-page-1">
                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(1); }} isActive={currentPage === 1}>1</PaginationLink>
                </PaginationItem>
            );

            if (currentPage > halfPagesToShow + 2) {
                items.push(<PaginationEllipsis key="edu-start-ellipsis" onClick={() => handlePageChange(Math.max(1, currentPage - maxPagesToShow))} />);
            }

            let startPage = Math.max(2, currentPage - halfPagesToShow);
            let endPage = Math.min(totalPages - 1, currentPage + halfPagesToShow);

            if (currentPage <= halfPagesToShow + 1) {
                endPage = Math.min(totalPages - 1, maxPagesToShow);
            }
            if (currentPage >= totalPages - halfPagesToShow) {
                startPage = Math.max(2, totalPages - maxPagesToShow + 1)
            }


            for (let i = startPage; i <= endPage; i++) {
                items.push(
                    <PaginationItem key={`edu-page-${i}`}>
                        <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i); }} isActive={currentPage === i}>
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }

            if (currentPage < totalPages - (halfPagesToShow + 1)) {
                items.push(<PaginationEllipsis key="edu-end-ellipsis" onClick={() => handlePageChange(Math.min(totalPages, currentPage + maxPagesToShow))} />);
            }

            items.push(
                <PaginationItem key={`edu-page-${totalPages}`}>
                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(totalPages); }} isActive={currentPage === totalPages}>
                        {totalPages}
                    </PaginationLink>
                </PaginationItem>
            );
        }
        return items;
    };

    if (isLoadingSession) {
        return <DashboardLayout><div className="flex justify-center items-center h-full"><Loader2 className="h-12 w-12 animate-spin text-green-600" /></div></DashboardLayout>;
    }


    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8 m-5 sm:m-10">
                <div className="mt-16 md:mt-5 lg:mt-0 p-6 flex flex-col gap-2 text-white bg-gradient-to-r from-green-600 to-teal-600 rounded-xl shadow-lg">
                    <div className="flex items-center gap-3">
                        <BookText className="h-8 w-8" />
                        <h1 className="text-3xl font-bold tracking-tight">Educación Ambiental</h1>
                    </div>
                    <p className="text-teal-100">
                        Aprende, comparte y explora artículos y guías para un futuro más sostenible.
                    </p>
                </div>

                {/* Filtros y botón de crear */}
                <Card className="shadow-md">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 flex-grow w-full md:w-auto">
                                <div className="relative flex-grow">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="search-education"
                                        type="search"
                                        placeholder="Buscar artículos..."
                                        className="pl-10 py-2 text-sm w-full"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Select value={topicFilter} onValueChange={(value) => { setTopicFilter(value as ArticleTopic | "ALL"); setCurrentPage(1); }}>
                                    <SelectTrigger className="py-2 text-sm w-full sm:w-auto">
                                        <Filter className="mr-1.5 h-4 w-4" />
                                        <SelectValue placeholder="Todos los temas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Todos los Temas</SelectItem>
                                        {articleTopicsArray.map(topic => (
                                            <SelectItem key={topic} value={topic}>
                                                {topic.replace(/_/g, " ").charAt(0).toUpperCase() + topic.replace(/_/g, " ").slice(1).toLowerCase()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white py-2 text-sm w-full sm:w-auto">
                                    Buscar
                                </Button>
                            </form>
                            {(session?.userType === UserType.SCHOOL || session?.userType === UserType.GOVERNMENT) && (
                                <Link href="/educacion/articulos/nuevo" legacyBehavior passHref>
                                    <Button className="bg-teal-600 hover:bg-teal-700 text-white w-full md:w-auto mt-3 md:mt-0">
                                        <PlusCircle className="mr-2 h-4 w-4" /> Crear Artículo
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>


                {/* Listado de Artículos */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-green-600" /></div>
                ) : error ? (
                    <Card className="bg-red-50 border-red-200 text-red-700 py-10 text-center">
                        <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
                        <p className="text-xl font-semibold">Ocurrió un Error</p>
                        <p>{error}</p>
                        <Button onClick={() => fetchArticles(1, searchTerm, topicFilter)} variant="destructive" className="mt-4">Reintentar</Button>
                    </Card>
                ) : articles.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {articles.map((article) => (
                                <Card key={article.id} className="flex flex-col overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                                    <Link href={`/educacion/articulos/${article.id}`} legacyBehavior passHref>
                                        <a className="block group">
                                            <CardHeader className="p-0">
                                                <div className="relative w-full h-48 bg-gray-200">
                                                    {article.coverImageUrl ? (
                                                        <Image src={article.coverImageUrl} alt={article.title} layout="fill" objectFit="cover" className="group-hover:scale-105 transition-transform duration-300" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-teal-100">
                                                            <BookText className="h-16 w-16 text-green-400 opacity-70" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4 flex-grow flex flex-col">
                                                <Badge variant="outline" className="mb-2 text-xs self-start text-green-700 border-green-300 bg-green-50">
                                                    {article.topic.replace(/_/g, " ").charAt(0).toUpperCase() + article.topic.replace(/_/g, " ").slice(1).toLowerCase()}
                                                </Badge>
                                                <CardTitle className="text-lg font-semibold text-gray-800 mb-1 group-hover:text-green-600 transition-colors line-clamp-2" title={article.title}>
                                                    {article.title}
                                                </CardTitle>
                                                <CardDescription className="text-xs text-gray-500 line-clamp-3 mb-2 flex-grow">
                                                    {/* Podríamos mostrar un extracto del contenido aquí */}
                                                    {article.content.substring(0, 100)}...
                                                </CardDescription>
                                                <div className="text-xs text-gray-500 mt-auto">
                                                    <p className="flex items-center gap-1"><UserCircle className="h-3.5 w-3.5" /> {article.authorName}</p>
                                                    <p className="truncate" title={article.authorInstitution}>{article.authorInstitution}</p>
                                                    <p>{formatDistanceToNowStrict(new Date(article.createdAt), { locale: es, addSuffix: true })}</p>
                                                </div>
                                            </CardContent>
                                        </a>
                                    </Link>
                                    <CardFooter className="p-3 border-t bg-gray-50 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`h-auto px-2 py-1 text-xs ${article.currentUserRating === true ? 'text-green-600 bg-green-100' : 'text-muted-foreground hover:bg-green-50'}`}
                                                onClick={() => handleRating(article.id, true)}
                                                disabled={!session?.id}
                                            >
                                                <ThumbsUp className="h-3.5 w-3.5 mr-1" /> {article.likes}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`h-auto px-2 py-1 text-xs ${article.currentUserRating === false ? 'text-red-600 bg-red-100' : 'text-muted-foreground hover:bg-red-50'}`}
                                                onClick={() => handleRating(article.id, false)}
                                                disabled={!session?.id}
                                            >
                                                <ThumbsDown className="h-3.5 w-3.5 mr-1" /> {article.dislikes}
                                            </Button>
                                        </div>
                                        {session && session.id === article.userId && (session.userType === UserType.SCHOOL || session.userType === UserType.GOVERNMENT) && (
                                            <div className="flex gap-1">
                                                <Link href={`/educacion/articulos/editar/${article.id}`} passHref legacyBehavior>
                                                    <Button variant="outline" size="icon" className="h-7 w-7 border-gray-300 hover:border-blue-500 hover:text-blue-600" title="Editar">
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                </Link>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="outline" size="icon" className="h-7 w-7 border-gray-300 hover:border-red-500 hover:text-red-600" title="Eliminar" onClick={() => setArticleToDelete(article)}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                </AlertDialog>
                                            </div>
                                        )}
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                        {totalPages > 1 && (
                            <Pagination className="mt-10">
                                <PaginationContent>
                                    <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} className={currentPage === 1 ? "pointer-events-none opacity-50" : ""} /></PaginationItem>
                                    {renderPaginationItems()}
                                    <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""} /></PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        )}
                    </>
                ) : (
                    <div className="text-center py-20">
                        <BookText className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                        <h3 className="text-2xl font-semibold text-gray-700">No hay artículos educativos todavía.</h3>
                        <p className="text-gray-500 mt-3 text-md">
                            {(session?.userType === UserType.SCHOOL || session?.userType === UserType.GOVERNMENT)
                                ? "¡Sé el primero en compartir tu conocimiento!"
                                : "Vuelve más tarde para encontrar contenido útil."
                            }
                        </p>
                        {(session?.userType === UserType.SCHOOL || session?.userType === UserType.GOVERNMENT) && (
                            <Button asChild className="mt-6 bg-teal-600 hover:bg-teal-700">
                                <Link href="/educacion/articulos/nuevo">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo Artículo
                                </Link>
                            </Button>
                        )}
                    </div>
                )}
            </div>
            <AlertDialog open={!!articleToDelete} onOpenChange={(open) => !open && setArticleToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas eliminar el artículo "{articleToDelete?.title}"? Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setArticleToDelete(null)} disabled={isLoading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteArticle} disabled={isLoading} className="bg-red-600 hover:bg-red-700">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
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