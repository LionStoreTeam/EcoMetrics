// app/productos-disponibles/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
// Icons (asegúrate que todos los que usas estén aquí)
import {
    Search, Filter, MapPin, Clock, Phone, Mail, Globe, Package, Tag, Users, ImageOff,
    Loader2, AlertTriangle, ExternalLink, Info, Eye, ShoppingBag, CalendarDays
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Pagination, PaginationContent, PaginationItem, PaginationLink,
    PaginationPrevious, PaginationNext, PaginationEllipsis,
} from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { MEXICAN_STATES, BUSINESS_TYPES, type MexicanState, type BusinessType } from "@/lib/constants";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Label } from "@radix-ui/react-label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { ProductLightboxViewer } from "@/components/product-lightbox-viewer";

interface ProductImage { // Definición local para claridad, puede venir de types.ts
    id: string;
    url: string | null;
}

// Interfaz para los datos de promoción de producto que se mostrarán (actualizada)
interface DisplayProductPromotion {
    id: string;
    businessName: string;
    productName: string;
    businessLogoUrl?: string | null; // URL pública
    description: string;
    businessType: string;
    productImages: { id: string; url: string | null }[]; // Array de objetos con URLs públicas
    priceOrPromotion: string;
    address: string;
    city: string;
    state: string;
    validUntil?: string | null; // ISO string
    zipCode?: string | null;
    phone?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    openingHours?: string | null;
    contactEmail?: string | null;
    website?: string | null;
    socialMediaLinks?: string | null;
    submittedAt: string; // ISO string
}

interface ProductPromotionsApiResponse {
    promotions: DisplayProductPromotion[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

const ITEMS_PER_PAGE_PRODUCTS = 9;

export default function ProductosDisponiblesPage() {
    const [promotions, setPromotions] = useState<DisplayProductPromotion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [stateFilter, setStateFilter] = useState<MexicanState | "ALL">("ALL");
    const [businessTypeFilter, setBusinessTypeFilter] = useState<BusinessType | "ALL">("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedPromotion, setSelectedPromotion] = useState<DisplayProductPromotion | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);


    // Estado para el lightbox
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxImages, setLightboxImages] = useState<ProductImage[]>([]);
    const [lightboxInitialImageId, setLightboxInitialImageId] = useState<string | null>(null);
    const [lightboxProductName, setLightboxProductName] = useState<string>("");



    const fetchProductPromotions = useCallback(async (page = 1, name = searchTerm, state = stateFilter, type = businessTypeFilter) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: ITEMS_PER_PAGE_PRODUCTS.toString(),
            });
            if (name) params.append("name", name);
            if (state !== "ALL") params.append("state", state);
            if (type !== "ALL") params.append("type", type);

            const response = await fetch(`/api/productos-promocionados?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al obtener las promociones de productos");
            }
            const data: ProductPromotionsApiResponse = await response.json();
            console.log("Datos recibidos de la API (productos):", data.promotions); // Log para depuración
            setPromotions(data.promotions);
            setCurrentPage(data.pagination.page);
            setTotalPages(data.pagination.totalPages);
        } catch (err) {
            console.error("Error al cargar promociones de productos:", err);
            setError(err instanceof Error ? err.message : "Ocurrió un error desconocido.");
            setPromotions([]);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, stateFilter, businessTypeFilter]);

    useEffect(() => {
        fetchProductPromotions(1);
    }, [fetchProductPromotions]);

    const handleSearchSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
        if (event) event.preventDefault();
        setCurrentPage(1);
        fetchProductPromotions(1, searchTerm, stateFilter, businessTypeFilter);
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            fetchProductPromotions(page, searchTerm, stateFilter, businessTypeFilter);
        }
    };

    const openDetailsModal = (promotion: DisplayProductPromotion) => {
        setSelectedPromotion(promotion);
        setIsModalOpen(true);
    };

    const openLightbox = (images: ProductImage[], initialId: string | null, productName: string) => {
        setLightboxImages(images);
        setLightboxInitialImageId(initialId);
        setLightboxProductName(productName);
        setLightboxOpen(true);
    };

    const getBusinessTypeName = (typeId: string) => BUSINESS_TYPES.find(bt => bt.id === typeId)?.name || typeId;

    const renderPaginationItems = () => {
        const items = [];
        const maxPagesToShow = 3;
        const halfPagesToShow = Math.floor(maxPagesToShow / 2);

        if (totalPages <= maxPagesToShow + 2) {
            for (let i = 1; i <= totalPages; i++) {
                items.push(
                    <PaginationItem key={`prod-page-${i}`}>
                        <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i); }} isActive={currentPage === i}>
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }
        } else {
            items.push(
                <PaginationItem key="prod-page-1">
                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(1); }} isActive={currentPage === 1}>1</PaginationLink>
                </PaginationItem>
            );
            if (currentPage > halfPagesToShow + 2) {
                items.push(<PaginationEllipsis key="prod-start-ellipsis" onClick={() => handlePageChange(Math.max(1, currentPage - maxPagesToShow))} />);
            }
            let startPage = Math.max(2, currentPage - halfPagesToShow);
            let endPage = Math.min(totalPages - 1, currentPage + halfPagesToShow);
            if (currentPage <= halfPagesToShow + 1) endPage = Math.min(totalPages - 1, maxPagesToShow);
            if (currentPage >= totalPages - halfPagesToShow) startPage = Math.max(2, totalPages - maxPagesToShow + 1);

            for (let i = startPage; i <= endPage; i++) {
                items.push(
                    <PaginationItem key={`prod-page-${i}`}>
                        <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i); }} isActive={currentPage === i}>
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }
            if (currentPage < totalPages - (halfPagesToShow + 1)) {
                items.push(<PaginationEllipsis key="prod-end-ellipsis" onClick={() => handlePageChange(Math.min(totalPages, currentPage + maxPagesToShow))} />);
            }
            items.push(
                <PaginationItem key={`prod-page-${totalPages}`}>
                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(totalPages); }} isActive={currentPage === totalPages}>
                        {totalPages}
                    </PaginationLink>
                </PaginationItem>
            );
        }
        return items;
    };


    // Componente para el carrusel de imágenes dentro del modal de detalles
    const ProductDetailImageGallery = ({ images, onImageClick }: { images: ProductImage[], onImageClick: (imageId: string) => void }) => {
        if (!images || images.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center text-sm text-gray-500 p-4 border rounded-md bg-gray-50">
                    <ImageOff className="h-10 w-10 mb-2 text-gray-400" />
                    No hay imágenes adicionales para este producto.
                </div>
            );
        }
        const gridColsClass = images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3';

        return (
            <div className={`grid ${gridColsClass} gap-2`}>
                {images.map(img => (
                    <div
                        key={img.id}
                        className="aspect-square relative rounded-md overflow-hidden border bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => img.url && onImageClick(img.id)} // Abrir lightbox al hacer clic
                    >
                        {img.url ? (
                            <Image src={img.url} alt="Imagen de producto" layout="fill" objectFit="cover" onError={(e) => (e.currentTarget.src = "/placeholder-product.svg")} />
                        ) : (
                            <div className="flex items-center justify-center h-full w-full">
                                <ImageOff className="h-8 w-8 text-gray-400" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };


    return (
        <div className="min-h-screen bg-gray-50">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/logo.png" alt="EcoMetrics Logo" width={40} height={40} priority />
                        <span className="text-xl font-bold">EcoMetrics</span>
                    </Link>
                    <nav className="flex items-center gap-4">
                        <Link href="/promociona-tu-producto" legacyBehavior passHref>
                            <Button variant="outline" size="sm" className="border-sky-600 text-sky-600 hover:bg-sky-50">
                                Promociona tu Producto
                            </Button>
                        </Link>
                        <Link href="/negocios-disponibles" legacyBehavior passHref>
                            <Button variant="outline" size="sm" className="border-green-600 text-green-600 hover:bg-green-50">
                                Negocios
                            </Button>
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-800 sm:text-5xl md:text-6xl">
                        Productos y Servicios <span className="text-sky-600">Destacados</span>
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
                        Explora ofertas y productos de negocios locales que cuidan nuestro planeta.
                    </p>
                </div>

                <Card className="mb-8 shadow-md">
                    <CardContent className="p-4">
                        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                            <div className="sm:col-span-2 lg:col-span-1">
                                <Label htmlFor="search-product-name" className="text-sm font-medium text-gray-700">Producto o Negocio</Label>
                                <div className="relative mt-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="search-product-name"
                                        type="search"
                                        placeholder="Buscar..."
                                        className="pl-10"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="state-filter-prod-public" className="text-sm font-medium text-gray-700">Estado</Label>
                                <Select value={stateFilter} onValueChange={(value) => setStateFilter(value as MexicanState | "ALL")}>
                                    <SelectTrigger id="state-filter-prod-public" className="mt-1"><SelectValue placeholder="Todos los estados" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Todos los Estados</SelectItem>
                                        {MEXICAN_STATES.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="type-filter-prod-public" className="text-sm font-medium text-gray-700">Tipo de Negocio</Label>
                                <Select value={businessTypeFilter} onValueChange={(value) => setBusinessTypeFilter(value as BusinessType | "ALL")}>
                                    <SelectTrigger id="type-filter-prod-public" className="mt-1"><SelectValue placeholder="Todos los tipos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Todos los Tipos</SelectItem>
                                        {BUSINESS_TYPES.map(type => <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white sm:col-span-2 lg:col-span-1">
                                <Filter className="mr-2 h-4 w-4" /> Aplicar Filtros
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-sky-600" /></div>
                ) : error ? (
                    <Card className="bg-red-50 border-red-200 text-red-700 py-10 text-center">
                        <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
                        <p className="text-xl font-semibold">Ocurrió un Error</p>
                        <p>{error}</p>
                        <Button onClick={() => fetchProductPromotions(1, searchTerm, stateFilter, businessTypeFilter)} variant="destructive" className="mt-4">Reintentar</Button>
                    </Card>
                ) : promotions.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
                            {promotions.map((promo) => (
                                <Card key={promo.id} className="h-full flex flex-col bg-white shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden rounded-[18px]">
                                    <CardHeader className="p-0">
                                        <div className="relative w-full h-52">
                                            <Image
                                                src={promo.productImages?.[0]?.url || promo.businessLogoUrl || "/placeholder-product.svg"}
                                                alt={`Imagen de ${promo.productName}`}
                                                layout="fill"
                                                objectFit="cover"
                                                className={!(promo.productImages?.[0]?.url || promo.businessLogoUrl) ? 'p-8 opacity-50' : ''}
                                                onError={(e) => (e.currentTarget.src = "/placeholder-product.svg")}
                                                priority={false} // Solo la primera imagen o las visibles en el viewport inicial deberían ser priority
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                                            <div className="absolute top-3 right-3">
                                                {promo.businessLogoUrl && (
                                                    <Avatar className="h-10 w-10 border-2 border-white shadow-md">
                                                        <AvatarImage src={promo.businessLogoUrl} alt={`Logo ${promo.businessName}`} />
                                                        <AvatarFallback className="bg-sky-100 text-sky-700 text-xs">
                                                            {promo.businessName.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                )}
                                            </div>
                                            <div className="absolute bottom-0 left-0 p-3">
                                                <Badge variant="default" className="bg-sky-500 text-white text-xs shadow-md">
                                                    <Tag className="h-3 w-3 mr-1.5" />{promo.priceOrPromotion}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 flex-grow flex flex-col">
                                        <CardTitle className="text-lg font-semibold text-gray-800 mb-1 truncate" title={promo.productName}>{promo.productName}</CardTitle>
                                        <p className="text-xs text-sky-700 font-medium mb-2">{promo.businessName}</p>
                                        <CardDescription className="text-xs text-gray-600 line-clamp-2 mb-2 flex-grow">
                                            {promo.description}
                                        </CardDescription>
                                        <div className="text-xs text-gray-500 space-y-0.5">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                                                <span>{promo.city}, {promo.state}</span>
                                            </div>
                                            {promo.validUntil && (
                                                <div className="flex items-center gap-1">
                                                    <CalendarDays className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                                                    <span>Válido hasta: {format(parseISO(promo.validUntil), "dd MMM, yy", { locale: es })}</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="p-3 border-t bg-gray-50">
                                        <Button variant="outline" className="w-full border-sky-600 text-sky-600 hover:bg-sky-50 hover:text-sky-700 text-xs py-1.5 h-auto" onClick={() => openDetailsModal(promo)}>
                                            <Eye className="mr-1.5 h-3.5 w-3.5" /> Ver Detalles y Contacto
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
                        <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                        <h3 className="text-2xl font-semibold text-gray-700">No se encontraron productos o servicios</h3>
                        <p className="text-gray-500 mt-3 text-md">
                            Intenta ajustar los filtros o revisa más tarde. Constantemente se unen nuevas promociones a nuestra comunidad.
                        </p>
                        <Button asChild className="mt-6 bg-sky-600 hover:bg-sky-700">
                            <Link href="/promociona-tu-producto">¡Promociona tu Producto Aquí!</Link>
                        </Button>
                    </div>
                )}
            </main>

            {/* Modal de Detalles de la Promoción de Producto */}
            {selectedPromotion && (
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto p-0">
                        <DialogHeader className="p-6 pb-4 border-b sticky top-0 bg-white z-10">
                            {selectedPromotion.businessLogoUrl && (
                                <div className="flex justify-center mb-2">
                                    <Image src={selectedPromotion.businessLogoUrl} alt={`Logo de ${selectedPromotion.businessName}`} width={70} height={70} className="rounded-lg object-contain border shadow-sm" />
                                </div>
                            )}
                            <DialogTitle className="text-2xl text-center font-bold text-gray-800">{selectedPromotion.productName}</DialogTitle>
                            <DialogDescription className="text-center text-sm text-gray-500 mb-1">
                                Ofrecido por: <span className="font-medium text-sky-700">{selectedPromotion.businessName}</span>
                                <br />
                                <Badge variant="outline" className="mt-1 bg-gray-100 text-gray-700 text-xs">
                                    {getBusinessTypeName(selectedPromotion.businessType)}
                                </Badge>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 px-6 py-4 text-sm">
                            {/* Carrusel o Grid de Imágenes del Producto */}
                            <div className="mb-4">
                                <Label className="font-semibold text-xs text-gray-500 block mb-1.5">Imágenes del Producto/Servicio:</Label>
                                <ProductDetailImageGallery
                                    images={selectedPromotion.productImages || []}
                                    onImageClick={(imageId) => openLightbox(selectedPromotion.productImages || [], imageId, selectedPromotion.productName)}
                                />
                            </div>

                            <div className="bg-sky-50 p-3 rounded-md border border-sky-200">
                                <strong className="font-semibold text-sky-700 block mb-1 text-base">
                                    <Tag className="inline h-4 w-4 mr-1.5 align-middle" />
                                    Precio/Promoción:
                                </strong>
                                <span className="text-gray-800 text-lg">{selectedPromotion.priceOrPromotion}</span>
                            </div>

                            {selectedPromotion.validUntil && (
                                <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                    <CalendarDays className="h-4 w-4 text-sky-500" />
                                    <strong className="font-medium text-gray-700">Válido hasta:</strong>
                                    {format(parseISO(selectedPromotion.validUntil), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                                </p>
                            )}

                            <div className="pt-3 border-t mt-3">
                                <h4 className="font-semibold text-gray-700 mb-1">Descripción Detallada:</h4>
                                <p className="text-gray-700 whitespace-pre-line leading-relaxed text-xs">{selectedPromotion.description}</p>
                            </div>

                            <div className="border-t pt-3 mt-3 space-y-1.5">
                                <h4 className="font-semibold text-gray-700">Ubicación y Contacto del Negocio:</h4>
                                <p className="flex items-start gap-2"><MapPin className="h-4 w-4 text-sky-500 mt-0.5 shrink-0" /> {selectedPromotion.address}, {selectedPromotion.city}, {selectedPromotion.state}{selectedPromotion.zipCode && `, C.P. ${selectedPromotion.zipCode}`}</p>
                                {selectedPromotion.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-sky-500 shrink-0" /> {selectedPromotion.phone}</p>}
                                {selectedPromotion.contactEmail && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-sky-500 shrink-0" /> <a href={`mailto:${selectedPromotion.contactEmail}`} className="text-sky-600 hover:underline truncate">{selectedPromotion.contactEmail}</a></p>}
                                {selectedPromotion.website && <p className="flex items-center gap-2"><Globe className="h-4 w-4 text-sky-500 shrink-0" /> <a href={selectedPromotion.website.startsWith('http') ? selectedPromotion.website : `https://${selectedPromotion.website}`} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline truncate">{selectedPromotion.website}</a></p>}
                            </div>

                            {selectedPromotion.openingHours && (
                                <div className="border-t pt-3 mt-3 space-y-1">
                                    <h4 className="font-semibold text-gray-700 flex items-center gap-2"><Clock className="h-4 w-4 text-sky-500 shrink-0" /> Horarios del Negocio:</h4>
                                    <p className="text-gray-600 pl-6 whitespace-pre-line text-xs">{selectedPromotion.openingHours}</p>
                                </div>
                            )}
                            {selectedPromotion.socialMediaLinks && (
                                <div className="border-t pt-3 mt-3 space-y-1">
                                    <h4 className="font-semibold text-gray-700 flex items-center gap-2"><Users className="h-4 w-4 text-sky-500 shrink-0" /> Redes Sociales del Negocio:</h4>
                                    <div className="pl-6 space-y-0.5">
                                        {selectedPromotion.socialMediaLinks.split(/[,; ]+/).filter(link => link.trim()).map((link, index) => (
                                            <a key={index} href={link.trim().startsWith('http') ? link.trim() : `https://${link.trim()}`} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline block truncate text-xs">{link.trim()}</a>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {(selectedPromotion.latitude && selectedPromotion.longitude) && (
                                <div className="border-t pt-3 mt-3">
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={`https://www.google.com/maps/search/?api=1&query=${selectedPromotion.latitude},${selectedPromotion.longitude}`} target="_blank" rel="noopener noreferrer" className="text-xs"> {/* Corregido: usé mal las comillas */}
                                            <ExternalLink className="mr-2 h-3.5 w-3.5" /> Ver Ubicación del Negocio en Mapa
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </div>
                        <DialogFooter className="p-6 pt-4 border-t sticky bottom-0 bg-white z-10">
                            <DialogClose asChild>
                                <Button variant="outline">Cerrar</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
            {/* Lightbox para las imágenes del producto */}
            <ProductLightboxViewer
                images={lightboxImages}
                isOpen={lightboxOpen}
                onOpenChange={setLightboxOpen}
                initialImageId={lightboxInitialImageId}
                productName={lightboxProductName}
            />
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