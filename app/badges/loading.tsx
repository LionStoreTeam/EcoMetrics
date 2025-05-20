// app/badges/loading.tsx
import { Loader2, Award } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Loading() {
    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8 m-5 sm:m-10">
                <div className="p-6 flex flex-col gap-2 text-white bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl shadow-lg">
                    <div className="flex items-center gap-3">
                        <Award className="h-8 w-8" />
                        <h1 className="text-3xl font-bold tracking-tight">Galería de Insignias</h1>
                    </div>
                    <p className="text-amber-100">
                        Descubre todas las insignias que puedes obtener...
                    </p>
                </div>

                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-12 w-12 animate-spin text-amber-600" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <Card key={i} className="flex flex-col items-center text-center animate-pulse">
                            <CardHeader className="pt-6">
                                <div className="relative mx-auto h-24 w-24 mb-3 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                                <div className="h-5 w-3/4 bg-gray-300 dark:bg-gray-700 rounded-md mx-auto"></div>
                            </CardHeader>
                            <CardContent className="flex-grow w-full px-4">
                                <div className="h-4 w-full bg-gray-300 dark:bg-gray-700 rounded-md mb-1"></div>
                                <div className="h-4 w-5/6 bg-gray-300 dark:bg-gray-700 rounded-md mx-auto"></div>
                            </CardContent>
                            <CardContent className="pb-4 pt-2 w-full">
                                <div className="h-6 w-1/2 bg-gray-300 dark:bg-gray-700 rounded-md mx-auto"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
