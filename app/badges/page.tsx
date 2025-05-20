"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Award, CheckCircle, Lock, Loader2, ShieldAlert } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge as UiBadge } from "@/components/ui/badge"; // Shadcn UI Badge
import { type BadgeApiResponseItem } from "@/app/api/badges/route"; // Importar el tipo
import { Button } from "@/components/ui/button";

export default function BadgesPage() {
    const [badges, setBadges] = useState<BadgeApiResponseItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBadges = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch("/api/badges");
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Error al obtener las insignias");
                }
                const data: BadgeApiResponseItem[] = await response.json();
                setBadges(data);
            } catch (err) {
                console.error("Error al cargar insignias:", err);
                setError(err instanceof Error ? err.message : "Ocurrió un error desconocido.");
                setBadges([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBadges();
    }, []);

    const getCriteriaText = (badge: BadgeApiResponseItem): string => {
        switch (badge.criteriaType) {
            case "ACTIVITY_COUNT":
                return `Registra ${badge.criteriaThreshold} actividad(es) en total.`;
            case "USER_LEVEL":
                return `Alcanza el Nivel ${badge.criteriaThreshold}.`;
            case "TOTAL_POINTS":
                return `Acumula ${badge.criteriaThreshold} eco-puntos.`;
            case "SPECIFIC_ACTIVITY_TYPE_COUNT":
                const activityTypeName = badge.criteriaActivityType
                    ? badge.criteriaActivityType.toLowerCase().replace("_", " ")
                    : "cierto tipo";
                return `Acumula ${badge.criteriaThreshold} unidades/kg/árboles en actividades de ${activityTypeName}.`;
            default:
                return "Completa el objetivo específico.";
        }
    };


    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8 m-5 sm:m-10">
                <div className="p-6 flex flex-col gap-2 text-white bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl shadow-lg">
                    <div className="flex items-center gap-3">
                        <Award className="h-8 w-8" />
                        <h1 className="text-3xl font-bold tracking-tight">Galería de Insignias</h1>
                    </div>
                    <p className="text-amber-100">
                        Descubre todas las insignias que puedes obtener y sigue contribuyendo al medio ambiente.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-12 w-12 animate-spin text-amber-600" />
                    </div>
                ) : error ? (
                    <Card className="bg-red-50 border-red-200">
                        <CardHeader>
                            <CardTitle className="text-red-700 flex items-center gap-2">
                                <ShieldAlert className="h-6 w-6" /> Error al Cargar Insignias
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-red-600">{error}</p>
                            <Button onClick={() => window.location.reload()} className="mt-4 bg-red-600 hover:bg-red-700">
                                Reintentar
                            </Button>
                        </CardContent>
                    </Card>
                ) : badges.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {badges.map((badge) => (
                            <Card
                                key={badge.id}
                                className={`flex flex-col items-center text-center transition-all duration-300 ease-in-out transform hover:scale-105 ${badge.obtained
                                    ? "border-green-500 bg-green-50/50 dark:bg-green-900/30 shadow-lg"
                                    : "border-gray-300 bg-gray-50/50 dark:bg-gray-800/30 opacity-75 hover:opacity-100"
                                    }`}
                            >
                                <CardHeader className="pt-6">
                                    <div className="relative mx-auto h-24 w-24 mb-3">
                                        <Image
                                            src={badge.imageUrl || "/placeholder.svg"}
                                            alt={badge.name}
                                            width={96}
                                            height={96}
                                            className={`rounded-full object-cover ${!badge.obtained ? "grayscale" : ""}`}
                                            onError={(e) => (e.currentTarget.src = "https://placehold.co/96x96/EBF5FF/707070?text=?")}
                                        />
                                        {badge.obtained && (
                                            <CheckCircle className="absolute -bottom-1 -right-1 h-7 w-7 text-white bg-green-500 rounded-full p-0.5 border-2 border-white dark:border-gray-800" />
                                        )}
                                    </div>
                                    <CardTitle className={`text-lg font-semibold ${badge.obtained ? "text-green-700 dark:text-green-300" : "text-gray-700 dark:text-gray-300"}`}>
                                        {badge.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className={`text-xs px-2 ${badge.obtained ? "text-gray-600 dark:text-gray-400" : "text-gray-500 dark:text-gray-400"}`}>
                                        {badge.description}
                                    </p>
                                    {!badge.obtained && (
                                        <div className="mt-3 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 p-2 rounded-md">
                                            <p className="font-medium">Cómo obtenerla:</p>
                                            <p>{getCriteriaText(badge)}</p>
                                        </div>
                                    )}
                                </CardContent>
                                {badge.obtained && badge.obtainedAt && (
                                    <CardFooter className="pb-4 pt-2 w-full">
                                        <UiBadge variant="default" className="mx-auto bg-green-600 text-white text-xs">
                                            Obtenida
                                            {/* {format(new Date(badge.obtainedAt), "dd MMM yyyy", { locale: es })} */}
                                        </UiBadge>
                                    </CardFooter>
                                )}
                                {!badge.obtained && (
                                    <CardFooter className="pb-4 pt-2 w-full">
                                        <UiBadge variant="outline" className="mx-auto text-gray-500 border-gray-400 text-xs flex items-center gap-1">
                                            <Lock className="h-3 w-3" /> Bloqueada
                                        </UiBadge>
                                    </CardFooter>
                                )}
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-10 text-center">
                            <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium text-muted-foreground">No hay insignias disponibles por el momento.</p>
                            <p className="text-sm text-muted-foreground">Vuelve más tarde para ver nuevas insignias.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
