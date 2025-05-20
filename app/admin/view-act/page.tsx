// app/admin/activities-management/page.tsx
"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Search, Filter, Edit3, Trash2, Eye, Loader2, AlertTriangle, MessageSquare, ListChecks, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";


import DashboardLayout from "@/components/dashboard-layout";
import { cn } from "@/lib/utils";
import EvidenceViewer from "@/components/evidence-viewer"; // Para mostrar evidencias
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import toast from "react-hot-toast";

// Tipos (puedes moverlos a types/types.ts si se reutilizan)
interface UserForActivity {
    id: string;
    name: string;
    email: string;
    userType: string;
    profile?: {
        avatarUrl?: string | null; // fileKey
        avatarPublicUrl?: string | null; // URL pública
    } | null;
}
interface EvidenceForActivity {
    id: string;
    fileUrl: string; // fileKey
    publicDisplayUrl?: string | null; // URL pública
    fileType: string;
    fileName: string;
}
interface ActivityForAdmin {
    id: string;
    title: string;
    description: string | null;
    type: string;
    quantity: number;
    unit: string;
    points: number;
    date: string; // ISO string
    createdAt: string; // ISO string
    user: UserForActivity;
    evidence: EvidenceForActivity[];
}
interface AdminActivitiesApiResponse {
    activities: ActivityForAdmin[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

const USER_TYPE_MAP: { [key: string]: string } = {
    INDIVIDUAL: "Individual", SCHOOL: "Escuela", COMMUNITY: "Comunidad", GOVERNMENT: "Gobierno",
};
const ACTIVITY_TYPE_MAP: { [key: string]: string } = {
    RECYCLING: "Reciclaje", TREE_PLANTING: "Plantación", WATER_SAVING: "Ahorro Agua",
    ENERGY_SAVING: "Ahorro Energía", COMPOSTING: "Compostaje", EDUCATION: "Educación", OTHER: "Otro",
};
const ACTIVITY_POINTS_MAP = {
    RECYCLING: 5, TREE_PLANTING: 5, WATER_SAVING: 2, ENERGY_SAVING: 2,
    COMPOSTING: 5, EDUCATION: 5, OTHER: 2,
};

const ITEMS_PER_PAGE = 10;

export default function AdminActivitiesManagementPage() {
    const router = useRouter();
    const [activities, setActivities] = useState<ActivityForAdmin[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [userTypeFilter, setUserTypeFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<ActivityForAdmin | null>(null);
    const [editFormData, setEditFormData] = useState({
        title: "", description: "", type: "OTHER", quantity: "1", unit: "", date: new Date(),
    });
    const [notificationTitle, setNotificationTitle] = useState("");
    const [notificationMessage, setNotificationMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);


    const fetchAdminActivities = useCallback(async (page = 1, search = searchTerm, type = userTypeFilter) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: ITEMS_PER_PAGE.toString(),
            });
            if (search) params.append("search", search);
            if (type !== "all") params.append("userType", type);

            const response = await fetch(`/api/admin/activities?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al obtener las actividades");
            }
            const data: AdminActivitiesApiResponse = await response.json();
            setActivities(data.activities);
            setCurrentPage(data.pagination.page);
            setTotalPages(data.pagination.totalPages);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Ocurrió un error desconocido.");
            setActivities([]);
        } finally {
            setIsLoading(false);
        }
    }, []); // No dependencies, will be called by other useEffects or handlers

    useEffect(() => {
        fetchAdminActivities(1, searchTerm, userTypeFilter);
    }, [fetchAdminActivities, searchTerm, userTypeFilter]);


    const handleSearchSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
        if (event) event.preventDefault();
        setCurrentPage(1);
        fetchAdminActivities(1, searchTerm, userTypeFilter);
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            fetchAdminActivities(page, searchTerm, userTypeFilter);
        }
    };

    const openEditModal = (activity: ActivityForAdmin) => {
        setSelectedActivity(activity);
        setEditFormData({
            title: activity.title,
            description: activity.description || "",
            type: activity.type,
            quantity: activity.quantity.toString(),
            unit: activity.unit,
            date: new Date(activity.date),
        });
        setIsEditModalOpen(true);
    };

    const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleEditDateChange = (date: Date | undefined) => {
        if (date) {
            setEditFormData(prev => ({ ...prev, date }));
        }
    };


    const handleUpdateActivity = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedActivity) return;
        setIsSubmitting(true);
        try {
            const dataToUpdate = {
                ...editFormData,
                quantity: parseFloat(editFormData.quantity),
                date: editFormData.date.toISOString().split('T')[0], // Enviar solo la fecha YYYY-MM-DD
            };

            const response = await fetch(`/api/admin/activities/${selectedActivity.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToUpdate),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al actualizar actividad");
            }
            toast.success("Actividad actualizada correctamente")
            setIsEditModalOpen(false);
            fetchAdminActivities(currentPage, searchTerm, userTypeFilter); // Recargar
            router.refresh()
        } catch (err) {
            console.error("Error actualizando actividad:", err);
            toast.error("Error. No se pudo actualizar")
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDeleteModal = (activity: ActivityForAdmin) => {
        setSelectedActivity(activity);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteActivity = async () => {
        if (!selectedActivity) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/admin/activities/${selectedActivity.id}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al eliminar actividad");
            }
            toast.success("Actividad eliminada y puntos del usuario ajustados")
            setIsDeleteModalOpen(false);
            fetchAdminActivities(currentPage, searchTerm, userTypeFilter); // Recargar
            router.refresh()
        } catch (err) {
            console.error("Error eliminando actividad:", err);
            toast.error("Error. No se pudo eliminar")
        } finally {
            setIsSubmitting(false);
        }
    };

    const openNotifyModal = (activity: ActivityForAdmin) => {
        setSelectedActivity(activity);
        setNotificationTitle(`Sobre tu actividad: ${activity.title}`);
        setNotificationMessage(""); // Limpiar mensaje previo
        setIsNotifyModalOpen(true);
    };

    const handleSendNotification = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedActivity || !notificationMessage.trim() || !notificationTitle.trim()) {
            toast.error("Atención. El título y el mensaje de la notificación son requeridos")
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/admin/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedActivity.user.id,
                    title: notificationTitle,
                    message: notificationMessage,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al enviar notificación.");
            }
            toast.success(`Notificación Enviada. Mensaje enviado a ${selectedActivity.user.name}.`)
            setIsNotifyModalOpen(false);
            router.refresh()
        } catch (err) {
            console.error("Error enviando notificación:", err);
            toast.error("Error. No se pudo enviar la notificación")
        } finally {
            setIsSubmitting(false);
        }
    };


    const getInitials = (name: string = "") => name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "U";

    const renderPaginationItems = () => {
        // ... (misma lógica de paginación que en ScoresPage o MapPage)
        const items = [];
        const maxPagesToShow = 5;
        const halfPagesToShow = Math.floor(maxPagesToShow / 2);

        if (totalPages <= maxPagesToShow) {
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
                items.push(<PaginationEllipsis key="start-ellipsis" />);
            }
            let startPage = Math.max(2, currentPage - halfPagesToShow);
            let endPage = Math.min(totalPages - 1, currentPage + halfPagesToShow);
            if (currentPage <= halfPagesToShow + 1) endPage = Math.min(totalPages - 1, maxPagesToShow - 1);
            if (currentPage >= totalPages - halfPagesToShow) startPage = Math.max(2, totalPages - maxPagesToShow + 2);
            for (let i = startPage; i <= endPage; i++) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i); }} isActive={currentPage === i}>
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }
            if (currentPage < totalPages - halfPagesToShow - 1) {
                items.push(<PaginationEllipsis key="end-ellipsis" />);
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
                <div className="p-6 flex flex-col gap-2 text-white bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl shadow-lg">
                    <div className="flex items-center gap-3">
                        <UserCog className="h-8 w-8" />
                        <h1 className="text-3xl font-bold tracking-tight">Gestión de Actividades</h1>
                    </div>
                    <p className="text-purple-100">
                        Visualiza, modifica y elimina actividades de todos los usuarios.
                    </p>
                </div>

                <Card className="shadow-md">
                    <CardHeader className="p-4">
                        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                            <div className="relative md:col-span-1">
                                <Label htmlFor="search-term-admin-act" className="sr-only">Buscar</Label>
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="search-term-admin-act" type="search" placeholder="Nombre o correo de usuario..." className="pl-9 py-2 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="user-type-filter-admin-act" className="sr-only">Tipo de Usuario</Label>
                                <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                                    <SelectTrigger id="user-type-filter-admin-act" className="py-2 text-sm"><Filter className="mr-1.5 h-4 w-4" /><SelectValue placeholder="Tipo de Usuario" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los Tipos</SelectItem>
                                        <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                                        <SelectItem value="SCHOOL">Escuela</SelectItem>
                                        <SelectItem value="COMMUNITY">Comunidad</SelectItem>
                                        <SelectItem value="GOVERNMENT">Gobierno</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 text-sm w-full md:w-auto">Buscar Actividades</Button>
                        </form>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-indigo-600" /></div>
                        ) : error ? (
                            <div className="text-center py-10 text-red-600 bg-red-50 p-4 rounded-md"><AlertTriangle className="mx-auto h-10 w-10 mb-2" /><p>{error}</p><Button onClick={() => fetchAdminActivities(currentPage)} variant="outline" className="mt-4 border-red-600 text-red-600 hover:bg-red-100">Reintentar</Button></div>
                        ) : activities.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[60px]">Avatar</TableHead>
                                                <TableHead>Usuario</TableHead>
                                                <TableHead className="hidden md:table-cell">Correo</TableHead>
                                                <TableHead>Actividad</TableHead>
                                                <TableHead className="text-center">Tipo</TableHead>
                                                <TableHead className="text-center">Puntos</TableHead>
                                                <TableHead className="hidden lg:table-cell text-center">Fecha</TableHead>
                                                <TableHead className="text-right">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {activities.map((activity) => (
                                                <TableRow key={activity.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <TableCell>
                                                        <Avatar className="h-9 w-9">
                                                            <AvatarImage src={activity.user.profile?.avatarPublicUrl || ""} alt={activity.user.name} />
                                                            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
                                                                {getInitials(activity.user.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </TableCell>
                                                    <TableCell className="font-medium text-sm">{activity.user.name}</TableCell>
                                                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{activity.user.email}</TableCell>
                                                    <TableCell className="text-sm">{activity.title}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="secondary" className="text-xs whitespace-nowrap">{ACTIVITY_TYPE_MAP[activity.type] || activity.type}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center font-semibold text-indigo-600 dark:text-indigo-400">{activity.points}</TableCell>
                                                    <TableCell className="hidden lg:table-cell text-center text-xs text-muted-foreground">
                                                        {format(new Date(activity.date), "dd MMM, yyyy", { locale: es })}
                                                    </TableCell>
                                                    <TableCell className="text-right space-x-1">
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-sky-600" title="Ver Evidencia">
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                                                <DialogHeader>
                                                                    <DialogTitle>Evidencia de: {activity.title}</DialogTitle>
                                                                    <DialogDescription>Presentada por: {activity.user.name}</DialogDescription>
                                                                </DialogHeader>
                                                                {activity.evidence && activity.evidence.length > 0 ? (
                                                                    <EvidenceViewer evidence={activity.evidence.map(ev => ({
                                                                        id: ev.id,
                                                                        fileUrl: ev.publicDisplayUrl || "", // Usar la URL pública
                                                                        fileType: ev.fileType, // 'image' o 'video'
                                                                        fileName: ev.fileName,
                                                                        format: ev.fileName.split('.').pop() || '', // Inferir formato si es necesario
                                                                    }))} />
                                                                ) : (
                                                                    <p className="text-sm text-muted-foreground py-4">No hay evidencia adjunta para esta actividad.</p>
                                                                )}
                                                                <DialogFooter><DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose></DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-blue-600" title="Editar Actividad" onClick={() => openEditModal(activity)}>
                                                            <Edit3 className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600" title="Eliminar Actividad" onClick={() => openDeleteModal(activity)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-green-600" title="Enviar Notificación" onClick={() => openNotifyModal(activity)}>
                                                            <MessageSquare className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
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
                            <div className="text-center py-16"><ListChecks className="mx-auto h-16 w-16 text-muted-foreground mb-4" /><h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No hay actividades para mostrar.</h3><p className="text-muted-foreground mt-2 text-sm">Intenta ajustar los filtros o espera a que los usuarios registren actividades.</p></div>
                        )}
                    </CardContent>
                </Card>

                {/* Modal de Edición */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent className="sm:max-w-[525px]">
                        <DialogHeader>
                            <DialogTitle>Editar Actividad: {selectedActivity?.title}</DialogTitle>
                            <DialogDescription>Usuario: {selectedActivity?.user.name}</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdateActivity} className="space-y-4 py-2">
                            <div>
                                <Label htmlFor="edit-title">Título</Label>
                                <Input id="edit-title" name="title" value={editFormData.title} onChange={handleEditFormChange} disabled={isSubmitting} />
                            </div>
                            <div>
                                <Label htmlFor="edit-description">Descripción</Label>
                                <Textarea id="edit-description" name="description" value={editFormData.description} onChange={handleEditFormChange} disabled={isSubmitting} rows={3} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="edit-type">Tipo</Label>
                                    <Select name="type" value={editFormData.type} onValueChange={(value) => setEditFormData(prev => ({ ...prev, type: value }))} disabled={isSubmitting}>
                                        <SelectTrigger id="edit-type"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(ACTIVITY_TYPE_MAP).map(([key, value]) => (
                                                <SelectItem key={key} value={key}>{value}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="edit-quantity">Cantidad</Label>
                                    <Input id="edit-quantity" name="quantity" type="number" value={editFormData.quantity} onChange={handleEditFormChange} disabled={isSubmitting} min="1" max="20" step="0.01" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="edit-unit">Unidad</Label>
                                    <Input id="edit-unit" name="unit" value={editFormData.unit} onChange={handleEditFormChange} disabled={isSubmitting} />
                                </div>
                                <div>
                                    <Label htmlFor="edit-date">Fecha</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !editFormData.date && "text-muted-foreground")} disabled={isSubmitting}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {editFormData.date ? format(editFormData.date, "PPP", { locale: es }) : <span>Selecciona fecha</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={editFormData.date} onSelect={handleEditDateChange} initialFocus disabled={(date) => date > new Date() || isSubmitting} />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button></DialogClose>
                                <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar Cambios
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Modal de Eliminación */}
                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Confirmar Eliminación</DialogTitle>
                            <DialogDescription>
                                ¿Estás seguro de que deseas eliminar la actividad <span className="font-semibold">"{selectedActivity?.title}"</span> del usuario <span className="font-semibold">{selectedActivity?.user.name}</span>?
                                Esta acción descontará {selectedActivity?.points} puntos al usuario y no se puede deshacer.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="sm:justify-end gap-2">
                            <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button></DialogClose>
                            <Button type="button" variant="destructive" onClick={handleDeleteActivity} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Eliminar Actividad
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Modal de Notificación */}
                <Dialog open={isNotifyModalOpen} onOpenChange={setIsNotifyModalOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Enviar Notificación a {selectedActivity?.user.name}</DialogTitle>
                            <DialogDescription>Redacta un mensaje para el usuario sobre su actividad o cualquier otro asunto.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSendNotification} className="space-y-4 py-2">
                            <div>
                                <Label htmlFor="notify-title">Título del Mensaje</Label>
                                <Input id="notify-title" value={notificationTitle} onChange={(e) => setNotificationTitle(e.target.value)} placeholder="Ej: Revisión de actividad" disabled={isSubmitting} />
                            </div>
                            <div>
                                <Label htmlFor="notify-message">Mensaje</Label>
                                <Textarea id="notify-message" value={notificationMessage} onChange={(e) => setNotificationMessage(e.target.value)} placeholder="Escribe tu mensaje aquí..." rows={4} disabled={isSubmitting} />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button></DialogClose>
                                <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enviar Mensaje
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

            </div>
        </DashboardLayout>
    );
}
