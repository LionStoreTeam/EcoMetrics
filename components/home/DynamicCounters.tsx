"use client";

import React, { useState, useEffect } from 'react';
import CountUp from 'react-countup';
import { Users, ListChecks, Store, AlertTriangle, ShoppingBasket } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; //
import { BackgroundGradient } from '@/components/ui/background-gradient'; //
import { cn } from '@/lib/utils'; //

interface PlatformStats {
    totalUsers: number;
    totalActivities: number;
    totalBusinesses: number;
    totalProducts: number;
}

interface CounterCardProps {
    icon: React.ElementType;
    title: string;
    value: number;
    duration?: number;
    description?: string;
    className?: string;
    iconClassName?: string;
}

const CounterCard: React.FC<CounterCardProps> = ({ icon: Icon, title, value, duration = 2, description, className, iconClassName }: any) => (
    <BackgroundGradient
        containerClassName="rounded-[22px] h-full"
        className={cn("rounded-[22px] p-0.5 bg-white h-full", className)}
    >
        <Card className="flex flex-col h-full items-center justify-center p-6 text-center border-none shadow-none bg-transparent">
            <CardHeader className="p-0 mb-3">
                <div className={cn("mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-2", iconClassName)}>
                    <Icon className={cn("h-6 w-6 text-green-600", iconClassName)} />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-700 ">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="text-4xl font-bold text-green-700">
                    <CountUp end={value} duration={duration} separator="," />
                </div>
                {description && <CardDescription className="text-xs text-gray-500 mt-1">{description}</CardDescription>}
            </CardContent>
        </Card>
    </BackgroundGradient>
);

export const DynamicCounters: React.FC = () => {
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/platform-stats');
                if (!response.ok) {
                    throw new Error('No se pudieron cargar las estadísticas');
                }
                const data = await response.json();
                setStats(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido');
                setStats(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 py-8">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="p-6 flex flex-col items-center justify-center h-48 animate-pulse">
                        <div className="h-12 w-12 bg-gray-300 rounded-full mb-3"></div>
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                    </Card>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-8 text-center text-red-600">
                <AlertTriangle className="mx-auto h-10 w-10 mb-2" />
                <p>Error al cargar estadísticas: {error}</p>
            </div>
        );
    }

    if (!stats) {
        return null; // O un mensaje de "No hay datos disponibles"
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 py-8">
            <CounterCard
                icon={Users}
                title="Usuarios Registrados"
                value={stats.totalUsers}
                description="Miembros activos en nuestra comunidad."
                iconClassName="text-blue-600"
                className=""
            />
            <CounterCard
                icon={ListChecks}
                title="Actividades Registradas"
                value={stats.totalActivities}
                description="Acciones ecológicas completadas."
                iconClassName="text-teal-600"
                className=""
            />
            <CounterCard
                icon={Store}
                title="Negocios Promocionados"
                value={stats.totalBusinesses}
                description="Negocios sostenibles destacados."
                iconClassName="text-purple-600"
                className=""
            />
            <CounterCard
                icon={ShoppingBasket}
                title="Productos Promocionados"
                value={stats.totalProducts}
                description="Productos eco-amigables disponibles."
                iconClassName="text-pink-600"
                className=""
            />
        </div>
    );
};