// app/negocios-disponibles/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // import { useRouter } from "next/navigation";
import {
    Search, Filter, MapPin, Clock, Phone, Mail, Globe, Building, Briefcase, Users, Store,
    Loader2, AlertTriangle, ExternalLink, Info, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Pagination, PaginationContent, PaginationItem, PaginationLink,
    PaginationPrevious, PaginationNext, PaginationEllipsis,
} from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import Image from "next/image";
import { MEXICAN_STATES, BUSINESS_TYPES, type MexicanState, type BusinessType } from "@/lib/constants"; //
import { Label } from "@radix-ui/react-label";


// Interfaz para los datos del negocio que se mostrarán
interface DisplayBusiness {
    id: string;
    businessName: string;
    logoUrl?: string | null;
    description: string;
    businessType: string;
    address: string;
    city: string;
    state: string;
    zipCode?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    openingHours?: string | null;
    socialMedia?: string | null;
    submittedAt: string; // ISO string
}

interface BusinessesApiResponse {
    businesses: DisplayBusiness[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

const ITEMS_PER_PAGE = 9; // Para un grid 3x3

export default function NegociosDisponiblesPage() {
    const router = useRouter();
    const [businesses, setBusinesses] = useState<DisplayBusiness[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [stateFilter, setStateFilter] = useState<MexicanState | "ALL">("ALL");
    const [businessTypeFilter, setBusinessTypeFilter] = useState<BusinessType | "ALL">("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedBusiness, setSelectedBusiness] = useState<DisplayBusiness | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);


    const fetchBusinesses = useCallback(async (page = 1, name = searchTerm, state = stateFilter, type = businessTypeFilter) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: ITEMS_PER_PAGE.toString(),
            });
            if (name) params.append("name", name);
            if (state !== "ALL") params.append("state", state);
            if (type !== "ALL") params.append("type", type);

            const response = await fetch(`/api/negocios-promocionados?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al obtener los negocios promocionados");
            }
            const data: BusinessesApiResponse = await response.json();
            setBusinesses(data.businesses);
            setCurrentPage(data.pagination.page);
            setTotalPages(data.pagination.totalPages);
        } catch (err) {
            console.error("Error al cargar negocios:", err);
            setError(err instanceof Error ? err.message : "Ocurrió un error desconocido.");
            setBusinesses([]);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, stateFilter, businessTypeFilter]); // Dependencias para useCallback

    useEffect(() => {
        fetchBusinesses(1); // Carga inicial
    }, [fetchBusinesses]); // fetchBusinesses ya tiene sus propias dependencias

    const handleSearchSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
        if (event) event.preventDefault();
        setCurrentPage(1); // Resetear a la primera página en nueva búsqueda/filtro
        fetchBusinesses(1, searchTerm, stateFilter, businessTypeFilter);
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            fetchBusinesses(page, searchTerm, stateFilter, businessTypeFilter);
        }
    };

    const openDetailsModal = (business: DisplayBusiness) => {
        setSelectedBusiness(business);
        setIsModalOpen(true);
    };

    const getBusinessTypeName = (typeId: string) => BUSINESS_TYPES.find(bt => bt.id === typeId)?.name || typeId; //

    const renderPaginationItems = () => {
        const items = [];
        const maxPagesToShow = 3;
        const halfPagesToShow = Math.floor(maxPagesToShow / 2);

        if (totalPages <= maxPagesToShow + 2) {
            for (let i = 1; i <= totalPages; i++) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i); }} isActive={currentPage === i}>
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }
        } else {
            items.push(
                <PaginationItem key={1}>
                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(1); }} isActive={currentPage === 1}>1</PaginationLink>
                </PaginationItem>
            );
            if (currentPage > halfPagesToShow + 2) {
                items.push(<PaginationEllipsis key="start-ellipsis" onClick={() => handlePageChange(Math.max(1, currentPage - maxPagesToShow))} />);
            }
            let startPage = Math.max(2, currentPage - halfPagesToShow);
            let endPage = Math.min(totalPages - 1, currentPage + halfPagesToShow);
            if (currentPage <= halfPagesToShow + 1) endPage = Math.min(totalPages - 1, maxPagesToShow);
            if (currentPage >= totalPages - halfPagesToShow) startPage = Math.max(2, totalPages - maxPagesToShow + 1);

            for (let i = startPage; i <= endPage; i++) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i); }} isActive={currentPage === i}>
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }
            if (currentPage < totalPages - (halfPagesToShow + 1)) {
                items.push(<PaginationEllipsis key="end-ellipsis" onClick={() => handlePageChange(Math.min(totalPages, currentPage + maxPagesToShow))} />);
            }
            items.push(
                <PaginationItem key={totalPages}>
                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(totalPages); }} isActive={currentPage === totalPages}>
                        {totalPages}
                    </PaginationLink>
                </PaginationItem>
            );
        }
        return items;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header similar al de la página principal, pero sin botones de login/registro si es una vista pública */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex flex-col h-24 gap-2 items-center justify-center md:flex-row md:justify-between md:h-16">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/logo.png" alt="EcoMetrics Logo" width={40} height={40} priority />
                        <span className="text-xl font-bold">EcoMetrics</span>
                    </Link>
                    <nav className="flex items-center gap-4">
                        <Link href="/dashboard" legacyBehavior passHref>
                            <Button variant="outline" size="sm" className="bg-green-600 text-white hover:bg-green-700 hover:text-white">
                                Inicio
                            </Button>
                        </Link>
                        <Link href="/promociona-tu-negocio" legacyBehavior passHref>
                            <Button variant="outline" size="sm" className="text-green-600 border border-green-600 hover:bg-green-600 hover:text-white">
                                Promociona tu Negocio
                            </Button>
                        </Link>
                        {/* Aquí podrían ir otros enlaces públicos */}
                    </nav>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-800 sm:text-5xl md:text-6xl">
                        Negocios <span className="text-green-600">Sostenibles</span> en tu Comunidad
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
                        Descubre y apoya a los negocios locales comprometidos con el medio ambiente.
                    </p>
                </div>

                {/* Filtros */}
                <Card className="mb-8 shadow-md">
                    <CardContent className="p-4">
                        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                            <div className="sm:col-span-2 lg:col-span-1">
                                <Label htmlFor="search-name" className="text-sm font-medium text-gray-700">Nombre del Negocio</Label>
                                <div className="relative mt-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="search-name"
                                        type="search"
                                        placeholder="Buscar por nombre..."
                                        className="pl-10"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="state-filter-public" className="text-sm font-medium text-gray-700">Estado</Label>
                                <Select value={stateFilter} onValueChange={(value) => setStateFilter(value as MexicanState | "ALL")}>
                                    <SelectTrigger id="state-filter-public" className="mt-1"><SelectValue placeholder="Todos los estados" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Todos los Estados</SelectItem>
                                        {MEXICAN_STATES.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="type-filter-public" className="text-sm font-medium text-gray-700">Tipo de Negocio</Label>
                                <Select value={businessTypeFilter} onValueChange={(value) => setBusinessTypeFilter(value as BusinessType | "ALL")}>
                                    <SelectTrigger id="type-filter-public" className="mt-1"><SelectValue placeholder="Todos los tipos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Todos los Tipos</SelectItem>
                                        {BUSINESS_TYPES.map(type => <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white sm:col-span-2 lg:col-span-1">
                                <Filter className="mr-2 h-4 w-4" /> Aplicar Filtros
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Listado de Negocios */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-green-600" /></div>
                ) : error ? (
                    <Card className="bg-red-50 border-red-200 text-red-700 py-10 text-center">
                        <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
                        <p className="text-xl font-semibold">Ocurrió un Error</p>
                        <p>{error}</p>
                        <Button onClick={() => fetchBusinesses(1, searchTerm, stateFilter, businessTypeFilter)} variant="destructive" className="mt-4">Reintentar</Button>
                    </Card>
                ) : businesses.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
                            {businesses.map((business) => (
                                <Card key={business.id} className="h-full flex flex-col bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                                    <CardHeader className="p-0">
                                        <div className="relative w-full h-48">
                                            <Image
                                                src={business.logoUrl || "/placeholder-business.svg"}
                                                alt={`Logo de ${business.businessName}`}
                                                layout="fill"
                                                objectFit="cover"
                                                className={!business.logoUrl ? 'p-8 opacity-50' : ''}
                                                onError={(e) => (e.currentTarget.src = "/placeholder-business.svg")}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                                            <div className="absolute bottom-0 left-0 p-4">
                                                <Badge variant="secondary" className="bg-white/90 text-green-700 backdrop-blur-sm text-xs">
                                                    {getBusinessTypeName(business.businessType)}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-5 flex-grow flex flex-col">
                                        <CardTitle className="text-xl font-semibold text-gray-800 mb-2">{business.businessName}</CardTitle>
                                        <CardDescription className="text-sm text-gray-600 line-clamp-3 mb-3 flex-grow">
                                            {business.description}
                                        </CardDescription>
                                        <div className="text-xs text-gray-500 space-y-1">
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                                <span>{business.city}, {business.state}</span>
                                            </div>
                                            {business.phone && (
                                                <div className="flex items-center gap-1.5">
                                                    <Phone className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                                    <span>{business.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="p-4 border-t bg-gray-50">
                                        <Button variant="outline" className="w-full border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => openDetailsModal(business)}>
                                            <Eye className="mr-2 h-4 w-4" /> Ver Detalles
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                        {totalPages > 1 && (
                            <Pagination className="mt-12">
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
                        <Store className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                        <h3 className="text-2xl font-semibold text-gray-700">No se encontraron negocios</h3>
                        <p className="text-gray-500 mt-3 text-md">
                            Intenta ajustar los filtros o revisa más tarde. Constantemente se unen nuevos negocios a nuestra comunidad.
                        </p>
                        <Button asChild className="mt-6 bg-green-600 hover:bg-green-700">
                            <Link href="/promociona-tu-negocio">¡Promociona el Tuyo!</Link>
                        </Button>
                    </div>
                )}
            </main>

            {/* Modal de Detalles del Negocio */}
            {selectedBusiness && (
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            {selectedBusiness.logoUrl && (
                                <div className="flex justify-center mb-4">
                                    <Image src={selectedBusiness.logoUrl} alt={`Logo de ${selectedBusiness.businessName}`} width={100} height={100} className="rounded-lg object-contain border shadow-sm" />
                                </div>
                            )}
                            <DialogTitle className="text-2xl text-center font-bold text-gray-800">{selectedBusiness.businessName}</DialogTitle>
                            <DialogDescription className="text-center text-sm text-gray-500 mb-2">
                                <Badge variant="secondary" className="bg-green-100 text-green-700">{getBusinessTypeName(selectedBusiness.businessType)}</Badge>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 px-2 py-4 text-sm">
                            <p className="text-gray-700 whitespace-pre-line leading-relaxed">{selectedBusiness.description}</p>

                            <div className="border-t pt-4 space-y-2">
                                <h4 className="font-semibold text-gray-700">Ubicación y Contacto:</h4>
                                <p className="flex items-start gap-2"><MapPin className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> {selectedBusiness.address}, {selectedBusiness.city}, {selectedBusiness.state}{selectedBusiness.zipCode && `, C.P. ${selectedBusiness.zipCode}`}</p>
                                {selectedBusiness.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-green-500 shrink-0" /> {selectedBusiness.phone}</p>}
                                {selectedBusiness.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-green-500 shrink-0" /> <a href={`mailto:${selectedBusiness.email}`} className="text-green-600 hover:underline truncate">{selectedBusiness.email}</a></p>}
                                {selectedBusiness.website && <p className="flex items-center gap-2"><Globe className="h-4 w-4 text-green-500 shrink-0" /> <a href={selectedBusiness.website} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline truncate">{selectedBusiness.website}</a></p>}
                            </div>

                            {selectedBusiness.openingHours && (
                                <div className="border-t pt-4 space-y-1">
                                    <h4 className="font-semibold text-gray-700 flex items-center gap-2"><Clock className="h-4 w-4 text-green-500 shrink-0" /> Horarios:</h4>
                                    <p className="text-gray-600 pl-6 whitespace-pre-line">{selectedBusiness.openingHours}</p>
                                </div>
                            )}
                            {selectedBusiness.socialMedia && (
                                <div className="border-t pt-4 space-y-1">
                                    <h4 className="font-semibold text-gray-700 flex items-center gap-2"><Users className="h-4 w-4 text-green-500 shrink-0" /> Redes Sociales:</h4>
                                    <p className="text-gray-600 pl-6 whitespace-pre-line">{selectedBusiness.socialMedia}</p>
                                </div>
                            )}
                            {(selectedBusiness.latitude && selectedBusiness.longitude) && (
                                <div className="border-t pt-4">
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={`https://www.google.com/maps/search/?api=1&query=${selectedBusiness.latitude},${selectedBusiness.longitude}`} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="mr-2 h-4 w-4" /> Ver en Google Maps
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </div>
                        <DialogFooter className="mt-2">
                            <DialogClose asChild>
                                <Button variant="outline">Cerrar</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
            <footer className="border-t py-6 md:py-8 mt-12">
                <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
                    <p className="text-center text-xs leading-loose text-muted-foreground md:text-left">
                        © {new Date().getFullYear()} EcoMetrics. Todos los derechos reservados.
                    </p>
                    <div className="flex gap-4">
                        <Link href="/terminos" className="text-xs text-muted-foreground hover:underline">
                            Términos
                        </Link>
                        <Link href="/privacidad" className="text-xs text-muted-foreground hover:underline">
                            Privacidad
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}