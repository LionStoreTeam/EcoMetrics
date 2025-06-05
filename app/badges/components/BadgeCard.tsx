import React from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Lock, ShieldAlert, Info } from "lucide-react";
import { Badge as UiBadge } from "@/components/ui/badge"; // Shadcn UI Badge
import { type BadgeApiResponseItem } from "@/app/api/badges/route";
import { cn } from "@/lib/utils";
import { BackgroundGradient } from "@/components/ui/background-gradient"; //
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"; //
import toast from "react-hot-toast";

interface BadgeCardProps {
    badge: BadgeApiResponseItem;
}

const showInfoModalBadge = (badge: BadgeApiResponseItem): string => {
    switch (badge.criteriaType) {
        case "ACTIVITY_COUNT":
            return toast(`Registra ${badge.criteriaThreshold} actividad en total.`);
        case "USER_LEVEL":
            return toast(`Alcanza el Nivel ${badge.criteriaThreshold}.`);
        case "TOTAL_POINTS":
            return toast(`Acumula ${badge.criteriaThreshold} eco-puntos.`);
        case "SPECIFIC_ACTIVITY_TYPE_COUNT":
            const activityTypeName = badge.criteriaActivityType
                ? badge.criteriaActivityType.toLowerCase().replace(/_/g, " ")
                : "cierto tipo";
            return toast(`Acumula ${badge.criteriaThreshold} unidades/kg/árboles en actividades de ${activityTypeName}.`);
        default:
            return toast("Completa el objetivo específico para desbloquear.");
    }
}

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
                ? badge.criteriaActivityType.toLowerCase().replace(/_/g, " ")
                : "cierto tipo";
            return `Acumula ${badge.criteriaThreshold} unidades/kg/árboles en actividades de ${activityTypeName}.`;
        default:
            return "Completa el objetivo específico para desbloquear.";
    }
};

const BadgeCard: React.FC<BadgeCardProps> = ({ badge }) => {
    const cardContent = (
        <div
            className={cn(
                "flex flex-col items-center text-center h-full overflow-hidden transition-all duration-300 ease-in-out",
                badge.obtained
                    ? "bg-transparent" // Fondo oscuro para el contenido dentro del gradiente
                    : "bg-transparent border-2 border-slate-200 rounded-3xl shadow-lg",
                "group" // Para efectos hover en elementos hijos
            )}
        >
            <CardHeader className="pt-6 pb-3 w-full">
                <div className={cn(
                    "relative mx-auto h-28 w-28 mb-2 transition-transform duration-300 group-hover:scale-110",
                    !badge.obtained && "grayscale group-hover:grayscale-0"
                )}>
                    <Image
                        src={badge.imageUrl || ""}
                        alt={badge.name}
                        width={112}
                        height={112}
                        className="rounded-full object-cover aspect-square shadow-md"
                        onError={(e) => (e.currentTarget.src = "")}
                    />
                    {badge.obtained && (
                        <CheckCircle className="absolute bottom-0 right-0 h-8 w-8 text-white bg-green-500 rounded-full p-1 border-2 border-slate-900" />
                    )}
                    {!badge.obtained && (
                        <Lock className="absolute bottom-0 right-0 h-8 w-8 text-gray-300 bg-gray-600 rounded-full p-1.5 border-2 border-gray-100" />
                    )}
                </div>
                <CardTitle className={cn(
                    "text-lg font-bold tracking-tight",
                    badge.obtained ? "text-green-400" : "text-gray-700"
                )}>
                    {badge.name}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow px-4 pb-3">
                <CardDescription className={cn(
                    "text-xs line-clamp-3",
                    badge.obtained ? "text-gray-800" : "text-gray-400"
                )}>
                    {badge.description}
                </CardDescription>
            </CardContent>
            <CardFooter className="pb-5 pt-2 w-full">
                {!badge.obtained ? (
                    <TooltipProvider>
                        <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                                <UiBadge variant="outline" className="mx-auto text-xs bg-amber-100/80 border-amber-400/50 text-amber-800 cursor-help">
                                    <Info className="h-3.5 w-3.5 mr-1.5" />
                                    <button
                                        onClick={
                                            () => {
                                                showInfoModalBadge(badge)
                                            }
                                        }
                                    >
                                        Cómo obtener
                                    </button>
                                </UiBadge>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs bg-gray-800 text-white border-gray-700 p-2 text-xs rounded-md shadow-lg">
                                <p>{getCriteriaText(badge)}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : (
                    <UiBadge variant="default" className="mx-auto bg-green-600/90 text-white text-xs shadow-sm">
                        ¡Obtenida!
                    </UiBadge>
                )}
            </CardFooter>

        </div>
    );

    return badge.obtained ? (
        <BackgroundGradient
            className="rounded-[22px] h-full p-0.5 bg-white"
            containerClassName="h-full"
        >
            {cardContent}
        </BackgroundGradient>
    ) : (
        cardContent
    );
};

export default BadgeCard;