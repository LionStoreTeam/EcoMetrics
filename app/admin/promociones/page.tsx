// app/admin/promociones/page.tsx
"use client";

import React, { useState, useEffect, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Search, Filter, Eye, CheckCircle, XCircle, MessageSquare, Clock, Building2, UserCog,
    Loader2, AlertTriangle, Info, BadgeCheck, BadgeX, RotateCcw, MoreHorizontal
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
    DialogFooter, DialogClose, DialogTrigger
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import DashboardLayout from "@/components/dashboard-layout";
import toast from 'react-hot-toast';
import Image from "next/image";
import { BusinessPromotionRequest as BusinessPromotionRequestType, BusinessPromotionStatus } from "@prisma/client";
import { BUSINESS_TYPES } from "@/lib/constants";

interface BusinessPromotionRequestFE extends Omit<BusinessPromotionRequestType, 'logoUrl' | 'submittedAt' | 'reviewedAt'> {
    logoUrl?: string | null;
    submittedAt: string;
    reviewedAt?: string | null;
}

interface AdminPromotionsApiResponse {
    requests: BusinessPromotionRequestFE[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

const ITEMS_PER_PAGE = 10;

const STATUS_MAP: Record<BusinessPromotionStatus, { text: string; color: string; icon: React.ElementType }> = {
    PENDING_APPROVAL: { text: "Pendiente", color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock },
    APPROVED: { text: "Aprobado", color: "bg-green-100 text-green-800 border-green-300", icon: BadgeCheck },
    REJECTED: { text: "Rechazado", color: "bg-red-100 text-red-800 border-red-300", icon: BadgeX },
};

export default function AdminPromotionsPage() {
    const router = useRouter();
    const [requests, setRequests] = useState<BusinessPromotionRequestFE[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<BusinessPromotionStatus | "ALL">("PENDING_APPROVAL");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<BusinessPromotionRequestFE | null>(null);
    const [reviewerNotes, setReviewerNotes] = useState("");
    const [newStatus, setNewStatus] = useState<BusinessPromotionStatus>("PENDING_APPROVAL");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchPromotionRequests = useCallback(async (page = 1, search = searchTerm, status = statusFilter) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: ITEMS_PER_PAGE.toString(),
            });
            if (search) params.append("search", search);
            if (status !== "ALL") params.append("status", status);

            const response = await fetch(`/api/admin/business-promotions?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al obtener las solicitudes de promoción");
            }
            const data: AdminPromotionsApiResponse = await response.json();
            setRequests(data.requests);
            setCurrentPage(data.pagination.page);
            setTotalPages(data.pagination.totalPages);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Ocurrió un error desconocido.");
            setRequests([]);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, statusFilter]);

    useEffect(() => {
        fetchPromotionRequests(1);
    }, [fetchPromotionRequests]);

    const handleSearchSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
        if (event) event.preventDefault();
        setCurrentPage(1);
        fetchPromotionRequests(1, searchTerm, statusFilter);
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            fetchPromotionRequests(page, searchTerm, statusFilter);
        }
    };

    const openDetailsModal = (request: BusinessPromotionRequestFE) => {
        setSelectedRequest(request);
        setIsDetailsModalOpen(true);
    };

    const openReviewModal = (request: BusinessPromotionRequestFE, targetStatus: BusinessPromotionStatus) => {
        setSelectedRequest(request);
        setNewStatus(targetStatus);
        setReviewerNotes(request.reviewerNotes || "");
        setIsReviewModalOpen(true);
    };

    const handleReviewSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedRequest) return;

        // Validación de notas si se rechaza
        if (newStatus === "REJECTED" && !reviewerNotes.trim()) {
            toast.error("Las notas son obligatorias al rechazar una solicitud.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/admin/business-promotions/${selectedRequest.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus, reviewerNotes }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error al ${newStatus === "APPROVED" ? "aprobar" : "rechazar"} la solicitud`);
            }
            toast.success(`Solicitud ${newStatus === "APPROVED" ? "aprobada" : newStatus === "REJECTED" ? "rechazada" : "actualizada a pendiente"} correctamente.`);
            setIsReviewModalOpen(false);
            fetchPromotionRequests(currentPage, searchTerm, statusFilter);
            router.refresh();
        } catch (err) {
            console.error("Error al revisar solicitud:", err);
            toast.error(err instanceof Error ? err.message : "Error al procesar la revisión.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getInitials = (name: string = "") => name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "N";
    const getBusinessTypeName = (typeId: string) => BUSINESS_TYPES.find(bt => bt.id === typeId)?.name || typeId;

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

            let showStartEllipsis = currentPage > halfPagesToShow + 2;
            let showEndEllipsis = currentPage < totalPages - (halfPagesToShow + 1);

            if (showStartEllipsis) {
                items.push(<PaginationEllipsis key="start-ellipsis" onClick={() => handlePageChange(Math.max(1, currentPage - maxPagesToShow))} />);
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
                    <PaginationItem key={i}>
                        <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i); }} isActive={currentPage === i}>
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }

            if (showEndEllipsis) {
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
        <DashboardLayout>
            <div className="flex flex-col gap-8 m-5 sm:m-10">
                <div className="mt-10 lg:mt-0 p-6 flex flex-col gap-2 text-white bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl shadow-lg">
                    <div className="flex items-center gap-3">
                        <Building2 className="h-8 w-8" />
                        <h1 className="text-3xl font-bold tracking-tight">Revisión de Promociones de Negocios</h1>
                    </div>
                    <p className="text-indigo-100">
                        Gestiona las solicitudes para promocionar negocios en la plataforma EcoMetrics.
                    </p>
                </div>

                <Card className="shadow-md">
                    <CardHeader className="p-4">
                        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                            <div className="relative md:col-span-1">
                                <Label htmlFor="search-term-promotions" className="sr-only">Buscar</Label>
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="search-term-promotions" type="search" placeholder="Nombre, correo, ciudad..." className="pl-9 py-2 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="status-filter-promotions" className="sr-only">Estado</Label>
                                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as BusinessPromotionStatus | "ALL")}>
                                    <SelectTrigger id="status-filter-promotions" className="py-2 text-sm"><Filter className="mr-1.5 h-4 w-4" /><SelectValue placeholder="Estado" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Todos los Estados</SelectItem>
                                        {Object.entries(STATUS_MAP).map(([key, { text }]) => (
                                            <SelectItem key={key} value={key}>{text}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 text-sm w-full md:w-auto">Buscar Solicitudes</Button>
                        </form>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-indigo-600" /></div>
                        ) : error ? (
                            <div className="text-center py-10 text-red-600 bg-red-50 p-4 rounded-md"><AlertTriangle className="mx-auto h-10 w-10 mb-2" /><p>{error}</p><Button onClick={() => fetchPromotionRequests(currentPage, searchTerm, statusFilter)} variant="outline" className="mt-4 border-red-600 text-red-600 hover:bg-red-100">Reintentar</Button></div>
                        ) : requests.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]">Logo</TableHead>
                                                <TableHead>Negocio</TableHead>
                                                <TableHead className="hidden md:table-cell">Tipo</TableHead>
                                                <TableHead className="hidden lg:table-cell">Contacto</TableHead>
                                                <TableHead className="text-center">Estado</TableHead>
                                                <TableHead className="hidden lg:table-cell text-center">Enviado</TableHead>
                                                <TableHead className="text-right">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {requests.map((req) => {
                                                const StatusIcon = STATUS_MAP[req.status].icon as any; // Correcto: Asignar a variable con mayúscula
                                                return (
                                                    <TableRow key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                        <TableCell>
                                                            <Avatar className="h-9 w-9">
                                                                <AvatarImage src={req.logoUrl || ""} alt={req.businessName} />
                                                                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
                                                                    {getInitials(req.businessName)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        </TableCell>
                                                        <TableCell className="font-medium text-sm">{req.businessName}</TableCell>
                                                        <TableCell className="hidden md:table-cell text-xs">{getBusinessTypeName(req.businessType)}</TableCell>
                                                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{req.email || req.phone || "N/A"}</TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant="outline" className={`text-xs whitespace-nowrap ${STATUS_MAP[req.status].color}`}>
                                                                <StatusIcon className="mr-1 h-3 w-3" /> {/* Correcto: Usar la variable con mayúscula */}
                                                                {STATUS_MAP[req.status].text}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="hidden lg:table-cell text-center text-xs text-muted-foreground">
                                                            {format(new Date(req.submittedAt), "dd MMM, yy", { locale: es })} {/* Formato más corto */}
                                                        </TableCell>
                                                        <TableCell className="text-right space-x-1">
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-sky-600" title="Ver Detalles" onClick={() => openDetailsModal(req)}>
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            {req.status === "PENDING_APPROVAL" && (
                                                                <>
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-green-600" title="Aprobar Solicitud" onClick={() => openReviewModal(req, "APPROVED")}>
                                                                        <CheckCircle className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600" title="Rechazar Solicitud" onClick={() => openReviewModal(req, "REJECTED")}>
                                                                        <XCircle className="h-4 w-4" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {req.status !== "PENDING_APPROVAL" && (
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-yellow-500" title="Reconsiderar (Poner Pendiente)" onClick={() => openReviewModal(req, "PENDING_APPROVAL")}>
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
                                {totalPages > 1 && (
                                    <Pagination className="mt-6">
                                        <PaginationContent>
                                            <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} className={currentPage === 1 ? "pointer-events-none opacity-50" : ""} /></PaginationItem>
                                            {renderPaginationItems()}
                                            <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""} /></PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-16"><Building2 className="mx-auto h-16 w-16 text-muted-foreground mb-4" /><h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No hay solicitudes de promoción pendientes o que coincidan con los filtros.</h3><p className="text-muted-foreground mt-2 text-sm">Cuando se envíen nuevas solicitudes, aparecerán aquí.</p></div>
                        )}
                    </CardContent>
                </Card>

                {/* Modal de Detalles */}
                <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
                    <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-xl flex items-center gap-2">
                                <Info className="h-5 w-5 text-indigo-600" />
                                Detalles de: {selectedRequest?.businessName}
                            </DialogTitle>
                            <DialogDescription>
                                Información completa de la solicitud de promoción.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedRequest && (
                            <div className="space-y-3 py-3 text-sm">
                                {selectedRequest.logoUrl && (
                                    <div className="flex justify-center mb-3">
                                        <Image src={selectedRequest.logoUrl} alt={`Logo de ${selectedRequest.businessName}`} width={128} height={128} className="rounded-lg object-contain border shadow-sm" />
                                    </div>
                                )}
                                <p><strong className="font-medium text-gray-700">Nombre:</strong> {selectedRequest.businessName}</p>
                                <p><strong className="font-medium text-gray-700">Descripción:</strong> <span className="text-gray-600 whitespace-pre-wrap">{selectedRequest.description}</span></p>
                                <p><strong className="font-medium text-gray-700">Tipo:</strong> {getBusinessTypeName(selectedRequest.businessType)}</p>
                                <p><strong className="font-medium text-gray-700">Dirección:</strong> {selectedRequest.address}, {selectedRequest.city}, {selectedRequest.state} {selectedRequest.zipCode}</p>
                                {selectedRequest.phone && <p><strong className="font-medium text-gray-700">Teléfono:</strong> {selectedRequest.phone}</p>}
                                {selectedRequest.email && <p><strong className="font-medium text-gray-700">Email:</strong> {selectedRequest.email}</p>}
                                {selectedRequest.website && <p><strong className="font-medium text-gray-700">Sitio Web:</strong> <a href={selectedRequest.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{selectedRequest.website}</a></p>}
                                {(selectedRequest.latitude && selectedRequest.longitude) && <p><strong className="font-medium text-gray-700">Ubicación:</strong> Lat: {selectedRequest.latitude}, Lon: {selectedRequest.longitude}</p>}
                                {selectedRequest.openingHours && <p><strong className="font-medium text-gray-700">Horarios:</strong> {selectedRequest.openingHours}</p>}
                                {selectedRequest.socialMedia && <p><strong className="font-medium text-gray-700">Redes Sociales:</strong> {selectedRequest.socialMedia}</p>}

                                <div className="pt-2 mt-2 border-t">
                                    <p className="font-semibold text-gray-700">Información del Pago:</p>
                                    <p className="text-xs text-gray-600">ID Transacción: <span className="font-mono">{selectedRequest.paymentIntentId || "N/A"}</span></p>
                                    <p className="text-xs text-gray-600">Monto Pagado: <span className="font-semibold">${selectedRequest.amountPaid?.toFixed(2) || "0.00"} {selectedRequest.currency?.toUpperCase()}</span></p>
                                    <p className="text-xs text-gray-600">Estado del Pago: <Badge variant="secondary" className="text-xs">{selectedRequest.paymentStatus || "Desconocido"}</Badge></p>
                                </div>

                                <div className="pt-2 mt-2 border-t">
                                    <p className="font-semibold text-gray-700">Estado de la Solicitud:</p>
                                    <Badge variant="outline" className={`text-sm ${STATUS_MAP[selectedRequest.status].color}`}>
                                        {/* <STATUS_MAP[selectedRequest.status].icon className="mr-1.5 h-4 w-4" /> */}
                                        {STATUS_MAP[selectedRequest.status].text}
                                    </Badge>
                                    <p className="text-xs text-muted-foreground mt-1">Enviada: {format(new Date(selectedRequest.submittedAt), "dd MMM, yyyy 'a las' HH:mm", { locale: es })}</p>
                                    {selectedRequest.reviewedAt && <p className="text-xs text-muted-foreground">Revisada: {format(new Date(selectedRequest.reviewedAt), "dd MMM, yyyy 'a las' HH:mm", { locale: es })}</p>}
                                </div>
                                {selectedRequest.reviewerNotes && (
                                    <div className="pt-2 mt-2 border-t">
                                        <p className="font-semibold text-gray-700">Notas del Revisor:</p>
                                        <p className="text-gray-600 bg-gray-50 p-2 rounded-md border whitespace-pre-wrap">{selectedRequest.reviewerNotes}</p>
                                    </div>
                                )}
                            </div>
                        )}
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Modal de Revisión (Aprobar/Rechazar/Pendiente) */}
                <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                {/* Icono dinámico basado en newStatus */}
                                {React.createElement(STATUS_MAP[newStatus]?.icon || Info, { className: `h-5 w-5 ${newStatus === "APPROVED" ? "text-green-600" : newStatus === "REJECTED" ? "text-red-600" : "text-yellow-500"}` })}
                                {newStatus === "APPROVED" ? "Aprobar" : newStatus === "REJECTED" ? "Rechazar" : "Marcar como Pendiente"} Solicitud
                            </DialogTitle>
                            <DialogDescription>
                                Vas a cambiar el estado de la solicitud de "{selectedRequest?.businessName}" a <span className={`font-semibold ${STATUS_MAP[newStatus]?.color.replace('bg-', 'text-').replace('-100', '-700')}`}>{STATUS_MAP[newStatus]?.text}</span>.
                                {(newStatus === "REJECTED" || newStatus === "PENDING_APPROVAL") && " Por favor, proporciona notas para esta acción."}
                                {newStatus === "APPROVED" && " Puedes añadir notas opcionales."}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleReviewSubmit} className="space-y-4 py-2">
                            {(newStatus === "REJECTED" || newStatus === "PENDING_APPROVAL" || (newStatus === "APPROVED" && selectedRequest?.reviewerNotes)) && ( // Mostrar siempre si hay notas previas al aprobar
                                <div>
                                    <Label htmlFor="reviewerNotes">
                                        Notas de Revisión {(newStatus === "REJECTED" || newStatus === "PENDING_APPROVAL") ? <span className="text-red-500">*</span> : "(Opcional)"}
                                    </Label>
                                    <Textarea
                                        id="reviewerNotes"
                                        value={reviewerNotes}
                                        onChange={(e) => setReviewerNotes(e.target.value)}
                                        placeholder={
                                            newStatus === "REJECTED"
                                                ? "Motivo del rechazo (ej: información incompleta...)"
                                                : newStatus === "PENDING_APPROVAL"
                                                    ? "Motivo para marcar como pendiente (ej: se requiere más información...)"
                                                    : "Notas adicionales para la aprobación..."
                                        }
                                        rows={3}
                                        disabled={isSubmitting}
                                        required={newStatus === "REJECTED" || newStatus === "PENDING_APPROVAL"}
                                    />
                                    {(newStatus === "REJECTED" || newStatus === "PENDING_APPROVAL") && !reviewerNotes.trim() && isSubmitting === false && <p className="text-xs text-red-500 mt-1">Las notas son obligatorias para esta acción.</p>}
                                </div>
                            )}
                            <DialogFooter className="sm:justify-end gap-2">
                                <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button></DialogClose>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || ((newStatus === "REJECTED" || newStatus === "PENDING_APPROVAL") && !reviewerNotes.trim())}
                                    className={
                                        newStatus === "APPROVED" ? "bg-green-600 hover:bg-green-700"
                                            : newStatus === "REJECTED" ? "bg-red-600 hover:bg-red-700"
                                                : "bg-yellow-500 hover:bg-yellow-600"
                                    }
                                >
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Confirmar {newStatus === "APPROVED" ? "Aprobación" : newStatus === "REJECTED" ? "Rechazo" : "Pendiente"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}