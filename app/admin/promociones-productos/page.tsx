// app/admin/promociones-productos/page.tsx
"use client";

import React, { useState, useEffect, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Search, Filter, Eye, CheckCircle, XCircle, Clock, Package, ImageOff,
    Loader2, AlertTriangle, Info, BadgeCheck, BadgeX, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Pagination, PaginationContent, PaginationItem, PaginationLink,
    PaginationPrevious, PaginationNext, PaginationEllipsis,
} from "@/components/ui/pagination";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
    DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import DashboardLayout from "@/components/dashboard-layout";
import toast from 'react-hot-toast';
import { BusinessPromotionStatus } from "@prisma/client";
// Asegúrate de que este tipo es el correcto y contiene la estructura esperada para productImages
import { BUSINESS_TYPES } from "@/lib/constants";
import Image from "next/image";
import { ProductLightboxViewer } from "@/components/product-lightbox-viewer";

interface DisplayProductPromotion {
    id: string;
    businessName: string;
    productName: string;
    businessLogoUrl?: string | null; // URL pública
    description: string;
    businessType: string;
    productImages: { id: string; url: string | null }[]; // Array de objetos con URLs públicas
    status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
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
    paymentIntentId?: string;
    paymentStatus?: string;
    amountPaid?: number;
    currency?: string;
    reviewedAt?: string | null; // ISO String
    reviewerNotes?: string | null;
}


interface AdminProductPromotionsApiResponse {
    requests: DisplayProductPromotion[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

interface ProductImage { // Definición local para claridad, puede venir de types.ts
    id: string;
    url: string | null;
}

const ITEMS_PER_PAGE_ADMIN = 10;

const STATUS_MAP_ADMIN: Record<BusinessPromotionStatus, { text: string; color: string; icon: React.ElementType }> = {
    PENDING_APPROVAL: { text: "Pendiente", color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock },
    APPROVED: { text: "Aprobado", color: "bg-green-100 text-green-800 border-green-300", icon: BadgeCheck },
    REJECTED: { text: "Rechazado", color: "bg-red-100 text-red-800 border-red-300", icon: BadgeX },
};

// Componente para mostrar la galería de imágenes de producto en el modal (revisado)
const AdminProductDetailImageGallery = ({ images, onImageClick }: { images: ProductImage[], onImageClick: (imageId: string) => void }) => {
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


export default function AdminProductPromotionsPage() {
    const router = useRouter();
    const [requests, setRequests] = useState<DisplayProductPromotion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTermAdmin, setSearchTermAdmin] = useState("");
    const [statusFilterAdmin, setStatusFilterAdmin] = useState<BusinessPromotionStatus | "ALL">("PENDING_APPROVAL");
    const [currentPageAdmin, setCurrentPageAdmin] = useState(1);
    const [totalPagesAdmin, setTotalPagesAdmin] = useState(1);

    const [isDetailsModalOpenAdmin, setIsDetailsModalOpenAdmin] = useState(false);
    const [isReviewModalOpenAdmin, setIsReviewModalOpenAdmin] = useState(false);
    const [selectedRequestAdmin, setSelectedRequestAdmin] = useState<DisplayProductPromotion | null>(null);
    const [reviewerNotesAdmin, setReviewerNotesAdmin] = useState("");
    const [newStatusAdmin, setNewStatusAdmin] = useState<BusinessPromotionStatus>("PENDING_APPROVAL");
    const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

    // Estado para el lightbox
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxImages, setLightboxImages] = useState<ProductImage[]>([]);
    const [lightboxInitialImageId, setLightboxInitialImageId] = useState<string | null>(null);
    const [lightboxProductName, setLightboxProductName] = useState<string>("");


    const fetchProductPromotionRequests = useCallback(async (page = 1, search = searchTermAdmin, status = statusFilterAdmin) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: ITEMS_PER_PAGE_ADMIN.toString(),
            });
            if (search) params.append("search", search);
            if (status !== "ALL") params.append("status", status);

            const response = await fetch(`/api/admin/product-promotions?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al obtener las solicitudes de promoción de productos");
            }
            const data: AdminProductPromotionsApiResponse = await response.json();
            // console.log("Admin - Datos de promociones de productos recibidos:", data.requests);
            setRequests(data.requests);
            setCurrentPageAdmin(data.pagination.page);
            setTotalPagesAdmin(data.pagination.totalPages);
        } catch (err) {
            console.error("Error al cargar solicitudes de productos:", err);
            setError(err instanceof Error ? err.message : "Ocurrió un error desconocido.");
            setRequests([]);
        } finally {
            setIsLoading(false);
        }
    }, [searchTermAdmin, statusFilterAdmin]);

    useEffect(() => {
        fetchProductPromotionRequests(1);
    }, [fetchProductPromotionRequests]);

    const handleSearchSubmitAdmin = (event?: React.FormEvent<HTMLFormElement>) => {
        if (event) event.preventDefault();
        setCurrentPageAdmin(1);
        fetchProductPromotionRequests(1, searchTermAdmin, statusFilterAdmin);
    };

    const handlePageChangeAdmin = (page: number) => {
        if (page >= 1 && page <= totalPagesAdmin) {
            fetchProductPromotionRequests(page, searchTermAdmin, statusFilterAdmin);
        }
    };

    const openDetailsModalAdmin = (request: DisplayProductPromotion) => {
        // console.log("Abriendo modal con request:", request); // Log para depurar el request seleccionado
        setSelectedRequestAdmin(request);
        setIsDetailsModalOpenAdmin(true);
    };

    const openReviewModalAdmin = (request: DisplayProductPromotion, targetStatus: BusinessPromotionStatus) => {
        setSelectedRequestAdmin(request);
        setNewStatusAdmin(targetStatus);
        setReviewerNotesAdmin(request.reviewerNotes || "");
        setIsReviewModalOpenAdmin(true);
    };

    const handleReviewSubmitAdmin = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedRequestAdmin) return;
        if ((newStatusAdmin === "REJECTED" || newStatusAdmin === "PENDING_APPROVAL") && !reviewerNotesAdmin.trim()) {
            toast.error("Las notas son obligatorias para esta acción.");
            return;
        }
        setIsSubmittingAdmin(true);
        try {
            const response = await fetch(`/api/admin/product-promotions/${selectedRequestAdmin.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatusAdmin, reviewerNotes: reviewerNotesAdmin }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error al ${newStatusAdmin === "APPROVED" ? "aprobar" : "rechazar"} la solicitud de producto`);
            }
            toast.success(`Solicitud de producto ${newStatusAdmin === "APPROVED" ? "aprobada" : newStatusAdmin === "REJECTED" ? "rechazada" : "actualizada"} correctamente.`);
            setIsReviewModalOpenAdmin(false);
            fetchProductPromotionRequests(currentPageAdmin, searchTermAdmin, statusFilterAdmin); // Recargar
            router.refresh();
        } catch (err) {
            console.error("Error al revisar solicitud de producto:", err);
            toast.error(err instanceof Error ? err.message : "Error al procesar la revisión del producto.");
        } finally {
            setIsSubmittingAdmin(false);
        }
    };

    const openLightbox = (images: ProductImage[], initialId: string | null, productName: string) => {
        setLightboxImages(images);
        setLightboxInitialImageId(initialId);
        setLightboxProductName(productName);
        setLightboxOpen(true);
    };

    const getInitialsAdmin = (name: string = "") => name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "N";
    const getBusinessTypeNameAdmin = (typeId: string) => BUSINESS_TYPES.find(bt => bt.id === typeId)?.name || typeId;

    const renderPaginationItemsAdmin = () => {
        const items = [];
        const maxPagesToShow = 3;
        const halfPagesToShow = Math.floor(maxPagesToShow / 2);

        if (totalPagesAdmin <= maxPagesToShow + 2) {
            for (let i = 1; i <= totalPagesAdmin; i++) {
                items.push(
                    <PaginationItem key={`admin-prod-${i}`}>
                        <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChangeAdmin(i); }} isActive={currentPageAdmin === i}>
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }
        } else {
            items.push(
                <PaginationItem key="admin-prod-1">
                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChangeAdmin(1); }} isActive={currentPageAdmin === 1}>1</PaginationLink>
                </PaginationItem>
            );
            if (currentPageAdmin > halfPagesToShow + 2) {
                items.push(<PaginationEllipsis key="admin-prod-start-ellipsis" onClick={() => handlePageChangeAdmin(Math.max(1, currentPageAdmin - maxPagesToShow))} />);
            }
            let startPage = Math.max(2, currentPageAdmin - halfPagesToShow);
            let endPage = Math.min(totalPagesAdmin - 1, currentPageAdmin + halfPagesToShow);
            if (currentPageAdmin <= halfPagesToShow + 1) endPage = Math.min(totalPagesAdmin - 1, maxPagesToShow);
            if (currentPageAdmin >= totalPagesAdmin - halfPagesToShow) startPage = Math.max(2, totalPagesAdmin - maxPagesToShow + 1);

            for (let i = startPage; i <= endPage; i++) {
                items.push(
                    <PaginationItem key={`admin-prod-${i}`}>
                        <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChangeAdmin(i); }} isActive={currentPageAdmin === i}>
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }
            if (currentPageAdmin < totalPagesAdmin - (halfPagesToShow + 1)) {
                items.push(<PaginationEllipsis key="admin-prod-end-ellipsis" onClick={() => handlePageChangeAdmin(Math.min(totalPagesAdmin, currentPageAdmin + maxPagesToShow))} />);
            }
            items.push(
                <PaginationItem key={`admin-prod-${totalPagesAdmin}`}>
                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChangeAdmin(totalPagesAdmin); }} isActive={currentPageAdmin === totalPagesAdmin}>
                        {totalPagesAdmin}
                    </PaginationLink>
                </PaginationItem>
            );
        }
        return items;
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8 m-5 sm:m-10">
                {/* ... (Header de la página de admin sin cambios) ... */}
                <div className="mt-10 lg:mt-0 p-6 flex flex-col gap-2 text-white bg-gradient-to-r from-teal-600 to-cyan-700 rounded-xl shadow-lg">
                    <div className="flex items-center gap-3">
                        <Package className="h-8 w-8" />
                        <h1 className="text-3xl font-bold tracking-tight">Revisión de Promociones de Productos</h1>
                    </div>
                    <p className="text-cyan-100">
                        Gestiona las solicitudes para promocionar productos y servicios en EcoMetrics.
                    </p>
                </div>


                <Card className="shadow-md">
                    {/* ... (Formulario de filtros sin cambios) ... */}
                    <CardHeader className="p-4">
                        <form onSubmit={handleSearchSubmitAdmin} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                            <div className="relative md:col-span-1">
                                <Label htmlFor="search-term-prod-promotions" className="sr-only">Buscar</Label>
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="search-term-prod-promotions" type="search" placeholder="Negocio, producto, email..." className="pl-9 py-2 text-sm" value={searchTermAdmin} onChange={(e) => setSearchTermAdmin(e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="status-filter-prod-promotions" className="sr-only">Estado</Label>
                                <Select value={statusFilterAdmin} onValueChange={(value) => setStatusFilterAdmin(value as BusinessPromotionStatus | "ALL")}>
                                    <SelectTrigger id="status-filter-prod-promotions" className="py-2 text-sm"><Filter className="mr-1.5 h-4 w-4" /><SelectValue placeholder="Estado" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Todos los Estados</SelectItem>
                                        {Object.entries(STATUS_MAP_ADMIN).map(([key, { text }]) => (
                                            <SelectItem key={key} value={key}>{text}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white py-2 text-sm w-full md:w-auto">Buscar Solicitudes</Button>
                        </form>
                    </CardHeader>
                    <CardContent>
                        {/* ... (Lógica de isLoading, error y tabla sin cambios significativos, excepto el renderizado del icono de estado) ... */}
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-teal-600" /></div>
                        ) : error ? (
                            <div className="text-center py-10 text-red-600 bg-red-50 p-4 rounded-md"><AlertTriangle className="mx-auto h-10 w-10 mb-2" /><p>{error}</p><Button onClick={() => fetchProductPromotionRequests(currentPageAdmin, searchTermAdmin, statusFilterAdmin)} variant="outline" className="mt-4 border-red-600 text-red-600 hover:bg-red-100">Reintentar</Button></div>
                        ) : requests.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]">Logo Neg.</TableHead>
                                                <TableHead>Producto / Negocio</TableHead>
                                                <TableHead className="hidden md:table-cell">Tipo Neg.</TableHead>
                                                <TableHead className="hidden lg:table-cell">Precio/Promo</TableHead>
                                                <TableHead className="text-center">Estado</TableHead>
                                                <TableHead className="hidden lg:table-cell text-center">Enviado</TableHead>
                                                <TableHead className="text-right">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {requests.map((req) => {
                                                const IconForStatus = STATUS_MAP_ADMIN[req.status].icon as any; // Correcto: Asignar a variable con mayúscula
                                                return (
                                                    <TableRow key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                        <TableCell>
                                                            <Avatar className="h-9 w-9">
                                                                <AvatarImage src={req.businessLogoUrl || ""} alt={req.businessName} />
                                                                <AvatarFallback className="bg-teal-100 text-teal-700 text-xs font-semibold">
                                                                    {getInitialsAdmin(req.businessName)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="font-medium text-sm">{req.productName}</div>
                                                            <div className="text-xs text-muted-foreground">{req.businessName}</div>
                                                        </TableCell>
                                                        <TableCell className="hidden md:table-cell text-xs">{getBusinessTypeNameAdmin(req.businessType)}</TableCell>
                                                        <TableCell className="hidden lg:table-cell text-xs">{req.priceOrPromotion}</TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant="outline" className={`text-xs whitespace-nowrap ${STATUS_MAP_ADMIN[req.status].color}`}>
                                                                <IconForStatus className="mr-1 h-3 w-3" /> {/* Usar la variable con mayúscula */}
                                                                {STATUS_MAP_ADMIN[req.status].text}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="hidden lg:table-cell text-center text-xs text-muted-foreground">
                                                            {format(new Date(req.submittedAt), "dd MMM, yy", { locale: es })}
                                                        </TableCell>
                                                        <TableCell className="text-right space-x-1">
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-sky-600" title="Ver Detalles" onClick={() => openDetailsModalAdmin(req)}>
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            {req.status === "PENDING_APPROVAL" && (
                                                                <>
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-green-600" title="Aprobar" onClick={() => openReviewModalAdmin(req, "APPROVED")}>
                                                                        <CheckCircle className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600" title="Rechazar" onClick={() => openReviewModalAdmin(req, "REJECTED")}>
                                                                        <XCircle className="h-4 w-4" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {req.status !== "PENDING_APPROVAL" && (
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-yellow-500" title="Reconsiderar" onClick={() => openReviewModalAdmin(req, "PENDING_APPROVAL")}>
                                                                    <RotateCcw className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                                {totalPagesAdmin > 1 && (
                                    <Pagination className="mt-6">
                                        <PaginationContent>
                                            <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChangeAdmin(currentPageAdmin - 1); }} className={currentPageAdmin === 1 ? "pointer-events-none opacity-50" : ""} /></PaginationItem>
                                            {renderPaginationItemsAdmin()}
                                            <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChangeAdmin(currentPageAdmin + 1); }} className={currentPageAdmin === totalPagesAdmin ? "pointer-events-none opacity-50" : ""} /></PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-16"><Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" /><h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No hay solicitudes de promoción de productos.</h3><p className="text-muted-foreground mt-2 text-sm">Cuando se envíen nuevas solicitudes para productos, aparecerán aquí.</p></div>
                        )}
                    </CardContent>
                </Card>

                {/* Modal de Detalles del Producto para Admin */}
                <Dialog open={isDetailsModalOpenAdmin} onOpenChange={setIsDetailsModalOpenAdmin}>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
                        <DialogHeader className="p-6 pb-4 border-b sticky top-0 bg-white z-10">
                            <DialogTitle className="text-xl flex items-center gap-2">
                                <Info className="h-5 w-5 text-teal-600" />
                                Detalles de Promoción: {selectedRequestAdmin?.productName}
                            </DialogTitle>
                            <DialogDescription>
                                Solicitado por: {selectedRequestAdmin?.businessName} ({getBusinessTypeNameAdmin(selectedRequestAdmin?.businessType || "")})
                            </DialogDescription>
                        </DialogHeader>
                        {selectedRequestAdmin && (
                            <div className="space-y-3 px-6 py-4 text-sm">
                                {selectedRequestAdmin.businessLogoUrl && (
                                    <div className="mb-3 p-2 border-b">
                                        <Label className="font-semibold text-xs text-gray-500 block mb-1">Logo del Negocio:</Label>
                                        <Image src={selectedRequestAdmin.businessLogoUrl} alt={`Logo de ${selectedRequestAdmin.businessName}`} width={80} height={80} className="rounded-md object-contain border shadow-sm mx-auto" />
                                    </div>
                                )}

                                {/* SECCIÓN DE IMÁGENES DEL PRODUCTO (USANDO AdminProductImageGallery) */}
                                <div className="mb-4">
                                    <Label className="font-semibold text-xs text-gray-500 block mb-1.5">Imágenes del Producto/Servicio:</Label>
                                    <AdminProductDetailImageGallery
                                        images={selectedRequestAdmin.productImages || []}
                                        onImageClick={(imageId) => openLightbox(selectedRequestAdmin.productImages || [], imageId, selectedRequestAdmin.productName)}
                                    />
                                </div>

                                <p><strong className="font-medium text-gray-700">Producto:</strong> {selectedRequestAdmin.productName}</p>
                                <p><strong className="font-medium text-gray-700">Descripción:</strong> <span className="text-gray-600 whitespace-pre-line">{selectedRequestAdmin.description}</span></p>
                                <p><strong className="font-medium text-gray-700">Precio/Promoción:</strong> {selectedRequestAdmin.priceOrPromotion}</p>
                                {selectedRequestAdmin.validUntil && <p><strong className="font-medium text-gray-700">Válido hasta:</strong> {format(new Date(selectedRequestAdmin.validUntil), "dd MMM, yyyy", { locale: es })}</p>}

                                <div className="pt-2 mt-2 border-t">
                                    <p className="font-semibold text-gray-700">Información del Negocio:</p>
                                    <p><strong className="font-medium">Dirección:</strong> {selectedRequestAdmin.address}, {selectedRequestAdmin.city}, {selectedRequestAdmin.state} {selectedRequestAdmin.zipCode}</p>
                                    {selectedRequestAdmin.phone && <p><strong className="font-medium">Teléfono:</strong> {selectedRequestAdmin.phone}</p>}
                                    {selectedRequestAdmin.contactEmail && <p><strong className="font-medium">Email Contacto:</strong> {selectedRequestAdmin.contactEmail}</p>}
                                    {selectedRequestAdmin.website && <p><strong className="font-medium">Sitio Web:</strong> <a href={selectedRequestAdmin.website.startsWith('http') ? selectedRequestAdmin.website : `https://${selectedRequestAdmin.website}`} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">{selectedRequestAdmin.website}</a></p>}
                                    {(selectedRequestAdmin.latitude && selectedRequestAdmin.longitude) && <p><strong className="font-medium">Ubicación:</strong> Lat: {selectedRequestAdmin.latitude}, Lon: {selectedRequestAdmin.longitude}</p>}
                                    {selectedRequestAdmin.openingHours && <p><strong className="font-medium">Horarios:</strong> {selectedRequestAdmin.openingHours}</p>}
                                    {selectedRequestAdmin.socialMediaLinks && <p><strong className="font-medium">Redes Sociales:</strong> <a href={selectedRequestAdmin.socialMediaLinks.startsWith('http') ? selectedRequestAdmin.socialMediaLinks : `https://${selectedRequestAdmin.socialMediaLinks}`} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">{selectedRequestAdmin.socialMediaLinks}</a></p>}
                                </div>

                                <div className="pt-2 mt-2 border-t">
                                    <p className="font-semibold text-gray-700">Información del Pago:</p>
                                    <p className="text-xs">ID Transacción: <span className="font-mono">{selectedRequestAdmin.paymentIntentId || "N/A"}</span></p>
                                    <p className="text-xs">Monto Pagado: <span className="font-semibold">${selectedRequestAdmin.amountPaid?.toFixed(2) || "0.00"} {selectedRequestAdmin.currency?.toUpperCase()}</span></p>
                                    <p className="text-xs">Estado del Pago: <Badge variant="secondary" className="text-xs">{selectedRequestAdmin.paymentStatus || "Desconocido"}</Badge></p>
                                </div>

                                <div className="pt-2 mt-2 border-t">
                                    <p className="font-semibold text-gray-700">Estado de la Solicitud:</p>
                                    <Badge variant="outline" className={`text-sm ${STATUS_MAP_ADMIN[selectedRequestAdmin.status].color}`}>
                                        {React.createElement(STATUS_MAP_ADMIN[selectedRequestAdmin.status].icon, { className: "mr-1.5 h-4 w-4" })}
                                        {STATUS_MAP_ADMIN[selectedRequestAdmin.status].text}
                                    </Badge>
                                    <p className="text-xs text-muted-foreground mt-1">Enviada: {format(new Date(selectedRequestAdmin.submittedAt), "dd MMM, yyyy 'a las' HH:mm", { locale: es })}</p>
                                    {selectedRequestAdmin.reviewedAt && <p className="text-xs text-muted-foreground">Revisada: {format(new Date(selectedRequestAdmin.reviewedAt), "dd MMM, yyyy 'a las' HH:mm", { locale: es })}</p>}
                                </div>
                                {selectedRequestAdmin.reviewerNotes && (
                                    <div className="pt-2 mt-2 border-t">
                                        <p className="font-semibold text-gray-700">Notas del Revisor:</p>
                                        <p className="text-gray-600 bg-gray-50 p-2 rounded-md border whitespace-pre-line">{selectedRequestAdmin.reviewerNotes}</p>
                                    </div>
                                )}
                            </div>
                        )}
                        <DialogFooter className="p-6 pt-4 border-t sticky bottom-0 bg-white z-10">
                            <DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Modal de Revisión (Aprobar/Rechazar/Pendiente) para Productos */}
                <Dialog open={isReviewModalOpenAdmin} onOpenChange={setIsReviewModalOpenAdmin}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                {React.createElement(STATUS_MAP_ADMIN[newStatusAdmin]?.icon || Info, { className: `h-5 w-5 ${newStatusAdmin === "APPROVED" ? "text-green-600" : newStatusAdmin === "REJECTED" ? "text-red-600" : "text-yellow-500"}` })}
                                {newStatusAdmin === "APPROVED" ? "Aprobar" : newStatusAdmin === "REJECTED" ? "Rechazar" : "Marcar como Pendiente"} Solicitud de Producto
                            </DialogTitle>
                            <DialogDescription>
                                Vas a cambiar el estado de "{selectedRequestAdmin?.productName}" de "{selectedRequestAdmin?.businessName}" a <span className={`font-semibold ${STATUS_MAP_ADMIN[newStatusAdmin]?.color.replace('bg-', 'text-').replace('-100', '-700')}`}>{STATUS_MAP_ADMIN[newStatusAdmin]?.text}</span>.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleReviewSubmitAdmin} className="space-y-4 py-2">
                            {(newStatusAdmin === "REJECTED" || newStatusAdmin === "PENDING_APPROVAL" || (newStatusAdmin === "APPROVED" && selectedRequestAdmin?.reviewerNotes)) && (
                                <div>
                                    <Label htmlFor="reviewerNotesAdminProd">
                                        Notas de Revisión {(newStatusAdmin === "REJECTED" || newStatusAdmin === "PENDING_APPROVAL") ? <span className="text-red-500">*</span> : "(Opcional)"}
                                    </Label>
                                    <Textarea
                                        id="reviewerNotesAdminProd"
                                        value={reviewerNotesAdmin}
                                        onChange={(e) => setReviewerNotesAdmin(e.target.value)}
                                        placeholder={
                                            newStatusAdmin === "REJECTED" ? "Motivo del rechazo..." :
                                                newStatusAdmin === "PENDING_APPROVAL" ? "Motivo para marcar como pendiente..." :
                                                    "Notas adicionales..."
                                        }
                                        rows={3}
                                        disabled={isSubmittingAdmin}
                                        required={newStatusAdmin === "REJECTED" || newStatusAdmin === "PENDING_APPROVAL"}
                                    />
                                    {(newStatusAdmin === "REJECTED" || newStatusAdmin === "PENDING_APPROVAL") && !reviewerNotesAdmin.trim() && !isSubmittingAdmin && <p className="text-xs text-red-500 mt-1">Las notas son obligatorias para esta acción.</p>}
                                </div>
                            )}
                            <DialogFooter className="sm:justify-end gap-2">
                                <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmittingAdmin}>Cancelar</Button></DialogClose>
                                <Button
                                    type="submit"
                                    disabled={isSubmittingAdmin || ((newStatusAdmin === "REJECTED" || newStatusAdmin === "PENDING_APPROVAL") && !reviewerNotesAdmin.trim())}
                                    className={
                                        newStatusAdmin === "APPROVED" ? "bg-green-600 hover:bg-green-700" :
                                            newStatusAdmin === "REJECTED" ? "bg-red-600 hover:bg-red-700" :
                                                "bg-yellow-500 hover:bg-yellow-600"
                                    }
                                >
                                    {isSubmittingAdmin && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Confirmar {newStatusAdmin === "APPROVED" ? "Aprobación" : newStatusAdmin === "REJECTED" ? "Rechazo" : "Pendiente"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
                {/* Lightbox para las imágenes del producto */}
                <ProductLightboxViewer
                    images={lightboxImages}
                    isOpen={lightboxOpen}
                    onOpenChange={setLightboxOpen}
                    initialImageId={lightboxInitialImageId}
                    productName={lightboxProductName}
                />
            </div>
        </DashboardLayout>
    );
}