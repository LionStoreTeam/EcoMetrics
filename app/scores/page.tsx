"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Users, Filter, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge"; // Asegúrate que es el Badge correcto
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
} from "@/components/ui/pagination";
import { Card, CardContent, CardHeader } from "@/components/ui/card";


// Definición de la interfaz para los datos de usuario en la tabla de scores
interface ScoreUser {
    id: string;
    name: string;
    email: string;
    userType: string;
    avatarUrl?: string | null;
    totalActivities: number;
    totalPoints: number;
    level: number;
    memberSince: string;
}

interface ApiResponse {
    users: ScoreUser[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

const USER_TYPE_MAP: { [key: string]: string } = {
    INDIVIDUAL: "Individual",
    SCHOOL: "Escuela",
    COMMUNITY: "Comunidad",
    GOVERNMENT: "Gobierno",
};

const ITEMS_PER_PAGE = 10;

export default function ScoresPage() {
    const [users, setUsers] = useState<ScoreUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [userTypeFilter, setUserTypeFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const getInitials = (name: string = "") => {
        return name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() || "U";
    };

    const fetchScores = useCallback(async (page = 1, search = searchTerm, type = userTypeFilter) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: ITEMS_PER_PAGE.toString(),
            });
            if (search) params.append("search", search);
            if (type !== "all") params.append("userType", type);

            const response = await fetch(`/api/scores?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al obtener los scores");
            }
            const data: ApiResponse = await response.json();
            setUsers(data.users);
            setCurrentPage(data.pagination.page);
            setTotalPages(data.pagination.totalPages);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Ocurrió un error desconocido.");
            setUsers([]); // Limpiar usuarios en caso de error
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, userTypeFilter]); // Dependencias actualizadas

    useEffect(() => {
        fetchScores(1); // Cargar la primera página al inicio o cuando cambian los filtros
    }, [fetchScores]);


    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
        // No llamar a fetchScores aquí directamente para evitar múltiples requests si el usuario escribe rápido.
        // Se podría implementar un debounce o llamar en el submit de un botón de búsqueda.
        // Por ahora, la búsqueda se activa al cambiar de página o filtro, o al llamar a fetchScores manualmente.
    };

    const handleSearchSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
        if (event) event.preventDefault();
        setCurrentPage(1); // Resetear a la primera página en nueva búsqueda
        fetchScores(1, searchTerm, userTypeFilter);
    }

    const handleUserTypeChange = (value: string) => {
        setUserTypeFilter(value);
        setCurrentPage(1); // Resetear a la primera página
        fetchScores(1, searchTerm, value);
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            fetchScores(page);
        }
    };


    const renderPaginationItems = () => {
        const items = [];
        const maxPagesToShow = 5; // Máximo de botones de página a mostrar (ej. 1 ... 3 4 5 ... 10)
        const halfPagesToShow = Math.floor(maxPagesToShow / 2);

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLink
                            href="#"
                            onClick={(e) => { e.preventDefault(); handlePageChange(i); }}
                            isActive={currentPage === i}
                        >
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }
        } else {
            // Mostrar primera página y elipsis si es necesario
            items.push(
                <PaginationItem key={1}>
                    <PaginationLink
                        href="#"
                        onClick={(e) => { e.preventDefault(); handlePageChange(1); }}
                        isActive={currentPage === 1}
                    >
                        1
                    </PaginationLink>
                </PaginationItem>
            );

            if (currentPage > halfPagesToShow + 2) {
                items.push(<PaginationEllipsis key="start-ellipsis" />);
            }

            // Calcular rango de páginas a mostrar alrededor de la actual
            let startPage = Math.max(2, currentPage - halfPagesToShow);
            let endPage = Math.min(totalPages - 1, currentPage + halfPagesToShow);

            if (currentPage <= halfPagesToShow + 1) {
                endPage = Math.min(totalPages - 1, maxPagesToShow - 1);
            }
            if (currentPage >= totalPages - halfPagesToShow) {
                startPage = Math.max(2, totalPages - maxPagesToShow + 2);
            }


            for (let i = startPage; i <= endPage; i++) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLink
                            href="#"
                            onClick={(e) => { e.preventDefault(); handlePageChange(i); }}
                            isActive={currentPage === i}
                        >
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }

            // Mostrar elipsis y última página si es necesario
            if (currentPage < totalPages - halfPagesToShow - 1) {
                items.push(<PaginationEllipsis key="end-ellipsis" />);
            }

            items.push(
                <PaginationItem key={totalPages}>
                    <PaginationLink
                        href="#"
                        onClick={(e) => { e.preventDefault(); handlePageChange(totalPages); }}
                        isActive={currentPage === totalPages}
                    >
                        {totalPages}
                    </PaginationLink>
                </PaginationItem>
            );
        }
        return items;
    };


    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8 m-5 sm:m-10">
                <div className="p-6 flex flex-col gap-2 text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg">
                    <div className="flex items-center gap-3">
                        <Users className="h-8 w-8" />
                        <h1 className="text-3xl font-bold tracking-tight">Scores de Usuarios</h1>
                    </div>
                    <p className="text-purple-100">
                        Ranking y estadísticas de los participantes de EcoTrack MX.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Buscar por nombre o correo..."
                                    className="pl-10 py-2 text-base"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                            </div>
                            <Select value={userTypeFilter} onValueChange={handleUserTypeChange}>
                                <SelectTrigger className="w-full md:w-[220px] py-2 text-base">
                                    <Filter className="mr-2 h-5 w-5" />
                                    <SelectValue placeholder="Filtrar por Tipo de Usuario" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los Tipos</SelectItem>
                                    <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                                    <SelectItem value="SCHOOL">Escuela</SelectItem>
                                    <SelectItem value="COMMUNITY">Comunidad</SelectItem>
                                    <SelectItem value="GOVERNMENT">Gobierno</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white py-2">
                                Buscar
                            </Button>
                        </form>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
                            </div>
                        ) : error ? (
                            <div className="text-center py-10 text-red-500">
                                <p>{error}</p>
                                <Button onClick={() => fetchScores(currentPage)} variant="outline" className="mt-4">Reintentar</Button>
                            </div>
                        ) : users.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[80px]">Avatar</TableHead>
                                                <TableHead>Nombre</TableHead>
                                                <TableHead className="hidden md:table-cell">Correo</TableHead>
                                                <TableHead>Tipo</TableHead>
                                                <TableHead className="text-center">Actividades</TableHead>
                                                <TableHead className="text-center">Puntos</TableHead>
                                                <TableHead className="text-center">Nivel</TableHead>
                                                <TableHead className="hidden lg:table-cell">Miembro Desde</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {users.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell>
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={user.avatarUrl || ""} alt={user.name} />
                                                            <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">
                                                                {getInitials(user.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </TableCell>
                                                    <TableCell className="font-medium">{user.name}</TableCell>
                                                    <TableCell className="hidden md:table-cell text-muted-foreground">{user.email}</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                user.userType === "SCHOOL" ? "secondary" :
                                                                    user.userType === "COMMUNITY" ? "outline" : // Example: use outline for community
                                                                        user.userType === "GOVERNMENT" ? "destructive" // Example
                                                                            : "default"
                                                            }
                                                            className={
                                                                user.userType === "INDIVIDUAL" ? "bg-sky-100 text-sky-700 border-sky-300" :
                                                                    user.userType === "SCHOOL" ? "bg-amber-100 text-amber-700 border-amber-300" :
                                                                        user.userType === "COMMUNITY" ? "bg-teal-100 text-teal-700 border-teal-300" :
                                                                            user.userType === "GOVERNMENT" ? "bg-slate-100 text-slate-700 border-slate-300"
                                                                                : "bg-gray-100 text-gray-700 border-gray-300"
                                                            }
                                                        >
                                                            {USER_TYPE_MAP[user.userType] || user.userType}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">{user.totalActivities}</TableCell>
                                                    <TableCell className="text-center font-semibold text-purple-600">{user.totalPoints}</TableCell>
                                                    <TableCell className="text-center">{user.level}</TableCell>
                                                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                                                        {format(new Date(user.memberSince), "dd MMM, yyyy", { locale: es })}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                {totalPages > 1 && (
                                    <Pagination className="mt-6">
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href="#"
                                                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                                                />
                                            </PaginationItem>
                                            {renderPaginationItems()}
                                            <PaginationItem>
                                                <PaginationNext
                                                    href="#"
                                                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                                                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-10">
                                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-lg font-medium text-muted-foreground">No se encontraron usuarios.</p>
                                <p className="text-sm text-muted-foreground">
                                    Intenta ajustar los filtros o el término de búsqueda.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}